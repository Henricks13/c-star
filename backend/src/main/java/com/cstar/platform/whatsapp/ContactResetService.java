package com.cstar.platform.whatsapp;

import com.cstar.platform.whatsapp.dto.ContactResetResponse;
import com.cstar.platform.whatsapp.repository.ContactRepository;
import com.cstar.platform.whatsapp.repository.ConversationSummaryRepository;
import com.cstar.platform.whatsapp.repository.WhatsappMessageRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ContactResetService {

    private final ContactRepository contactRepository;
    private final ConversationSummaryRepository conversationSummaryRepository;
    private final WhatsappMessageRepository whatsappMessageRepository;

    public ContactResetService(
            ContactRepository contactRepository,
            ConversationSummaryRepository conversationSummaryRepository,
            WhatsappMessageRepository whatsappMessageRepository
    ) {
        this.contactRepository = contactRepository;
        this.conversationSummaryRepository = conversationSummaryRepository;
        this.whatsappMessageRepository = whatsappMessageRepository;
    }

    @Transactional
    public ContactResetResponse resetAllContactsAndSatellites() {
        long messagesCount = whatsappMessageRepository.count();
        long conversationsCount = conversationSummaryRepository.count();
        long contactsCount = contactRepository.count();

        whatsappMessageRepository.deleteAllInBatch();
        conversationSummaryRepository.deleteAllInBatch();
        contactRepository.deleteAllInBatch();

        return new ContactResetResponse(contactsCount, conversationsCount, messagesCount);
    }
}
