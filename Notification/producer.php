<?php
require_once __DIR__ . '/vendor/autoload.php';

use PhpAmqpLib\Connection\AMQPStreamConnection;
use PhpAmqpLib\Message\AMQPMessage;

function env_value($key, $default = null)
{
    $value = getenv($key);

    if ($value === false || $value === '') {
        return $default;
    }

    return $value;
}

// Permitir JSON
header('Content-Type: application/json');

// Leer input JSON
$input = json_decode(file_get_contents("php://input"), true);

$email   = $input['email']   ?? null;
$asunto  = $input['asunto']  ?? 'Sin asunto';
$mensaje = $input['mensaje'] ?? 'Sin contenido';

// Validación básica
if (!$email) {
    http_response_code(400);
    echo json_encode([
        "error" => "El campo 'email' es obligatorio"
    ]);
    exit;
}

// Validar formato de email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode([
        "error" => "El formato del email es inválido"
    ]);
    exit;
}

try {
    // Conexión a RabbitMQ dinámica para la nube
    $connection = new AMQPStreamConnection(
        env_value('RABBITMQ_HOST', 'rabbitmq'),
        (int) env_value('RABBITMQ_PORT', 5672),
        env_value('RABBITMQ_USER', 'guest'),
        env_value('RABBITMQ_PASS', 'guest')
    );
    $channel = $connection->channel();

    // queue_declare($queue, $passive, $durable, $exclusive, $auto_delete)
    // durable=true para que coincida con el worker
    $channel->queue_declare('notificaciones_email', false, true, false, false);

    // Crear mensaje
    $data = [
        "email"   => $email,
        "asunto"  => $asunto,
        "mensaje" => $mensaje,
        "timestamp" => time()
    ];

    $msg = new AMQPMessage(json_encode($data), [
        'delivery_mode' => AMQPMessage::DELIVERY_MODE_PERSISTENT // 2 = persistente
    ]);

    // Enviar mensaje
    $channel->basic_publish($msg, '', 'notificaciones_email');

    $channel->close();
    $connection->close();

    echo json_encode([
        "status" => "ok",
        "message" => "Mensaje enviado a la cola correctamente",
        "data" => [
            "email" => $email,
            "asunto" => $asunto
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "error" => "Error al enviar a RabbitMQ",
        "detalle" => $e->getMessage()
    ]);
}