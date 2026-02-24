package com.nomina.desktop.model;

import javafx.beans.property.SimpleIntegerProperty;
import javafx.beans.property.SimpleStringProperty;
import javafx.beans.property.StringProperty;

public class UniversThematique {
    private int id;
    private String name;
    private String description;
    private String imageUrl;

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public SimpleIntegerProperty idProperty() {
        return new SimpleIntegerProperty(id);
    }

    public StringProperty nameProperty() {
        return new SimpleStringProperty(name == null ? "" : name);
    }

    public StringProperty descriptionProperty() {
        return new SimpleStringProperty(description == null ? "" : description);
    }

    public StringProperty imageUrlProperty() {
        return new SimpleStringProperty(imageUrl == null ? "" : imageUrl);
    }
}
