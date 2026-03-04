package com.cstar.platform.whatsapp;

import com.cstar.platform.whatsapp.dto.ContactListItemResponse;
import com.cstar.platform.whatsapp.model.Contact;
import com.cstar.platform.whatsapp.repository.ContactRepository;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;

@RestController
@RequestMapping("/api/contacts")
public class ContactController {

    private final ContactRepository contactRepository;

    public ContactController(ContactRepository contactRepository) {
        this.contactRepository = contactRepository;
    }

    @GetMapping
    public List<ContactListItemResponse> listContacts() {
        return contactRepository.findAll(Sort.by(Sort.Direction.DESC, "updatedAt"))
                .stream()
                .map(contact -> new ContactListItemResponse(
                        contact.getId(),
                        contact.getFullName(),
                        contact.getWhatsappPhoneE164(),
                        contact.getStage().name(),
                        resolveLastInteraction(contact)
                ))
                .toList();
    }

    private Instant resolveLastInteraction(Contact contact) {
        return List.of(contact.getLastInboundAt(), contact.getLastOutboundAt(), contact.getUpdatedAt())
                .stream()
                .filter(value -> value != null)
                .max(Comparator.naturalOrder())
                .orElse(contact.getCreatedAt());
    }
}
