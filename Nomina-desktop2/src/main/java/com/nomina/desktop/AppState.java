package com.nomina.desktop;

import java.io.InputStream;
import java.net.URI;
import java.util.Properties;

public final class AppState {
    private static final AppState INSTANCE = new AppState();

    private static final String DEFAULT_BASE_URL = "http://localhost:3000/api";
    private String baseUrl = DEFAULT_BASE_URL;
    private String token;
    private String userId;
    private boolean admin;

    private AppState() {
        this.baseUrl = resolveBaseUrl();
    }

    public static AppState getInstance() {
        return INSTANCE;
    }

    public String getBaseUrl() {
        return baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
        if (baseUrl == null || baseUrl.isBlank()) {
            return;
        }
        this.baseUrl = normalizeBaseUrl(baseUrl);
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public boolean isAdmin() {
        return admin;
    }

    public void setAdmin(boolean admin) {
        this.admin = admin;
    }

    public void clearAuth() {
        this.token = null;
        this.userId = null;
        this.admin = false;
    }

    private String stripTrailingSlash(String url) {
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }

    private String resolveBaseUrl() {
        String envUrl = System.getenv("NOMINA_API_URL");
        if (envUrl != null && !envUrl.isBlank()) {
            return normalizeBaseUrl(envUrl);
        }

        String fileUrl = readBaseUrlFromProperties();
        if (fileUrl != null && !fileUrl.isBlank()) {
            return normalizeBaseUrl(fileUrl);
        }

        return DEFAULT_BASE_URL;
    }

    private String normalizeBaseUrl(String url) {
        String normalized = url.trim();

        if (!normalized.startsWith("http://") && !normalized.startsWith("https://")) {
            if (normalized.startsWith("localhost") || normalized.startsWith("127.0.0.1")) {
                normalized = "http://" + normalized;
            } else {
                normalized = "https://" + normalized;
            }
        }

        if (normalized.startsWith("http://") && normalized.contains(".vercel.app")) {
            normalized = "https://" + normalized.substring("http://".length());
        }

        normalized = stripTrailingSlash(normalized);

        try {
            URI uri = URI.create(normalized);
            String path = uri.getPath() == null ? "" : uri.getPath().trim();

            if (path.endsWith("/auth/me")) {
                path = path.substring(0, path.length() - "/auth/me".length());
            }

            int apiIndex = path.indexOf("/api");
            if (apiIndex >= 0) {
                path = path.substring(0, apiIndex) + "/api";
            } else if (path.isBlank() || "/".equals(path)) {
                path = "/api";
            } else {
                path = stripTrailingSlash(path) + "/api";
            }

            normalized = new URI(
                    uri.getScheme(),
                    uri.getAuthority(),
                    path,
                    null,
                    null
            ).toString();
        } catch (Exception ignored) {
            if (!normalized.endsWith("/api")) {
                normalized = normalized + "/api";
            }
        }

        return normalized;
    }

    private String readBaseUrlFromProperties() {
        Properties properties = new Properties();
        try (InputStream input = AppState.class.getResourceAsStream("/app.properties")) {
            if (input == null) {
                return null;
            }
            properties.load(input);
            return properties.getProperty("api.baseUrl");
        } catch (Exception ignored) {
            return null;
        }
    }
}
