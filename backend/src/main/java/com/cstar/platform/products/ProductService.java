package com.cstar.platform.products;

import com.cstar.platform.products.dto.CreateProductRequest;
import com.cstar.platform.products.dto.ProductResponse;
import com.cstar.platform.products.dto.StockAdjustmentRequest;
import com.cstar.platform.products.dto.UpdateProductRequest;
import com.cstar.platform.products.model.Product;
import com.cstar.platform.products.model.ProductType;
import com.cstar.platform.products.model.StockAdjustmentOperation;
import com.cstar.platform.finance.FinanceEntryService;
import com.cstar.platform.finance.FinanceExpenseTypeRepository;
import com.cstar.platform.finance.FinanceIncomeTypeRepository;
import com.cstar.platform.finance.dto.FinanceExpenseRequest;
import com.cstar.platform.finance.dto.FinanceIncomeRequest;
import com.cstar.platform.finance.model.FinanceExpenseType;
import com.cstar.platform.finance.model.FinanceIncomeStatus;
import com.cstar.platform.finance.model.FinanceIncomeType;
import com.cstar.platform.finance.model.IncomeSource;
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
    private final FinanceEntryService financeEntryService;
    private final FinanceIncomeTypeRepository financeIncomeTypeRepository;
    private final FinanceExpenseTypeRepository financeExpenseTypeRepository;

    public ProductService(ProductRepository productRepository,
                          ProductTypeRepository productTypeRepository,
                          FinanceEntryService financeEntryService,
                          FinanceIncomeTypeRepository financeIncomeTypeRepository,
                          FinanceExpenseTypeRepository financeExpenseTypeRepository) {
        this.productRepository = productRepository;
        this.productTypeRepository = productTypeRepository;
        this.financeEntryService = financeEntryService;
        this.financeIncomeTypeRepository = financeIncomeTypeRepository;
        this.financeExpenseTypeRepository = financeExpenseTypeRepository;
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

    @Transactional
    public ProductResponse adjustStock(UUID id, StockAdjustmentRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Produto não encontrado"));

        BigDecimal quantity = ensurePositiveQuantity(request.quantity(), "Quantidade do ajuste");
        StockAdjustmentOperation operation = request.operation();
        BigDecimal unitPrice = resolveUnitPrice(product, operation, request.customUnitPrice());
        BigDecimal totalAmount = unitPrice.multiply(quantity);
        String notes = normalizeNotes(request.notes());

        if (operation == StockAdjustmentOperation.REMOVE) {
            if (product.getStockQuantity().compareTo(quantity) < 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Estoque insuficiente para retirada");
            }

            product.consumeStock(quantity);
            product.registerStockAdjustment(operation, quantity);
            productRepository.save(product);
            createIncomeForStockRemoval(product, quantity, unitPrice, totalAmount, notes);
        } else {
            product.addStock(quantity);
            product.registerStockAdjustment(operation, quantity);
            productRepository.save(product);
            createExpenseForStockAddition(product, quantity, unitPrice, totalAmount, notes);
        }

        return toResponse(product);
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
                product.getLastAdjustmentOperation(),
                product.getLastAdjustmentQuantity(),
                product.getLastAdjustmentAt(),
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

    private BigDecimal ensurePositiveQuantity(BigDecimal value, String fieldLabel) {
        if (value == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldLabel + " é obrigatório");
        }

        if (value.signum() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldLabel + " deve ser maior que zero");
        }

        return value;
    }

    private BigDecimal resolveUnitPrice(Product product, StockAdjustmentOperation operation, BigDecimal customUnitPrice) {
        if (customUnitPrice != null) {
            if (customUnitPrice.signum() < 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Preço personalizado não pode ser negativo");
            }
            return customUnitPrice;
        }

        return operation == StockAdjustmentOperation.REMOVE ? product.getSalePrice() : product.getPurchasePrice();
    }

    private void createIncomeForStockRemoval(Product product,
                                             BigDecimal quantity,
                                             BigDecimal unitPrice,
                                             BigDecimal totalAmount,
                                             String notes) {
        FinanceIncomeType incomeType = financeIncomeTypeRepository.findByNameIgnoreCase("Venda de Produto")
                .orElseGet(() -> financeIncomeTypeRepository.save(
                        FinanceIncomeType.create("Venda de Produto", "Receita originada de venda de produtos", true)
                ));

        String description = "Saída de estoque (venda) - " + product.getName() + " (" + quantity + " x " + unitPrice + ")";

        financeEntryService.createIncome(new FinanceIncomeRequest(
                incomeType.getId(),
                IncomeSource.PRODUCT_SALE,
                product.getId(),
                totalAmount,
                description,
                notes,
                LocalDate.now(),
                FinanceIncomeStatus.PAGO
        ));
    }

    private void createExpenseForStockAddition(Product product,
                                               BigDecimal quantity,
                                               BigDecimal unitPrice,
                                               BigDecimal totalAmount,
                                               String notes) {
        FinanceExpenseType expenseType = financeExpenseTypeRepository.findByNameIgnoreCase("Compra de Produto")
                .orElseGet(() -> financeExpenseTypeRepository.save(
                        FinanceExpenseType.create("Compra de Produto", "Despesa originada de reposição de estoque", true)
                ));

        String description = "Entrada de estoque (compra) - " + product.getName() + " (" + quantity + " x " + unitPrice + ")";

        financeEntryService.createExpense(new FinanceExpenseRequest(
                expenseType.getId(),
                totalAmount,
                description,
                notes,
                LocalDate.now()
        ));
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
