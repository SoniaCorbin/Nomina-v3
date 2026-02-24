package com.nomina.desktop.controller;

import java.util.List;

import com.nomina.desktop.model.Culture;
import com.nomina.desktop.model.CultureInput;
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

public class CulturesController {
    @FXML
    private TableView<Culture> culturesTable;

    @FXML
    private TableColumn<Culture, Number> colId;

    @FXML
    private TableColumn<Culture, String> colName;

    @FXML
    private TableColumn<Culture, String> colDescription;

    @FXML
    private TextField nameField;

    @FXML
    private TextField descriptionField;

    @FXML
    private Label feedbackLabel;

    @FXML
    private ProgressIndicator loadingIndicator;

    @FXML
    private Button saveButton;

    @FXML
    private Button deleteButton;

    private final ApiService apiService = new ApiService();
    private final ObservableList<Culture> cultures = FXCollections.observableArrayList();

    @FXML
    public void initialize() {
        setupTable();
        setLoading(false);
        culturesTable.setItems(cultures);
        culturesTable.getSelectionModel().selectedItemProperty().addListener((obs, oldValue, selected) -> fillForm(selected));
        loadCultures();
    }

    @FXML
    private void onRefresh() {
        loadCultures();
    }

    @FXML
    private void onNew() {
        culturesTable.getSelectionModel().clearSelection();
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

        CultureInput input = mapFormToInput();
        Culture selected = culturesTable.getSelectionModel().getSelectedItem();

        Task<Void> task = new Task<>() {
            @Override
            protected Void call() throws Exception {
                if (selected == null) {
                    apiService.createCulture(input);
                } else {
                    apiService.updateCulture(selected.getId(), input);
                }
                return null;
            }
        };

        task.setOnRunning(event -> setLoading(true));
        task.setOnSucceeded(event -> {
            setLoading(false);
            feedbackLabel.setText(selected == null ? "Culture créée avec succès." : "Culture modifiée avec succès.");
            loadCultures();
            clearForm();
        });
        task.setOnFailed(event -> {
            setLoading(false);
            showTaskError("Enregistrement", task.getException());
        });

        Thread thread = new Thread(task, "culture-save-thread");
        thread.setDaemon(true);
        thread.start();
    }

    @FXML
    private void onDelete() {
        Culture selected = culturesTable.getSelectionModel().getSelectedItem();
        if (selected == null) {
            UiAlerts.error("Suppression", "Sélectionne une culture à supprimer.");
            return;
        }

        boolean confirmed = UiAlerts.confirm("Suppression", "Supprimer la culture #" + selected.getId() + " ?");
        if (!confirmed) {
            return;
        }

        Task<Void> task = new Task<>() {
            @Override
            protected Void call() throws Exception {
                apiService.deleteCulture(selected.getId());
                return null;
            }
        };

        task.setOnRunning(event -> setLoading(true));
        task.setOnSucceeded(event -> {
            setLoading(false);
            feedbackLabel.setText("Culture supprimée.");
            loadCultures();
            clearForm();
        });
        task.setOnFailed(event -> {
            setLoading(false);
            showTaskError("Suppression", task.getException());
        });

        Thread thread = new Thread(task, "culture-delete-thread");
        thread.setDaemon(true);
        thread.start();
    }

    private void loadCultures() {
        Task<List<Culture>> task = new Task<>() {
            @Override
            protected List<Culture> call() throws Exception {
                return apiService.getCultures();
            }
        };

        task.setOnRunning(event -> setLoading(true));
        task.setOnSucceeded(event -> {
            setLoading(false);
            cultures.setAll(task.getValue());
            feedbackLabel.setText("Cultures chargées: " + cultures.size());
        });
        task.setOnFailed(event -> {
            setLoading(false);
            showTaskError("Chargement", task.getException());
        });

        Thread thread = new Thread(task, "culture-load-thread");
        thread.setDaemon(true);
        thread.start();
    }

    private void setupTable() {
        colId.setCellValueFactory(data -> data.getValue().idProperty());
        colName.setCellValueFactory(data -> data.getValue().nameProperty());
        colDescription.setCellValueFactory(data -> data.getValue().descriptionProperty());
    }

    private void fillForm(Culture culture) {
        if (culture == null) {
            deleteButton.setDisable(true);
            return;
        }

        nameField.setText(culture.getName() == null ? "" : culture.getName());
        descriptionField.setText(culture.getDescription() == null ? "" : culture.getDescription());
        deleteButton.setDisable(false);
    }

    private CultureInput mapFormToInput() {
        CultureInput input = new CultureInput();
        input.setName(trimOrNull(nameField.getText()));
        input.setDescription(trimOrNull(descriptionField.getText()));
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
