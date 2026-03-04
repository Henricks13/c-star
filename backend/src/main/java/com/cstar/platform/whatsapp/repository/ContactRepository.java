package com.cstar.platform.whatsapp.repository;

import com.cstar.platform.whatsapp.model.Contact;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ContactRepository extends JpaRepository<Contact, UUID> {

    Optional<Contact> findByWhatsappPhoneE164(String whatsappPhoneE164);
}
