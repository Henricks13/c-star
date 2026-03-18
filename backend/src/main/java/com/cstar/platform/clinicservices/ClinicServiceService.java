package com.cstar.platform.clinicservices;

import com.cstar.platform.clinicservices.dto.ClinicServiceResponse;
import com.cstar.platform.clinicservices.dto.CreateClinicServiceRequest;
import com.cstar.platform.clinicservices.dto.ServiceProductInput;
import com.cstar.platform.clinicservices.dto.ServiceProductResponse;
import com.cstar.platform.clinicservices.dto.UpdateClinicServiceRequest;
import com.cstar.platform.clinicservices.model.ClinicService;
import com.cstar.platform.clinicservices.model.ServiceProduct;
import com.cstar.platform.clinicservices.model.ServiceStage;
import com.cstar.platform.products.ProductRepository;
import com.cstar.platform.products.model.Product;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class ClinicServiceService {

    private final ClinicServiceRepository clinicServiceRepository;
    private final ProductRepository productRepository;

    public ClinicServiceService(ClinicServiceRepository clinicServiceRepository, ProductRepository productRepository) {
        this.clinicServiceRepository = clinicServiceRepository;
        this.productRepository = productRepository;
    }

    @Transactional(readOnly = true)
    public List<ClinicServiceResponse> list() {
        return clinicServiceRepository.findAll(Sort.by(Sort.Direction.ASC, "name"))
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public ClinicServiceResponse create(CreateClinicServiceRequest request) {
        String name = normalizeName(request.name());
        ServiceStage stage = parseStage(request.stage());
        BigDecimal price = ensurePrice(request.price());
        Integer durationMinutes = normalizeDuration(request.durationMinutes());
        boolean active = request.active() == null || request.active();
        String notes = normalizeNotes(request.notes());

        if (clinicServiceRepository.existsByNameIgnoreCase(name)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Já existe serviço com este nome");
        }

        ClinicService service = ClinicService.create(
                name,
                stage,
                price,
                durationMinutes,
                active,
                notes
        );

        replaceConsumedProducts(service, request.consumedProducts());
        ClinicService saved = clinicServiceRepository.save(service);
        return toResponse(saved);
    }

    @Transactional
    public ClinicServiceResponse update(UUID id, UpdateClinicServiceRequest request) {
        ClinicService current = clinicServiceRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Serviço não encontrado"));

        String name = normalizeName(request.name());
        ServiceStage stage = parseStage(request.stage());
        BigDecimal price = ensurePrice(request.price());
        Integer durationMinutes = normalizeDuration(request.durationMinutes());
        boolean active = request.active() == null || request.active();
        String notes = normalizeNotes(request.notes());

        if (clinicServiceRepository.existsByNameIgnoreCaseAndIdNot(name, id)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Já existe serviço com este nome");
        }

        current.update(name, stage, price, durationMinutes, active, notes);
        replaceConsumedProducts(current, request.consumedProducts());

        ClinicService saved = clinicServiceRepository.save(current);
        return toResponse(saved);
    }

    @Transactional
    public void delete(UUID id) {
        ClinicService current = clinicServiceRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Serviço não encontrado"));

        try {
            clinicServiceRepository.delete(current);
        } catch (DataIntegrityViolationException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Não foi possível excluir este serviço", ex);
        }
    }

    private ClinicServiceResponse toResponse(ClinicService service) {
        List<ServiceProductResponse> consumedProducts = service.getConsumedProducts().stream()
                .map(item -> new ServiceProductResponse(
                        item.getId(),
                        item.getProduct().getId(),
                        item.getProduct().getName(),
                        item.getProduct().getSku(),
                        item.getQuantityUsed()
                ))
                .toList();

        return new ClinicServiceResponse(
                service.getId(),
                service.getName(),
                service.getStage().name(),
                service.getPrice(),
                service.getDurationMinutes(),
                service.isActive(),
                service.getNotes(),
                consumedProducts,
                service.getCreatedAt(),
                service.getUpdatedAt()
        );
    }

    private void replaceConsumedProducts(ClinicService service, List<ServiceProductInput> consumedProductsInput) {
        service.clearConsumedProducts();

        if (consumedProductsInput == null || consumedProductsInput.isEmpty()) {
            return;
        }

        Set<UUID> seenProducts = new HashSet<>();

        for (ServiceProductInput input : consumedProductsInput) {
            UUID productId = input.productId();
            if (!seenProducts.add(productId)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Produto duplicado na composição do serviço");
            }

            Product product = productRepository.findById(productId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Produto da composição não encontrado"));

            BigDecimal quantityUsed = ensureQuantity(input.quantityUsed());
            service.addConsumedProduct(ServiceProduct.of(service, product, quantityUsed));
        }
    }

    private String normalizeName(String rawName) {
        if (rawName == null || rawName.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nome do serviço é obrigatório");
        }

        return rawName.trim();
    }

    private ServiceStage parseStage(String rawStage) {
        if (rawStage == null || rawStage.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Etapa do serviço é obrigatória");
        }

        try {
            return ServiceStage.valueOf(rawStage.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Etapa de serviço inválida");
        }
    }

    private BigDecimal ensurePrice(BigDecimal price) {
        if (price == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Preço do serviço é obrigatório");
        }

        if (price.signum() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Preço do serviço não pode ser negativo");
        }

        return price;
    }

    private Integer normalizeDuration(Integer durationMinutes) {
        if (durationMinutes == null) {
            return null;
        }

        if (durationMinutes <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Duração deve ser maior que zero");
        }

        return durationMinutes;
    }

    private BigDecimal ensureQuantity(BigDecimal quantityUsed) {
        if (quantityUsed == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quantidade utilizada é obrigatória");
        }

        if (quantityUsed.signum() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quantidade utilizada deve ser maior que zero");
        }

        return quantityUsed;
    }

    private String normalizeNotes(String rawNotes) {
        if (rawNotes == null || rawNotes.isBlank()) {
            return null;
        }

        return rawNotes.trim();
    }
}
