NODE_ENV=development \
DASHBOARD_SERVER="$CONNECT_DASHBOARD_SERVER" \
PORT=8200 \
DOMAIN="${CONNECT_DOMAIN}" \
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

# Dashboard startup parameters
# These ENV variables let you tweak certain parts of Dashboard to your preference.

# NODE_ENV=development 
# production | development | testing
# when in production strict configuration is required

# APPLICATION_SERVER=http://localhost:3000
# string
# the URL to your application server

# APPLICATION_SERVER_TOKEN="a secret"
# string
# shared secret for signing requests between application/dashboard server

# BCRYPT_WORKLOAD_FACTOR
# integer 4+ in production 10+
# the strength with which to protect passwords

# BCRYPT_FIXED_SALT
# string
# make a fixed-salt like this:
# $ node
# $ const bcrypt = require('./node_modules/bcryptjs')
# $ bcrypt.genSaltSync(BCRYPT_WORKLOAD_FACTOR)

# ENCRYPTION_SECRET
# string
# 32-character secret encryption key for data at rest

# PAGE_SIZE=3 
# number
# the number of rows of data on object list pages

# DASHBOARD_SERVER="http://localhost:8001" 
# URL
# the URL to your dashboard server

# DOMAIN=localhost 
# web domain
# the domain you are using

# IP=0.0.0.0 
# ip default localhost
# start server on a public IP address

# PORT=8001 
# number
# start server on a specific port

# STORAGE_PATH=/tmp/test-data
# storage path if using file system

# ID_LENGTH=6 
# number
# the length of random ids

# ALLOW_PUBLIC_API=false 
# false | true default false
# permits public access to the browser API

# REQUIRE_PROFILE_EMAIL=false 
# false | true default false
# requires email address when registering

# REQUIRE_PROFILE_NAME=false 
# false |true default false
# requires name when registering

# DELETE_DELAY=7 # number
# accounts are flagged for deletion after this many days

# MINIMUM_PASSWORD_LENGTH=10 
# number default 1
# minimum length for passwords 

# MAXIMUM_PASSWORD_LENGTH=100 
# number default 50
# maximum length for passwords

# MINIMUM_USERNAME_LENGTH=10 
# number default 1
# minimum length for usernames

# MAXIMUM_USERNAME_LENGTH=100 
# number default 50
# maximum length for usernames

# MINIMUM_RESET_CODE_LENGTH=1 
# number default 10
# minumum length for account reset codes

# MAXIMUM_RESET_CODE_LENGTH=100 
# number default 50
# maximum length for account reset codes

# MINIMUM_PROFILE_FIRST_NAME_LENGTH=1 
# number default 1
# minumum length for first name

# MAXIMUM_PROFILE_FIRST_NAME_LENGTH=50 
# number default 50
# maximum length for first name

# MINIMUM_PROFILE_LAST_NAME_LENGTH=1 
# number default 1
# minumum length for last name

# MAXIMUM_PROFILE_LAST_NAME_LENGTH=50 
# number default 50
# maximum length for last name