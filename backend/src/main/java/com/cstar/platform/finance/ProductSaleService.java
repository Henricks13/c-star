package com.cstar.platform.finance;

import com.cstar.platform.finance.dto.FinanceIncomeRequest;
import com.cstar.platform.finance.dto.ProductSaleItemRequest;
import com.cstar.platform.finance.dto.ProductSaleItemResponse;
import com.cstar.platform.finance.dto.ProductSaleRequest;
import com.cstar.platform.finance.dto.ProductSaleResponse;
import com.cstar.platform.finance.model.FinanceIncomeStatus;
import com.cstar.platform.finance.model.IncomeSource;
import com.cstar.platform.finance.model.ProductSale;
import com.cstar.platform.finance.model.ProductSaleItem;
import com.cstar.platform.products.ProductRepository;
import com.cstar.platform.products.model.Product;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class ProductSaleService {

    private final ProductRepository productRepository;
    private final ProductSaleRepository productSaleRepository;
    private final FinanceEntryService financeEntryService;
    private final FinanceIncomeTypeRepository financeIncomeTypeRepository;

    public ProductSaleService(ProductRepository productRepository,
                              ProductSaleRepository productSaleRepository,
                              FinanceEntryService financeEntryService,
                              FinanceIncomeTypeRepository financeIncomeTypeRepository) {
        this.productRepository = productRepository;
        this.productSaleRepository = productSaleRepository;
        this.financeEntryService = financeEntryService;
        this.financeIncomeTypeRepository = financeIncomeTypeRepository;
    }

    @Transactional(readOnly = true)
    public List<ProductSaleResponse> listSales() {
        return productSaleRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional
    public ProductSaleResponse createSale(ProductSaleRequest request) {
        List<ProductSaleItemDraft> drafts = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;

        for (ProductSaleItemRequest itemRequest : request.items()) {
            Product product = productRepository.findById(itemRequest.productId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Produto inválido"));
            product.consumeStock(itemRequest.quantity());
            BigDecimal lineTotal = product.getSalePrice().multiply(itemRequest.quantity());
            totalAmount = totalAmount.add(lineTotal);
            drafts.add(new ProductSaleItemDraft(product, itemRequest.quantity()));
        }

        ProductSale sale = ProductSale.create(trimToNull(request.customerName()), trimToNull(request.notes()), request.occurredOn(), totalAmount);

        for (ProductSaleItemDraft draft : drafts) {
            ProductSaleItem item = ProductSaleItem.of(sale, draft.product(), draft.quantity());
            sale.addItem(item);
        }

        ProductSale saved = productSaleRepository.save(sale);

        UUID incomeTypeId = financeIncomeTypeRepository.findByNameIgnoreCase("Venda de Produto")
                .map(type -> type.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Crie o tipo de receita 'Venda de Produto' para registrar vendas avulsas"));

        financeEntryService.createIncome(new FinanceIncomeRequest(
                incomeTypeId,
                IncomeSource.PRODUCT_SALE,
            saved.getId(),
                saved.getTotalAmount(),
                "Venda avulsa de produtos",
                saved.getNotes(),
            saved.getOccurredOn(),
            FinanceIncomeStatus.PAGO
        ));

        return toResponse(saved);
    }

    private ProductSaleResponse toResponse(ProductSale sale) {
        return new ProductSaleResponse(
                sale.getId(),
                sale.getCustomerName(),
                sale.getNotes(),
                sale.getOccurredOn(),
                sale.getTotalAmount(),
                sale.getCreatedAt(),
                sale.getItems().stream()
                        .map(item -> new ProductSaleItemResponse(
                                item.getProduct().getId(),
                                item.getProductNameSnapshot(),
                                item.getQuantity(),
                                item.getUnitPrice(),
                                item.getLineTotal()))
                        .toList());
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private record ProductSaleItemDraft(Product product, BigDecimal quantity) {
    }
}
