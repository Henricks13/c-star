package com.cstar.platform.anamnesis;

import com.cstar.platform.anamnesis.dto.AnamnesisQuestionRequest;
import com.cstar.platform.anamnesis.dto.AnamnesisQuestionResponse;
import com.cstar.platform.anamnesis.dto.PublicAnamnesisAnsweredItemResponse;
import com.cstar.platform.anamnesis.dto.PublicAnamnesisFormResponse;
import com.cstar.platform.anamnesis.dto.PublicAnamnesisQuestionResponse;
import com.cstar.platform.anamnesis.dto.SubmitPublicAnamnesisAnswerRequest;
import com.cstar.platform.anamnesis.dto.SubmitPublicAnamnesisRequest;
import com.cstar.platform.anamnesis.model.AnamnesisQuestion;
import com.cstar.platform.anamnesis.model.ClientAnamnesisSubmission;
import com.cstar.platform.anamnesis.model.ClientAnamnesisSubmissionAnswer;
import com.cstar.platform.clients.ClientRepository;
import com.cstar.platform.clients.model.Client;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class AnamnesisService {

    private final AnamnesisQuestionRepository questionRepository;
    private final ClientAnamnesisSubmissionRepository submissionRepository;
    private final ClientAnamnesisSubmissionAnswerRepository answerRepository;
    private final ClientRepository clientRepository;

    public AnamnesisService(AnamnesisQuestionRepository questionRepository,
                            ClientAnamnesisSubmissionRepository submissionRepository,
                            ClientAnamnesisSubmissionAnswerRepository answerRepository,
                            ClientRepository clientRepository) {
        this.questionRepository = questionRepository;
        this.submissionRepository = submissionRepository;
        this.answerRepository = answerRepository;
        this.clientRepository = clientRepository;
    }

    @Transactional(readOnly = true)
    public List<AnamnesisQuestionResponse> listQuestions() {
        return questionRepository.findAllByOrderByDisplayOrderAscCreatedAtAsc().stream()
                .map(this::toQuestionResponse)
                .toList();
    }

    @Transactional
    public AnamnesisQuestionResponse createQuestion(AnamnesisQuestionRequest request) {
        validateDisplayOrderForCreate(request.displayOrder());

        AnamnesisQuestion question = AnamnesisQuestion.create(
                request.questionText().trim(),
                request.displayOrder(),
                request.active()
        );
        AnamnesisQuestion saved = questionRepository.save(question);
        return toQuestionResponse(saved);
    }

    @Transactional
    public AnamnesisQuestionResponse updateQuestion(UUID id, AnamnesisQuestionRequest request) {
        AnamnesisQuestion question = questionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pergunta de anamnese não encontrada"));

        validateDisplayOrderForUpdate(request.displayOrder(), id);

        question.update(
                request.questionText().trim(),
                request.displayOrder(),
                request.active()
        );

        AnamnesisQuestion saved = questionRepository.save(question);
        return toQuestionResponse(saved);
    }

    @Transactional
    public void deleteQuestion(UUID id) {
        AnamnesisQuestion question = questionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pergunta de anamnese não encontrada"));
        questionRepository.delete(question);
    }

    @Transactional(readOnly = true)
    public PublicAnamnesisFormResponse getPublicForm(UUID clientId, String cpf) {
        Client client = resolveClient(clientId, cpf);
        return buildFormResponse(client);
    }

    @Transactional
    public PublicAnamnesisFormResponse submitPublic(SubmitPublicContext context) {
        Client client = resolveClient(context.clientId(), context.cpf());

        if (submissionRepository.existsByClientId(client.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Este cliente já respondeu a anamnese");
        }

        List<AnamnesisQuestion> activeQuestions = questionRepository.findByActiveTrueOrderByDisplayOrderAscCreatedAtAsc();
        if (activeQuestions.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Não há perguntas de anamnese ativas no momento");
        }

        List<SubmitPublicAnamnesisAnswerRequest> rawAnswers = context.answers();
        if (rawAnswers == null || rawAnswers.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Responda a anamnese para continuar");
        }

        Map<UUID, String> answerByQuestionId = new HashMap<>();
        for (SubmitPublicAnamnesisAnswerRequest answer : rawAnswers) {
            if (answer.questionId() == null) {
                continue;
            }
            String answerText = trimToNull(answer.answerText());
            if (answerText != null) {
                answerByQuestionId.put(answer.questionId(), answerText);
            }
        }

        for (AnamnesisQuestion question : activeQuestions) {
            if (!answerByQuestionId.containsKey(question.getId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Responda todas as perguntas da anamnese");
            }
        }

        ClientAnamnesisSubmission submission = ClientAnamnesisSubmission.create(
                client,
                client.getFullName(),
                client.getCpf()
        );
        ClientAnamnesisSubmission savedSubmission = submissionRepository.save(submission);

        List<ClientAnamnesisSubmissionAnswer> snapshots = activeQuestions.stream()
                .map(question -> ClientAnamnesisSubmissionAnswer.create(
                        savedSubmission,
                        question.getId(),
                        question.getQuestionText(),
                        answerByQuestionId.get(question.getId()),
                        question.getDisplayOrder()
                ))
                .toList();

        answerRepository.saveAll(snapshots);

        return buildFormResponse(client);
    }

    @Transactional
    public PublicAnamnesisFormResponse submitPublic(SubmitPublicAnamnesisRequest request) {
        return submitPublic(new SubmitPublicContext(request.clientId(), request.cpf(), request.answers()));
    }

    @Transactional(readOnly = true)
    public PublicAnamnesisFormResponse getByClientId(UUID clientId) {
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cliente não encontrado"));
        return buildFormResponse(client);
    }

    private PublicAnamnesisFormResponse buildFormResponse(Client client) {
        ClientAnamnesisSubmission submission = submissionRepository.findByClientId(client.getId()).orElse(null);

        if (submission != null) {
            List<PublicAnamnesisAnsweredItemResponse> answeredItems = answerRepository
                    .findBySubmissionIdOrderByDisplayOrderAscCreatedAtAsc(submission.getId())
                    .stream()
                    .map(answer -> new PublicAnamnesisAnsweredItemResponse(
                            answer.getQuestionIdSnapshot(),
                            answer.getQuestionTextSnapshot(),
                            answer.getAnswerText(),
                            answer.getDisplayOrder()
                    ))
                    .toList();

            return new PublicAnamnesisFormResponse(
                    client.getId(),
                    submission.getClientNameSnapshot(),
                    submission.getCpfSnapshot(),
                    true,
                    submission.getSubmittedAt(),
                    List.of(),
                    answeredItems
            );
        }

        List<PublicAnamnesisQuestionResponse> activeQuestions = questionRepository
                .findByActiveTrueOrderByDisplayOrderAscCreatedAtAsc()
                .stream()
                .map(question -> new PublicAnamnesisQuestionResponse(
                        question.getId(),
                        question.getQuestionText(),
                        question.getDisplayOrder()
                ))
                .toList();

        return new PublicAnamnesisFormResponse(
                client.getId(),
                client.getFullName(),
                client.getCpf(),
                false,
                null,
                activeQuestions,
                List.of()
        );
    }

    private Client resolveClient(UUID clientId, String rawCpf) {
        if (clientId != null) {
            return clientRepository.findById(clientId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cliente não encontrado"));
        }

        String cpf = normalizeCpf(rawCpf);
        if (cpf == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe o cliente por ID ou CPF");
        }

        return clientRepository.findByCpf(cpf)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cliente não encontrado para o CPF informado"));
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

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private AnamnesisQuestionResponse toQuestionResponse(AnamnesisQuestion question) {
        return new AnamnesisQuestionResponse(
                question.getId(),
                question.getQuestionText(),
                question.getDisplayOrder(),
                question.isActive(),
                question.getCreatedAt(),
                question.getUpdatedAt()
        );
    }

    private void validateDisplayOrderForCreate(int displayOrder) {
        if (questionRepository.existsByDisplayOrder(displayOrder)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Já existe uma pergunta na ordem informada");
        }
    }

    private void validateDisplayOrderForUpdate(int displayOrder, UUID id) {
        if (questionRepository.existsByDisplayOrderAndIdNot(displayOrder, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Já existe uma pergunta na ordem informada");
        }
    }

        private record SubmitPublicContext(
            UUID clientId,
            String cpf,
            List<SubmitPublicAnamnesisAnswerRequest> answers
    ) {
    }
}
