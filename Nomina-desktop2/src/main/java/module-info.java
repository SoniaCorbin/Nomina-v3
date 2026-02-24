module com.nomina.desktop {
    requires com.fasterxml.jackson.core;
    requires javafx.controls;
    requires javafx.fxml;
    requires com.fasterxml.jackson.databind;
    requires java.desktop;
    requires java.net.http;

    opens com.nomina.desktop to javafx.fxml;
    opens com.nomina.desktop.controller to javafx.fxml;
    opens com.nomina.desktop.model to com.fasterxml.jackson.databind;

    exports com.nomina.desktop;
}