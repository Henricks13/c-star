package com.cstar.platform.finance;

import com.cstar.platform.finance.dto.ProductSaleRequest;
import com.cstar.platform.finance.dto.ProductSaleResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/finance/product-sales")
public class ProductSaleController {

    private final ProductSaleService productSaleService;

    public ProductSaleController(ProductSaleService productSaleService) {
        this.productSaleService = productSaleService;
    }

    @GetMapping
    public List<ProductSaleResponse> listSales() {
        return productSaleService.listSales();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProductSaleResponse createSale(@Valid @RequestBody ProductSaleRequest request) {
        return productSaleService.createSale(request);
    }
}
