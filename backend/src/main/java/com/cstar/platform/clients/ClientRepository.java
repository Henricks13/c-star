package com.cstar.platform.clients;

import com.cstar.platform.clients.model.Client;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ClientRepository extends JpaRepository<Client, UUID> {

    boolean existsByFullNameIgnoreCase(String fullName);

    boolean existsByFullNameIgnoreCaseAndIdNot(String fullName, UUID id);

    boolean existsByPhoneE164(String phoneE164);

    boolean existsByPhoneE164AndIdNot(String phoneE164, UUID id);

    boolean existsByCpf(String cpf);

    boolean existsByCpfAndIdNot(String cpf, UUID id);

    Optional<Client> findByCpf(String cpf);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCaseAndIdNot(String email, UUID id);

    boolean existsBySourceContactId(UUID sourceContactId);
}
