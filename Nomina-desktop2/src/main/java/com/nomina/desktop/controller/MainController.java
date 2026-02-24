package com.nomina.desktop.controller;

import com.nomina.desktop.AppState;
import com.nomina.desktop.util.Navigator;

import javafx.fxml.FXML;
import javafx.scene.Node;
import javafx.scene.control.Label;
import javafx.scene.layout.BorderPane;

public class MainController {
    @FXML
    private BorderPane rootPane;

    @FXML
    private Label authStatusLabel;

    @FXML
    private Label apiUrlLabel;

    @FXML
    public void initialize() {
        Navigator.init(this);
        refreshHeaderStatus();
    }

    @FXML
    private void onOpenDashboard() {
        Navigator.showDashboard();
        refreshHeaderStatus();
    }

    @FXML
    private void onOpenLogin() {
        Navigator.showLogin();
        refreshHeaderStatus();
    }

    @FXML
    private void onOpenConcepts() {
        Navigator.showConcepts();
        refreshHeaderStatus();
    }

    @FXML
    private void onOpenCategories() {
        Navigator.showCategories();
        refreshHeaderStatus();
    }

    @FXML
    private void onOpenCultures() {
        Navigator.showCultures();
        refreshHeaderStatus();
    }

    @FXML
    private void onLogout() {
        AppState.getInstance().clearAuth();
        refreshHeaderStatus();
        Navigator.showLogin();
    }

    public void setCenter(Node node) {
        rootPane.setCenter(node);
        refreshHeaderStatus();
    }

    public void refreshHeaderStatus() {
        AppState state = AppState.getInstance();
        apiUrlLabel.setText("API: " + state.getBaseUrl());

        if (state.getToken() == null || state.getToken().isBlank()) {
            authStatusLabel.setText("Non connecté");
            return;
        }

        String role = state.isAdmin() ? "Admin" : "Utilisateur";
        String uid = state.getUserId() == null ? "inconnu" : state.getUserId();
        authStatusLabel.setText("Connecté: " + uid + " (" + role + ")");
    }
}
