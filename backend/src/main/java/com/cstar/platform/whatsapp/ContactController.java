package com.cstar.platform.whatsapp;

import com.cstar.platform.auth.model.User;
import com.cstar.platform.auth.repository.UserRepository;
import com.cstar.platform.auth.security.AuthUserPrincipal;
import com.cstar.platform.whatsapp.dto.ContactListItemResponse;
import com.cstar.platform.whatsapp.dto.ContactMessageItemResponse;
import com.cstar.platform.whatsapp.dto.ContactPageResponse;
import com.cstar.platform.whatsapp.dto.ContactResetResponse;
import com.cstar.platform.whatsapp.dto.ContactSyncResponse;
import com.cstar.platform.whatsapp.model.Contact;
import com.cstar.platform.whatsapp.model.ContactStage;
import com.cstar.platform.whatsapp.model.ConversationSummary;
import com.cstar.platform.whatsapp.repository.ContactRepository;
import com.cstar.platform.whatsapp.repository.ConversationSummaryRepository;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Stream;

@RestController
@RequestMapping("/api/contacts")
public class ContactController {

    private static final ZoneId BUSINESS_ZONE = ZoneId.of("America/Sao_Paulo");

    private final ContactRepository contactRepository;
    private final ConversationSummaryRepository conversationSummaryRepository;
    private final UserRepository userRepository;
    private final WhatsappContactSyncService whatsappContactSyncService;
    private final ContactLifecycleService contactLifecycleService;
    private final ContactResetService contactResetService;

    public ContactController(
            ContactRepository contactRepository,
            ConversationSummaryRepository conversationSummaryRepository,
            UserRepository userRepository,
            WhatsappContactSyncService whatsappContactSyncService,
            ContactLifecycleService contactLifecycleService,
            ContactResetService contactResetService
    ) {
        this.contactRepository = contactRepository;
        this.conversationSummaryRepository = conversationSummaryRepository;
        this.userRepository = userRepository;
        this.whatsappContactSyncService = whatsappContactSyncService;
        this.contactLifecycleService = contactLifecycleService;
        this.contactResetService = contactResetService;
    }

    @GetMapping
    public List<ContactListItemResponse> listContacts() {
        contactLifecycleService.refreshStagesByOutboundRecency();
        return contactRepository.findAll(Sort.by(Sort.Direction.DESC, "updatedAt"))
                .stream()
                .map(this::mapContact)
                .toList();
    }

    @GetMapping("/paged")
    public ContactPageResponse listContactsPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "geral") String view,
            @RequestParam(required = false) String stage,
            @RequestParam(required = false) String period
    ) {
        contactLifecycleService.refreshStagesByOutboundRecency();

        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, Math.min(size, 100));

        List<Contact> all = contactRepository.findAll(Sort.by(Sort.Direction.DESC, "updatedAt"));

        ContactStage stageFilter = parseStage(stage);
        String normalizedView = normalizeView(view);
        UnreadPeriodFilter periodFilter = parseUnreadPeriod(period);

        List<Contact> filtered = all.stream()
                .filter(contact -> matchesView(contact, normalizedView))
                .filter(contact -> stageFilter == null || contact.getStage() == stageFilter)
            .filter(contact -> matchesUnreadPeriod(contact, normalizedView, periodFilter))
                .toList();

        if ("nao-lidas".equals(normalizedView)) {
            filtered = filtered.stream()
                .sorted(Comparator.comparing(this::resolveLastInteraction, Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();
        }

        int fromIndex = Math.min(safePage * safeSize, filtered.size());
        int toIndex = Math.min(fromIndex + safeSize, filtered.size());
        List<ContactListItemResponse> content = filtered.subList(fromIndex, toIndex)
                .stream()
                .map(this::mapContact)
                .toList();

        int totalPages = filtered.isEmpty() ? 0 : (int) Math.ceil((double) filtered.size() / safeSize);
        boolean first = safePage <= 0;
        boolean last = totalPages == 0 || safePage >= totalPages - 1;

        return new ContactPageResponse(
                content,
                safePage,
                safeSize,
                filtered.size(),
                totalPages,
                first,
                last
        );
    }

    @PostMapping("/sync")
    public ContactSyncResponse syncAll(@AuthenticationPrincipal AuthUserPrincipal principal) {
        return whatsappContactSyncService.syncAllConversations(principal);
    }

    @PostMapping("/reset-all")
    public ContactResetResponse resetAllContacts(@AuthenticationPrincipal AuthUserPrincipal principal) {
        if (!canManageMassiveContactActions(principal)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Você não tem permissão para limpar todos os contatos.");
        }

        return contactResetService.resetAllContactsAndSatellites();
    }

    @PostMapping("/{contactId}/rescue-start")
    public void markAsRescuing(@PathVariable UUID contactId, @AuthenticationPrincipal AuthUserPrincipal principal) {
        UUID ownerUserId = principal != null ? principal.getUserId() : null;
        contactLifecycleService.markAsRescuing(contactId, ownerUserId);
    }

    @GetMapping("/{contactId}/messages")
    public List<ContactMessageItemResponse> getMessages(
            @PathVariable UUID contactId,
            @RequestParam(defaultValue = "20") int limit,
            @AuthenticationPrincipal AuthUserPrincipal principal
    ) {
        return whatsappContactSyncService.getLatestMessages(contactId, limit, principal);
    }

    private Instant resolveLastInteraction(Contact contact) {
        return Stream.of(contact.getLastInboundAt(), contact.getLastOutboundAt())
                .filter(Objects::nonNull)
                .max(Comparator.naturalOrder())
                .orElse(contact.getCreatedAt());
    }

    private ContactListItemResponse mapContact(Contact contact) {
        String rescueOwnerName = resolveRescueOwnerFirstName(contact);
        return new ContactListItemResponse(
                contact.getId(),
                contact.getFullName(),
                contact.getWhatsappPhoneE164(),
                contact.getStage().name(),
                resolveLastInteraction(contact),
                rescueOwnerName
        );
    }

    private String resolveRescueOwnerFirstName(Contact contact) {
        if (contact == null || (contact.getStage() != ContactStage.RESCUING && contact.getStage() != ContactStage.RECENTLY_RESCUED)) {
            return null;
        }

        ConversationSummary summary = conversationSummaryRepository
                .findByContactIdAndChannel(contact.getId(), "whatsapp")
                .orElse(null);
        if (summary == null || summary.getAssignedToUserId() == null) {
            return null;
        }

        User owner = userRepository.findById(summary.getAssignedToUserId()).orElse(null);
        if (owner == null) {
            return null;
        }

        return extractFirstName(owner.getFullName());
    }

    private String extractFirstName(String fullName) {
        if (fullName == null || fullName.isBlank()) {
            return null;
        }

        String[] parts = fullName.trim().split("\\s+");
        return parts.length > 0 ? parts[0] : null;
    }

    private boolean matchesView(Contact contact, String view) {
        if ("nao-lidas".equals(view)) {
            return contact.getStage() == ContactStage.LEAD && contactLifecycleService.isUnread(contact);
        }

        if ("em-andamento".equals(view)) {
            return contact.getStage() == ContactStage.RESCUING || contact.getStage() == ContactStage.RECENTLY_RESCUED;
        }

        return true;
    }

    private String normalizeView(String view) {
        if (view == null || view.isBlank()) {
            return "geral";
        }

        String normalized = view.trim().toLowerCase();
        if ("nao-lidas".equals(normalized) || "em-andamento".equals(normalized) || "geral".equals(normalized)) {
            return normalized;
        }

        return "geral";
    }

    private ContactStage parseStage(String stage) {
        if (stage == null || stage.isBlank() || "ALL".equalsIgnoreCase(stage)) {
            return null;
        }

        try {
            return ContactStage.valueOf(stage.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private boolean matchesUnreadPeriod(Contact contact, String view, UnreadPeriodFilter periodFilter) {
        if (!"nao-lidas".equals(view) || periodFilter == UnreadPeriodFilter.ALL) {
            return true;
        }

        Instant reference = resolveLastInteraction(contact);
        if (reference == null) {
            return false;
        }

        LocalDate interactionDate = reference.atZone(BUSINESS_ZONE).toLocalDate();
        LocalDate today = LocalDate.now(BUSINESS_ZONE);
        long days = ChronoUnit.DAYS.between(interactionDate, today);

        if (periodFilter == UnreadPeriodFilter.OLDER_THAN_WEEK) {
            return days > 7;
        }

        if (periodFilter == UnreadPeriodFilter.UP_TO_WEEK) {
            return days <= 7;
        }

        if (periodFilter == UnreadPeriodFilter.OLDER_THAN_MONTH) {
            return days > 30;
        }

        if (periodFilter == UnreadPeriodFilter.UP_TO_MONTH) {
            return days <= 30;
        }

        return true;
    }

    private UnreadPeriodFilter parseUnreadPeriod(String period) {
        if (period == null || period.isBlank() || "ALL".equalsIgnoreCase(period)) {
            return UnreadPeriodFilter.ALL;
        }

        try {
            return UnreadPeriodFilter.valueOf(period.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            return UnreadPeriodFilter.ALL;
        }
    }

    private enum UnreadPeriodFilter {
        ALL,
        OLDER_THAN_WEEK,
        UP_TO_WEEK,
        OLDER_THAN_MONTH,
        UP_TO_MONTH
    }

    private boolean canManageMassiveContactActions(AuthUserPrincipal principal) {
        if (principal == null) {
            return false;
        }

        String email = principal.getUsername() == null ? "" : principal.getUsername().trim().toLowerCase();
        if ("carol@gmail.com".equals(email)) {
            return true;
        }

        return principal.getRoleCodes().stream()
                .map(code -> code == null ? "" : code.trim().toUpperCase())
                .anyMatch(code -> "DEV_SUPORTE".equals(code) || "MASTER_ADMIN".equals(code));
    }
}
