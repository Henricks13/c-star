package com.cstar.platform.clients;

import com.cstar.platform.clients.dto.ClientListItemResponse;
import com.cstar.platform.clients.dto.CreateClientRequest;
import com.cstar.platform.clients.dto.ClientObservationResponse;
import com.cstar.platform.clients.dto.AddClientObservationRequest;
import com.cstar.platform.clients.dto.UpdateClientRequest;
import com.cstar.platform.auth.security.AuthUserPrincipal;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/clients")
public class ClientController {

    private final ClientService clientService;

    public ClientController(ClientService clientService) {
        this.clientService = clientService;
    }

    @GetMapping
    public List<ClientListItemResponse> list() {
        return clientService.list();
    }

    @PostMapping
    public ClientListItemResponse create(@RequestBody @Valid CreateClientRequest request) {
        return clientService.create(request);
    }

    @PutMapping("/{id}")
    public ClientListItemResponse update(@PathVariable("id") UUID clientId,
                                         @RequestBody @Valid UpdateClientRequest request) {
        return clientService.update(clientId, request);
    }

    @GetMapping("/{id}/observations")
    public java.util.List<ClientObservationResponse> listObservations(@PathVariable("id") UUID clientId) {
        return clientService.listObservations(clientId);
    }

    @PostMapping("/{id}/observations")
    public ClientObservationResponse addObservation(@PathVariable("id") UUID clientId,
                                                    @AuthenticationPrincipal AuthUserPrincipal principal,
                                                    @RequestBody @Valid AddClientObservationRequest request) {
        return clientService.addObservation(clientId, request, principal);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable("id") UUID clientId,
                       @AuthenticationPrincipal AuthUserPrincipal principal) {
        clientService.delete(clientId, principal);
    }
}
