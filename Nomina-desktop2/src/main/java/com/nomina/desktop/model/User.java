package com.nomina.desktop.model;

import javafx.beans.property.SimpleIntegerProperty;
import javafx.beans.property.SimpleStringProperty;
import javafx.beans.property.StringProperty;

public class User {
    private int id;
    private String username;
    private String email;
    private String role;
    private Boolean isActive;

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean active) {
        isActive = active;
    }

    public SimpleIntegerProperty idProperty() {
        return new SimpleIntegerProperty(id);
    }

    public StringProperty usernameProperty() {
        return new SimpleStringProperty(username == null ? "" : username);
    }

    public StringProperty emailProperty() {
        return new SimpleStringProperty(email == null ? "" : email);
    }

    public StringProperty roleProperty() {
        return new SimpleStringProperty(role == null ? "" : role);
    }

    public StringProperty activeProperty() {
        return new SimpleStringProperty(Boolean.TRUE.equals(isActive) ? "Oui" : "Non");
    }
}
