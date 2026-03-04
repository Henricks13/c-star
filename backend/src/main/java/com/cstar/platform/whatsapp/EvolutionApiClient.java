package com.cstar.platform.whatsapp;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class EvolutionApiClient {

    private final WhatsappProperties properties;
    private final RestTemplate restTemplate;

    public EvolutionApiClient(WhatsappProperties properties) {
        this.properties = properties;
        this.restTemplate = new RestTemplate();
    }

    public Map<String, Object> createInstance(String instanceName, String webhookUrl) {
        String url = properties.getEvolution().getBaseUrl() + "/instance/create";

        Map<String, Object> body = new HashMap<>();
        body.put("instanceName", instanceName);
        body.put("integration", "WHATSAPP-BAILEYS");
        body.put("qrcode", true);

        Map<String, Object> webhook = new HashMap<>();
        webhook.put("url", webhookUrl);
        webhook.put("byEvents", true);
        webhook.put("base64", true);
        webhook.put("events", new String[]{"MESSAGES_UPSERT", "CONNECTION_UPDATE", "QRCODE_UPDATED"});
        body.put("webhook", webhook);

        return post(url, body);
    }

    public Map<String, Object> connectInstance(String instanceName) {
        String url = properties.getEvolution().getBaseUrl() + "/instance/connect/" + instanceName;
        return get(url);
    }

    public Map<String, Object> connectionState(String instanceName) {
        String url = properties.getEvolution().getBaseUrl() + "/instance/connectionState/" + instanceName;
        Map<String, Object> response = get(url);
        return response.isEmpty() ? Map.of("state", "close") : response;
    }

    public Map<String, Object> fetchQrCode(String instanceName) {
        String url = properties.getEvolution().getBaseUrl() + "/instance/connect/" + instanceName;
        return get(url);
    }

    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> fetchInstances() {
        String url = properties.getEvolution().getBaseUrl() + "/instance/fetchInstances";
        HttpEntity<Void> request = new HttpEntity<>(headers());
        try {
            ResponseEntity<Map[]> response = restTemplate.exchange(url, HttpMethod.GET, request, Map[].class);
            if (response.getBody() == null) {
                return List.of();
            }
            return Arrays.stream(response.getBody())
                    .filter(map -> map != null)
                    .map(map -> (Map<String, Object>) map)
                    .toList();
        } catch (HttpClientErrorException | HttpServerErrorException ex) {
            return List.of();
        }
    }

    public void logout(String instanceName) {
        String url = properties.getEvolution().getBaseUrl() + "/instance/logout/" + instanceName;
        post(url, Map.of());
    }

    public Map<String, Object> sendText(String instanceName, String number, String text) {
        String url = properties.getEvolution().getBaseUrl() + "/message/sendText/" + instanceName;
        return post(url, Map.of("number", number, "text", text));
    }

    private Map<String, Object> get(String url) {
        HttpEntity<Void> request = new HttpEntity<>(headers());
        try {
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, request, Map.class);
            return response.getBody() == null ? Map.of() : response.getBody();
        } catch (HttpClientErrorException | HttpServerErrorException ex) {
            return Map.of();
        }
    }

    private Map<String, Object> post(String url, Object body) {
        HttpEntity<Object> request = new HttpEntity<>(body, headers());
        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
            return response.getBody() == null ? Map.of() : response.getBody();
        } catch (HttpClientErrorException | HttpServerErrorException ex) {
            return Map.of();
        }
    }

    private HttpHeaders headers() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (properties.getEvolution().getApiKey() != null && !properties.getEvolution().getApiKey().isBlank()) {
            headers.set("apikey", properties.getEvolution().getApiKey());
        }
        return headers;
    }
}
