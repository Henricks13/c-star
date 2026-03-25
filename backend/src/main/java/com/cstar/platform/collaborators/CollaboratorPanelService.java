package com.cstar.platform.collaborators;

import com.cstar.platform.auth.model.Role;
import com.cstar.platform.auth.model.User;
import com.cstar.platform.auth.repository.UserRepository;
import com.cstar.platform.auth.security.AuthUserPrincipal;
import com.cstar.platform.collaborators.dto.AddCollaboratorTaskRequest;
import com.cstar.platform.collaborators.dto.CollaboratorDailyTaskResponse;
import com.cstar.platform.collaborators.dto.CollaboratorManagementResponse;
import com.cstar.platform.collaborators.dto.CollaboratorMonthlyHistoryItemResponse;
import com.cstar.platform.collaborators.dto.CollaboratorPanelItemResponse;
import com.cstar.platform.collaborators.dto.CollaboratorPanelResponse;
import com.cstar.platform.collaborators.dto.CollaboratorTaskHistoryPageResponse;
import com.cstar.platform.collaborators.dto.MyPanelResponse;
import com.cstar.platform.collaborators.dto.SetCollaboratorGoalRequest;
import com.cstar.platform.collaborators.dto.SetCollaboratorMonthlyGoalRequest;
import com.cstar.platform.collaborators.dto.UpdateCollaboratorTaskStatusRequest;
import com.cstar.platform.collaborators.model.CollaboratorDailyGoal;
import com.cstar.platform.collaborators.model.CollaboratorDailyProgress;
import com.cstar.platform.collaborators.model.CollaboratorDailyTask;
import com.cstar.platform.collaborators.model.CollaboratorMonthlyGoal;
import com.cstar.platform.collaborators.model.CollaboratorMonthlyProgress;
import com.cstar.platform.collaborators.model.CollaboratorTaskType;
import com.cstar.platform.collaborators.repository.CollaboratorDailyGoalRepository;
import com.cstar.platform.collaborators.repository.CollaboratorDailyProgressRepository;
import com.cstar.platform.collaborators.repository.CollaboratorDailyTaskRepository;
import com.cstar.platform.collaborators.repository.CollaboratorMonthlyGoalRepository;
import com.cstar.platform.collaborators.repository.CollaboratorMonthlyProgressRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class CollaboratorPanelService {

    private static final ZoneId BUSINESS_ZONE = ZoneId.of("America/Sao_Paulo");

    private final UserRepository userRepository;
    private final CollaboratorDailyGoalRepository goalRepository;
    private final CollaboratorDailyTaskRepository taskRepository;
    private final CollaboratorDailyProgressRepository progressRepository;
    private final CollaboratorMonthlyGoalRepository monthlyGoalRepository;
    private final CollaboratorMonthlyProgressRepository monthlyProgressRepository;

    public CollaboratorPanelService(
            UserRepository userRepository,
            CollaboratorDailyGoalRepository goalRepository,
            CollaboratorDailyTaskRepository taskRepository,
            CollaboratorDailyProgressRepository progressRepository,
            CollaboratorMonthlyGoalRepository monthlyGoalRepository,
            CollaboratorMonthlyProgressRepository monthlyProgressRepository
    ) {
        this.userRepository = userRepository;
        this.goalRepository = goalRepository;
        this.taskRepository = taskRepository;
        this.progressRepository = progressRepository;
        this.monthlyGoalRepository = monthlyGoalRepository;
        this.monthlyProgressRepository = monthlyProgressRepository;
    }

    @Transactional(readOnly = true)
    public CollaboratorPanelResponse getCollaboratorsPanel(AuthUserPrincipal principal, LocalDate date) {
        validateManagerAccess(principal);
        LocalDate referenceDate = resolveDate(date);
        LocalDate referenceMonth = resolveReferenceMonth(referenceDate);

        List<User> collaborators = listEnabledCollaborators();
        List<UUID> userIds = collaborators.stream().map(User::getId).toList();

        Map<UUID, Integer> dailyGoalsByUser = new HashMap<>();
        for (CollaboratorDailyGoal goal : goalRepository.findByUserIdInAndGoalDate(userIds, referenceDate)) {
            dailyGoalsByUser.put(goal.getUserId(), goal.getTargetContacts());
        }

        Map<UUID, Integer> dailyProgressByUser = new HashMap<>();
        for (CollaboratorDailyProgress progress : progressRepository.findByUserIdInAndProgressDate(userIds, referenceDate)) {
            dailyProgressByUser.put(progress.getUserId(), progress.getAnsweredContactsCount());
        }

        Map<UUID, BigDecimal> monthlySalesGoalByUser = new HashMap<>();
        for (CollaboratorMonthlyGoal goal : monthlyGoalRepository.findByUserIdInAndReferenceMonth(userIds, referenceMonth)) {
            monthlySalesGoalByUser.put(goal.getUserId(), goal.getTargetSalesAmount());
        }

        Map<UUID, BigDecimal> monthlySalesProgressByUser = new HashMap<>();
        for (CollaboratorMonthlyProgress progress : monthlyProgressRepository.findByUserIdInAndReferenceMonth(userIds, referenceMonth)) {
            monthlySalesProgressByUser.put(progress.getUserId(), progress.getSalesAmount());
        }

        List<CollaboratorPanelItemResponse> items = collaborators.stream()
                .map(user -> {
                    UUID userId = user.getId();
                    int dailyGoalContacts = dailyGoalsByUser.getOrDefault(userId, 0);
                    int dailyAnsweredContacts = dailyProgressByUser.getOrDefault(userId, 0);
                    int monthlySalesGoal = monthlySalesGoalByUser.getOrDefault(userId, BigDecimal.ZERO).intValue();
                    int monthlySalesProgress = monthlySalesProgressByUser.getOrDefault(userId, BigDecimal.ZERO).intValue();

                    int dailyTasksCompletionPercent = calculateCompletionPercent(
                            taskRepository.countByUserIdAndTaskTypeAndTaskDate(userId, CollaboratorTaskType.DAILY, referenceDate),
                            taskRepository.countByUserIdAndTaskTypeAndTaskDateAndCompletedTrue(userId, CollaboratorTaskType.DAILY, referenceDate)
                    );

                    int allTasksCompletionPercent = calculateCompletionPercent(
                            taskRepository.countByUserId(userId),
                            taskRepository.countByUserIdAndCompletedTrue(userId)
                    );

                        List<CollaboratorDailyTaskResponse> dailyTasks = taskRepository
                            .findByUserIdAndTaskTypeAndTaskDateOrderByCreatedAtAsc(userId, CollaboratorTaskType.DAILY, referenceDate)
                            .stream()
                            .map(this::mapTask)
                            .toList();

                        List<CollaboratorDailyTaskResponse> generalTasks = taskRepository
                            .findByUserIdAndTaskTypeOrderByCreatedAtDesc(userId, CollaboratorTaskType.GENERAL)
                            .stream()
                            .map(this::mapTask)
                            .toList();

                    return new CollaboratorPanelItemResponse(
                            userId,
                            user.getFullName(),
                            dailyGoalContacts,
                            dailyAnsweredContacts,
                            monthlySalesGoal,
                            monthlySalesProgress,
                            dailyTasksCompletionPercent,
                            allTasksCompletionPercent,
                            dailyTasks,
                            generalTasks
                    );
                })
                .sorted(Comparator.comparing(CollaboratorPanelItemResponse::fullName, String.CASE_INSENSITIVE_ORDER))
                .toList();

        return new CollaboratorPanelResponse(referenceDate, items);
    }

    @Transactional(readOnly = true)
    public CollaboratorManagementResponse getCollaboratorManagement(AuthUserPrincipal principal, UUID userId, LocalDate date) {
        validateManagerAccess(principal);
        User user = validateCollaboratorUser(userId);

        LocalDate referenceDate = resolveDate(date);
        LocalDate referenceMonth = resolveReferenceMonth(referenceDate);

        int dailyGoalContacts = goalRepository.findByUserIdAndGoalDate(userId, referenceDate)
                .map(CollaboratorDailyGoal::getTargetContacts)
                .orElse(0);

        int dailyAnsweredContacts = progressRepository.findByUserIdAndProgressDate(userId, referenceDate)
                .map(CollaboratorDailyProgress::getAnsweredContactsCount)
                .orElse(0);

        CollaboratorMonthlyGoal monthlyGoal = monthlyGoalRepository.findByUserIdAndReferenceMonth(userId, referenceMonth).orElse(null);
        CollaboratorMonthlyProgress monthlyProgress = monthlyProgressRepository.findByUserIdAndReferenceMonth(userId, referenceMonth).orElse(null);

        int monthlyGoalAnsweredContacts = monthlyGoal != null ? monthlyGoal.getTargetAnsweredContacts() : 0;
        int monthlyAnsweredContacts = monthlyProgress != null ? monthlyProgress.getAnsweredContactsCount() : 0;
        BigDecimal monthlyGoalSalesAmount = monthlyGoal != null ? monthlyGoal.getTargetSalesAmount() : BigDecimal.ZERO;
        BigDecimal monthlySalesAmount = monthlyProgress != null ? monthlyProgress.getSalesAmount() : BigDecimal.ZERO;

        List<CollaboratorDailyTaskResponse> dailyTasks = taskRepository
                .findByUserIdAndTaskTypeAndTaskDateOrderByCreatedAtAsc(userId, CollaboratorTaskType.DAILY, referenceDate)
                .stream()
                .map(this::mapTask)
                .toList();

        List<CollaboratorDailyTaskResponse> generalTasks = taskRepository
                .findByUserIdAndTaskTypeOrderByCreatedAtDesc(userId, CollaboratorTaskType.GENERAL)
                .stream()
                .map(this::mapTask)
                .toList();

        int dailyTasksCompletionPercent = calculateCompletionPercent(
                taskRepository.countByUserIdAndTaskTypeAndTaskDate(userId, CollaboratorTaskType.DAILY, referenceDate),
                taskRepository.countByUserIdAndTaskTypeAndTaskDateAndCompletedTrue(userId, CollaboratorTaskType.DAILY, referenceDate)
        );

        int allTasksCompletionPercent = calculateCompletionPercent(
                taskRepository.countByUserId(userId),
                taskRepository.countByUserIdAndCompletedTrue(userId)
        );

        List<CollaboratorMonthlyHistoryItemResponse> monthlyHistory = getMonthlyHistoryInternal(userId, 6, referenceMonth);

        return new CollaboratorManagementResponse(
                userId,
                user.getFullName(),
                referenceDate,
                dailyGoalContacts,
                dailyAnsweredContacts,
                monthlyGoalAnsweredContacts,
                monthlyAnsweredContacts,
                monthlyGoalSalesAmount,
                monthlySalesAmount,
                dailyTasksCompletionPercent,
                allTasksCompletionPercent,
                dailyTasks,
                generalTasks,
                monthlyHistory
        );
    }

    @Transactional(readOnly = true)
        public CollaboratorTaskHistoryPageResponse getTaskHistory(AuthUserPrincipal principal, UUID userId, Integer page, Integer size) {
        validateManagerAccess(principal);
        validateCollaboratorUser(userId);

        int safePage = page == null ? 0 : Math.max(page, 0);
        int safeSize = size == null ? 20 : Math.min(Math.max(size, 1), 100);

        Page<CollaboratorDailyTask> taskPage = taskRepository.findByUserIdOrderByCreatedAtDesc(
            userId,
            PageRequest.of(safePage, safeSize)
        );

        return new CollaboratorTaskHistoryPageResponse(
            taskPage.getContent().stream().map(this::mapTask).toList(),
            taskPage.getNumber(),
            taskPage.getSize(),
            taskPage.getTotalElements(),
            taskPage.getTotalPages(),
            taskPage.isFirst(),
            taskPage.isLast()
        );
    }

    @Transactional(readOnly = true)
    public List<CollaboratorMonthlyHistoryItemResponse> getMonthlyHistory(AuthUserPrincipal principal, UUID userId, Integer months) {
        validateManagerAccess(principal);
        validateCollaboratorUser(userId);
        int safeMonths = months == null ? 6 : Math.min(Math.max(months, 1), 24);
        LocalDate currentMonth = resolveReferenceMonth(LocalDate.now(BUSINESS_ZONE));
        return getMonthlyHistoryInternal(userId, safeMonths, currentMonth);
    }

    @Transactional(readOnly = true)
    public MyPanelResponse getMyPanel(AuthUserPrincipal principal, LocalDate date) {
        if (principal == null || principal.getUserId() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Sem permissão para acessar o painel.");
        }

        LocalDate referenceDate = resolveDate(date);
        UUID userId = principal.getUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado."));

        int goalContacts = goalRepository.findByUserIdAndGoalDate(userId, referenceDate)
                .map(CollaboratorDailyGoal::getTargetContacts)
                .orElse(0);

        int answeredContacts = progressRepository.findByUserIdAndProgressDate(userId, referenceDate)
                .map(CollaboratorDailyProgress::getAnsweredContactsCount)
                .orElse(0);

        List<CollaboratorDailyTaskResponse> dailyTasks = taskRepository
                .findByUserIdAndTaskTypeAndTaskDateOrderByCreatedAtAsc(userId, CollaboratorTaskType.DAILY, referenceDate)
                .stream()
                .map(this::mapTask)
                .toList();

        List<CollaboratorDailyTaskResponse> generalTasks = taskRepository
            .findByUserIdAndTaskTypeOrderByCreatedAtDesc(userId, CollaboratorTaskType.GENERAL)
            .stream()
            .map(this::mapTask)
            .toList();

        int totalTasks = (int) taskRepository.countByUserId(userId);
        int completedTasks = (int) taskRepository.countByUserIdAndCompletedTrue(userId);
        int remainingContacts = Math.max(goalContacts - answeredContacts, 0);

        LocalDate startDate = referenceDate.minusDays(29);
        Map<LocalDate, Integer> goalsByDate = new HashMap<>();
        for (CollaboratorDailyGoal goal : goalRepository.findByUserIdAndGoalDateBetween(userId, startDate, referenceDate)) {
            goalsByDate.put(goal.getGoalDate(), goal.getTargetContacts());
        }

        Map<LocalDate, Integer> progressByDate = new HashMap<>();
        for (CollaboratorDailyProgress progress : progressRepository.findByUserIdAndProgressDateBetween(userId, startDate, referenceDate)) {
            progressByDate.put(progress.getProgressDate(), progress.getAnsweredContactsCount());
        }

        List<LocalDate> achievedDates = new ArrayList<>();
        LocalDate cursor = startDate;
        while (!cursor.isAfter(referenceDate)) {
            int goal = goalsByDate.getOrDefault(cursor, 0);
            int progress = progressByDate.getOrDefault(cursor, 0);
            if (goal > 0 && progress >= goal) {
                achievedDates.add(cursor);
            }
            cursor = cursor.plusDays(1);
        }

        return new MyPanelResponse(
                referenceDate,
                user.getId(),
                user.getFullName(),
                goalContacts,
                answeredContacts,
                remainingContacts,
                totalTasks,
                completedTasks,
                dailyTasks,
                generalTasks,
                achievedDates
        );
    }

    @Transactional
    public void setGoal(AuthUserPrincipal principal, UUID userId, SetCollaboratorGoalRequest request) {
        validateManagerAccess(principal);
        validateCollaboratorUser(userId);

        LocalDate referenceDate = resolveDate(request.date());
        int targetContacts = request.targetContacts() == null ? 0 : request.targetContacts();

        CollaboratorDailyGoal goal = goalRepository.findByUserIdAndGoalDate(userId, referenceDate)
                .orElseGet(() -> CollaboratorDailyGoal.create(userId, referenceDate, targetContacts, principal.getUserId()));

        goal.updateTargetContacts(targetContacts, principal.getUserId());
        goalRepository.save(goal);
    }

    @Transactional
    public void setMonthlyGoal(AuthUserPrincipal principal, UUID userId, SetCollaboratorMonthlyGoalRequest request) {
        validateManagerAccess(principal);
        validateCollaboratorUser(userId);

        LocalDate referenceMonth = resolveReferenceMonth(resolveDate(request.referenceMonth()));
        int targetAnsweredContacts = request.targetAnsweredContacts() == null ? 0 : request.targetAnsweredContacts();
        BigDecimal targetSalesAmount = request.targetSalesAmount() == null ? BigDecimal.ZERO : request.targetSalesAmount();

        CollaboratorMonthlyGoal goal = monthlyGoalRepository.findByUserIdAndReferenceMonth(userId, referenceMonth)
                .orElseGet(() -> CollaboratorMonthlyGoal.create(
                        userId,
                        referenceMonth,
                        targetAnsweredContacts,
                        targetSalesAmount,
                        principal.getUserId()
                ));

        goal.updateTargets(targetAnsweredContacts, targetSalesAmount, principal.getUserId());
        monthlyGoalRepository.save(goal);
    }

    @Transactional
    public CollaboratorDailyTaskResponse addTask(AuthUserPrincipal principal, UUID userId, AddCollaboratorTaskRequest request) {
        validateManagerAccess(principal);
        validateCollaboratorUser(userId);

        LocalDate referenceDate = resolveDate(request.date());
        String title = request.title() == null ? "" : request.title().trim();
        if (title.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O título da tarefa é obrigatório.");
        }

        CollaboratorTaskType taskType = parseTaskType(request.taskType());

        CollaboratorDailyTask task = CollaboratorDailyTask.create(userId, referenceDate, title, taskType, principal.getUserId());
        CollaboratorDailyTask saved = taskRepository.save(task);
        return mapTask(saved);
    }

    @Transactional
    public CollaboratorDailyTaskResponse updateTaskStatusAsManager(
            AuthUserPrincipal principal,
            UUID userId,
            UUID taskId,
            UpdateCollaboratorTaskStatusRequest request
    ) {
        validateManagerAccess(principal);
        validateCollaboratorUser(userId);
        return updateTaskStatus(userId, taskId, request.completed());
    }

    @Transactional
    public CollaboratorDailyTaskResponse updateMyTaskStatus(
            AuthUserPrincipal principal,
            UUID taskId,
            UpdateCollaboratorTaskStatusRequest request
    ) {
        if (principal == null || principal.getUserId() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Sem permissão para atualizar tarefas.");
        }
        return updateTaskStatus(principal.getUserId(), taskId, request.completed());
    }

    @Transactional
    public void deleteTaskAsManager(AuthUserPrincipal principal, UUID userId, UUID taskId) {
        validateManagerAccess(principal);
        validateCollaboratorUser(userId);
        CollaboratorDailyTask task = taskRepository.findByIdAndUserId(taskId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tarefa não encontrada."));
        taskRepository.delete(task);
    }

    @Transactional
    public void incrementAnsweredContact(UUID userId, LocalDate date) {
        if (userId == null) {
            return;
        }

        LocalDate referenceDate = resolveDate(date);
        CollaboratorDailyProgress dailyProgress = progressRepository.findByUserIdAndProgressDate(userId, referenceDate)
                .orElseGet(() -> CollaboratorDailyProgress.create(userId, referenceDate));
        dailyProgress.incrementAnsweredContactsCount();
        progressRepository.save(dailyProgress);

        LocalDate referenceMonth = resolveReferenceMonth(referenceDate);
        CollaboratorMonthlyProgress monthlyProgress = monthlyProgressRepository.findByUserIdAndReferenceMonth(userId, referenceMonth)
                .orElseGet(() -> CollaboratorMonthlyProgress.create(userId, referenceMonth));
        monthlyProgress.incrementAnsweredContactsCount();
        monthlyProgressRepository.save(monthlyProgress);
    }

    private CollaboratorDailyTaskResponse updateTaskStatus(UUID userId, UUID taskId, Boolean completed) {
        if (completed == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe o status da tarefa.");
        }

        CollaboratorDailyTask task = taskRepository.findByIdAndUserId(taskId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tarefa não encontrada."));
        task.setCompleted(completed);
        CollaboratorDailyTask saved = taskRepository.save(task);
        return mapTask(saved);
    }

    private CollaboratorDailyTaskResponse mapTask(CollaboratorDailyTask task) {
        return new CollaboratorDailyTaskResponse(
                task.getId(),
                task.getTitle(),
                task.isCompleted(),
                task.getTaskType().name(),
                task.getTaskDate(),
                task.getCreatedAt(),
                task.getCompletedAt()
        );
    }

    private List<CollaboratorMonthlyHistoryItemResponse> getMonthlyHistoryInternal(UUID userId, int months, LocalDate currentMonth) {
        LocalDate startMonth = currentMonth.minusMonths(months - 1);

        Map<LocalDate, CollaboratorMonthlyGoal> goalsByMonth = new HashMap<>();
        for (CollaboratorMonthlyGoal goal : monthlyGoalRepository.findByUserIdAndReferenceMonthBetweenOrderByReferenceMonthAsc(userId, startMonth, currentMonth)) {
            goalsByMonth.put(goal.getReferenceMonth(), goal);
        }

        Map<LocalDate, CollaboratorMonthlyProgress> progressByMonth = new HashMap<>();
        for (CollaboratorMonthlyProgress progress : monthlyProgressRepository
                .findByUserIdAndReferenceMonthBetweenOrderByReferenceMonthAsc(userId, startMonth, currentMonth)) {
            progressByMonth.put(progress.getReferenceMonth(), progress);
        }

        List<CollaboratorMonthlyHistoryItemResponse> monthlyHistory = new ArrayList<>();
        LocalDate cursor = startMonth;
        while (!cursor.isAfter(currentMonth)) {
            CollaboratorMonthlyGoal goal = goalsByMonth.get(cursor);
            CollaboratorMonthlyProgress progress = progressByMonth.get(cursor);

            int targetAnsweredContacts = goal != null ? goal.getTargetAnsweredContacts() : 0;
            int answeredContacts = progress != null ? progress.getAnsweredContactsCount() : 0;
            BigDecimal targetSalesAmount = goal != null ? goal.getTargetSalesAmount() : BigDecimal.ZERO;
            BigDecimal salesAmount = progress != null ? progress.getSalesAmount() : BigDecimal.ZERO;

            monthlyHistory.add(new CollaboratorMonthlyHistoryItemResponse(
                    cursor,
                    targetAnsweredContacts,
                    answeredContacts,
                    targetSalesAmount,
                    salesAmount,
                    targetAnsweredContacts > 0 && answeredContacts >= targetAnsweredContacts,
                    targetSalesAmount.compareTo(BigDecimal.ZERO) > 0 && salesAmount.compareTo(targetSalesAmount) >= 0
            ));

            cursor = cursor.plusMonths(1);
        }

        return monthlyHistory;
    }

    private void validateManagerAccess(AuthUserPrincipal principal) {
        if (!canManage(principal)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Sem permissão para gerenciar colaboradores.");
        }
    }

    private boolean canManage(AuthUserPrincipal principal) {
        if (principal == null) {
            return false;
        }

        String email = principal.getUsername() == null ? "" : principal.getUsername().trim().toLowerCase();
        if ("carol@gmail.com".equals(email)) {
            return true;
        }

        Set<String> roles = principal.getRoleCodes();
        return roles.stream()
                .map(code -> code == null ? "" : code.trim().toUpperCase())
                .anyMatch(code -> "DEV_SUPORTE".equals(code) || "MASTER_ADMIN".equals(code));
    }

    private User validateCollaboratorUser(UUID userId) {
        User user = userRepository.findWithRolesById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado."));

        boolean collaborator = user.getRoles().stream()
                .map(Role::getCode)
                .map(code -> code == null ? "" : code.trim().toUpperCase())
                .anyMatch("COLABORADOR"::equals);

        if (!collaborator) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O usuário informado não é colaborador.");
        }

        return user;
    }

    private List<User> listEnabledCollaborators() {
        return userRepository.findAllWithRolesByOrderByFullNameAsc().stream()
                .filter(User::isEnabled)
                .filter(user -> user.getRoles().stream()
                        .map(Role::getCode)
                        .map(code -> code == null ? "" : code.trim().toUpperCase())
                        .anyMatch("COLABORADOR"::equals))
                .toList();
    }

    private CollaboratorTaskType parseTaskType(String rawValue) {
        if (rawValue == null || rawValue.isBlank()) {
            return CollaboratorTaskType.DAILY;
        }

        try {
            return CollaboratorTaskType.valueOf(rawValue.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            return CollaboratorTaskType.DAILY;
        }
    }

    private int calculateCompletionPercent(long total, long completed) {
        if (total <= 0) {
            return 0;
        }

        return (int) Math.min(Math.round(((double) completed / (double) total) * 100d), 100);
    }

    private LocalDate resolveDate(LocalDate date) {
        return date == null ? LocalDate.now(BUSINESS_ZONE) : date;
    }

    private LocalDate resolveReferenceMonth(LocalDate date) {
        LocalDate value = date == null ? LocalDate.now(BUSINESS_ZONE) : date;
        return value.withDayOfMonth(1);
    }
}
