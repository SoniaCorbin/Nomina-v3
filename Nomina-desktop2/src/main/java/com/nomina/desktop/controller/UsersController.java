package com.nomina.desktop.controller;

import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

import com.nomina.desktop.model.User;
import com.nomina.desktop.model.UserInput;
import com.nomina.desktop.service.ApiException;
import com.nomina.desktop.service.ApiService;
import com.nomina.desktop.util.UiAlerts;

import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.concurrent.Task;
import javafx.fxml.FXML;
import javafx.scene.control.Button;
import javafx.scene.control.ComboBox;
import javafx.scene.control.Label;
import javafx.scene.control.ProgressIndicator;
import javafx.scene.control.TableColumn;
import javafx.scene.control.TableView;
import javafx.scene.control.TextField;

public class UsersController {
    @FXML
    private TableView<User> tableUsers;

    @FXML
    private TableColumn<User, Number> colId;

    @FXML
    private TableColumn<User, String> colUsername;

    @FXML
    private TableColumn<User, String> colEmail;

    @FXML
    private TableColumn<User, String> colRole;

    @FXML
    private TableColumn<User, String> colStatut;

    @FXML
    private TextField txtSearch;

    @FXML
    private ComboBox<String> cbRoleFilter;

    @FXML
    private ComboBox<String> cbStatutFilter;

    @FXML
    private TextField txtUsername;

    @FXML
    private TextField txtEmail;

    @FXML
    private TextField txtPassword;

    @FXML
    private ComboBox<String> cbRole;

    @FXML
    private ComboBox<String> cbStatut;

    @FXML
    private Button saveButton;

    @FXML
    private Button deleteButton;

    @FXML
    private ProgressIndicator loadingIndicator;

    @FXML
    private Label feedbackLabel;

    private final ApiService apiService = new ApiService();
    private final ObservableList<User> allUsers = FXCollections.observableArrayList();
    private final ObservableList<User> visibleUsers = FXCollections.observableArrayList();

    @FXML
    public void initialize() {
        setupTable();

        cbRoleFilter.getItems().setAll("ADMIN", "RH", "USER");
        cbStatutFilter.getItems().setAll("ACTIF", "INACTIF", "BLOQUÉ");

        cbRoleFilter.setValue(null);
        cbStatutFilter.setValue(null);

        cbRole.getItems().setAll("ADMIN", "RH", "USER");
        cbStatut.getItems().setAll("ACTIF", "INACTIF", "BLOQUÉ");
        cbRole.setValue("USER");
        cbStatut.setValue("ACTIF");

        tableUsers.setItems(visibleUsers);
        tableUsers.getSelectionModel().selectedItemProperty().addListener((obs, oldValue, selected) -> fillForm(selected));
        setLoading(false);
        loadUsers();
    }

    @FXML
    private void onRefresh() {
        loadUsers();
    }

    @FXML
    private void onSearch() {
        applyFilters();
    }

    @FXML
    private void onClearFilters() {
        txtSearch.clear();
        cbRoleFilter.setValue(null);
        cbStatutFilter.setValue(null);
        applyFilters();
    }

    @FXML
    private void onNew() {
        tableUsers.getSelectionModel().clearSelection();
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

        User selected = tableUsers.getSelectionModel().getSelectedItem();
        UserInput input = mapFormToInput(selected == null);

        Task<Void> task = new Task<>() {
            @Override
            protected Void call() throws Exception {
                if (selected == null) {
                    apiService.createUser(input);
                } else {
                    apiService.updateUser(selected.getId(), input);
                }
                return null;
            }
        };

        task.setOnRunning(event -> setLoading(true));
        task.setOnSucceeded(event -> {
            setLoading(false);
            feedbackLabel.setText(selected == null ? "Utilisateur créé." : "Utilisateur modifié.");
            loadUsers();
            clearForm();
        });
        task.setOnFailed(event -> {
            setLoading(false);
            showTaskError("Enregistrement", task.getException());
        });

        Thread thread = new Thread(task, "users-save-thread");
        thread.setDaemon(true);
        thread.start();
    }

    @FXML
    private void onDelete() {
        User selected = tableUsers.getSelectionModel().getSelectedItem();
        if (selected == null) {
            UiAlerts.error("Suppression", "Sélectionne un utilisateur à supprimer.");
            return;
        }

        boolean confirmed = UiAlerts.confirm("Suppression", "Supprimer l'utilisateur #" + selected.getId() + " ?");
        if (!confirmed) {
            return;
        }

        Task<Void> task = new Task<>() {
            @Override
            protected Void call() throws Exception {
                apiService.deleteUser(selected.getId());
                return null;
            }
        };

        task.setOnRunning(event -> setLoading(true));
        task.setOnSucceeded(event -> {
            setLoading(false);
            feedbackLabel.setText("Utilisateur supprimé.");
            loadUsers();
            clearForm();
        });
        task.setOnFailed(event -> {
            setLoading(false);
            showTaskError("Suppression", task.getException());
        });

        Thread thread = new Thread(task, "users-delete-thread");
        thread.setDaemon(true);
        thread.start();
    }

    private void setupTable() {
        colId.setCellValueFactory(data -> data.getValue().idProperty());
        colUsername.setCellValueFactory(data -> data.getValue().usernameProperty());
        colEmail.setCellValueFactory(data -> data.getValue().emailProperty());
        colRole.setCellValueFactory(data -> data.getValue().roleProperty());
        colStatut.setCellValueFactory(data -> data.getValue().activeProperty());
    }

    private void loadUsers() {
        Task<List<User>> task = new Task<>() {
            @Override
            protected List<User> call() throws Exception {
                return apiService.getUsers();
            }
        };

        task.setOnRunning(event -> setLoading(true));
        task.setOnSucceeded(event -> {
            setLoading(false);
            allUsers.setAll(task.getValue());
            applyFilters();
            feedbackLabel.setText("Utilisateurs chargés: " + allUsers.size());
        });
        task.setOnFailed(event -> {
            setLoading(false);
            showTaskError("Chargement", task.getException());
        });

        Thread thread = new Thread(task, "users-load-thread");
        thread.setDaemon(true);
        thread.start();
    }

    private void applyFilters() {
        String search = trimOrNull(txtSearch.getText());
        String roleFilter = cbRoleFilter.getValue();
        String statutFilter = cbStatutFilter.getValue();

        List<User> filtered = allUsers.stream()
                .filter(user -> matchesSearch(user, search))
                .filter(user -> matchesRole(user, roleFilter))
                .filter(user -> matchesStatus(user, statutFilter))
                .collect(Collectors.toList());

        visibleUsers.setAll(filtered);
    }

    private boolean matchesSearch(User user, String search) {
        if (search == null) {
            return true;
        }
        String needle = search.toLowerCase(Locale.ROOT);
        return safe(user.getUsername()).toLowerCase(Locale.ROOT).contains(needle)
                || safe(user.getEmail()).toLowerCase(Locale.ROOT).contains(needle)
                || String.valueOf(user.getId()).contains(needle);
    }

    private boolean matchesRole(User user, String roleFilter) {
        if (roleFilter == null) {
            return true;
        }
        return roleFilter.equals(toUiRole(user.getRole()));
    }

    private boolean matchesStatus(User user, String statutFilter) {
        if (statutFilter == null) {
            return true;
        }
        String status = Boolean.TRUE.equals(user.getIsActive()) ? "ACTIF" : "INACTIF";
        return statutFilter.equals(status) || ("BLOQUÉ".equals(statutFilter) && !Boolean.TRUE.equals(user.getIsActive()));
    }

    private void fillForm(User user) {
        if (user == null) {
            deleteButton.setDisable(true);
            return;
        }

        txtUsername.setText(safe(user.getUsername()));
        txtEmail.setText(safe(user.getEmail()));
        txtPassword.clear();
        cbRole.setValue(toUiRole(user.getRole()));
        cbStatut.setValue(Boolean.TRUE.equals(user.getIsActive()) ? "ACTIF" : "INACTIF");
        deleteButton.setDisable(false);
    }

    private UserInput mapFormToInput(boolean isCreate) {
        UserInput input = new UserInput();
        input.setUsername(trimOrNull(txtUsername.getText()));
        input.setEmail(trimOrNull(txtEmail.getText()));
        input.setRole(toApiRole(cbRole.getValue()));

        String password = trimOrNull(txtPassword.getText());
        if (isCreate || password != null) {
            input.setPassword(password);
        }

        String statut = cbStatut.getValue();
        input.setIsActive(!"INACTIF".equals(statut) && !"BLOQUÉ".equals(statut));
        return input;
    }

    private String validateForm() {
        String username = trimOrNull(txtUsername.getText());
        String email = trimOrNull(txtEmail.getText());
        String role = cbRole.getValue();
        User selected = tableUsers.getSelectionModel().getSelectedItem();

        if (username == null || username.length() < 3) {
            return "Nom d'utilisateur requis (min 3 caractères).";
        }
        if (email == null || !email.contains("@")) {
            return "Courriel invalide.";
        }
        if (role == null) {
            return "Rôle requis.";
        }

        String password = trimOrNull(txtPassword.getText());
        if (selected == null && (password == null || password.length() < 6)) {
            return "Mot de passe requis à la création (min 6 caractères).";
        }
        if (selected != null && password != null && password.length() < 6) {
            return "Mot de passe invalide (min 6 caractères).";
        }
        return null;
    }

    private void clearForm() {
        txtUsername.clear();
        txtEmail.clear();
        txtPassword.clear();
        cbRole.setValue("USER");
        cbStatut.setValue("ACTIF");
        deleteButton.setDisable(true);
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
        String message = ex == null || ex.getMessage() == null ? "Erreur inconnue" : ex.getMessage();
        UiAlerts.error(operation, message);
    }

    private String trimOrNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isBlank() ? null : trimmed;
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }

    private String toUiRole(String apiRole) {
        if (apiRole == null) return "USER";
        return switch (apiRole) {
            case "Admin", "ADMIN" -> "ADMIN";
            case "Editor", "RH" -> "RH";
            default -> "USER";
        };
    }

    private String toApiRole(String uiRole) {
        if (uiRole == null) return "Viewer";
        return switch (uiRole) {
            case "ADMIN" -> "Admin";
            case "RH" -> "Editor";
            default -> "Viewer";
        };
    }
}
