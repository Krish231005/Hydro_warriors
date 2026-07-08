# Use a slim, official Debian-based Node.js LTS image
FROM node:20-bookworm-slim

# Install Python 3, pip, and essential virtual env tools
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Set working directory for the application
WORKDIR /app

# Copy dependency manifests first to leverage Docker layer caching
COPY package*.json ./
COPY requirements.txt ./

# Install Node.js frontend/server dependencies
RUN npm ci

# Set up a Python Virtual Environment to keep dependencies isolated and clean
ENV VIRTUAL_ENV=/opt/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Install Python ML and Flask dependencies inside the virtual env
RUN pip install --no-cache-dir -r requirements.txt

# Copy all application files
COPY . .

# Build the Vite frontend static files and bundle server.ts with esbuild
RUN npm run build

# Expose port 3000 (standard ingress port for web apps)
EXPOSE 3000

# Set production environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Start the Node.js/Express server (which automatically spawns the Python Flask subprocess)
CMD ["npm", "start"]
