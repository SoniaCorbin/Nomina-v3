package com.nomina.desktop;

import com.nomina.desktop.util.Navigator;
import javafx.application.Application;
import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.stage.Stage;

public class MainApp extends Application {

    @Override
    public void start(Stage stage) throws Exception {
        FXMLLoader loader = new FXMLLoader(MainApp.class.getResource("/com/nomina/desktop/view/main-view.fxml"));
        Parent root = loader.load();

        Scene scene = new Scene(root, 1180, 760);
        scene.getStylesheets().add(MainApp.class.getResource("/com/nomina/desktop/css/style.css").toExternalForm());

        stage.setTitle("Nomina Desktop");
        stage.setMinWidth(980);
        stage.setMinHeight(640);
        stage.setScene(scene);
        stage.show();

        Navigator.showDashboard();
    }

    public static void main(String[] args) {
        launch(args);
    }
}