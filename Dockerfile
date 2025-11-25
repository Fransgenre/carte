# backend
FROM rust:1.90-alpine3.22 AS backend-builder
RUN apk add --no-cache build-base;
WORKDIR /app/backend
COPY backend .
RUN cargo build --release;

# frontend
FROM node:24-alpine3.22 AS frontend-builder
WORKDIR /app/frontend
COPY frontend .
RUN npm ci && npm run build;

# backend + frontend
FROM alpine:3.22 AS safehaven
WORKDIR /app
COPY --from=backend-builder /app/backend/target/release/safehaven .
COPY --from=frontend-builder /app/frontend/.output/public static
ENV SH__SERVE_PUBLIC_PATH=/app/static
EXPOSE 28669
CMD ["/app/safehaven", "serve"]
