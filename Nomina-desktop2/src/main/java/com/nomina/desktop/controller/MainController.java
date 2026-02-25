package com.nomina.desktop.controller;

import com.nomina.desktop.AppState;
import com.nomina.desktop.util.Navigator;

import javafx.fxml.FXML;
import javafx.scene.Node;
import javafx.scene.control.Button;
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
    private Button dashboardButton;

    @FXML
    private Button loginButton;

    @FXML
    private Button conceptsButton;

    @FXML
    private Button categoriesButton;

    @FXML
    private Button culturesButton;

    @FXML
    private Button universButton;

    @FXML
    public void initialize() {
        Navigator.init(this);
        refreshHeaderStatus();
        setActiveButton(dashboardButton);
    }

    @FXML
    private void onOpenDashboard() {
        Navigator.showDashboard();
        setActiveButton(dashboardButton);
        refreshHeaderStatus();
    }

    @FXML
    private void onOpenLogin() {
        Navigator.showLogin();
        setActiveButton(loginButton);
        refreshHeaderStatus();
    }

    @FXML
    private void onOpenConcepts() {
        Navigator.showConcepts();
        setActiveButton(conceptsButton);
        refreshHeaderStatus();
    }

    @FXML
    private void onOpenCategories() {
        Navigator.showCategories();
        setActiveButton(categoriesButton);
        refreshHeaderStatus();
    }

    @FXML
    private void onOpenCultures() {
        Navigator.showCultures();
        setActiveButton(culturesButton);
        refreshHeaderStatus();
    }

    @FXML
    private void onOpenUnivers() {
        Navigator.showUnivers();
        setActiveButton(universButton);
        refreshHeaderStatus();
    }

    @FXML
    private void onLogout() {
        AppState.getInstance().clearAuth();
        refreshHeaderStatus();
        Navigator.showLogin();
        setActiveButton(loginButton);
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

    private void setActiveButton(Button activeButton) {
        Button[] navButtons = { dashboardButton, loginButton, conceptsButton, categoriesButton, culturesButton, universButton };

        for (Button button : navButtons) {
            if (button == null) {
                continue;
            }
            button.getStyleClass().remove("active");
        }

        if (activeButton != null && !activeButton.getStyleClass().contains("active")) {
            activeButton.getStyleClass().add("active");
        }
    }
}
