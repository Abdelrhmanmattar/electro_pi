# --- Backend image: Node + TypeScript API ---
FROM node:22-alpine

WORKDIR /app

# Install dependencies first (better layer caching — only re-runs when
# package files change, not on every source edit).
COPY package*.json ./
RUN npm ci

# Copy the rest of the source.
COPY . .

# Compile TypeScript to dist/.
RUN npm run build

# The API port (matches PORT env / compose mapping).
EXPOSE 5000

# The compose file overrides this with an entrypoint that migrates + seeds
# first; by default just run the compiled server.
CMD ["node", "dist/server.js"]
