package com.nomina.desktop.service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nomina.desktop.AppState;

public class ApiClient {
    private static final Duration TIMEOUT = Duration.ofSeconds(20);
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final AppState state;

    public ApiClient() {
        this.httpClient = HttpClient.newBuilder().connectTimeout(TIMEOUT).build();
        this.objectMapper = new ObjectMapper();
        this.objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        this.state = AppState.getInstance();
    }

    public ObjectMapper getObjectMapper() {
        return objectMapper;
    }

    public String request(String method, String path, Object body, boolean requiresAuth) throws IOException, InterruptedException {
        String fullPath = path.startsWith("/") ? path : "/" + path;
        HttpRequest.Builder builder = HttpRequest.newBuilder()
                .uri(URI.create(state.getBaseUrl() + fullPath))
                .timeout(TIMEOUT)
                .header("Accept", "application/json");

        if (requiresAuth) {
            String token = state.getToken();
            if (token == null || token.isBlank()) {
                throw new ApiException(401, "Token requis pour cette opération");
            }
            builder.header("Authorization", "Bearer " + token);
        }

        if (body != null) {
            builder.header("Content-Type", "application/json");
            String payload = objectMapper.writeValueAsString(body);
            builder.method(method, HttpRequest.BodyPublishers.ofString(payload));
        } else {
            builder.method(method, HttpRequest.BodyPublishers.noBody());
        }

        HttpResponse<String> response = httpClient.send(builder.build(), HttpResponse.BodyHandlers.ofString());
        int status = response.statusCode();

        if (status >= 200 && status < 300) {
            return response.body();
        }

        String message = extractMessage(response.body());
        throw new ApiException(status, message);
    }

    private String extractMessage(String body) {
        if (body == null || body.isBlank()) {
            return "Erreur API";
        }
        try {
            ApiErrorPayload payload = objectMapper.readValue(body, ApiErrorPayload.class);
            if (payload.error != null && !payload.error.isBlank()) {
                return payload.error;
            }
            if (payload.message != null && !payload.message.isBlank()) {
                return payload.message;
            }
        } catch (Exception ignored) {
        }
        return body;
    }

    private static class ApiErrorPayload {
        public String error;
        public String message;
    }
}