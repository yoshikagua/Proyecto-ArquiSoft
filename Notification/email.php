<?php

require_once __DIR__ . '/vendor/autoload.php';

use PhpAmqpLib\Connection\AMQPStreamConnection;
use PhpAmqpLib\Message\AMQPMessage;
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// --- CONFIG ---
class Config
{
    const RABBITMQ_HOST = 'rabbitmq';
    const RABBITMQ_PORT = 5672;
    const RABBITMQ_USER = 'guest';
    const RABBITMQ_PASS = 'guest';
    const RABBITMQ_QUEUE = 'notificaciones_email';

    const QUEUE_PREFETCH_COUNT = 1;
    const MAX_RETRIES = 3;

    const SENDGRID_HOST = 'smtp.sendgrid.net';
    const SENDGRID_PORT = 587;

    const FROM_EMAIL = 'jmanuelt09@gmail.com';
    const FROM_NAME = 'Sistema RabbitMQ';
}

// --- DB ---
function getDB()
{
    static $pdo = null;

    if ($pdo === null) {
        $pdo = new PDO(
            "pgsql:host=" . getenv('DB_HOST') . ";port=5432;dbname=" . getenv('DB_NAME'),
            getenv('DB_USER'),
            getenv('DB_PASSWORD'),
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
            ]
        );
    }

    return $pdo;
}

// --- LOGGER ---
class Logger
{
    public function info($msg) { echo "[INFO] $msg\n"; }
    public function error($msg) { echo "[ERROR] $msg\n"; }
}

// --- EMAIL PROCESSOR ---
class EmailProcessor
{
    private $logger;
    private $db;

    public function __construct($logger, $db)
    {
        $this->logger = $logger;
        $this->db = $db;
    }

    public function process(AMQPMessage $msg)
    {
        $datos = json_decode($msg->body, true);

        $email = $datos['email'] ?? null;
        $asunto = $datos['asunto'] ?? 'Sin asunto';
        $mensaje = $datos['mensaje'] ?? 'Sin contenido';

        if (!$email) {
            $this->logger->error("Email vacío");
            $msg->ack();
            return;
        }

        try {
            $this->sendEmail($email, $mensaje, $asunto);

            // Guardar éxito
            $this->saveLog($email, $asunto, $mensaje, 'success');

            $this->logger->info("Enviado a $email");
            $msg->ack();

        } catch (Exception $e) {
            $this->logger->error($e->getMessage());

            // Guardar error
            $this->saveLog($email, $asunto, $mensaje, 'failed', $e->getMessage());

            $msg->ack();
        }
    }

    private function sendEmail($to, $message, $subject)
    {
        $mail = new PHPMailer(true);
        $mail->CharSet = 'UTF-8';

        $mail->isSMTP();
        $mail->Host = Config::SENDGRID_HOST;
        $mail->SMTPAuth = true;
        $mail->Username = 'apikey';
        $mail->Password = getenv('SENDGRID_API_KEY');
        $mail->Port = Config::SENDGRID_PORT;
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;

        $mail->setFrom(Config::FROM_EMAIL, Config::FROM_NAME);
        $mail->addAddress($to);

        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body = "<p>" . htmlspecialchars($message) . "</p>";

        $mail->send();
    }

    private function saveLog($email, $asunto, $mensaje, $estado, $error = null)
    {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO emails_enviados 
                (email_destino, asunto, mensaje, estado, error)
                VALUES (?, ?, ?, ?, ?)
            ");

            $stmt->execute([$email, $asunto, $mensaje, $estado, $error]);

        } catch (Exception $e) {
            $this->logger->error("DB error: " . $e->getMessage());
        }
    }
}

// --- WORKER ---
$logger = new Logger();
$db = getDB();

$connection = new AMQPStreamConnection(
    getenv('RABBITMQ_HOST') ?: 'rabbitmq',
    5672,
    'guest',
    'guest'
);

$channel = $connection->channel();

$channel->queue_declare('notificaciones_email', false, true, false, false);
$channel->basic_qos(null, 1, null);

$processor = new EmailProcessor($logger, $db);

$channel->basic_consume('notificaciones_email', '', false, false, false, false,
    function ($msg) use ($processor) {
        $processor->process($msg);
    }
);

echo "Worker listo...\n";

while ($channel->is_consuming()) {
    $channel->wait();
}