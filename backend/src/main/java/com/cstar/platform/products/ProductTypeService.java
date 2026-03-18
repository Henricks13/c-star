package com.cstar.platform.products;

import com.cstar.platform.products.dto.CreateProductTypeRequest;
import com.cstar.platform.products.dto.ProductTypeResponse;
import com.cstar.platform.products.dto.UpdateProductTypeRequest;
import com.cstar.platform.products.model.ProductType;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class ProductTypeService {

    private final ProductTypeRepository productTypeRepository;
    private final ProductRepository productRepository;

    public ProductTypeService(ProductTypeRepository productTypeRepository, ProductRepository productRepository) {
        this.productTypeRepository = productTypeRepository;
        this.productRepository = productRepository;
    }

    @Transactional(readOnly = true)
    public List<ProductTypeResponse> list() {
        return productTypeRepository.findAll(Sort.by(Sort.Direction.ASC, "name"))
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public ProductTypeResponse create(CreateProductTypeRequest request) {
        String name = normalizeName(request.name());
        String description = normalizeDescription(request.description());
        boolean active = request.active() == null || request.active();

        if (productTypeRepository.existsByNameIgnoreCase(name)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Já existe tipo de produto com este nome");
        }

        ProductType saved = productTypeRepository.save(ProductType.create(name, description, active));
        return toResponse(saved);
    }

    @Transactional
    public ProductTypeResponse update(UUID id, UpdateProductTypeRequest request) {
        ProductType current = productTypeRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tipo de produto não encontrado"));

        String name = normalizeName(request.name());
        String description = normalizeDescription(request.description());
        boolean active = request.active() == null || request.active();

        if (productTypeRepository.existsByNameIgnoreCaseAndIdNot(name, id)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Já existe tipo de produto com este nome");
        }

        current.update(name, description, active);
        ProductType saved = productTypeRepository.save(current);
        return toResponse(saved);
    }

    @Transactional
    public void delete(UUID id) {
        ProductType current = productTypeRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tipo de produto não encontrado"));

        if (productRepository.existsByProductTypeId(id)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Não é possível excluir: há produtos vinculados a este tipo");
        }

        productTypeRepository.delete(current);
    }

    private ProductTypeResponse toResponse(ProductType type) {
        return new ProductTypeResponse(
                type.getId(),
                type.getName(),
                type.getDescription(),
                type.isActive(),
                type.getCreatedAt(),
                type.getUpdatedAt()
        );
    }

    private String normalizeName(String rawName) {
        if (rawName == null || rawName.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nome do tipo é obrigatório");
        }

        return rawName.trim();
    }

    private String normalizeDescription(String rawDescription) {
        if (rawDescription == null || rawDescription.isBlank()) {
            return null;
        }

        return rawDescription.trim();
    }
}
