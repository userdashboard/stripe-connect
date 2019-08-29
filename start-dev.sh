NODE_ENV=development \
DASHBOARD_SERVER="$CONNECT_DASHBOARD_SERVER" \
PORT=$CONNECT_DASHBOARD_SERVER_PORT \
DOMAIN="$CONNECT_DOMAIN" \
STRIPE_KEY="$CONNECT_STRIPE_KEY" \
STRIPE_PUBLISHABLE_KEY="$CONNECT_STRIPE_PUBLISHABLE_KEY" \
CONNECT_ENDPOINT_SECRET="$CONNECT_CONNECT_ENDPOINT_SECRET" \
STRIPE_JS="false" \
IP="0.0.0.0" \
STORAGE_PATH=/tmp/connect \
node main.js

# Connect module startup parameters
# These ENV variables let you tweak certain parts of the Connect module to your preference.

# CONNECT_ENDPOINT_SECRET=whsec_xxxxxxx
# string received from Stripe
# used to verify webhooks received from stripe

# STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxx 
# string received from Stripe
# an API key published inside HTML pages for web browsers to use Stripe

# STRIPE_KEY=sk_test_xxxxx
# string received from Stripe
# an API key used by the web server to use Stripe

