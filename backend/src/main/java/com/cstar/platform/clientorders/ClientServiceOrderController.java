package com.cstar.platform.clientorders;

import com.cstar.platform.clientorders.dto.ClientServiceOrderResponse;
import com.cstar.platform.clientorders.dto.ConfirmClientServiceOrderPaymentRequest;
import com.cstar.platform.clientorders.dto.CreateClientServiceOrderRequest;
import jakarta.validation.Valid;
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
    public ClientServiceOrderResponse create(@RequestBody @Valid CreateClientServiceOrderRequest request) {
        return clientServiceOrderService.create(request);
    }

    @PostMapping("/client-service-orders/{orderId}/payment")
    public ClientServiceOrderResponse confirmPayment(
            @PathVariable UUID orderId,
            @RequestBody @Valid ConfirmClientServiceOrderPaymentRequest request
    ) {
        return clientServiceOrderService.confirmPayment(orderId, request);
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
