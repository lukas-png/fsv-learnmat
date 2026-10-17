FROM node:22-bullseye-slim AS builder

WORKDIR /app

# The Nx daemon dies at the end of each RUN step but leaves stale state behind,
# which makes the next nx command hang and fail with "NX [object Object]"
ENV NX_DAEMON=false

COPY package*.json ./

RUN --mount=type=cache,target=/root/.npm npm install --legacy-peer-deps

COPY . .

# .nx/cache is a cache mount, persisted between CI runs (see .github/workflows/main.yml)
RUN --mount=type=cache,target=/app/.nx/cache npx nx build api --configuration=production
RUN --mount=type=cache,target=/app/.nx/cache npx nx build learnmat --configuration=production

# Copy config files to dist and create empty production.json
RUN cp -r apps/api/src/configs dist/apps/api/configs && echo '{}' > dist/apps/api/configs/production.json

FROM node:22-bullseye-slim AS production

WORKDIR /app

COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm install --omit=dev --legacy-peer-deps --ignore-scripts

COPY --from=builder /app/dist/apps/api ./dist/apps/api
COPY --from=builder /app/dist/apps/learnmat ./dist/apps/learnmat

# SSL certs are expected at /app/key.pem and /app/cert.pem
# Mount them at runtime: -v /host/key.pem:/app/key.pem -v /host/cert.pem:/app/cert.pem

ENV NODE_ENV=production
ENV NODE_CONFIG_DIR=/app/dist/apps/api/configs

# Required environment variables:
# SECRET_KEY     - JWT signing secret
# UNI_USERNAME   - University SMTP username
# UNI_PASSWORD   - University SMTP password
# UNI_MAIL       - University sender email
# ACC_USERNAME   - AcademicCloud username
# ACC_PASSWORD   - AcademicCloud app password
# ACC_HOST       - AcademicCloud WebDAV URL (default below)
# DOMAIN         - Public domain, e.g. https://learnmat.example.de
# PORT           - HTTP port to listen on (default 80)
# TRUST_PROXY    - Set to true behind a reverse proxy (NetBird), needed for per-IP rate limiting
ENV ACC_HOST=https://sync.academiccloud.de/remote.php/nonshib-webdav

# Direct HTTPS (without a reverse proxy): keep PORT != 443 and mount the certs (see above).
# The app then additionally serves HTTPS on the fixed port 443 (publish it with -p 443:443).
ARG PORT=80
ENV PORT=${PORT}

EXPOSE ${PORT}

CMD ["node", "dist/apps/api/main.js"]
