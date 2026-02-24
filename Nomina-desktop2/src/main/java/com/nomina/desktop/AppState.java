package com.nomina.desktop;

import java.io.InputStream;
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
        this.baseUrl = stripTrailingSlash(baseUrl.trim());
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
            return stripTrailingSlash(envUrl.trim());
        }

        String fileUrl = readBaseUrlFromProperties();
        if (fileUrl != null && !fileUrl.isBlank()) {
            return stripTrailingSlash(fileUrl.trim());
        }

        return DEFAULT_BASE_URL;
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
