CREATE TABLE IF NOT EXISTS emails_enviados (
    id SERIAL PRIMARY KEY,
    email_destino VARCHAR(255) NOT NULL,
    asunto TEXT,
    mensaje TEXT,
    estado VARCHAR(20),
    error TEXT,
    fecha_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_email ON emails_enviados(email_destino);
CREATE INDEX IF NOT EXISTS idx_fecha ON emails_enviados(fecha_envio);