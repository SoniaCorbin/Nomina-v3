package com.nomina.desktop.controller;

import com.nomina.desktop.AppState;
import com.nomina.desktop.model.AuthMe;
import com.nomina.desktop.service.ApiException;
import com.nomina.desktop.service.ApiService;
import com.nomina.desktop.util.Navigator;
import com.nomina.desktop.util.UiAlerts;
import javafx.application.Platform;
import javafx.concurrent.Task;
import javafx.fxml.FXML;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.control.ProgressIndicator;
import javafx.scene.control.TextField;

import java.awt.Desktop;
import java.net.URI;

public class LoginController {
    @FXML
    private TextField apiUrlField;

    @FXML
    private TextField tokenField;

    @FXML
    private Label infoLabel;

    @FXML
    private ProgressIndicator loadingIndicator;

    @FXML
    private Button validateButton;

    private final ApiService apiService = new ApiService();

    @FXML
    public void initialize() {
        AppState state = AppState.getInstance();
        apiUrlField.setText(state.getBaseUrl());
        tokenField.setText(state.getToken() == null ? "" : state.getToken());
        setLoading(false);
    }

    @FXML
    private void onValidateToken() {
        String apiUrl = apiUrlField.getText() == null ? "" : apiUrlField.getText().trim();
        String token = tokenField.getText() == null ? "" : tokenField.getText().trim();

        if (apiUrl.isBlank()) {
            UiAlerts.error("Validation", "L'URL API est obligatoire.");
            return;
        }
        if (token.isBlank()) {
            UiAlerts.error("Validation", "Le token Bearer est obligatoire pour les opérations protégées.");
            return;
        }

        AppState state = AppState.getInstance();
        state.setBaseUrl(apiUrl);
        state.setToken(token);

        Task<AuthMe> task = new Task<>() {
            @Override
            protected AuthMe call() throws Exception {
                return apiService.checkMe();
            }
        };

        task.setOnRunning(event -> setLoading(true));
        task.setOnSucceeded(event -> {
            setLoading(false);
            AuthMe me = task.getValue();

            state.setUserId(me.getUserId());
            state.setAdmin(me.isAdmin());

            String role = me.isAdmin() ? "Admin" : "Utilisateur";
            infoLabel.setText("Connecté: " + me.getUserId() + " (" + role + ")");
            UiAlerts.info("Connexion réussie", "Authentification validée via /auth/me.");
            Navigator.showDashboard();
        });

        task.setOnFailed(event -> {
            setLoading(false);
            Throwable ex = task.getException();

            if (ex instanceof ApiException apiException) {
                UiAlerts.error("Connexion", apiException.getMessage() + " (HTTP " + apiException.getStatusCode() + ")");
            } else {
                UiAlerts.error("Connexion", ex.getMessage());
            }
        });

        Thread thread = new Thread(task, "login-check-thread");
        thread.setDaemon(true);
        thread.start();
    }

    @FXML
    private void onOpenSignIn() {
        openInBrowser("https://clerk.com/sign-in");
    }

    @FXML
    private void onOpenSignUp() {
        openInBrowser("https://clerk.com/sign-up");
    }

    private void openInBrowser(String url) {
        try {
            if (!Desktop.isDesktopSupported()) {
                UiAlerts.error("Navigateur", "Ouverture navigateur non supportée sur ce système.");
                return;
            }
            Desktop.getDesktop().browse(new URI(url));
        } catch (Exception e) {
            UiAlerts.error("Navigateur", "Impossible d'ouvrir le lien: " + e.getMessage());
        }
    }

    private void setLoading(boolean loading) {
        loadingIndicator.setVisible(loading);
        loadingIndicator.setManaged(loading);
        validateButton.setDisable(loading);
        apiUrlField.setDisable(loading);
        tokenField.setDisable(loading);
        Platform.runLater(() -> infoLabel.setText(loading ? "Validation en cours..." : infoLabel.getText()));
    }
}