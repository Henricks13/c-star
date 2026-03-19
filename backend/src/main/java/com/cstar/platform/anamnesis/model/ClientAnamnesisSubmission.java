package com.cstar.platform.anamnesis.model;

import com.cstar.platform.clients.model.Client;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "client_anamnesis_submissions")
public class ClientAnamnesisSubmission {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    @Column(name = "client_name_snapshot", nullable = false, length = 160)
    private String clientNameSnapshot;

    @Column(name = "cpf_snapshot", length = 14)
    private String cpfSnapshot;

    @Column(name = "submitted_at", nullable = false)
    private Instant submittedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected ClientAnamnesisSubmission() {
    }

    public static ClientAnamnesisSubmission create(Client client, String clientNameSnapshot, String cpfSnapshot) {
        ClientAnamnesisSubmission submission = new ClientAnamnesisSubmission();
        submission.client = client;
        submission.clientNameSnapshot = clientNameSnapshot;
        submission.cpfSnapshot = cpfSnapshot;
        return submission;
    }

    @PrePersist
    void onPrePersist() {
        Instant now = Instant.now();
        this.submittedAt = now;
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    void onPreUpdate() {
        this.updatedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public Client getClient() {
        return client;
    }

    public String getClientNameSnapshot() {
        return clientNameSnapshot;
    }

    public String getCpfSnapshot() {
        return cpfSnapshot;
    }

    public Instant getSubmittedAt() {
        return submittedAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
