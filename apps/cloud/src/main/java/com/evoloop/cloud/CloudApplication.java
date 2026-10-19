package com.evoloop.cloud;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
public class CloudApplication {
  public static void main(String[] args) {
    SpringApplication.run(CloudApplication.class, args);
  }
}
