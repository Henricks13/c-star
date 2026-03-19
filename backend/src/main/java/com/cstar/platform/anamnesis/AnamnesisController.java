package com.cstar.platform.anamnesis;

import com.cstar.platform.anamnesis.dto.AnamnesisQuestionRequest;
import com.cstar.platform.anamnesis.dto.AnamnesisQuestionResponse;
import com.cstar.platform.anamnesis.dto.PublicAnamnesisFormResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/anamnesis")
public class AnamnesisController {

    private final AnamnesisService anamnesisService;

    public AnamnesisController(AnamnesisService anamnesisService) {
        this.anamnesisService = anamnesisService;
    }

    @GetMapping("/questions")
    public List<AnamnesisQuestionResponse> listQuestions() {
        return anamnesisService.listQuestions();
    }

    @PostMapping("/questions")
    @ResponseStatus(HttpStatus.CREATED)
    public AnamnesisQuestionResponse createQuestion(@Valid @RequestBody AnamnesisQuestionRequest request) {
        return anamnesisService.createQuestion(request);
    }

    @PutMapping("/questions/{id}")
    public AnamnesisQuestionResponse updateQuestion(@PathVariable UUID id,
                                                    @Valid @RequestBody AnamnesisQuestionRequest request) {
        return anamnesisService.updateQuestion(id, request);
    }

    @DeleteMapping("/questions/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteQuestion(@PathVariable UUID id) {
        anamnesisService.deleteQuestion(id);
    }

    @GetMapping("/clients/{clientId}")
    public PublicAnamnesisFormResponse getByClientId(@PathVariable UUID clientId) {
        return anamnesisService.getByClientId(clientId);
    }
}
