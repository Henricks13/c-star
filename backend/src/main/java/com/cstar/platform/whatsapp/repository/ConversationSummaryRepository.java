package com.cstar.platform.whatsapp.repository;

import com.cstar.platform.whatsapp.model.Contact;
import com.cstar.platform.whatsapp.model.ConversationSummary;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ConversationSummaryRepository extends JpaRepository<ConversationSummary, UUID> {

    Optional<ConversationSummary> findByContactAndChannel(Contact contact, String channel);
}
