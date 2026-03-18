package com.cstar.platform.clientorders.model;

import com.cstar.platform.products.model.Product;
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
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "client_service_order_products")
public class ClientServiceOrderProductItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private ClientServiceOrder order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Enumerated(EnumType.STRING)
    @Column(name = "source", nullable = false, length = 40)
    private OrderProductSource source;

    @Column(name = "product_name_snapshot", nullable = false, length = 160)
    private String productNameSnapshot;

    @Column(name = "quantity_used", nullable = false, precision = 15, scale = 3)
    private BigDecimal quantityUsed;

    @Column(name = "sale_price_snapshot", nullable = false, precision = 15, scale = 2)
    private BigDecimal salePriceSnapshot;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected ClientServiceOrderProductItem() {
    }

    public static ClientServiceOrderProductItem of(
            ClientServiceOrder order,
            Product product,
            OrderProductSource source,
            BigDecimal quantityUsed
    ) {
        ClientServiceOrderProductItem item = new ClientServiceOrderProductItem();
        item.order = order;
        item.product = product;
        item.source = source;
        item.productNameSnapshot = product.getName();
        item.quantityUsed = quantityUsed;
        item.salePriceSnapshot = product.getSalePrice();
        return item;
    }

    @PrePersist
    void onPrePersist() {
        this.createdAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public Product getProduct() {
        return product;
    }

    public OrderProductSource getSource() {
        return source;
    }

    public String getProductNameSnapshot() {
        return productNameSnapshot;
    }

    public BigDecimal getQuantityUsed() {
        return quantityUsed;
    }

    public BigDecimal getSalePriceSnapshot() {
        return salePriceSnapshot;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
