#!/bin/sh
if [ ! -d node_modules/puppeteer ] || [ ! -d node_modules/@userdashboard/dashboard ] || [ ! -d node_modules/@userdashboard/storage-s3 ]; then
  npm install public-ip localtunnel ngrok @userdashboard/dashboard @userdashboard/storage-s3 puppeteer@2.1.1 --no-save
fi
PARAMS=""
if [ ! -z "$1" ]; then
  PARAMS="$PARAMS -- --grep $1"
fi
NODE_ENV=testing \
STORAGE="@userdashboard/storage-s3" \
S3_BUCKET_NAME="$DASHBOARD_S3_BUCKET_NAME" \
SECRET_ACCESS_KEY="$DASHBOARD_SECRET_ACCESS_KEY" \
ACCESS_KEY_ID="$DASHBOARD_ACCESS_KEY_ID" \
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
