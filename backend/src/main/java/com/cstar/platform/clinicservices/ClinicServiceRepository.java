package com.cstar.platform.clinicservices;

import com.cstar.platform.clinicservices.model.ClinicService;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ClinicServiceRepository extends JpaRepository<ClinicService, UUID> {

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, UUID id);
}
