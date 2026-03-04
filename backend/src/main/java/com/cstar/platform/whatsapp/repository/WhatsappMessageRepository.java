package com.cstar.platform.whatsapp.repository;

import com.cstar.platform.whatsapp.model.WhatsappMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface WhatsappMessageRepository extends JpaRepository<WhatsappMessage, UUID> {

    Optional<WhatsappMessage> findByWaMessageId(String waMessageId);
}
