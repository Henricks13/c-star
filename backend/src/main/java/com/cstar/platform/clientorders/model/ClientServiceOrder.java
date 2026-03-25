package com.cstar.platform.clientorders.model;

import com.cstar.platform.clients.model.Client;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "client_service_orders")
public class ClientServiceOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    @Column(name = "subtotal_services", nullable = false, precision = 15, scale = 2)
    private BigDecimal subtotalServices;

    @Column(name = "subtotal_extra_products", nullable = false, precision = 15, scale = 2)
    private BigDecimal subtotalExtraProducts;

    @Column(name = "discount_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal discountAmount;

    @Column(name = "custom_total_enabled", nullable = false)
    private boolean customTotalEnabled;

    @Column(name = "custom_total_value", precision = 15, scale = 2)
    private BigDecimal customTotalValue;

    @Column(name = "final_total", nullable = false, precision = 15, scale = 2)
    private BigDecimal finalTotal;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "last_edited_by_name", length = 120)
    private String lastEditedByName;

    @Column(name = "last_edited_at")
    private Instant lastEditedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 40)
    private ClientServiceOrderStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false, length = 40)
    private ClientServiceOrderPaymentStatus paymentStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", length = 40)
    private ServicePaymentMethod paymentMethod;

    @Column(name = "installment_count")
    private Integer installmentCount;

    @Column(name = "paid_installment_count", nullable = false)
    private Integer paidInstallmentCount;

    @Column(name = "paid_at")
    private Instant paidAt;

    @Column(name = "scheduled_at")
    private Instant scheduledAt;

    @Column(name = "next_return_at")
    private Instant nextReturnAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private final List<ClientServiceOrderServiceItem> services = new ArrayList<>();

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private final List<ClientServiceOrderProductItem> products = new ArrayList<>();

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private final List<ClientServiceOrderObservation> observations = new ArrayList<>();

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private final List<ClientServiceOrderReturn> returns = new ArrayList<>();

    protected ClientServiceOrder() {
    }

    public static ClientServiceOrder create(
            Client client,
            BigDecimal subtotalServices,
            BigDecimal subtotalExtraProducts,
            BigDecimal discountAmount,
            boolean customTotalEnabled,
            BigDecimal customTotalValue,
            BigDecimal finalTotal,
            String notes
    ) {
        ClientServiceOrder order = new ClientServiceOrder();
        order.client = client;
        order.subtotalServices = subtotalServices;
        order.subtotalExtraProducts = subtotalExtraProducts;
        order.discountAmount = discountAmount;
        order.customTotalEnabled = customTotalEnabled;
        order.customTotalValue = customTotalValue;
        order.finalTotal = finalTotal;
        order.notes = notes;
        order.status = ClientServiceOrderStatus.ORCADO;
        order.paymentStatus = ClientServiceOrderPaymentStatus.ORCADO;
        order.paidInstallmentCount = 0;
        return order;
    }

    public void updateBudget(
            BigDecimal subtotalServices,
            BigDecimal subtotalExtraProducts,
            BigDecimal discountAmount,
            boolean customTotalEnabled,
            BigDecimal customTotalValue,
            BigDecimal finalTotal,
            String notes
    ) {
        this.subtotalServices = subtotalServices;
        this.subtotalExtraProducts = subtotalExtraProducts;
        this.discountAmount = discountAmount;
        this.customTotalEnabled = customTotalEnabled;
        this.customTotalValue = customTotalValue;
        this.finalTotal = finalTotal;
        this.notes = notes;
        this.status = ClientServiceOrderStatus.ORCADO;
        this.paymentStatus = ClientServiceOrderPaymentStatus.ORCADO;
        this.paymentMethod = null;
        this.installmentCount = null;
        this.paidInstallmentCount = 0;
        this.paidAt = null;
        this.scheduledAt = null;
        this.nextReturnAt = null;
        this.observations.clear();
        this.returns.clear();
    }

    public void registerBudgetEdition(String editedByName) {
        this.lastEditedByName = editedByName;
        this.lastEditedAt = Instant.now();
    }

    public void applyPaymentStatus(ServicePaymentMethod paymentMethod, int installmentCount, int paidInstallmentCount) {
        this.paymentMethod = paymentMethod;
        this.installmentCount = installmentCount;
        this.paidInstallmentCount = paidInstallmentCount;
        this.paymentStatus = resolvePaymentStatus(installmentCount, paidInstallmentCount);
        this.paidAt = this.paymentStatus == ClientServiceOrderPaymentStatus.PAGAMENTO_CONCLUIDO ? Instant.now() : null;
    }

    public void initializePaymentPlan(ServicePaymentMethod paymentMethod, int invoiceCount) {
        this.paymentMethod = paymentMethod;
        this.installmentCount = invoiceCount;
        this.paidInstallmentCount = 0;
        this.paymentStatus = ClientServiceOrderPaymentStatus.AGUARDANDO_PAGAMENTO;
        this.paidAt = null;
    }

    public void syncPaymentProgress(int invoiceCount, int paidInvoiceCount) {
        this.installmentCount = invoiceCount;
        this.paidInstallmentCount = paidInvoiceCount;

        if (invoiceCount <= 0) {
            this.paymentStatus = this.status == ClientServiceOrderStatus.ORCADO
                    ? ClientServiceOrderPaymentStatus.ORCADO
                    : ClientServiceOrderPaymentStatus.AGUARDANDO_PAGAMENTO;
            this.paidAt = null;
            return;
        }

        this.paymentStatus = resolvePaymentStatus(invoiceCount, paidInvoiceCount);
        this.paidAt = this.paymentStatus == ClientServiceOrderPaymentStatus.PAGAMENTO_CONCLUIDO ? Instant.now() : null;
    }

    public void scheduleService(Instant scheduleAt) {
        this.scheduledAt = scheduleAt;
        this.status = ClientServiceOrderStatus.AGENDADO;
        if (this.paymentStatus == ClientServiceOrderPaymentStatus.ORCADO) {
            this.paymentStatus = ClientServiceOrderPaymentStatus.AGUARDANDO_PAGAMENTO;
        }
    }

    public void addObservation(String note, String createdByName) {
        observations.add(ClientServiceOrderObservation.of(this, note, createdByName));
    }

    public void scheduleReturn(Instant returnAt) {
        returns.add(ClientServiceOrderReturn.of(this, returnAt));
        this.nextReturnAt = returnAt;
        this.status = ClientServiceOrderStatus.AGUARDANDO_RETORNO;
    }

    public void finalizeService() {
        this.nextReturnAt = null;
        this.status = ClientServiceOrderStatus.FINALIZADO;
    }

    public void addServiceItem(ClientServiceOrderServiceItem item) {
        services.add(item);
    }

    public void addProductItem(ClientServiceOrderProductItem item) {
        products.add(item);
    }

    public void clearServiceItems() {
        services.clear();
    }

    public void clearProductItems() {
        products.clear();
    }

    private ClientServiceOrderPaymentStatus resolvePaymentStatus(int installmentCount, int paidInstallmentCount) {
        if (paidInstallmentCount <= 0) {
            return ClientServiceOrderPaymentStatus.AGUARDANDO_PAGAMENTO;
        }

        if (paidInstallmentCount >= installmentCount) {
            return ClientServiceOrderPaymentStatus.PAGAMENTO_CONCLUIDO;
        }

        return ClientServiceOrderPaymentStatus.PAGAMENTO_PARCIAL;
    }

    @PrePersist
    void onPrePersist() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    void onPreUpdate() {
        this.updatedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public Client getClient() {
        return client;
    }

    public BigDecimal getSubtotalServices() {
        return subtotalServices;
    }

    public BigDecimal getSubtotalExtraProducts() {
        return subtotalExtraProducts;
    }

    public BigDecimal getDiscountAmount() {
        return discountAmount;
    }

    public boolean isCustomTotalEnabled() {
        return customTotalEnabled;
    }

    public BigDecimal getCustomTotalValue() {
        return customTotalValue;
    }

    public BigDecimal getFinalTotal() {
        return finalTotal;
    }

    public String getNotes() {
        return notes;
    }

    public ClientServiceOrderStatus getStatus() {
        return status;
    }

    public ServicePaymentMethod getPaymentMethod() {
        return paymentMethod;
    }

    public ClientServiceOrderPaymentStatus getPaymentStatus() {
        return paymentStatus;
    }

    public Integer getInstallmentCount() {
        return installmentCount;
    }

    public Integer getPaidInstallmentCount() {
        return paidInstallmentCount;
    }

    public Instant getPaidAt() {
        return paidAt;
    }

    public Instant getScheduledAt() {
        return scheduledAt;
    }

    public Instant getNextReturnAt() {
        return nextReturnAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public String getLastEditedByName() {
        return lastEditedByName;
    }

    public Instant getLastEditedAt() {
        return lastEditedAt;
    }

    public List<ClientServiceOrderServiceItem> getServices() {
        return services;
    }

    public List<ClientServiceOrderProductItem> getProducts() {
        return products;
    }

    public List<ClientServiceOrderObservation> getObservations() {
        return observations;
    }

    public List<ClientServiceOrderReturn> getReturns() {
        return returns;
    }
}
