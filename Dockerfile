FROM node:20-bullseye-slim

# Install Python 3 and build deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-pip python3-venv build-essential curl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Workdir
WORKDIR /app

# Copy backend JS
COPY package.json package-lock.json* ./
RUN npm install --production

# Copy Python app
COPY python_app ./python_app
RUN python3 -m pip install --upgrade pip && \
    python3 -m pip install -r python_app/requirements.txt

# Copy rest of server
COPY src ./src
COPY start.sh ./start.sh
RUN chmod +x ./start.sh

# Render provides PORT, Node will bind to it; Python binds to 5001 locally
ENV PORT=8080
ENV PY_HOST=127.0.0.1
ENV PY_PORT=5001

CMD ["./start.sh"]
