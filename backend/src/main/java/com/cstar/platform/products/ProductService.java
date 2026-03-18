package com.cstar.platform.products;

import com.cstar.platform.products.dto.CreateProductRequest;
import com.cstar.platform.products.dto.ProductResponse;
import com.cstar.platform.products.dto.UpdateProductRequest;
import com.cstar.platform.products.model.Product;
import com.cstar.platform.products.model.ProductType;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductTypeRepository productTypeRepository;

    public ProductService(ProductRepository productRepository, ProductTypeRepository productTypeRepository) {
        this.productRepository = productRepository;
        this.productTypeRepository = productTypeRepository;
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> list() {
        return productRepository.findAll(Sort.by(Sort.Direction.ASC, "name"))
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public ProductResponse create(CreateProductRequest request) {
        ProductType type = resolveType(request.productTypeId());

        String name = normalizeName(request.name());
        String sku = normalizeSku(request.sku());
        BigDecimal purchasePrice = ensureMoney(request.purchasePrice(), "Preço de compra");
        BigDecimal salePrice = ensureMoney(request.salePrice(), "Preço de venda");
        BigDecimal stockQuantity = ensureQuantity(request.stockQuantity(), "Estoque atual");
        BigDecimal minimumStock = ensureQuantity(request.minimumStock(), "Estoque mínimo");
        boolean perishable = request.perishable() != null && request.perishable();
        LocalDate expirationDate = normalizeExpirationDate(perishable, request.expirationDate());
        boolean active = request.active() == null || request.active();
        String notes = normalizeNotes(request.notes());

        if (sku != null && productRepository.existsBySkuIgnoreCase(sku)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Já existe produto com este SKU");
        }

        Product saved = productRepository.save(Product.create(
                name,
                sku,
                type,
                purchasePrice,
                salePrice,
                stockQuantity,
                minimumStock,
                perishable,
                expirationDate,
                active,
                notes
        ));

        return toResponse(saved);
    }

    @Transactional
    public ProductResponse update(UUID id, UpdateProductRequest request) {
        Product current = productRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Produto não encontrado"));

        ProductType type = resolveType(request.productTypeId());

        String name = normalizeName(request.name());
        String sku = normalizeSku(request.sku());
        BigDecimal purchasePrice = ensureMoney(request.purchasePrice(), "Preço de compra");
        BigDecimal salePrice = ensureMoney(request.salePrice(), "Preço de venda");
        BigDecimal stockQuantity = ensureQuantity(request.stockQuantity(), "Estoque atual");
        BigDecimal minimumStock = ensureQuantity(request.minimumStock(), "Estoque mínimo");
        boolean perishable = request.perishable() != null && request.perishable();
        LocalDate expirationDate = normalizeExpirationDate(perishable, request.expirationDate());
        boolean active = request.active() == null || request.active();
        String notes = normalizeNotes(request.notes());

        if (sku != null && productRepository.existsBySkuIgnoreCaseAndIdNot(sku, id)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Já existe produto com este SKU");
        }

        current.update(
                name,
                sku,
                type,
                purchasePrice,
                salePrice,
                stockQuantity,
                minimumStock,
                perishable,
                expirationDate,
                active,
                notes
        );

        Product saved = productRepository.save(current);
        return toResponse(saved);
    }

    @Transactional
    public void delete(UUID id) {
        Product current = productRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Produto não encontrado"));

        productRepository.delete(current);
    }

    private ProductResponse toResponse(Product product) {
        return new ProductResponse(
                product.getId(),
                product.getName(),
                product.getSku(),
                product.getProductType().getId(),
                product.getProductType().getName(),
                product.getPurchasePrice(),
                product.getSalePrice(),
                product.getStockQuantity(),
                product.getMinimumStock(),
                product.isPerishable(),
                product.getExpirationDate(),
                product.isActive(),
                product.getNotes(),
                product.getCreatedAt(),
                product.getUpdatedAt()
        );
    }

    private ProductType resolveType(UUID typeId) {
        return productTypeRepository.findById(typeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tipo de produto não encontrado"));
    }

    private String normalizeName(String rawName) {
        if (rawName == null || rawName.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nome do produto é obrigatório");
        }

        return rawName.trim();
    }

    private String normalizeSku(String rawSku) {
        if (rawSku == null || rawSku.isBlank()) {
            return null;
        }

        return rawSku.trim();
    }

    private BigDecimal ensureMoney(BigDecimal value, String fieldLabel) {
        if (value == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldLabel + " é obrigatório");
        }

        if (value.signum() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldLabel + " não pode ser negativo");
        }

        return value;
    }

    private BigDecimal ensureQuantity(BigDecimal value, String fieldLabel) {
        if (value == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldLabel + " é obrigatório");
        }

        if (value.signum() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldLabel + " não pode ser negativo");
        }

        return value;
    }

    private LocalDate normalizeExpirationDate(boolean perishable, LocalDate expirationDate) {
        if (!perishable) {
            return null;
        }

        if (expirationDate == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe a validade para produto perecível");
        }

        return expirationDate;
    }

    private String normalizeNotes(String rawNotes) {
        if (rawNotes == null || rawNotes.isBlank()) {
            return null;
        }

        return rawNotes.trim();
    }
}
