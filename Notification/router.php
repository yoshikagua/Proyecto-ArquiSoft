<?php
// Router para PHP Development Server
// Redirige todas las solicitudes a producer.php

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// --- VALIDACIÓN DE FIRMA HMAC INTERNA ---
// Definimos las rutas que quedan exentas de la validación (Bypass)
$is_health_check = ($method === 'GET' && ($uri === '/status' || $uri === '/health' || $uri === '/' || $uri === ''));

if (!$is_health_check) {
    // 1. Extraer las cabeceras HTTP enviadas por el API Gateway
    // Nota: PHP convierte las cabeceras "X-Service-*" a "HTTP_X_SERVICE_*" en $_SERVER
    $service_name = $_SERVER['HTTP_X_SERVICE_NAME'] ?? null;
    $timestamp_str = $_SERVER['HTTP_X_SERVICE_TIMESTAMP'] ?? null;
    $signature_hex = $_SERVER['HTTP_X_SERVICE_SIGNATURE'] ?? null;

    if (!$service_name || !$timestamp_str || !$signature_hex) {
        http_response_code(403);
        echo json_encode(['error' => 'Falta firma de canal seguro interno']);
        exit;
    }

    // 2. Control estricto de origen
    $allowed_services = ['api-gateway', 'auth-api'];
    if (!in_array($service_name, $allowed_services)) {
        http_response_code(403);
        echo json_encode(['error' => "Origen de peticion no autorizado: '$service_name'"]);
        exit;
    }

    // 3. Ventana de tiempo (Anti-Replay Attack) de 15 segundos
    $timestamp = (int)$timestamp_str;
    $current_time = time();
    if (abs($current_time - $timestamp) > 15) {
        http_response_code(403);
        echo json_encode(['error' => 'La firma de la peticion ha expirado o desincronizacion de reloj']);
        exit;
    }

    // 4. Verificar firma criptográfica con el secreto compartido
    $secret = getenv('INTERNAL_SERVICE_SECRET') ?: 'super-secret-internal-cluster-key-change-me';
    $message = $service_name . ':' . $timestamp_str;
    
    $expected_signature = hash_hmac('sha256', $message, $secret);

    // 5. Comparación segura en tiempo constante contra ataques de temporización
    if (!hash_equals($expected_signature, $signature_hex)) {
        http_response_code(403);
        echo json_encode(['error' => 'Firma HMAC invalida']);
        exit;
    }
}
// --- FIN DE LA VALIDACIÓN ---

// Flujo normal de enrutamiento del negocio
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
