package com.example.demo1.listener;

import com.example.demo1.model.Order;
import com.example.demo1.repository.OrderRepository;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class OrderStatusUpdateListener {

    @Autowired
    private OrderRepository orderRepository;

    @RabbitListener(queues = "orderStatusQueue")
    public void handleOrderStatusUpdate(Order order) {
        orderRepository.save(order);
    }
}