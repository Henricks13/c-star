package com.cstar.platform.clientorders;

import com.cstar.platform.auth.security.AuthUserPrincipal;
import com.cstar.platform.clientorders.dto.ClientServiceOrderResponse;
import com.cstar.platform.clientorders.dto.ConfirmClientServiceOrderPaymentRequest;
import com.cstar.platform.clientorders.dto.CreateClientServiceOrderRequest;
import com.cstar.platform.clientorders.dto.CreateClientServiceOrderPaymentPlanRequest;
import com.cstar.platform.clientorders.dto.AddClientServiceOrderObservationRequest;
import com.cstar.platform.clientorders.dto.ScheduleClientServiceOrderRequest;
import com.cstar.platform.clientorders.dto.ScheduleClientServiceOrderReturnRequest;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class ClientServiceOrderController {

    private final ClientServiceOrderService clientServiceOrderService;

    public ClientServiceOrderController(ClientServiceOrderService clientServiceOrderService) {
        this.clientServiceOrderService = clientServiceOrderService;
    }

    @PostMapping("/client-service-orders")
    public ClientServiceOrderResponse create(
            @AuthenticationPrincipal AuthUserPrincipal principal,
            @RequestBody @Valid CreateClientServiceOrderRequest request
    ) {
        return clientServiceOrderService.create(request, principal);
    }

    @GetMapping("/client-service-orders")
    public List<ClientServiceOrderResponse> listAll() {
        return clientServiceOrderService.listAll();
    }

    @PostMapping("/client-service-orders/{orderId}/payment")
    public ClientServiceOrderResponse confirmPayment(
            @PathVariable UUID orderId,
            @RequestBody @Valid ConfirmClientServiceOrderPaymentRequest request
    ) {
        return clientServiceOrderService.confirmPayment(orderId, request);
    }

    @PostMapping("/client-service-orders/{orderId}/payment-plan")
    public ClientServiceOrderResponse createPaymentPlan(
            @PathVariable UUID orderId,
            @RequestBody @Valid CreateClientServiceOrderPaymentPlanRequest request
    ) {
        return clientServiceOrderService.createPaymentPlan(orderId, request);
    }

    @PostMapping("/client-service-orders/{orderId}/schedule")
    public ClientServiceOrderResponse scheduleService(
            @PathVariable UUID orderId,
            @RequestBody @Valid ScheduleClientServiceOrderRequest request
    ) {
        return clientServiceOrderService.scheduleService(orderId, request);
    }

    @PostMapping("/client-service-orders/{orderId}/observations")
    public ClientServiceOrderResponse addObservation(
            @PathVariable UUID orderId,
            @AuthenticationPrincipal AuthUserPrincipal principal,
            @RequestBody @Valid AddClientServiceOrderObservationRequest request
    ) {
        return clientServiceOrderService.addObservation(orderId, request, principal);
    }

    @PostMapping("/client-service-orders/{orderId}/returns")
    public ClientServiceOrderResponse scheduleReturn(
            @PathVariable UUID orderId,
            @RequestBody @Valid ScheduleClientServiceOrderReturnRequest request
    ) {
        return clientServiceOrderService.scheduleReturn(orderId, request);
    }

    @PostMapping("/client-service-orders/{orderId}/finalize")
    public ClientServiceOrderResponse finalizeService(@PathVariable UUID orderId) {
        return clientServiceOrderService.finalizeService(orderId);
    }

    @GetMapping("/clients/{clientId}/service-orders")
    public List<ClientServiceOrderResponse> listByClient(@PathVariable UUID clientId) {
        return clientServiceOrderService.listByClient(clientId);
    }

    @GetMapping("/clients/{clientId}/service-orders/pending")
    public ResponseEntity<ClientServiceOrderResponse> findPendingByClient(@PathVariable UUID clientId) {
        ClientServiceOrderResponse pending = clientServiceOrderService.findPendingByClient(clientId);
        if (pending == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(pending);
    }
}
