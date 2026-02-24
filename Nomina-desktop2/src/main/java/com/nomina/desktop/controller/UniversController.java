package com.nomina.desktop.controller;

import com.nomina.desktop.model.UniversThematique;
import com.nomina.desktop.model.UniversThematiqueInput;
import com.nomina.desktop.service.ApiException;
import com.nomina.desktop.service.ApiService;
import com.nomina.desktop.util.UiAlerts;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.concurrent.Task;
import javafx.fxml.FXML;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.control.ProgressIndicator;
import javafx.scene.control.TableColumn;
import javafx.scene.control.TableView;
import javafx.scene.control.TextField;

import java.util.List;

public class UniversController {
    @FXML
    private TableView<UniversThematique> universTable;

    @FXML
    private TableColumn<UniversThematique, Number> colId;

    @FXML
    private TableColumn<UniversThematique, String> colName;

    @FXML
    private TableColumn<UniversThematique, String> colDescription;

    @FXML
    private TableColumn<UniversThematique, String> colImageUrl;

    @FXML
    private TextField nameField;

    @FXML
    private TextField descriptionField;

    @FXML
    private TextField imageUrlField;

    @FXML
    private Label feedbackLabel;

    @FXML
    private ProgressIndicator loadingIndicator;

    @FXML
    private Button saveButton;

    @FXML
    private Button deleteButton;

    private final ApiService apiService = new ApiService();
    private final ObservableList<UniversThematique> univers = FXCollections.observableArrayList();

    @FXML
    public void initialize() {
        setupTable();
        setLoading(false);
        universTable.setItems(univers);
        universTable.getSelectionModel().selectedItemProperty().addListener((obs, oldValue, selected) -> fillForm(selected));
        loadUnivers();
    }

    @FXML
    private void onRefresh() {
        loadUnivers();
    }

    @FXML
    private void onNew() {
        universTable.getSelectionModel().clearSelection();
        clearForm();
        feedbackLabel.setText("Mode création");
    }

    @FXML
    private void onSave() {
        String validationError = validateForm();
        if (validationError != null) {
            UiAlerts.error("Validation", validationError);
            return;
        }

        UniversThematiqueInput input = mapFormToInput();
        UniversThematique selected = universTable.getSelectionModel().getSelectedItem();

        Task<Void> task = new Task<>() {
            @Override
            protected Void call() throws Exception {
                if (selected == null) {
                    apiService.createUnivers(input);
                } else {
                    apiService.updateUnivers(selected.getId(), input);
                }
                return null;
            }
        };

        task.setOnRunning(event -> setLoading(true));
        task.setOnSucceeded(event -> {
            setLoading(false);
            feedbackLabel.setText(selected == null ? "Univers créé avec succès." : "Univers modifié avec succès.");
            loadUnivers();
            clearForm();
        });
        task.setOnFailed(event -> {
            setLoading(false);
            showTaskError("Enregistrement", task.getException());
        });

        Thread thread = new Thread(task, "univers-save-thread");
        thread.setDaemon(true);
        thread.start();
    }

    @FXML
    private void onDelete() {
        UniversThematique selected = universTable.getSelectionModel().getSelectedItem();
        if (selected == null) {
            UiAlerts.error("Suppression", "Sélectionne un univers à supprimer.");
            return;
        }

        boolean confirmed = UiAlerts.confirm("Suppression", "Supprimer l'univers #" + selected.getId() + " ?");
        if (!confirmed) {
            return;
        }

        Task<Void> task = new Task<>() {
            @Override
            protected Void call() throws Exception {
                apiService.deleteUnivers(selected.getId());
                return null;
            }
        };

        task.setOnRunning(event -> setLoading(true));
        task.setOnSucceeded(event -> {
            setLoading(false);
            feedbackLabel.setText("Univers supprimé.");
            loadUnivers();
            clearForm();
        });
        task.setOnFailed(event -> {
            setLoading(false);
            showTaskError("Suppression", task.getException());
        });

        Thread thread = new Thread(task, "univers-delete-thread");
        thread.setDaemon(true);
        thread.start();
    }

    private void loadUnivers() {
        Task<List<UniversThematique>> task = new Task<>() {
            @Override
            protected List<UniversThematique> call() throws Exception {
                return apiService.getUnivers();
            }
        };

        task.setOnRunning(event -> setLoading(true));
        task.setOnSucceeded(event -> {
            setLoading(false);
            univers.setAll(task.getValue());
            feedbackLabel.setText("Univers chargés: " + univers.size());
        });
        task.setOnFailed(event -> {
            setLoading(false);
            showTaskError("Chargement", task.getException());
        });

        Thread thread = new Thread(task, "univers-load-thread");
        thread.setDaemon(true);
        thread.start();
    }

    private void setupTable() {
        colId.setCellValueFactory(data -> data.getValue().idProperty());
        colName.setCellValueFactory(data -> data.getValue().nameProperty());
        colDescription.setCellValueFactory(data -> data.getValue().descriptionProperty());
        colImageUrl.setCellValueFactory(data -> data.getValue().imageUrlProperty());
    }

    private void fillForm(UniversThematique universThematique) {
        if (universThematique == null) {
            deleteButton.setDisable(true);
            return;
        }

        nameField.setText(universThematique.getName() == null ? "" : universThematique.getName());
        descriptionField.setText(universThematique.getDescription() == null ? "" : universThematique.getDescription());
        imageUrlField.setText(universThematique.getImageUrl() == null ? "" : universThematique.getImageUrl());
        deleteButton.setDisable(false);
    }

    private UniversThematiqueInput mapFormToInput() {
        UniversThematiqueInput input = new UniversThematiqueInput();
        input.setName(trimOrNull(nameField.getText()));
        input.setDescription(trimOrNull(descriptionField.getText()));
        input.setImageUrl(trimOrNull(imageUrlField.getText()));
        return input;
    }

    private String validateForm() {
        String name = trimOrNull(nameField.getText());
        if (name == null) {
            return "Le champ 'Nom' est obligatoire.";
        }
        if (name.length() < 2) {
            return "Le champ 'Nom' doit contenir au moins 2 caractères.";
        }
        return null;
    }

    private void clearForm() {
        nameField.clear();
        descriptionField.clear();
        imageUrlField.clear();
        deleteButton.setDisable(true);
    }

    private String trimOrNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isBlank() ? null : trimmed;
    }

    private void setLoading(boolean loading) {
        loadingIndicator.setVisible(loading);
        loadingIndicator.setManaged(loading);
        saveButton.setDisable(loading);
    }

    private void showTaskError(String operation, Throwable ex) {
        if (ex instanceof ApiException apiException) {
            UiAlerts.error(operation, apiException.getMessage() + " (HTTP " + apiException.getStatusCode() + ")");
            return;
        }
        UiAlerts.error(operation, ex.getMessage());
    }
}
