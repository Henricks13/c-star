package com.cstar.platform.whatsapp;

import com.cstar.platform.whatsapp.model.Contact;
import com.cstar.platform.whatsapp.model.ContactStage;
import com.cstar.platform.whatsapp.repository.ContactRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.EnumSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
public class ContactLifecycleService {

    private static final ZoneId BUSINESS_ZONE = ZoneId.of("America/Sao_Paulo");
    private static final Set<ContactStage> MANAGED_STAGES = EnumSet.of(
            ContactStage.LEAD,
            ContactStage.RESCUING,
            ContactStage.RECENTLY_RESCUED
    );

    private final ContactRepository contactRepository;

    public ContactLifecycleService(ContactRepository contactRepository) {
        this.contactRepository = contactRepository;
    }

    @Transactional
    public void refreshStagesByOutboundRecency() {
        List<Contact> contacts = contactRepository.findAll();
        LocalDate today = LocalDate.now(BUSINESS_ZONE);

        for (Contact contact : contacts) {
            if (!MANAGED_STAGES.contains(contact.getStage())) {
                continue;
            }

            ContactStage target = resolveManagedStage(contact, today);
            if (target != contact.getStage()) {
                contact.setStage(target);
                contactRepository.save(contact);
            }
        }
    }

    @Transactional
    public void markAsRescuing(UUID contactId) {
        Optional<Contact> maybeContact = contactRepository.findById(contactId);
        if (maybeContact.isEmpty()) {
            return;
        }

        Contact contact = maybeContact.get();
        contact.touchOutbound(Instant.now());
        contact.setStage(ContactStage.RESCUING);
        contactRepository.save(contact);
    }

    public boolean isUnread(Contact contact) {
        Instant lastInbound = contact.getLastInboundAt();
        Instant lastOutbound = contact.getLastOutboundAt();

        if (lastInbound == null) {
            return false;
        }

        return lastOutbound == null || lastInbound.isAfter(lastOutbound);
    }

    private ContactStage resolveManagedStage(Contact contact, LocalDate today) {
        Instant lastOutboundAt = contact.getLastOutboundAt();
        if (lastOutboundAt == null) {
            return ContactStage.LEAD;
        }

        LocalDate lastOutboundDate = lastOutboundAt.atZone(BUSINESS_ZONE).toLocalDate();

        if (!lastOutboundDate.isBefore(today)) {
            return ContactStage.RESCUING;
        }

        LocalDate fiveDaysAgo = today.minusDays(5);
        if (!lastOutboundDate.isBefore(fiveDaysAgo)) {
            return ContactStage.RECENTLY_RESCUED;
        }

        return ContactStage.LEAD;
    }
}
