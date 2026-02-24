package com.nomina.desktop.controller;

import com.nomina.desktop.model.Concept;
import com.nomina.desktop.model.ConceptInput;
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

public class ConceptsController {
    @FXML
    private TableView<Concept> conceptsTable;

    @FXML
    private TableColumn<Concept, Number> colId;

    @FXML
    private TableColumn<Concept, String> colValeur;

    @FXML
    private TableColumn<Concept, String> colType;

    @FXML
    private TableColumn<Concept, String> colMood;

    @FXML
    private TableColumn<Concept, String> colKeywords;

    @FXML
    private TableColumn<Concept, String> colCategorie;

    @FXML
    private TextField valeurField;

    @FXML
    private TextField typeField;

    @FXML
    private TextField moodField;

    @FXML
    private TextField keywordsField;

    @FXML
    private TextField categorieIdField;

    @FXML
    private Label feedbackLabel;

    @FXML
    private ProgressIndicator loadingIndicator;

    @FXML
    private Button saveButton;

    @FXML
    private Button deleteButton;

    private final ApiService apiService = new ApiService();
    private final ObservableList<Concept> concepts = FXCollections.observableArrayList();

    @FXML
    public void initialize() {
        setupTable();
        setLoading(false);
        conceptsTable.setItems(concepts);
        conceptsTable.getSelectionModel().selectedItemProperty().addListener((obs, oldValue, selected) -> fillForm(selected));
        loadConcepts();
    }

    @FXML
    private void onRefresh() {
        loadConcepts();
    }

    @FXML
    private void onNew() {
        conceptsTable.getSelectionModel().clearSelection();
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

        ConceptInput input = mapFormToInput();
        Concept selected = conceptsTable.getSelectionModel().getSelectedItem();

        Task<Void> task = new Task<>() {
            @Override
            protected Void call() throws Exception {
                if (selected == null) {
                    apiService.createConcept(input);
                } else {
                    apiService.updateConcept(selected.getId(), input);
                }
                return null;
            }
        };

        task.setOnRunning(event -> setLoading(true));
        task.setOnSucceeded(event -> {
            setLoading(false);
            feedbackLabel.setText(selected == null ? "Concept créé avec succès." : "Concept modifié avec succès.");
            loadConcepts();
            clearForm();
        });
        task.setOnFailed(event -> {
            setLoading(false);
            showTaskError("Enregistrement", task.getException());
        });

        Thread thread = new Thread(task, "concept-save-thread");
        thread.setDaemon(true);
        thread.start();
    }

    @FXML
    private void onDelete() {
        Concept selected = conceptsTable.getSelectionModel().getSelectedItem();
        if (selected == null) {
            UiAlerts.error("Suppression", "Sélectionne un concept à supprimer.");
            return;
        }

        boolean confirmed = UiAlerts.confirm("Suppression", "Supprimer le concept #" + selected.getId() + " ?");
        if (!confirmed) {
            return;
        }

        Task<Void> task = new Task<>() {
            @Override
            protected Void call() throws Exception {
                apiService.deleteConcept(selected.getId());
                return null;
            }
        };

        task.setOnRunning(event -> setLoading(true));
        task.setOnSucceeded(event -> {
            setLoading(false);
            feedbackLabel.setText("Concept supprimé.");
            loadConcepts();
            clearForm();
        });
        task.setOnFailed(event -> {
            setLoading(false);
            showTaskError("Suppression", task.getException());
        });

        Thread thread = new Thread(task, "concept-delete-thread");
        thread.setDaemon(true);
        thread.start();
    }

    private void loadConcepts() {
        Task<List<Concept>> task = new Task<>() {
            @Override
            protected List<Concept> call() throws Exception {
                return apiService.getConcepts();
            }
        };

        task.setOnRunning(event -> setLoading(true));
        task.setOnSucceeded(event -> {
            setLoading(false);
            concepts.setAll(task.getValue());
            feedbackLabel.setText("Concepts chargés: " + concepts.size());
        });
        task.setOnFailed(event -> {
            setLoading(false);
            showTaskError("Chargement", task.getException());
        });

        Thread thread = new Thread(task, "concept-load-thread");
        thread.setDaemon(true);
        thread.start();
    }

    private void setupTable() {
        colId.setCellValueFactory(data -> data.getValue().idProperty());
        colValeur.setCellValueFactory(data -> data.getValue().valeurProperty());
        colType.setCellValueFactory(data -> data.getValue().typeProperty());
        colMood.setCellValueFactory(data -> data.getValue().moodProperty());
        colKeywords.setCellValueFactory(data -> data.getValue().keywordsProperty());
        colCategorie.setCellValueFactory(data -> data.getValue().categorieIdProperty());
    }

    private void fillForm(Concept concept) {
        if (concept == null) {
            deleteButton.setDisable(true);
            return;
        }

        valeurField.setText(concept.getValeur() == null ? "" : concept.getValeur());
        typeField.setText(concept.getType() == null ? "" : concept.getType());
        moodField.setText(concept.getMood() == null ? "" : concept.getMood());
        keywordsField.setText(concept.getKeywords() == null ? "" : concept.getKeywords());
        categorieIdField.setText(concept.getCategorieId() == null ? "" : String.valueOf(concept.getCategorieId()));
        deleteButton.setDisable(false);
    }

    private ConceptInput mapFormToInput() {
        ConceptInput input = new ConceptInput();
        input.setValeur(trimOrNull(valeurField.getText()));
        input.setType(trimOrNull(typeField.getText()));
        input.setMood(trimOrNull(moodField.getText()));
        input.setKeywords(trimOrNull(keywordsField.getText()));

        String catValue = trimOrNull(categorieIdField.getText());
        if (catValue == null) {
            input.setCategorieId(null);
        } else {
            input.setCategorieId(Integer.parseInt(catValue));
        }
        return input;
    }

    private String validateForm() {
        String valeur = trimOrNull(valeurField.getText());
        if (valeur == null) {
            return "Le champ 'Valeur' est obligatoire.";
        }
        if (valeur.length() < 2) {
            return "Le champ 'Valeur' doit contenir au moins 2 caractères.";
        }

        String catValue = trimOrNull(categorieIdField.getText());
        if (catValue != null) {
            try {
                Integer.parseInt(catValue);
            } catch (NumberFormatException e) {
                return "Categorie ID doit être un entier valide.";
            }
        }
        return null;
    }

    private void clearForm() {
        valeurField.clear();
        typeField.clear();
        moodField.clear();
        keywordsField.clear();
        categorieIdField.clear();
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