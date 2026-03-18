package com.cstar.platform.finance;

import com.cstar.platform.finance.dto.FinanceTypeRequest;
import com.cstar.platform.finance.dto.FinanceTypeResponse;
import com.cstar.platform.finance.model.FinanceExpenseType;
import com.cstar.platform.finance.model.FinanceIncomeType;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class FinanceTypeService {

    private final FinanceIncomeTypeRepository incomeTypeRepository;
    private final FinanceExpenseTypeRepository expenseTypeRepository;

    public FinanceTypeService(FinanceIncomeTypeRepository incomeTypeRepository,
                              FinanceExpenseTypeRepository expenseTypeRepository) {
        this.incomeTypeRepository = incomeTypeRepository;
        this.expenseTypeRepository = expenseTypeRepository;
    }

    @Transactional(readOnly = true)
    public List<FinanceTypeResponse> listIncomeTypes() {
        return incomeTypeRepository.findAll().stream()
                .map(type -> new FinanceTypeResponse(
                        type.getId(),
                        type.getName(),
                        type.getDescription(),
                        type.getCreatedAt(),
                        type.getUpdatedAt()))
                .toList();
    }

    @Transactional
    public FinanceTypeResponse createIncomeType(FinanceTypeRequest request) {
        validateIncomeTypeNameUnique(request.name(), null);
        FinanceIncomeType type = FinanceIncomeType.create(request.name().trim(), trimToNull(request.description()), true);
        FinanceIncomeType saved = incomeTypeRepository.save(type);
        return new FinanceTypeResponse(saved.getId(), saved.getName(), saved.getDescription(), saved.getCreatedAt(), saved.getUpdatedAt());
    }

    @Transactional
    public FinanceTypeResponse updateIncomeType(UUID id, FinanceTypeRequest request) {
        FinanceIncomeType type = incomeTypeRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tipo de receita não encontrado"));
        validateIncomeTypeNameUnique(request.name(), id);
        type.update(request.name().trim(), trimToNull(request.description()), type.isActive());
        FinanceIncomeType saved = incomeTypeRepository.save(type);
        return new FinanceTypeResponse(saved.getId(), saved.getName(), saved.getDescription(), saved.getCreatedAt(), saved.getUpdatedAt());
    }

    @Transactional
    public void deleteIncomeType(UUID id) {
        FinanceIncomeType type = incomeTypeRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tipo de receita não encontrado"));
        incomeTypeRepository.delete(type);
    }

    @Transactional(readOnly = true)
    public List<FinanceTypeResponse> listExpenseTypes() {
        return expenseTypeRepository.findAll().stream()
                .map(type -> new FinanceTypeResponse(
                        type.getId(),
                        type.getName(),
                        type.getDescription(),
                        type.getCreatedAt(),
                        type.getUpdatedAt()))
                .toList();
    }

    @Transactional
    public FinanceTypeResponse createExpenseType(FinanceTypeRequest request) {
        validateExpenseTypeNameUnique(request.name(), null);
        FinanceExpenseType type = FinanceExpenseType.create(request.name().trim(), trimToNull(request.description()), true);
        FinanceExpenseType saved = expenseTypeRepository.save(type);
        return new FinanceTypeResponse(saved.getId(), saved.getName(), saved.getDescription(), saved.getCreatedAt(), saved.getUpdatedAt());
    }

    @Transactional
    public FinanceTypeResponse updateExpenseType(UUID id, FinanceTypeRequest request) {
        FinanceExpenseType type = expenseTypeRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tipo de despesa não encontrado"));
        validateExpenseTypeNameUnique(request.name(), id);
        type.update(request.name().trim(), trimToNull(request.description()), type.isActive());
        FinanceExpenseType saved = expenseTypeRepository.save(type);
        return new FinanceTypeResponse(saved.getId(), saved.getName(), saved.getDescription(), saved.getCreatedAt(), saved.getUpdatedAt());
    }

    @Transactional
    public void deleteExpenseType(UUID id) {
        FinanceExpenseType type = expenseTypeRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tipo de despesa não encontrado"));
        expenseTypeRepository.delete(type);
    }

    @Transactional(readOnly = true)
    public FinanceIncomeType getIncomeTypeOrThrow(UUID id) {
        return incomeTypeRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tipo de receita inválido"));
    }

    @Transactional(readOnly = true)
    public FinanceExpenseType getExpenseTypeOrThrow(UUID id) {
        return expenseTypeRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tipo de despesa inválido"));
    }

    private void validateIncomeTypeNameUnique(String rawName, UUID currentId) {
        String name = rawName.trim();
        boolean exists = currentId == null
                ? incomeTypeRepository.existsByNameIgnoreCase(name)
                : incomeTypeRepository.existsByNameIgnoreCaseAndIdNot(name, currentId);
        if (exists) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Já existe um tipo de receita com esse nome");
        }
    }

    private void validateExpenseTypeNameUnique(String rawName, UUID currentId) {
        String name = rawName.trim();
        boolean exists = currentId == null
                ? expenseTypeRepository.existsByNameIgnoreCase(name)
                : expenseTypeRepository.existsByNameIgnoreCaseAndIdNot(name, currentId);
        if (exists) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Já existe um tipo de despesa com esse nome");
        }
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
