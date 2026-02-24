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
    private Label universTotalLabel;

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
        Task<TotalsResult> task = new Task<>() {
            @Override
            protected TotalsResult call() {
                Integer concepts = readTotal(() -> apiService.getConceptTotal());
                Integer cultures = readTotal(() -> apiService.getCultureTotal());
                Integer categories = readTotal(() -> apiService.getCategorieTotal());
                Integer univers = readTotal(() -> apiService.getUniversTotal());
                return new TotalsResult(concepts, cultures, categories, univers);
            }
        };

        task.setOnRunning(event -> setLoading(true));
        task.setOnSucceeded(event -> {
            setLoading(false);
            TotalsResult values = task.getValue();
            conceptsTotalLabel.setText(formatTotal(values.concepts()));
            culturesTotalLabel.setText(formatTotal(values.cultures()));
            categoriesTotalLabel.setText(formatTotal(values.categories()));
            universTotalLabel.setText(formatTotal(values.univers()));
        });

        task.setOnFailed(event -> {
            setLoading(false);
            UiAlerts.error("Dashboard", "Impossible de charger les statistiques: " + task.getException().getMessage());
        });

        Thread thread = new Thread(task, "dashboard-thread");
        thread.setDaemon(true);
        thread.start();
    }

    private Integer readTotal(ThrowingSupplier<Integer> supplier) {
        try {
            return supplier.get();
        } catch (Exception ignored) {
            return null;
        }
    }

    private String formatTotal(Integer total) {
        return total == null ? "-" : String.valueOf(total);
    }

    private void setLoading(boolean loading) {
        loadingIndicator.setVisible(loading);
        loadingIndicator.setManaged(loading);
    }

    @FunctionalInterface
    private interface ThrowingSupplier<T> {
        T get() throws Exception;
    }

    private record TotalsResult(Integer concepts, Integer cultures, Integer categories, Integer univers) {
    }
}