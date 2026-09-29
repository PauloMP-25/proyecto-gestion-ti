package com.hospital.servicedesk;

import javax.crypto.SecretKey;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Encoders;
import io.jsonwebtoken.security.Keys;

@SpringBootApplication
public class ServicedeskApplication {

	public static void main(String[] args) {
		SpringApplication.run(ServicedeskApplication.class, args);
		
		

	}

}
