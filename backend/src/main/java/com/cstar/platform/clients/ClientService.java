package com.cstar.platform.clients;

import com.cstar.platform.clients.dto.ClientListItemResponse;
import com.cstar.platform.clients.dto.CreateClientRequest;
import com.cstar.platform.clients.model.Client;
import com.cstar.platform.clients.model.ClientOrigin;
import com.cstar.platform.whatsapp.model.Contact;
import com.cstar.platform.whatsapp.model.ContactStage;
import com.cstar.platform.whatsapp.repository.ContactRepository;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class ClientService {

    private final ClientRepository clientRepository;
    private final ContactRepository contactRepository;

    public ClientService(ClientRepository clientRepository, ContactRepository contactRepository) {
        this.clientRepository = clientRepository;
        this.contactRepository = contactRepository;
    }

    @Transactional(readOnly = true)
    public List<ClientListItemResponse> list() {
        return clientRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public ClientListItemResponse create(CreateClientRequest request) {
        UUID sourceContactId = request.sourceContactId();
        Contact sourceContact = null;

        if (sourceContactId != null) {
            sourceContact = contactRepository.findById(sourceContactId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Contato de origem não encontrado"));

            if (clientRepository.existsBySourceContactId(sourceContactId)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Este contato já foi convertido em cliente");
            }
        }

        String fullName = normalizeName(request.fullName(), sourceContact);
        String phoneE164 = normalizePhone(request.phone(), sourceContact);
        String cpf = normalizeCpf(request.cpf());
        String email = normalizeEmail(request.email());
        String notes = normalizeNotes(request.notes());

        ClientOrigin origin = parseOrigin(request.origin(), sourceContactId != null);

        if (clientRepository.existsByPhoneE164(phoneE164)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Já existe cliente com este número");
        }

        if (cpf != null && clientRepository.existsByCpf(cpf)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Já existe cliente com este CPF");
        }

        if (email != null && clientRepository.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Já existe cliente com este e-mail");
        }

        Client client = Client.create(
                fullName,
                phoneE164,
                cpf,
                email,
                origin,
                sourceContactId,
                notes
        );

        Client saved = clientRepository.save(client);

        if (sourceContact != null) {
            sourceContact.setStage(ContactStage.CLIENT);
            sourceContact.setFullName(fullName);
            contactRepository.save(sourceContact);
        }

        return toResponse(saved);
    }

    private ClientListItemResponse toResponse(Client client) {
        return new ClientListItemResponse(
                client.getId(),
                client.getFullName(),
                client.getPhoneE164(),
                client.getCpf(),
                client.getEmail(),
                client.getOrigin().name(),
                client.getBusinessStatus().name(),
                client.getSourceContactId(),
                client.getNotes(),
                client.getCreatedAt(),
                client.getUpdatedAt()
        );
    }

    private String normalizeName(String rawName, Contact sourceContact) {
        String candidate = rawName == null ? "" : rawName.trim();
        if (!candidate.isBlank()) {
            return candidate;
        }

        if (sourceContact != null && sourceContact.getFullName() != null && !sourceContact.getFullName().isBlank()) {
            return sourceContact.getFullName().trim();
        }

        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nome é obrigatório");
    }

    private String normalizePhone(String rawPhone, Contact sourceContact) {
        String sourceValue = rawPhone;
        if ((sourceValue == null || sourceValue.isBlank()) && sourceContact != null) {
            sourceValue = sourceContact.getWhatsappPhoneE164();
        }

        String digits = sourceValue == null ? "" : sourceValue.replaceAll("[^0-9]", "");
        if (digits.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Número é obrigatório");
        }

        return "+" + digits;
    }

    private String normalizeCpf(String rawCpf) {
        if (rawCpf == null || rawCpf.isBlank()) {
            return null;
        }

        String digits = rawCpf.replaceAll("[^0-9]", "");
        if (digits.isBlank()) {
            return null;
        }

        if (digits.length() != 11) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "CPF deve conter 11 dígitos");
        }

        return digits;
    }

    private String normalizeEmail(String rawEmail) {
        if (rawEmail == null || rawEmail.isBlank()) {
            return null;
        }

        return rawEmail.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeNotes(String rawNotes) {
        if (rawNotes == null || rawNotes.isBlank()) {
            return null;
        }

        return rawNotes.trim();
    }

    private ClientOrigin parseOrigin(String rawOrigin, boolean forceRescue) {
        if (forceRescue) {
            return ClientOrigin.RESGATE;
        }

        if (rawOrigin == null || rawOrigin.isBlank()) {
            return ClientOrigin.CADASTRO_MANUAL;
        }

        try {
            return ClientOrigin.valueOf(rawOrigin.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Origem inválida");
        }
    }
}
