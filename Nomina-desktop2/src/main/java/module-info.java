module com.nomina.desktop {
    requires javafx.controls;
    requires javafx.fxml;
    requires java.net.http;
    requires java.desktop;
    requires com.fasterxml.jackson.databind;

    opens com.nomina.desktop to javafx.fxml;
    opens com.nomina.desktop.controller to javafx.fxml;
    opens com.nomina.desktop.model to com.fasterxml.jackson.databind;

    exports com.nomina.desktop;
}