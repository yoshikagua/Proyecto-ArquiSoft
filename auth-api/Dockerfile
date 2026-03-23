
FROM rustlang/rust:nightly-bookworm as builder
WORKDIR /app
COPY . .
RUN cargo build --release



FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y ca-certificates libpq-dev curl build-essential pkg-config libssl-dev && rm -rf /var/lib/apt/lists/*
# Instalar rustup y cargo moderno
RUN curl https://sh.rustup.rs -sSf | sh -s -- -y --default-toolchain stable
ENV PATH="/root/.cargo/bin:${PATH}"
# Instalar sqlx-cli con cargo moderno
RUN cargo install sqlx-cli --version 0.7.4 --no-default-features --features native-tls,postgres

COPY --from=builder /app/target/release/auth-api /usr/local/bin/auth-api
COPY --from=builder /app/migrations /app/migrations
COPY .env .
EXPOSE 3000

# Entrypoint: ejecutar migraciones y luego iniciar el binario
CMD sqlx migrate run --source /app/migrations && auth-api
