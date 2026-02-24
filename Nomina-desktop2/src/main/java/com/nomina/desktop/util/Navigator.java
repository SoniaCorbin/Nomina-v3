package com.nomina.desktop.util;

import java.io.IOException;

import com.nomina.desktop.controller.MainController;

import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;

public final class Navigator {
    private static MainController mainController;

    private Navigator() {
    }

    public static void init(MainController controller) {
        mainController = controller;
    }

    public static void showDashboard() {
        loadCenter("/com/nomina/desktop/view/dashboard-view.fxml");
    }

    public static void showLogin() {
        loadCenter("/com/nomina/desktop/view/login-view.fxml");
    }

    public static void showConcepts() {
        loadCenter("/com/nomina/desktop/view/concepts-view.fxml");
    }

    public static void showCategories() {
        loadCenter("/com/nomina/desktop/view/categories-view.fxml");
    }

    public static void showCultures() {
        loadCenter("/com/nomina/desktop/view/cultures-view.fxml");
    }

    public static void showUnivers() {
        loadCenter("/com/nomina/desktop/view/univers-view.fxml");
    }

    private static void loadCenter(String viewPath) {
        if (mainController == null) {
            return;
        }
        try {
            FXMLLoader loader = new FXMLLoader(Navigator.class.getResource(viewPath));
            Parent content = loader.load();
            mainController.setCenter(content);
        } catch (IOException e) {
            UiAlerts.error("Navigation", "Impossible de charger la vue : " + viewPath + "\n" + e.getMessage());
        }
    }
}