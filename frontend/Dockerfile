# --- Frontend image: Vite dev server (hot-reload) ---
FROM node:22-alpine

WORKDIR /app

# Install dependencies first for better layer caching.
COPY package*.json ./
RUN npm ci

# Copy the source.
COPY . .

# Vite dev server port.
EXPOSE 5173

# --host makes Vite listen on 0.0.0.0 so it's reachable from outside the
# container (not just localhost inside it).
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
