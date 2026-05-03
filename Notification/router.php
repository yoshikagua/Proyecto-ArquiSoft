<?php
// Router para PHP Development Server
// Redirige todas las solicitudes a producer.php

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

if ($method === 'POST' && ($uri === '/' || $uri === '')) {
    // Ejecutar producer.php para POST requests a /
    include __DIR__ . '/producer.php';
} elseif ($method === 'GET' && ($uri === '/status' || $uri === '/health')) {
    // Health check endpoint
    $rabbitmq_host = getenv('RABBITMQ_HOST') ?: 'rabbitmq';
    $status = [
        'status' => 'operational',
        'service' => 'Notification Producer',
        'version' => '1.0',
        'rabbitmq_host' => $rabbitmq_host,
        'timestamp' => date('c')
    ];
    http_response_code(200);
    echo json_encode($status);
} elseif ($method === 'GET' && ($uri === '/' || $uri === '')) {
    // Root endpoint - show API info
    http_response_code(200);
    echo json_encode([
        'service' => 'Notification Producer API',
        'version' => '1.0',
        'endpoints' => [
            'POST /' => 'Send email notification (requires: email, asunto, mensaje)',
            'GET /status' => 'Health check endpoint',
            'GET /health' => 'Health check endpoint'
        ]
    ]);
} else {
    // Retornar 404 para rutas no reconocidas
    http_response_code(404);
    echo json_encode(['error' => 'Not Found', 'method' => $method, 'path' => $uri]);
}
