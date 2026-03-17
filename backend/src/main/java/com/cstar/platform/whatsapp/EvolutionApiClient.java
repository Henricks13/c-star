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
            ResponseEntity<Object> response = restTemplate.exchange(url, HttpMethod.GET, request, Object.class);
            Object body = response.getBody();
            if (body instanceof List<?> list) {
                return list.stream()
                        .filter(item -> item instanceof Map<?, ?>)
                        .map(item -> (Map<String, Object>) item)
                        .toList();
            }

            if (body instanceof Map<?, ?> map) {
                return List.of((Map<String, Object>) map);
            }

            return List.of();
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

    public Map<String, Object> findChats(String instanceName, int limit) {
        String url = properties.getEvolution().getBaseUrl() + "/chat/findChats/" + instanceName;
        int safeLimit = Math.max(1, Math.min(limit, 500));
        Map<String, Object> payload = new HashMap<>();
        payload.put("page", 1);
        payload.put("limit", safeLimit);
        return post(url, payload);
    }

    public Map<String, Object> findMessages(String instanceName, String remoteJid, int limit) {
        String url = properties.getEvolution().getBaseUrl() + "/chat/findMessages/" + instanceName;
        int safeLimit = Math.max(1, Math.min(limit, 100));

        Map<String, Object> keyFilter = new HashMap<>();
        keyFilter.put("remoteJid", remoteJid);

        Map<String, Object> where = new HashMap<>();
        where.put("key", keyFilter);

        Map<String, Object> payload = new HashMap<>();
        payload.put("where", where);
        payload.put("page", 1);
        payload.put("limit", safeLimit);

        return post(url, payload);
    }

    private Map<String, Object> get(String url) {
        HttpEntity<Void> request = new HttpEntity<>(headers());
        try {
            ResponseEntity<Object> response = restTemplate.exchange(url, HttpMethod.GET, request, Object.class);
            return normalizeBody(response.getBody());
        } catch (HttpClientErrorException | HttpServerErrorException ex) {
            return Map.of();
        }
    }

    private Map<String, Object> post(String url, Object body) {
        HttpEntity<Object> request = new HttpEntity<>(body, headers());
        try {
            ResponseEntity<Object> response = restTemplate.postForEntity(url, request, Object.class);
            return normalizeBody(response.getBody());
        } catch (HttpClientErrorException | HttpServerErrorException ex) {
            return Map.of();
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> normalizeBody(Object body) {
        if (body == null) {
            return Map.of();
        }

        if (body instanceof Map<?, ?> map) {
            return (Map<String, Object>) map;
        }

        if (body instanceof List<?> list) {
            return Map.of("records", list);
        }

        return Map.of("value", body);
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
