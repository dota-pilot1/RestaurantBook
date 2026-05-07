package com.cj.restaurantbook;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class RestaurantBookServerApplication {

	public static void main(String[] args) {
		SpringApplication.run(RestaurantBookServerApplication.class, args);
	}

}
