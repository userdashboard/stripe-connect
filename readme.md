# Stripe Connect for Dashboard

This module adds a complete user and administrator `Private API` and `Web UI` for [Stripe Connect](https://stripe.com/connect) 'custom' integration.

# Dashboard

Dashboard is a NodeJS project that provides a user account system and administration tools for web applications.  A traditional web application has a tailor-made user login and management system often grievously lacking in functionality that will be added later, or forfeits very priviliged information to Google and Facebook.  When you use Dashboard you start with a complete UI for your users and administrators to manage the beaurocacy of web apps. 

You can use your preferred language, database and tools to write your application with Dashboard hosted seperately.  Dashboard will proxy your content as the user requests it, and your server can access Dashboard's comprehensive API to retrieve account-related data.

NodeJS developers may embed Dashboard as a module `@userappstore/dashboard` and share the hosting, or host Dashboard seperately too

### Demonstrations

- [Dashboard](https://dashboard-demo-2344.herokuapp.com)
- [Dashboard + Organizations module](https://organizations-demo-7933.herokuapp.com)
- [Dashboard + Stripe Subscriptions module](https://stripe-subscriptions-5701.herokuapp.com)
- [Dashboard + Stripe Connect module](https://stripe-connect-8509.herokuapp.com)

### UserAppStore

If you are building a SaaS with Dashboard consider publishing it on [UserAppStore](https://userappstore.com), an app store for subscriptions.   UserAppStore is powered by Dashboard and open source too.

#### Dashboard documentation
- [Introduction](https://github.com/userappstore/dashboard/wiki)
- [Configuring Dashboard](https://github.com/userappstore/dashboard/wiki/Configuring-Dashboard)
- [Contributing to Dashboard](https://github.com/userappstore/dashboard/wiki/Contributing-to-Dashboard)
- [Dashboard code structure](https://github.com/userappstore/dashboard/wiki/Dashboard-code-structure)
- [Server request lifecycle](https://github.com/userappstore/dashboard/wiki/Server-Request-Lifecycle)

#### License

This is free and unencumbered software released into the public domain.  The MIT License is provided for countries that have not established a public domain.

## Installation 

You must install [NodeJS](https://nodejs.org) 8.12.0+ prior to these steps.

1. Create an account at [Stripe](https://stripe.com/), you will need their API key for the STRIPE_KEY
2. If you require sending credit card numbers to your server enable 'Process payments unsafely' in Integrations, within Business settings, otherwise client-side JavaScript will post directly to Stripe
4. Setup a webhook in your Stripe account to `/api/webhooks/subscriptions/index-stripe-data`, you will need the signing secret for `SUBSCRIPTIONS_ENDPOINT_SECRET`
5. Setup a Connect webhook in your Stripe account to `/api/webhooks/connect/index-payout-data`, you will need the signing secret for `CONNECT_ENDPOINT_SECRET`


    $ mkdir project
    $ cd project
    $ npm init
    $ npm install @userappstore/stripe-connect
    # create a  main.js
    $ STRIPE_KEY=abc \
      SUBSCRIPTIONS_ENDPOINT_SECRET=wxy \
      CONNECT_ENDPOINT_SECRET=xyz \
      node main.js

Your `main.js` should contain:

    const dashboard = require('./index.js')
    dashboard.start(__dirname)

Add this code to require the module in your `package.json`:

    "dashboard": {
      "modules": [
        "@userappstore/stripe-connect"
      ]
    }

Your sitemap will output the server address, by default you can access it at:

    http://localhost:8000

The first account to register will be flagged as the owner and an administrator.

## Access Stripe Connect information in your application

When Dashboard requests something from your application server it passes the user account and session information to you.  You can use that information to access the API and retrieve Connect account information for a user.  This example uses NodeJS but the API is HTTP and can be accessed using any language.

        // your application
        const Proxy = require('./proxy.js)
        const util = require('util')
        const pass = util.promisify(Proxy.pass)
        const stripeAccounts = await pass('GET', `/api/user/connect/stripe-accounts?accountid=${accountid}`, accountid, sessionid)
        const payouts = await pass('GET', `/api/user/connect/payouts?stripeid=_____`, accountid, sessionid)

        // proxy.js file
        const http = require('http')
        const https = require('https')
        const util = require('util')

        module.exports = {
            dashboard: util.promisify(pass)
        }

        function pass (method, path, accountid, sessionid, callback) {
            let baseURL = process.env.DASHBOARD_SERVER.split('://')[1]
            const baseSlash = baseURL.indexOf('/')
            if (baseSlash > -1) {
                baseURL = baseURL.substring(0, baseSlash)
            }
            let port = 80
            const colon = baseURL.indexOf(':')
            if (colon > -1) {
                port = baseURL.substring(colon + 1)
                baseURL = baseURL.substring(0, colon)
            }
            const requestOptions = {
                host: baseURL,
                path: path,
                method: method,
                headers: {
                    'x-application-server-token': process.env.APPLICATION_SERVER_TOKEN,
                    'x-accountid': accountid,
                    'x-sessionid': sessionid,
                    'referer': process.env.APPLICATION_SERVER
                }
            }
            const protocol = process.env.DASHBOARD_SERVER.startsWith('https') ? https : http
            if (protocol === https) {
                requestOptions.port = 443
            } else {
                requestOptions.port = port
            }
            return protocol.request(requestOptions, (proxyResponse) => {
                let body = ''
                proxyResponse.on('data', (chunk) => {
                    body += chunk
                })
                proxyResponse.on('end', () => {
                    return callback(null, JSON.parse(body))
                })
                proxyResponse.on('error', (error) => {
                    return callback(error)
                })
            })
        }
