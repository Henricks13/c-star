package com.cstar.platform.clients;

import com.cstar.platform.agenda.AgendaEventRepository;
import com.cstar.platform.anamnesis.ClientAnamnesisSubmissionAnswerRepository;
import com.cstar.platform.anamnesis.ClientAnamnesisSubmissionRepository;
import com.cstar.platform.anamnesis.model.ClientAnamnesisSubmission;
import com.cstar.platform.auth.security.AuthUserPrincipal;
import com.cstar.platform.clientorders.ClientServiceOrderRepository;
import com.cstar.platform.clientorders.model.ClientServiceOrder;
import com.cstar.platform.clients.dto.AddClientObservationRequest;
import com.cstar.platform.clients.dto.ClientObservationResponse;
import com.cstar.platform.clients.dto.ClientListItemResponse;
import com.cstar.platform.clients.dto.CreateClientRequest;
import com.cstar.platform.clients.dto.UpdateClientRequest;
import com.cstar.platform.clients.model.Client;
import com.cstar.platform.clients.model.ClientObservation;
import com.cstar.platform.clients.model.ClientOrigin;
import com.cstar.platform.finance.FinanceIncomeRepository;
import com.cstar.platform.finance.model.IncomeSource;
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
    private final ClientServiceOrderRepository clientServiceOrderRepository;
    private final ClientObservationRepository clientObservationRepository;
    private final FinanceIncomeRepository financeIncomeRepository;
    private final ClientAnamnesisSubmissionRepository clientAnamnesisSubmissionRepository;
    private final ClientAnamnesisSubmissionAnswerRepository clientAnamnesisSubmissionAnswerRepository;
    private final AgendaEventRepository agendaEventRepository;

    public ClientService(ClientRepository clientRepository,
                         ContactRepository contactRepository,
                         ClientServiceOrderRepository clientServiceOrderRepository,
                         ClientObservationRepository clientObservationRepository,
                         FinanceIncomeRepository financeIncomeRepository,
                         ClientAnamnesisSubmissionRepository clientAnamnesisSubmissionRepository,
                         ClientAnamnesisSubmissionAnswerRepository clientAnamnesisSubmissionAnswerRepository,
                         AgendaEventRepository agendaEventRepository) {
        this.clientRepository = clientRepository;
        this.contactRepository = contactRepository;
        this.clientServiceOrderRepository = clientServiceOrderRepository;
        this.clientObservationRepository = clientObservationRepository;
        this.financeIncomeRepository = financeIncomeRepository;
        this.clientAnamnesisSubmissionRepository = clientAnamnesisSubmissionRepository;
        this.clientAnamnesisSubmissionAnswerRepository = clientAnamnesisSubmissionAnswerRepository;
        this.agendaEventRepository = agendaEventRepository;
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

    @Transactional
    public ClientListItemResponse update(UUID clientId, UpdateClientRequest request) {
        Client current = clientRepository.findById(clientId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cliente não encontrado"));

        String fullName = normalizeName(request.fullName(), null);
        String phoneE164 = normalizePhone(request.phone(), null);
        String cpf = normalizeCpf(request.cpf());
        String email = normalizeEmail(request.email());
        String notes = normalizeNotes(request.notes());
        ClientOrigin origin = parseOrigin(request.origin(), current.getSourceContactId() != null);

        if (clientRepository.existsByPhoneE164AndIdNot(phoneE164, clientId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Já existe cliente com este número");
        }

        if (cpf != null && clientRepository.existsByCpfAndIdNot(cpf, clientId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Já existe cliente com este CPF");
        }

        if (email != null && clientRepository.existsByEmailIgnoreCaseAndIdNot(email, clientId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Já existe cliente com este e-mail");
        }

        current.update(fullName, phoneE164, cpf, email, origin, notes);
        Client saved = clientRepository.save(current);

        return toResponse(saved);
    }

    @Transactional
    public void delete(UUID clientId, AuthUserPrincipal principal) {
        validateClientDeletionAccess(principal);

        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cliente não encontrado"));

        deleteClientDependencies(clientId);

        clientRepository.delete(client);
    }

    private void deleteClientDependencies(UUID clientId) {
        agendaEventRepository.deleteByClientId(clientId);

        clientObservationRepository.deleteByClientId(clientId);

        List<ClientAnamnesisSubmission> submissions = clientAnamnesisSubmissionRepository.findAllByClientId(clientId);
        if (!submissions.isEmpty()) {
            clientAnamnesisSubmissionAnswerRepository.deleteBySubmissionClientId(clientId);
            clientAnamnesisSubmissionRepository.deleteByClientId(clientId);
        }

        List<ClientServiceOrder> orders = clientServiceOrderRepository.findByClientIdOrderByCreatedAtDesc(clientId);
        if (!orders.isEmpty()) {
            for (ClientServiceOrder order : orders) {
                financeIncomeRepository.deleteBySourceAndReferenceId(IncomeSource.SERVICE_ORDER, order.getId());
            }
            clientServiceOrderRepository.deleteAll(orders);
        }
    }

    @Transactional(readOnly = true)
    public List<ClientObservationResponse> listObservations(UUID clientId) {
        validateClientExists(clientId);

        return clientObservationRepository.findByClientIdOrderByCreatedAtDesc(clientId)
                .stream()
                .map(this::toObservationResponse)
                .toList();
    }

    @Transactional
    public ClientObservationResponse addObservation(UUID clientId,
                                                    AddClientObservationRequest request,
                                                    AuthUserPrincipal principal) {
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cliente não encontrado"));

        String note = normalizeClientObservationNote(request.note());
        String createdByName = resolveObservationAuthor(principal);

        ClientObservation observation = ClientObservation.of(client, note, createdByName);
        return toObservationResponse(clientObservationRepository.save(observation));
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

    private ClientObservationResponse toObservationResponse(ClientObservation observation) {
        return new ClientObservationResponse(
                observation.getId(),
                observation.getClient().getId(),
                observation.getNote(),
                observation.getCreatedByName(),
                observation.getCreatedAt()
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

    private void validateClientDeletionAccess(AuthUserPrincipal principal) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Sem permissão para excluir cliente.");
        }

        String email = principal.getUsername() == null ? "" : principal.getUsername().trim().toLowerCase();
        if ("carol@gmail.com".equals(email)) {
            return;
        }

        boolean authorizedByRole = principal.getRoleCodes().stream()
                .map(code -> code == null ? "" : code.trim().toUpperCase())
                .anyMatch(code -> "DEV_SUPORTE".equals(code) || "MASTER_ADMIN".equals(code));

        if (!authorizedByRole) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Sem permissão para excluir cliente.");
        }
    }

    private void validateClientExists(UUID clientId) {
        if (!clientRepository.existsById(clientId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Cliente não encontrado");
        }
    }

    private String normalizeClientObservationNote(String rawNote) {
        if (rawNote == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Observação inválida");
        }

        String note = rawNote.trim();
        if (note.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Observação inválida");
        }

        return note;
    }

    private String resolveObservationAuthor(AuthUserPrincipal principal) {
        if (principal == null) {
            return "Equipe C-Star";
        }

        String fullName = principal.getFullName();
        if (fullName != null && !fullName.isBlank()) {
            return fullName.trim();
        }

        String email = principal.getUsername();
        if (email != null && !email.isBlank()) {
            return email.trim();
        }

        return "Equipe C-Star";
    }
}
