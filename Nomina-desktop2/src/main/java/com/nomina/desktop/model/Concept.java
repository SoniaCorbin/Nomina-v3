package com.nomina.desktop.model;

import javafx.beans.property.SimpleIntegerProperty;
import javafx.beans.property.SimpleStringProperty;
import javafx.beans.property.StringProperty;

public class Concept {
    private int id;
    private String valeur;
    private String type;
    private String mood;
    private String keywords;
    private Integer categorieId;

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getValeur() {
        return valeur;
    }

    public void setValeur(String valeur) {
        this.valeur = valeur;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getMood() {
        return mood;
    }

    public void setMood(String mood) {
        this.mood = mood;
    }

    public String getKeywords() {
        return keywords;
    }

    public void setKeywords(String keywords) {
        this.keywords = keywords;
    }

    public Integer getCategorieId() {
        return categorieId;
    }

    public void setCategorieId(Integer categorieId) {
        this.categorieId = categorieId;
    }

    public SimpleIntegerProperty idProperty() {
        return new SimpleIntegerProperty(id);
    }

    public StringProperty valeurProperty() {
        return new SimpleStringProperty(valeur == null ? "" : valeur);
    }

    public StringProperty typeProperty() {
        return new SimpleStringProperty(type == null ? "" : type);
    }

    public StringProperty moodProperty() {
        return new SimpleStringProperty(mood == null ? "" : mood);
    }

    public StringProperty keywordsProperty() {
        return new SimpleStringProperty(keywords == null ? "" : keywords);
    }

    public StringProperty categorieIdProperty() {
        return new SimpleStringProperty(categorieId == null ? "" : String.valueOf(categorieId));
    }
}