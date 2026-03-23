package com.cstar.platform.clientorders;

import com.cstar.platform.agenda.AgendaEventTypeRepository;
import com.cstar.platform.agenda.model.AgendaEventKind;
import com.cstar.platform.agenda.model.AgendaEventType;
import com.cstar.platform.agenda.model.AgendaEvent;
import com.cstar.platform.clinicservices.ClinicServiceRepository;
import com.cstar.platform.clinicservices.model.ClinicService;
import com.cstar.platform.clientorders.dto.ClientServiceOrderProductItemResponse;
import com.cstar.platform.clientorders.dto.ClientServiceOrderObservationResponse;
import com.cstar.platform.clientorders.dto.ClientServiceOrderReturnResponse;
import com.cstar.platform.clientorders.dto.ClientServiceOrderResponse;
import com.cstar.platform.clientorders.dto.ClientServiceOrderServiceItemResponse;
import com.cstar.platform.clientorders.dto.ConfirmClientServiceOrderPaymentRequest;
import com.cstar.platform.clientorders.dto.CreateClientServiceOrderRequest;
import com.cstar.platform.clientorders.dto.CreateClientServiceOrderPaymentPlanRequest;
import com.cstar.platform.clientorders.dto.ExtraProductInput;
import com.cstar.platform.clientorders.dto.AddClientServiceOrderObservationRequest;
import com.cstar.platform.clientorders.dto.ScheduleClientServiceOrderRequest;
import com.cstar.platform.clientorders.dto.ScheduleClientServiceOrderReturnRequest;
import com.cstar.platform.clientorders.model.ClientServiceOrder;
import com.cstar.platform.clientorders.model.ClientServiceOrderPaymentStatus;
import com.cstar.platform.clientorders.model.ClientServiceOrderStatus;
import com.cstar.platform.clientorders.model.ClientServiceOrderProductItem;
import com.cstar.platform.clientorders.model.ClientServiceOrderServiceItem;
import com.cstar.platform.clientorders.model.OrderProductSource;
import com.cstar.platform.clientorders.model.ServicePaymentMethod;
import com.cstar.platform.clients.ClientRepository;
import com.cstar.platform.clients.model.Client;
import com.cstar.platform.finance.FinanceEntryService;
import com.cstar.platform.finance.FinanceIncomeTypeRepository;
import com.cstar.platform.finance.FinanceIncomeRepository;
import com.cstar.platform.finance.dto.FinanceIncomeRequest;
import com.cstar.platform.finance.model.FinanceIncomeType;
import com.cstar.platform.finance.model.FinanceIncome;
import com.cstar.platform.finance.model.FinanceIncomeStatus;
import com.cstar.platform.finance.model.IncomeSource;
import com.cstar.platform.products.ProductRepository;
import com.cstar.platform.products.model.Product;
import com.cstar.platform.agenda.AgendaEventRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
public class ClientServiceOrderService {

    private final ClientServiceOrderRepository orderRepository;
    private final ClientRepository clientRepository;
    private final ClinicServiceRepository clinicServiceRepository;
    private final ProductRepository productRepository;
    private final FinanceEntryService financeEntryService;
    private final FinanceIncomeTypeRepository financeIncomeTypeRepository;
    private final FinanceIncomeRepository financeIncomeRepository;
    private final AgendaEventTypeRepository agendaEventTypeRepository;
    private final AgendaEventRepository agendaEventRepository;

    public ClientServiceOrderService(
            ClientServiceOrderRepository orderRepository,
            ClientRepository clientRepository,
            ClinicServiceRepository clinicServiceRepository,
            ProductRepository productRepository,
            FinanceEntryService financeEntryService,
            FinanceIncomeTypeRepository financeIncomeTypeRepository,
            FinanceIncomeRepository financeIncomeRepository,
            AgendaEventTypeRepository agendaEventTypeRepository,
            AgendaEventRepository agendaEventRepository
    ) {
        this.orderRepository = orderRepository;
        this.clientRepository = clientRepository;
        this.clinicServiceRepository = clinicServiceRepository;
        this.productRepository = productRepository;
        this.financeEntryService = financeEntryService;
        this.financeIncomeTypeRepository = financeIncomeTypeRepository;
        this.financeIncomeRepository = financeIncomeRepository;
        this.agendaEventTypeRepository = agendaEventTypeRepository;
        this.agendaEventRepository = agendaEventRepository;
    }

    @Transactional(readOnly = true)
    public List<ClientServiceOrderResponse> listAll() {
        return orderRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ClientServiceOrderResponse> listByClient(UUID clientId) {
        return orderRepository.findByClientIdOrderByCreatedAtDesc(clientId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ClientServiceOrderResponse findPendingByClient(UUID clientId) {
        return orderRepository.findFirstByClientIdAndPaymentStatusInAndStatusInOrderByUpdatedAtDesc(
                clientId,
            List.of(
                ClientServiceOrderPaymentStatus.ORCADO,
                ClientServiceOrderPaymentStatus.AGUARDANDO_PAGAMENTO,
                ClientServiceOrderPaymentStatus.PAGAMENTO_PARCIAL
            ),
            List.of(
                ClientServiceOrderStatus.ORCADO,
                ClientServiceOrderStatus.AGENDADO,
                ClientServiceOrderStatus.AGUARDANDO_RETORNO
            )
            )
                .map(this::toResponse)
                .orElse(null);
    }

    @Transactional
    public ClientServiceOrderResponse create(CreateClientServiceOrderRequest request) {
        Client client = clientRepository.findById(request.clientId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cliente não encontrado"));

        List<UUID> requestedServiceIds = distinctServiceIds(request.serviceIds());
        List<ClinicService> selectedServices = clinicServiceRepository.findAllById(requestedServiceIds);
        if (selectedServices.size() != requestedServiceIds.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Um ou mais serviços não foram encontrados");
        }

        Map<UUID, BigDecimal> requiredFromServices = aggregateRequiredProductsFromServices(selectedServices);
        Map<UUID, BigDecimal> requiredFromExtras = aggregateExtraProducts(request.extraProducts());

        Map<UUID, BigDecimal> totalRequiredProducts = new HashMap<>(requiredFromServices);
        requiredFromExtras.forEach((productId, qty) ->
                totalRequiredProducts.merge(productId, qty, BigDecimal::add)
        );

        Map<UUID, Product> involvedProducts = loadProducts(totalRequiredProducts.keySet());

        BigDecimal subtotalServices = selectedServices.stream()
                .map(ClinicService::getPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal subtotalExtraProducts = requiredFromExtras.entrySet().stream()
                .map(entry -> involvedProducts.get(entry.getKey()).getSalePrice().multiply(entry.getValue()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal discount = normalizeDiscount(request.discountAmount());
        boolean customTotalEnabled = request.customTotalEnabled() != null && request.customTotalEnabled();
        BigDecimal customTotalValue = normalizeCustomTotal(request.customTotalValue(), customTotalEnabled);

        BigDecimal finalTotal = customTotalEnabled
                ? customTotalValue
                : subtotalServices.add(subtotalExtraProducts).subtract(discount);

        if (!customTotalEnabled && finalTotal.signum() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Total final não pode ser negativo");
        }

        Optional<ClientServiceOrder> requestedOrder = findRequestedOpenOrder(client, request.orderId());
        ClientServiceOrder order = requestedOrder.orElse(null);

        if (order == null) {
            order = ClientServiceOrder.create(
                client,
                subtotalServices,
                subtotalExtraProducts,
                discount,
                customTotalEnabled,
                customTotalValue,
                finalTotal,
                normalizeNotes(request.notes())
            );
        } else {
            order.updateBudget(
                subtotalServices,
                subtotalExtraProducts,
                discount,
                customTotalEnabled,
                customTotalValue,
                finalTotal,
                normalizeNotes(request.notes())
            );
            order.clearServiceItems();
            order.clearProductItems();
        }

        for (ClinicService service : selectedServices) {
            order.addServiceItem(ClientServiceOrderServiceItem.of(order, service));
        }

        for (Map.Entry<UUID, BigDecimal> entry : requiredFromServices.entrySet()) {
            Product product = involvedProducts.get(entry.getKey());
            order.addProductItem(ClientServiceOrderProductItem.of(order, product, OrderProductSource.SERVICE_COMPOSITION, entry.getValue()));
        }

        for (Map.Entry<UUID, BigDecimal> entry : requiredFromExtras.entrySet()) {
            Product product = involvedProducts.get(entry.getKey());
            order.addProductItem(ClientServiceOrderProductItem.of(order, product, OrderProductSource.EXTRA, entry.getValue()));
        }

        return toResponse(orderRepository.save(order));
    }

    @Transactional
    public ClientServiceOrderResponse confirmPayment(UUID orderId, ConfirmClientServiceOrderPaymentRequest request) {
        ClientServiceOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Orçamento não encontrado"));

        if (order.getStatus() == ClientServiceOrderStatus.FINALIZADO) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Serviço finalizado não aceita alteração de pagamento");
        }

        if (order.getPaymentStatus() == ClientServiceOrderPaymentStatus.PAGAMENTO_CONCLUIDO) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Pagamento deste serviço já está concluído");
        }

        ServicePaymentMethod paymentMethod = request.paymentMethod();
        int installmentCount = normalizeInstallmentCount(paymentMethod, request.installmentCount());
        boolean paid = request.paid() != null && request.paid();
        boolean firstInstallmentPaid = request.firstInstallmentPaid() != null && request.firstInstallmentPaid();

        if (paid && firstInstallmentPaid) {
            firstInstallmentPaid = false;
        }

        int paidInstallmentCount = resolvePaidInstallments(installmentCount, paid, firstInstallmentPaid);

        createFinanceIncomes(order, installmentCount, paidInstallmentCount);

        order.applyPaymentStatus(paymentMethod, installmentCount, paidInstallmentCount);
        ClientServiceOrder saved = orderRepository.save(order);

        if (saved.getPaymentStatus() == ClientServiceOrderPaymentStatus.PAGAMENTO_CONCLUIDO) {
            Client client = order.getClient();
            client.transitionToClosedDeal();
            clientRepository.save(client);
        }

        return toResponse(saved);
    }

    @Transactional
    public ClientServiceOrderResponse createPaymentPlan(UUID orderId, CreateClientServiceOrderPaymentPlanRequest request) {
        ClientServiceOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Serviço não encontrado"));

        List<FinanceIncome> existingIncomes = financeIncomeRepository.findByReferenceIdAndSourceOrderByOccurredOnAscCreatedAtAsc(
                order.getId(),
                IncomeSource.SERVICE_ORDER
        );

        if (!existingIncomes.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Este serviço já possui faturas cadastradas");
        }

        ServicePaymentMethod paymentMethod = request.paymentMethod();
        int installmentCount = normalizeInstallmentCount(paymentMethod, request.installmentCount());
        boolean allowsInstallments = paymentMethod == ServicePaymentMethod.CREDIT_CARD
            || paymentMethod == ServicePaymentMethod.PIX_INSTALLMENT;

        boolean customSplitPaymentEnabled = request.customSplitPaymentEnabled() != null && request.customSplitPaymentEnabled();
        ServicePaymentMethod downPaymentMethod = paymentMethod;
        ServicePaymentMethod remainingPaymentMethod = paymentMethod;

        if (customSplitPaymentEnabled) {
            if (request.downPaymentMethod() == null || request.remainingPaymentMethod() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Informe as duas formas de pagamento para o modo personalizado");
            }

            downPaymentMethod = request.downPaymentMethod();
            remainingPaymentMethod = request.remainingPaymentMethod();

            if (downPaymentMethod == ServicePaymentMethod.CREDIT_CARD || downPaymentMethod == ServicePaymentMethod.PIX_INSTALLMENT) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Forma da entrada deve ser à vista (Pix, Dinheiro ou Troca)");
            }

            if (remainingPaymentMethod != ServicePaymentMethod.CREDIT_CARD && remainingPaymentMethod != ServicePaymentMethod.PIX_INSTALLMENT) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Forma do restante deve ser Cartão de crédito ou Pix parcelado");
            }

            installmentCount = normalizeInstallmentCount(remainingPaymentMethod, request.installmentCount());
            allowsInstallments = true;
        }

        boolean downPaymentEnabled = request.downPaymentEnabled() != null && request.downPaymentEnabled();
        if (customSplitPaymentEnabled) {
            downPaymentEnabled = true;
        }
        if (downPaymentEnabled && !allowsInstallments) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Entrada + parcelas está disponível apenas para Cartão ou Pix parcelado"
            );
        }

        BigDecimal total = order.getFinalTotal();
        BigDecimal downPaymentAmount = BigDecimal.ZERO;

        if (downPaymentEnabled) {
            if (request.downPaymentAmount() == null || request.downPaymentAmount().signum() <= 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe um valor de entrada válido");
            }

            downPaymentAmount = request.downPaymentAmount();
            if (downPaymentAmount.compareTo(total) >= 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "A entrada deve ser menor que o valor total do serviço");
            }
        }

        BigDecimal remaining = total.subtract(downPaymentAmount);
        if (remaining.signum() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Valor restante inválido para parcelamento");
        }

        List<BigDecimal> installmentValues = splitInstallments(remaining, installmentCount);
        FinanceIncomeType incomeType = resolveServiceIncomeType();

        if (downPaymentEnabled) {
            financeEntryService.createIncome(new FinanceIncomeRequest(
                    incomeType.getId(),
                    IncomeSource.SERVICE_ORDER,
                    order.getId(),
                    downPaymentAmount,
                "Entrada (" + paymentMethodLabel(downPaymentMethod) + ") - " + order.getClient().getFullName(),
                    order.getNotes(),
                    LocalDate.now(),
                    FinanceIncomeStatus.AGUARDANDO_PAGAMENTO
            ));
        }

        for (int index = 0; index < installmentCount; index++) {
            int number = index + 1;
            String description = "Parcela " + number + "/" + installmentCount + " ("
                + paymentMethodLabel(remainingPaymentMethod) + ") - " + order.getClient().getFullName();

            financeEntryService.createIncome(new FinanceIncomeRequest(
                    incomeType.getId(),
                    IncomeSource.SERVICE_ORDER,
                    order.getId(),
                    installmentValues.get(index),
                    description,
                    order.getNotes(),
                    LocalDate.now().plusMonths(index + 1L),
                    FinanceIncomeStatus.AGUARDANDO_PAGAMENTO
            ));
        }

        int totalInvoices = installmentCount + (downPaymentEnabled ? 1 : 0);
        order.initializePaymentPlan(remainingPaymentMethod, totalInvoices);
        return toResponse(orderRepository.save(order));
    }

    @Transactional
    public ClientServiceOrderResponse scheduleService(UUID orderId, ScheduleClientServiceOrderRequest request) {
        ClientServiceOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Serviço não encontrado"));

        if (order.getStatus() != ClientServiceOrderStatus.ORCADO) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Somente serviços orçados podem ser agendados");
        }

        Instant scheduledAt = request.scheduledAt();
        Instant now = Instant.now();
        if (scheduledAt == null || scheduledAt.isBefore(now)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Data/hora de agendamento deve ser de hoje em diante");
        }

        Map<UUID, BigDecimal> requiredProducts = aggregateRequiredProductsFromOrder(order);
        Map<UUID, Product> involvedProducts = loadProducts(requiredProducts.keySet());
        validateAndConsumeStock(requiredProducts, involvedProducts);

        int durationMinutes = resolveOrderDurationMinutes(order);
        validateNoAgendaConflict(scheduledAt, durationMinutes);
        AgendaEventType eventType = resolveAgendaEventTypeForServiceSchedule();

        String title = "Serviço - " + order.getClient().getFullName();
        String notes = buildAgendaNotes(order);
        AgendaEvent event = AgendaEvent.create(
                eventType,
                order.getClient(),
                title,
                notes,
                eventType.getColor(),
                scheduledAt,
                durationMinutes
        );
        agendaEventRepository.save(event);

        order.scheduleService(scheduledAt);
        return toResponse(orderRepository.save(order));
    }

    @Transactional
    public ClientServiceOrderResponse addObservation(UUID orderId, AddClientServiceOrderObservationRequest request) {
        ClientServiceOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Serviço não encontrado"));

        if (order.getStatus() == ClientServiceOrderStatus.ORCADO) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Agende o serviço para registrar observações");
        }

        String note = normalizeNotes(request.note());
        if (note == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Observação inválida");
        }

        order.addObservation(note);
        return toResponse(orderRepository.save(order));
    }

    @Transactional
    public ClientServiceOrderResponse scheduleReturn(UUID orderId, ScheduleClientServiceOrderReturnRequest request) {
        ClientServiceOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Serviço não encontrado"));

        if (order.getStatus() == ClientServiceOrderStatus.ORCADO) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Agende o serviço principal antes de agendar retorno");
        }

        if (order.getStatus() == ClientServiceOrderStatus.FINALIZADO) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Serviço já finalizado");
        }

        Instant returnAt = request.returnAt();
        Instant now = Instant.now();
        if (returnAt == null || returnAt.isBefore(now)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Data/hora do retorno deve ser de hoje em diante");
        }

        if (order.getScheduledAt() != null && returnAt.isBefore(order.getScheduledAt())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Não é possível marcar retorno antes da data de agendamento do serviço");
        }

        AgendaEventType eventType = resolveAgendaEventTypeForReturn();
        int returnDurationMinutes = eventType.getDefaultDurationMinutes() != null && eventType.getDefaultDurationMinutes() > 0
                ? eventType.getDefaultDurationMinutes()
                : 30;
        validateNoAgendaConflict(returnAt, returnDurationMinutes);
        String title = "Retorno - " + order.getClient().getFullName();
        String notes = buildAgendaNotes(order);

        AgendaEvent event = AgendaEvent.create(
                eventType,
                order.getClient(),
                title,
                notes,
                eventType.getColor(),
                returnAt,
                returnDurationMinutes
        );
        agendaEventRepository.save(event);

        order.scheduleReturn(returnAt);
        return toResponse(orderRepository.save(order));
    }

    @Transactional
    public ClientServiceOrderResponse finalizeService(UUID orderId) {
        ClientServiceOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Serviço não encontrado"));

        if (order.getStatus() == ClientServiceOrderStatus.ORCADO) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Agende o serviço antes de concluir");
        }

        if (order.getStatus() == ClientServiceOrderStatus.FINALIZADO) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Serviço já está finalizado");
        }

        order.finalizeService();
        return toResponse(orderRepository.save(order));
    }

    private Optional<ClientServiceOrder> findRequestedOpenOrder(Client client, UUID orderId) {
        if (orderId == null) {
            return Optional.empty();
        }

        ClientServiceOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Orçamento informado não existe"));

        if (!order.getClient().getId().equals(client.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Orçamento não pertence ao cliente informado");
        }

        if (order.getStatus() == ClientServiceOrderStatus.FINALIZADO) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Somente orçamentos pendentes podem ser atualizados");
        }

        return Optional.of(order);
    }

    private int resolvePaidInstallments(int installmentCount, boolean paid, boolean firstInstallmentPaid) {
        if (installmentCount > 1 && paid) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Para pagamentos parcelados, não é permitido marcar como pago total");
        }

        if (paid) {
            return installmentCount;
        }

        if (installmentCount == 1) {
            return 0;
        }

        return firstInstallmentPaid ? 1 : 0;
    }

    private int normalizeInstallmentCount(ServicePaymentMethod method, Integer installmentCount) {
        if (method == ServicePaymentMethod.CREDIT_CARD || method == ServicePaymentMethod.PIX_INSTALLMENT) {
            if (installmentCount == null || installmentCount < 1 || installmentCount > 12) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe parcelas entre 1 e 12");
            }
            return installmentCount;
        }

        if (installmentCount != null && installmentCount > 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Forma de pagamento selecionada não permite parcelamento");
        }

        return 1;
    }

    private Map<UUID, BigDecimal> aggregateRequiredProductsFromOrder(ClientServiceOrder order) {
        Map<UUID, BigDecimal> required = new HashMap<>();
        for (ClientServiceOrderProductItem item : order.getProducts()) {
            required.merge(item.getProduct().getId(), item.getQuantityUsed(), BigDecimal::add);
        }
        return required;
    }

    private void createFinanceIncomes(ClientServiceOrder order, int installmentCount, int paidInstallmentCount) {
        FinanceIncomeType incomeType = resolveServiceIncomeType();
        List<BigDecimal> installmentValues = splitInstallments(order.getFinalTotal(), installmentCount);
        List<FinanceIncome> existingIncomes = financeIncomeRepository.findByReferenceIdAndSourceOrderByOccurredOnAscCreatedAtAsc(
                order.getId(),
                IncomeSource.SERVICE_ORDER
        );

        for (int index = 0; index < installmentCount; index++) {
            LocalDate dueDate = LocalDate.now().plusMonths(index);
            int number = index + 1;
            String description = installmentCount == 1
                    ? "Pagamento de serviço - " + order.getClient().getFullName()
                    : "Pagamento de serviço - " + order.getClient().getFullName() + " (" + number + "/" + installmentCount + ")";

            boolean shouldBePaid = index < paidInstallmentCount;

            if (index < existingIncomes.size()) {
                FinanceIncome existing = existingIncomes.get(index);
                if (shouldBePaid) {
                    existing.markPaid();
                    financeIncomeRepository.save(existing);
                }
                continue;
            }

            financeEntryService.createIncome(new FinanceIncomeRequest(
                    incomeType.getId(),
                    IncomeSource.SERVICE_ORDER,
                    order.getId(),
                    installmentValues.get(index),
                    description,
                    order.getNotes(),
                    dueDate,
                    shouldBePaid ? FinanceIncomeStatus.PAGO : FinanceIncomeStatus.AGUARDANDO_PAGAMENTO
            ));
        }
    }

    private List<BigDecimal> splitInstallments(BigDecimal total, int installmentCount) {
        List<BigDecimal> values = new ArrayList<>();
        BigDecimal base = total.divide(BigDecimal.valueOf(installmentCount), 2, RoundingMode.DOWN);
        BigDecimal accumulated = BigDecimal.ZERO;

        for (int i = 0; i < installmentCount - 1; i++) {
            values.add(base);
            accumulated = accumulated.add(base);
        }

        values.add(total.subtract(accumulated));
        return values;
    }

    private FinanceIncomeType resolveServiceIncomeType() {
        return financeIncomeTypeRepository.findByNameIgnoreCase("Serviço")
                .orElseGet(() -> financeIncomeTypeRepository.save(
                        FinanceIncomeType.create("Serviço", "Receita originada de serviços contratados", true)
                ));
    }

    private List<UUID> distinctServiceIds(List<UUID> serviceIds) {
        if (serviceIds == null || serviceIds.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selecione ao menos um serviço");
        }

        Set<UUID> seen = new HashSet<>();
        List<UUID> result = new ArrayList<>();

        for (UUID id : serviceIds) {
            if (id == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Serviço inválido na seleção");
            }
            if (seen.add(id)) {
                result.add(id);
            }
        }

        return result;
    }

    private Map<UUID, BigDecimal> aggregateRequiredProductsFromServices(List<ClinicService> services) {
        Map<UUID, BigDecimal> required = new HashMap<>();

        for (ClinicService service : services) {
            service.getConsumedProducts().forEach(item -> {
                UUID productId = item.getProduct().getId();
                required.merge(productId, item.getQuantityUsed(), BigDecimal::add);
            });
        }

        return required;
    }

    private Map<UUID, BigDecimal> aggregateExtraProducts(List<ExtraProductInput> extraProducts) {
        Map<UUID, BigDecimal> required = new HashMap<>();

        if (extraProducts == null || extraProducts.isEmpty()) {
            return required;
        }

        for (ExtraProductInput item : extraProducts) {
            if (item.productId() == null || item.quantityUsed() == null || item.quantityUsed().signum() <= 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Produto extra inválido");
            }

            required.merge(item.productId(), item.quantityUsed(), BigDecimal::add);
        }

        return required;
    }

    private Map<UUID, Product> loadProducts(Set<UUID> productIds) {
        if (productIds.isEmpty()) {
            return Map.of();
        }

        List<Product> products = productRepository.findAllById(productIds);
        if (products.size() != productIds.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Um ou mais produtos não foram encontrados");
        }

        Map<UUID, Product> mapped = new HashMap<>();
        for (Product product : products) {
            mapped.put(product.getId(), product);
        }

        return mapped;
    }

    private void validateAndConsumeStock(Map<UUID, BigDecimal> requiredProducts, Map<UUID, Product> involvedProducts) {
        for (Map.Entry<UUID, BigDecimal> entry : requiredProducts.entrySet()) {
            Product product = involvedProducts.get(entry.getKey());
            BigDecimal requiredQty = entry.getValue();

            if (product.getStockQuantity().compareTo(requiredQty) < 0) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Estoque insuficiente para o produto: " + product.getName()
                );
            }
        }

        for (Map.Entry<UUID, BigDecimal> entry : requiredProducts.entrySet()) {
            Product product = involvedProducts.get(entry.getKey());
            product.consumeStock(entry.getValue());
            productRepository.save(product);
        }
    }

    private BigDecimal normalizeDiscount(BigDecimal rawDiscount) {
        if (rawDiscount == null) {
            return BigDecimal.ZERO;
        }

        if (rawDiscount.signum() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Desconto não pode ser negativo");
        }

        return rawDiscount;
    }

    private BigDecimal normalizeCustomTotal(BigDecimal rawCustomTotal, boolean customEnabled) {
        if (!customEnabled) {
            return null;
        }

        if (rawCustomTotal == null || rawCustomTotal.signum() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Total personalizado inválido");
        }

        return rawCustomTotal;
    }

    private String normalizeNotes(String rawNotes) {
        if (rawNotes == null || rawNotes.isBlank()) {
            return null;
        }

        return rawNotes.trim();
    }

    private int resolveOrderDurationMinutes(ClientServiceOrder order) {
        int total = order.getServices().stream()
                .map(item -> item.getService().getDurationMinutes())
                .filter(value -> value != null && value > 0)
                .mapToInt(Integer::intValue)
                .sum();

        return total > 0 ? total : 60;
    }

    private AgendaEventType resolveAgendaEventTypeForServiceSchedule() {
        return agendaEventTypeRepository.findFirstByKindAndActiveTrue(AgendaEventKind.EVENTO)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tipo de evento padrão da agenda não encontrado"));
    }

    private AgendaEventType resolveAgendaEventTypeForReturn() {
        return agendaEventTypeRepository.findFirstByKindAndActiveTrue(AgendaEventKind.RETORNO)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tipo de retorno da agenda não encontrado"));
    }

    private String buildAgendaNotes(ClientServiceOrder order) {
        return "Ordem de serviço: " + order.getId();
    }

    private String paymentMethodLabel(ServicePaymentMethod method) {
        if (method == ServicePaymentMethod.CREDIT_CARD) {
            return "Cartão de crédito";
        }
        if (method == ServicePaymentMethod.PIX_INSTALLMENT) {
            return "Pix parcelado";
        }
        if (method == ServicePaymentMethod.CASH) {
            return "Dinheiro";
        }
        if (method == ServicePaymentMethod.TRADE) {
            return "Troca";
        }
        return "Pix";
    }

    private void validateNoAgendaConflict(Instant startAt, int durationMinutes) {
        Instant endAt = startAt.plus(durationMinutes, ChronoUnit.MINUTES);
        agendaEventRepository.findFirstConflict(startAt, endAt)
                .ifPresent(conflict -> {
                    String title = conflict.getTitle() == null || conflict.getTitle().isBlank()
                            ? "sem título"
                            : conflict.getTitle();
                    throw new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "Não é possível agendar nessa data pois já existe o evento " + title + " no mesmo horário"
                    );
                });
    }

    private ClientServiceOrderResponse toResponse(ClientServiceOrder order) {
        List<ClientServiceOrderServiceItemResponse> services = order.getServices().stream()
                .map(item -> new ClientServiceOrderServiceItemResponse(
                        item.getId(),
                        item.getService().getId(),
                        item.getServiceNameSnapshot(),
                        item.getServicePriceSnapshot()
                ))
                .toList();

        List<ClientServiceOrderProductItemResponse> products = order.getProducts().stream()
                .map(item -> new ClientServiceOrderProductItemResponse(
                        item.getId(),
                        item.getProduct().getId(),
                        item.getSource().name(),
                        item.getProductNameSnapshot(),
                        item.getQuantityUsed(),
                        item.getSalePriceSnapshot()
                ))
                .toList();

            List<ClientServiceOrderObservationResponse> observations = order.getObservations().stream()
                .sorted((first, second) -> second.getCreatedAt().compareTo(first.getCreatedAt()))
                .map(item -> new ClientServiceOrderObservationResponse(
                    item.getId(),
                    item.getNote(),
                    item.getCreatedAt()
                ))
                .toList();

            List<ClientServiceOrderReturnResponse> returns = order.getReturns().stream()
                .sorted((first, second) -> second.getReturnAt().compareTo(first.getReturnAt()))
                .map(item -> new ClientServiceOrderReturnResponse(
                    item.getId(),
                    item.getReturnAt(),
                    item.getCreatedAt()
                ))
                .toList();

        return new ClientServiceOrderResponse(
                order.getId(),
                order.getClient().getId(),
            order.getClient().getFullName(),
                order.getSubtotalServices(),
                order.getSubtotalExtraProducts(),
                order.getDiscountAmount(),
                order.isCustomTotalEnabled(),
                order.getCustomTotalValue(),
                order.getFinalTotal(),
                order.getNotes(),
                order.getStatus().name(),
                order.getStatus().name(),
                order.getPaymentStatus().name(),
                order.getPaymentMethod() != null ? order.getPaymentMethod().name() : null,
                order.getInstallmentCount(),
                order.getPaidInstallmentCount(),
                order.getPaidAt(),
                order.getScheduledAt(),
                order.getNextReturnAt(),
                services,
                products,
                observations,
                returns,
                order.getCreatedAt(),
                order.getUpdatedAt()
        );
    }
}
