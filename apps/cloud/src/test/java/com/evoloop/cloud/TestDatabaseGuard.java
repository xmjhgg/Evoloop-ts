package com.evoloop.cloud;

import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import java.sql.DriverManager;

/** Runs before context refresh and before Flyway can modify any database. */
public class TestDatabaseGuard implements ApplicationContextInitializer<ConfigurableApplicationContext> {
  @Override public void initialize(ConfigurableApplicationContext context) {
    String url = System.getenv().getOrDefault("EVOLOOP_CLOUD_DB_URL", "");
    if (!url.matches("jdbc:mysql://[^/]+/evoloop_two_test(?:\\?.*)?")) throw new IllegalStateException("Isolated evoloop_two_test MySQL database required");
    try (var connection = DriverManager.getConnection(url, System.getenv("EVOLOOP_CLOUD_DB_USER"), System.getenv().getOrDefault("EVOLOOP_CLOUD_DB_PASSWORD", ""));
         var statement = connection.createStatement(); var result = statement.executeQuery("SELECT DATABASE()")) {
      if (!result.next() || !result.getString(1).equals("evoloop_two_test")) throw new IllegalStateException("Wrong database identity");
    } catch (Exception error) { throw new IllegalStateException("Real isolated MySQL is required before migration", error); }
  }
}
