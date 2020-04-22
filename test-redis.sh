#!/bin/sh
if [ ! -d node_modules/puppeteer ] || [ ! -d node_modules/@userdashboard/dashboard ] || [ ! -d node_modules/@userdashboard/storage-redis ]; then
  npm install @userdashboard/dashboard @userdashboard/storage-redis puppeteer@2.1.1 --no-save
fi
PARAMS=""
if [ ! -z "$1" ]; then
  PARAMS="$PARAMS -- --grep $1"
fi
NODE_ENV=testing \
STORAGE_ENGINE="@userdashboard/storage-redis" \
REDIS_URL=redis://localhost:6379 \
SILENT_START=true \
GENERATE_SITEMAP_TXT=false \
GENERATE_API_TXT=false \
DASHBOARD_SERVER="$CONNECT_DASHBOARD_SERVER" \
DOMAIN="$CONNECT_DOMAIN" \
STRIPE_KEY="$CONNECT_STRIPE_KEY" \
STRIPE_PUBLISHABLE_KEY="$CONNECT_STRIPE_PUBLISHABLE_KEY" \
STRIPE_JS="false" \
IP="0.0.0.0" \
npm test $PARAMS
