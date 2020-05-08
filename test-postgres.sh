#!/bin/sh
if [ ! -d node_modules/puppeteer ] || [ ! -d node_modules/@userdashboard/dashboard ] || [ ! -d node_modules/@userdashboard/storage-postgresql ]; then
  npm install public-ip localtunnel ngrok @userdashboard/dashboard @userdashboard/storage-postgresql puppeteer@2.1.1 --no-save
fi
PARAMS=""
if [ ! -z "$1" ]; then
  PARAMS="$PARAMS -- --grep $1"
fi

NODE_ENV=testing \
STORAGE="@userdashboard/storage-postgresql" \
DATABASE_URL=postgres://postgres:docker@localhost:5432/postgres \
SILENT_START=true \
GENERATE_SITEMAP_TXT=false \
GENERATE_API_TXT=false \
DASHBOARD_SERVER="http://localhost" \
DOMAIN="localhost" \
STRIPE_KEY="$CONNECT_STRIPE_KEY" \
STRIPE_PUBLISHABLE_KEY="$CONNECT_STRIPE_PUBLISHABLE_KEY" \
STRIPE_JS="false" \
IP="0.0.0.0" \
npm test $PARAMS
