<?php
// Router para PHP Development Server
// Redirige todas las solicitudes a producer.php

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $_SERVER['REQUEST_URI'] === '/') {
    // Ejecutar producer.php para POST requests a /
    include __DIR__ . '/producer.php';
} else {
    // Retornar 404 para cualquier otra solicitud
    http_response_code(404);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Not Found']);
}
