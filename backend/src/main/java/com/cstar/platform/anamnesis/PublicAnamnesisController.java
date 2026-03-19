package com.cstar.platform.anamnesis;

import com.cstar.platform.anamnesis.dto.PublicAnamnesisFormResponse;
import com.cstar.platform.anamnesis.dto.SubmitPublicAnamnesisRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/public/anamnesis")
public class PublicAnamnesisController {

    private final AnamnesisService anamnesisService;

    public PublicAnamnesisController(AnamnesisService anamnesisService) {
        this.anamnesisService = anamnesisService;
    }

    @GetMapping("/form")
    public PublicAnamnesisFormResponse getForm(
            @RequestParam(value = "clientId", required = false) UUID clientId,
            @RequestParam(value = "cpf", required = false) String cpf
    ) {
        return anamnesisService.getPublicForm(clientId, cpf);
    }

    @PostMapping("/submit")
    public PublicAnamnesisFormResponse submit(@Valid @RequestBody SubmitPublicAnamnesisRequest request) {
        return anamnesisService.submitPublic(request);
    }
}
