<?php

require_once __DIR__ . '/vendor/autoload.php';

use PhpAmqpLib\Connection\AMQPStreamConnection;
use PhpAmqpLib\Message\AMQPMessage;
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

function env_value($key, $default = null)
{
    $value = getenv($key);

    if ($value === false || $value === '') {
        return $default;
    }

    return $value;
}

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
            $this->sendEmail($email, $asunto, $mensaje);

            // Guardar éxito
            $this->saveLog($email, $asunto, $mensaje, 'success');

            $this->logger->info("Enviado a $email");
            $msg->ack();

        } catch (\Exception $e) {
            $this->logger->error("Error procesando mensaje: " . $e->getMessage());

            // Guardar error
            $this->saveLog($email, $asunto, $mensaje, 'failed', $e->getMessage());

            $msg->ack();
        }
    }

    private function sendEmail($to, $subject, $message)
    {
        $mail = new PHPMailer(true);
        $mail->CharSet = 'UTF-8';

        try {
            $mail->isSMTP();
            $mail->Host = env_value('SMTP_HOST', 'smtp.gmail.com');
            $mail->SMTPAuth = true;
            $mail->Username = env_value('SMTP_USER', 'kuisiscore.notifications@gmail.com');
            $mail->Password = env_value('SMTP_PASSWORD', 'cqgg yzdq aidw dxwq'); // Credencial de app mitigada
            $mail->SMTPSecure = 'tls';
            $mail->Port = (int) env_value('SMTP_PORT', 587);

            $mail->setFrom(env_value('SMTP_USER', 'kuisiscore.notifications@gmail.com'), 'KuisiScore Notifications');
            $mail->addAddress($to);
            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body = $message;

            $mail->send();
            echo "[INFO] Correo enviado exitosamente a {$to}\n";

            return true;
        } catch (Exception $e) {
            echo "[ERROR] Fallo en el envío. PHPMailer Error: {$mail->ErrorInfo}\n";
            throw $e;
        }
    }

    private function saveLog($email, $asunto, $mensaje, $estado, $error = null)
    {
        try {
            $this->logger->info("Guardando log en DB para $email...");
            $stmt = $this->db->prepare("
                INSERT INTO emails_enviados 
                (email_destino, asunto, mensaje, estado, error)
                VALUES (?, ?, ?, ?, ?)
            ");

            $stmt->execute([$email, $asunto, $mensaje, $estado, $error]);
            $this->logger->info("Log guardado con éxito.");

        } catch (\Exception $e) {
            $this->db->error("DB error crítico: " . $e->getMessage());
        }
    }
}

// --- WORKER ---
$logger = new Logger();
$db = getDB();

$connection = new AMQPStreamConnection(
    env_value('RABBITMQ_HOST', Config::RABBITMQ_HOST),
    (int) env_value('RABBITMQ_PORT', Config::RABBITMQ_PORT),
    env_value('RABBITMQ_USER', Config::RABBITMQ_USER),
    env_value('RABBITMQ_PASS', Config::RABBITMQ_PASS)
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