package com.cstar.platform.clients;

import com.cstar.platform.clients.model.Client;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ClientRepository extends JpaRepository<Client, UUID> {

    boolean existsByPhoneE164(String phoneE164);

    boolean existsByCpf(String cpf);

    Optional<Client> findByCpf(String cpf);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsBySourceContactId(UUID sourceContactId);
}
