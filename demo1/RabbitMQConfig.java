package com.example.demo1.config;

import org.springframework.amqp.core.Queue;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    @Bean
    public Queue orderStatusQueue() {
        return new Queue("orderStatusQueue", true); // True para durável
    }
}