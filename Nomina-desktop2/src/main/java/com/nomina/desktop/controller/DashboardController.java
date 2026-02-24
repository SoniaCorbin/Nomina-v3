package com.nomina.desktop.controller;

import com.nomina.desktop.AppState;
import com.nomina.desktop.service.ApiService;
import com.nomina.desktop.util.UiAlerts;
import javafx.concurrent.Task;
import javafx.fxml.FXML;
import javafx.scene.control.Label;
import javafx.scene.control.ProgressIndicator;

public class DashboardController {
    @FXML
    private Label userLabel;

    @FXML
    private Label roleLabel;

    @FXML
    private Label conceptsTotalLabel;

    @FXML
    private Label culturesTotalLabel;

    @FXML
    private Label categoriesTotalLabel;

    @FXML
    private ProgressIndicator loadingIndicator;

    private final ApiService apiService = new ApiService();

    @FXML
    public void initialize() {
        AppState state = AppState.getInstance();
        userLabel.setText(state.getUserId() == null ? "(non authentifié)" : state.getUserId());
        roleLabel.setText(state.isAdmin() ? "Administrateur" : "Utilisateur");
        refreshTotals();
    }

    @FXML
    private void onRefresh() {
        refreshTotals();
    }

    private void refreshTotals() {
        Task<int[]> task = new Task<>() {
            @Override
            protected int[] call() throws Exception {
                int concepts = apiService.getConceptTotal();
                int cultures = apiService.getCultureTotal();
                int categories = apiService.getCategorieTotal();
                return new int[]{concepts, cultures, categories};
            }
        };

        task.setOnRunning(event -> setLoading(true));
        task.setOnSucceeded(event -> {
            setLoading(false);
            int[] values = task.getValue();
            conceptsTotalLabel.setText(String.valueOf(values[0]));
            culturesTotalLabel.setText(String.valueOf(values[1]));
            categoriesTotalLabel.setText(String.valueOf(values[2]));
        });

        task.setOnFailed(event -> {
            setLoading(false);
            UiAlerts.error("Dashboard", "Impossible de charger les statistiques: " + task.getException().getMessage());
        });

        Thread thread = new Thread(task, "dashboard-thread");
        thread.setDaemon(true);
        thread.start();
    }

    private void setLoading(boolean loading) {
        loadingIndicator.setVisible(loading);
        loadingIndicator.setManaged(loading);
    }
}