package com.cstar.platform.clientorders;

import com.cstar.platform.clientorders.model.ClientServiceOrder;
import com.cstar.platform.clientorders.model.ClientServiceOrderPaymentStatus;
import com.cstar.platform.clientorders.model.ClientServiceOrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ClientServiceOrderRepository extends JpaRepository<ClientServiceOrder, UUID> {

    List<ClientServiceOrder> findAllByOrderByCreatedAtDesc();

    List<ClientServiceOrder> findByClientIdOrderByCreatedAtDesc(UUID clientId);

    boolean existsByClientId(UUID clientId);

    Optional<ClientServiceOrder> findFirstByClientIdAndPaymentStatusInAndStatusInOrderByUpdatedAtDesc(
            UUID clientId,
            List<ClientServiceOrderPaymentStatus> paymentStatuses,
            List<ClientServiceOrderStatus> serviceStatuses
    );
}
