#!/bin/sh
# Backend container entrypoint.
#
# On first start it runs the DB migration + seed, then launches the server.
# A marker file on the shared volume ensures seeding only happens ONCE (so
# restarts don't wipe/duplicate data). Migration is idempotent so it always runs.
set -e

MARKER="/app/uploads/.seeded"

echo "⏳ Waiting for MongoDB..."
# Simple readiness wait: retry the migrate step until Mongo accepts connections.
until node dist/scripts/migrate.js > /dev/null 2>&1; do
  echo "   ...Mongo not ready yet, retrying in 2s"
  sleep 2
done
echo "✅ Migration complete"

if [ ! -f "$MARKER" ]; then
  echo "🌱 First start — seeding demo data..."
  # 1) Base data: demo (7 tasks) + sara (5 tasks).
  node dist/scripts/seed.js
  # 2) Re-run the user-2 seeder (idempotent — recreates sara + her tasks).
  node dist/scripts/seedUser2.js
  # 3) Append 10 To Do tasks to the demo user (demo → 17 tasks, 13 todo).
  node dist/scripts/seedTodos.js
  touch "$MARKER"
  echo "✅ Seed complete (marker written)"
else
  echo "ℹ️  Already seeded — skipping seed."
fi

echo "🚀 Starting API server..."
exec node dist/server.js
