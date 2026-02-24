package com.nomina.desktop.controller;

import java.util.List;

import com.nomina.desktop.model.Category;
import com.nomina.desktop.model.CategoryInput;
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

public class CategoriesController {
    @FXML
    private TableView<Category> categoriesTable;

    @FXML
    private TableColumn<Category, Number> colId;

    @FXML
    private TableColumn<Category, String> colName;

    @FXML
    private TableColumn<Category, String> colDescription;

    @FXML
    private TableColumn<Category, String> colUniversId;

    @FXML
    private TextField nameField;

    @FXML
    private TextField descriptionField;

    @FXML
    private TextField universIdField;

    @FXML
    private TextField universNameField;

    @FXML
    private Label feedbackLabel;

    @FXML
    private ProgressIndicator loadingIndicator;

    @FXML
    private Button saveButton;

    @FXML
    private Button deleteButton;

    private final ApiService apiService = new ApiService();
    private final ObservableList<Category> categories = FXCollections.observableArrayList();

    @FXML
    public void initialize() {
        setupTable();
        setLoading(false);
        categoriesTable.setItems(categories);
        categoriesTable.getSelectionModel().selectedItemProperty().addListener((obs, oldValue, selected) -> fillForm(selected));
        loadCategories();
    }

    @FXML
    private void onRefresh() {
        loadCategories();
    }

    @FXML
    private void onNew() {
        categoriesTable.getSelectionModel().clearSelection();
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

        CategoryInput input = mapFormToInput();
        Category selected = categoriesTable.getSelectionModel().getSelectedItem();

        Task<Void> task = new Task<>() {
            @Override
            protected Void call() throws Exception {
                if (selected == null) {
                    apiService.createCategory(input);
                } else {
                    apiService.updateCategory(selected.getId(), input);
                }
                return null;
            }
        };

        task.setOnRunning(event -> setLoading(true));
        task.setOnSucceeded(event -> {
            setLoading(false);
            feedbackLabel.setText(selected == null ? "Catégorie créée avec succès." : "Catégorie modifiée avec succès.");
            loadCategories();
            clearForm();
        });
        task.setOnFailed(event -> {
            setLoading(false);
            showTaskError("Enregistrement", task.getException());
        });

        Thread thread = new Thread(task, "category-save-thread");
        thread.setDaemon(true);
        thread.start();
    }

    @FXML
    private void onDelete() {
        Category selected = categoriesTable.getSelectionModel().getSelectedItem();
        if (selected == null) {
            UiAlerts.error("Suppression", "Sélectionne une catégorie à supprimer.");
            return;
        }

        boolean confirmed = UiAlerts.confirm("Suppression", "Supprimer la catégorie #" + selected.getId() + " ?");
        if (!confirmed) {
            return;
        }

        Task<Void> task = new Task<>() {
            @Override
            protected Void call() throws Exception {
                apiService.deleteCategory(selected.getId());
                return null;
            }
        };

        task.setOnRunning(event -> setLoading(true));
        task.setOnSucceeded(event -> {
            setLoading(false);
            feedbackLabel.setText("Catégorie supprimée.");
            loadCategories();
            clearForm();
        });
        task.setOnFailed(event -> {
            setLoading(false);
            showTaskError("Suppression", task.getException());
        });

        Thread thread = new Thread(task, "category-delete-thread");
        thread.setDaemon(true);
        thread.start();
    }

    private void loadCategories() {
        Task<List<Category>> task = new Task<>() {
            @Override
            protected List<Category> call() throws Exception {
                return apiService.getCategories();
            }
        };

        task.setOnRunning(event -> setLoading(true));
        task.setOnSucceeded(event -> {
            setLoading(false);
            categories.setAll(task.getValue());
            feedbackLabel.setText("Catégories chargées: " + categories.size());
        });
        task.setOnFailed(event -> {
            setLoading(false);
            showTaskError("Chargement", task.getException());
        });

        Thread thread = new Thread(task, "category-load-thread");
        thread.setDaemon(true);
        thread.start();
    }

    private void setupTable() {
        colId.setCellValueFactory(data -> data.getValue().idProperty());
        colName.setCellValueFactory(data -> data.getValue().nameProperty());
        colDescription.setCellValueFactory(data -> data.getValue().descriptionProperty());
        colUniversId.setCellValueFactory(data -> data.getValue().universIdProperty());
    }

    private void fillForm(Category category) {
        if (category == null) {
            deleteButton.setDisable(true);
            return;
        }

        nameField.setText(category.getName() == null ? "" : category.getName());
        descriptionField.setText(category.getDescription() == null ? "" : category.getDescription());
        universIdField.setText(category.getUniversId() == null ? "" : String.valueOf(category.getUniversId()));
        universNameField.clear();
        deleteButton.setDisable(false);
    }

    private CategoryInput mapFormToInput() {
        CategoryInput input = new CategoryInput();
        input.setName(trimOrNull(nameField.getText()));
        input.setDescription(trimOrNull(descriptionField.getText()));

        String universIdValue = trimOrNull(universIdField.getText());
        String universNameValue = trimOrNull(universNameField.getText());

        if (universIdValue == null) {
            input.setUniversId(null);
        } else {
            input.setUniversId(Integer.parseInt(universIdValue));
        }

        input.setUniversName(universNameValue == null ? "Tous" : universNameValue);
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

        String universIdValue = trimOrNull(universIdField.getText());
        if (universIdValue != null) {
            try {
                Integer.parseInt(universIdValue);
            } catch (NumberFormatException e) {
                return "Univers ID doit être un entier valide.";
            }
        }
        return null;
    }

    private void clearForm() {
        nameField.clear();
        descriptionField.clear();
        universIdField.clear();
        universNameField.clear();
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
