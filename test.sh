if [ ! -d node_modules/puppeteer ] || [ ! -d node_modules/@userdashboard/dashboard ]; then
  npm install localtunnel puppeteer @userdashboard/dashboard --no-save
fi
NODE_ENV=testing \
SILENT_START=true \
GENERATE_SITEMAP_TXT=false \
GENERATE_API_TXT=false \
DASHBOARD_SERVER="$CONNECT_DASHBOARD_SERVER" \
PORT=$CONNECT_DASHBOARD_SERVER_PORT \
DOMAIN="$CONNECT_DOMAIN" \
STRIPE_KEY="$CONNECT_STRIPE_KEY" \
STRIPE_PUBLISHABLE_KEY="$CONNECT_STRIPE_PUBLISHABLE_KEY" \
STRIPE_JS="false" \
IP="0.0.0.0" \
STORAGE_PATH=/tmp/connect \
npm run test