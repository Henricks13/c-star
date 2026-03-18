package com.cstar.platform.clients;

import com.cstar.platform.clients.dto.ClientListItemResponse;
import com.cstar.platform.clients.dto.CreateClientRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

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
}
