package com.cstar.platform.products.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "products")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 160)
    private String name;

    @Column(name = "sku", unique = true, length = 60)
    private String sku;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_type_id", nullable = false)
    private ProductType productType;

    @Column(name = "purchase_price", nullable = false, precision = 15, scale = 2)
    private BigDecimal purchasePrice;

    @Column(name = "sale_price", nullable = false, precision = 15, scale = 2)
    private BigDecimal salePrice;

    @Column(name = "stock_quantity", nullable = false, precision = 15, scale = 3)
    private BigDecimal stockQuantity;

    @Column(name = "minimum_stock", nullable = false, precision = 15, scale = 3)
    private BigDecimal minimumStock;

    @Column(name = "perishable", nullable = false)
    private boolean perishable;

    @Column(name = "expiration_date")
    private LocalDate expirationDate;

    @Column(name = "active", nullable = false)
    private boolean active;

    @Column(name = "notes", length = 500)
    private String notes;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Product() {
    }

    public static Product create(
            String name,
            String sku,
            ProductType productType,
            BigDecimal purchasePrice,
            BigDecimal salePrice,
            BigDecimal stockQuantity,
            BigDecimal minimumStock,
            boolean perishable,
            LocalDate expirationDate,
            boolean active,
            String notes
    ) {
        Product product = new Product();
        product.name = name;
        product.sku = sku;
        product.productType = productType;
        product.purchasePrice = purchasePrice;
        product.salePrice = salePrice;
        product.stockQuantity = stockQuantity;
        product.minimumStock = minimumStock;
        product.perishable = perishable;
        product.expirationDate = expirationDate;
        product.active = active;
        product.notes = notes;
        return product;
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

    public String getName() {
        return name;
    }

    public String getSku() {
        return sku;
    }

    public ProductType getProductType() {
        return productType;
    }

    public BigDecimal getPurchasePrice() {
        return purchasePrice;
    }

    public BigDecimal getSalePrice() {
        return salePrice;
    }

    public BigDecimal getStockQuantity() {
        return stockQuantity;
    }

    public BigDecimal getMinimumStock() {
        return minimumStock;
    }

    public boolean isPerishable() {
        return perishable;
    }

    public LocalDate getExpirationDate() {
        return expirationDate;
    }

    public boolean isActive() {
        return active;
    }

    public String getNotes() {
        return notes;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void update(
            String name,
            String sku,
            ProductType productType,
            BigDecimal purchasePrice,
            BigDecimal salePrice,
            BigDecimal stockQuantity,
            BigDecimal minimumStock,
            boolean perishable,
            LocalDate expirationDate,
            boolean active,
            String notes
    ) {
        this.name = name;
        this.sku = sku;
        this.productType = productType;
        this.purchasePrice = purchasePrice;
        this.salePrice = salePrice;
        this.stockQuantity = stockQuantity;
        this.minimumStock = minimumStock;
        this.perishable = perishable;
        this.expirationDate = expirationDate;
        this.active = active;
        this.notes = notes;
    }
}
