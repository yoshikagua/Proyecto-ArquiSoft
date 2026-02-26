FROM rustlang/rust:nightly-bookworm as builder
WORKDIR /app
COPY . .
RUN cargo build --release

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/target/release/auth-api /usr/local/bin/auth-api
COPY .env .
EXPOSE 3000
CMD ["auth-api"]
