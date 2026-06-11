<?php

require_once __DIR__ . '/vendor/autoload.php';

use PhpAmqpLib\Connection\AMQPStreamConnection;
use PhpAmqpLib\Message\AMQPMessage;
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

<<<<<<< HEAD
function env_value($key, $default = null)
{
    $value = getenv($key);

    if ($value === false || $value === '') {
        return $default;
    }

    return $value;
}

=======
>>>>>>> origin/interoperabilidad
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
<<<<<<< HEAD
=======

    const SENDGRID_HOST = 'smtp.sendgrid.net';
    const SENDGRID_PORT = 587;

    const FROM_EMAIL = 'jmanuelt09@gmail.com';
    const FROM_NAME = 'Sistema RabbitMQ';
>>>>>>> origin/interoperabilidad
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
<<<<<<< HEAD
            $this->sendEmail($email, $asunto, $mensaje);
=======
            $this->sendEmail($email, $mensaje, $asunto);
>>>>>>> origin/interoperabilidad

            // Guardar éxito
            $this->saveLog($email, $asunto, $mensaje, 'success');

<<<<<<< HEAD
=======
            $this->logger->info("Enviado a $email");
>>>>>>> origin/interoperabilidad
            $msg->ack();

        } catch (\Exception $e) {
            $this->logger->error("Error procesando mensaje: " . $e->getMessage());

            // Guardar error
            $this->saveLog($email, $asunto, $mensaje, 'failed', $e->getMessage());

            $msg->ack();
        }
    }

<<<<<<< HEAD
    private function sendEmail($to, $subject, $message)
=======
    private function sendEmail($to, $message, $subject)
>>>>>>> origin/interoperabilidad
    {
        $mail = new PHPMailer(true);
        $mail->CharSet = 'UTF-8';

<<<<<<< HEAD
        try {
            $mail->isSMTP();
            $mail->Host = env_value('SMTP_HOST', 'smtp.gmail.com');
            $mail->SMTPAuth = true;
            $mail->Username = env_value('SMTP_USER', 'kuisiscore.notifications@gmail.com');
            $mail->Password = env_value('SMTP_PASSWORD', 'cqgg yzdq aidw dxwq');
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
=======
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
>>>>>>> origin/interoperabilidad
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
            $this->logger->error("DB error crítico: " . $e->getMessage());
        }
    }
}

// --- WORKER ---
$logger = new Logger();
$db = getDB();

$connection = new AMQPStreamConnection(
<<<<<<< HEAD
    env_value('RABBITMQ_HOST', Config::RABBITMQ_HOST),
    (int) env_value('RABBITMQ_PORT', Config::RABBITMQ_PORT),
    env_value('RABBITMQ_USER', Config::RABBITMQ_USER),
    env_value('RABBITMQ_PASS', Config::RABBITMQ_PASS)
=======
    getenv('RABBITMQ_HOST') ?: 'rabbitmq',
    5672,
    'guest',
    'guest'
>>>>>>> origin/interoperabilidad
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
<<<<<<< HEAD
}
=======
}
>>>>>>> origin/interoperabilidad
