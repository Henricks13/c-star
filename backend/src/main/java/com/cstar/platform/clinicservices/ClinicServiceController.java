package com.cstar.platform.clinicservices;

import com.cstar.platform.clinicservices.dto.ClinicServiceResponse;
import com.cstar.platform.clinicservices.dto.CreateClinicServiceRequest;
import com.cstar.platform.clinicservices.dto.UpdateClinicServiceRequest;
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
@RequestMapping("/api/services")
public class ClinicServiceController {

    private final ClinicServiceService clinicServiceService;

    public ClinicServiceController(ClinicServiceService clinicServiceService) {
        this.clinicServiceService = clinicServiceService;
    }

    @GetMapping
    public List<ClinicServiceResponse> list() {
        return clinicServiceService.list();
    }

    @PostMapping
    public ClinicServiceResponse create(@RequestBody @Valid CreateClinicServiceRequest request) {
        return clinicServiceService.create(request);
    }

    @PutMapping("/{id}")
    public ClinicServiceResponse update(@PathVariable UUID id, @RequestBody @Valid UpdateClinicServiceRequest request) {
        return clinicServiceService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        clinicServiceService.delete(id);
    }
}
