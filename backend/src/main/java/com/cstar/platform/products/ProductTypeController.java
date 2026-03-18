package com.cstar.platform.products;

import com.cstar.platform.products.dto.CreateProductTypeRequest;
import com.cstar.platform.products.dto.ProductTypeResponse;
import com.cstar.platform.products.dto.UpdateProductTypeRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/product-types")
public class ProductTypeController {

    private final ProductTypeService productTypeService;

    public ProductTypeController(ProductTypeService productTypeService) {
        this.productTypeService = productTypeService;
    }

    @GetMapping
    public List<ProductTypeResponse> list() {
        return productTypeService.list();
    }

    @PostMapping
    public ProductTypeResponse create(@RequestBody @Valid CreateProductTypeRequest request) {
        return productTypeService.create(request);
    }

    @PutMapping("/{id}")
    public ProductTypeResponse update(@PathVariable UUID id, @RequestBody @Valid UpdateProductTypeRequest request) {
        return productTypeService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        productTypeService.delete(id);
    }
}
