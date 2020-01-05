# Stripe Connect module for Dashboard
![StandardJS](https://github.com/userdashboard/stripe-connect/workflows/standardjs/badge.svg) ![Test suite](https://github.com/userdashboard/stripe-connect/workflows/test-user-ui/badge.svg) ![Test suite](https://github.com/userdashboard/stripe-connect/workflows/test-administrator-ui/badge.svg) ![Test suite](https://github.com/userdashboard/stripe-connect/workflows/test-user-api/badge.svg) ![Test suite](https://github.com/userdashboard/stripe-connect/workflows/test-administrator-api/badge.svg)

Dashboard bundles everything a web app needs, all the "boilerplate" like signing in and changing passwords, into a parallel server so you can write a much smaller web app.

The Stripe Connect module adds a complete "custom" integration of Stripe's Connect API, allowing your users to provide personal or company information and receive payouts on your platform.

A complete UI is provided for users to create and manage their registrations, and a basic administrator UI is provided for oversight but has limited functionality so far.

Your application server can use the Stripe Connect module's API to ensure the user has a valid Connect account with payouts enabled.

Currently only automatic payouts are supported.

## Import this module

Install the module with NPM:

    $ npm install @userdashboard/stripe-connect

Edit your `package.json` to activate the module:

    "dashboard": {
      "modules": [
        "@userdashboard/stripe-connect"
      ]
    }

## Setting up your Stripe credentials

You will need to retrieve various keys from [Stripe](https://stripe.com).  During development your webhook will be created automatically, but in production with multiple dashboard server instances they share a configured webhook:

- create your Stripe account and find your API keys
- create a webhook for https://your_domain/webhooks/connect/index-connect-data 
- environment STRIPE_KEY=sk_test_xxxxxxx
- environment STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxx
- environment CONNECT_WEBHOOK_ENDPOINT_SECRET=whsec_xxxxxxxx

### Request Connect data from your application server

Dashboard and official modules are completely API-driven and you can access the same APIs on behalf of the user making requests.  You perform `GET`, `POST`, `PATCH`, and `DELETE` HTTP requests against the API endpoints to fetch or modify data.  This example uses NodeJS to fetch the user's organizations from the Dashboard server using NodeJS, your application server can be in any language.

You can view API documentation within the NodeJS modules' `api.txt` files, or on the [documentation site](https://userdashboard.github.io/api/stripe-connect).

    const stripeAccounts = await proxy(`/api/user/connect/stripe-accounts?accountid=${accountid}&all=true`, accountid, sessionid)

    const proxy = util.promisify((path, accountid, sessionid, callback) => {
        let hashText
        if (accountid) {
            hashText = `${process.env.APPLICATION_SERVER_TOKEN}/${accountid}/${sessionid}`
        } else {
            hashText = process.env.APPLICATION_SERVER_TOKEN
        }
        const salt = bcrypt.genSaltSync(4)
        const token = bcrypt.hashSync(hashText, salt)
        const requestOptions = {
            'dashboard.example.com',
            path,
            '443',
            'GET',
            headers: {
                'x-application-server': 'application.example.com',
                'x-dashboard-token': token
            }
        }
        if (accountid) {
            requestOptions.headers['x-accountid'] = accountid
            requestOptions.headers['x-sessionid'] = sessionid
        }
        const proxyRequest = require('https').request(requestOptions, (proxyResponse) => {
            let body = ''
            proxyResponse.on('data', (chunk) => {
                body += chunk
            })
            return proxyResponse.on('end', () => {
                return callback(null, JSON.parse(body))
            })
        })
        proxyRequest.on('error', (error) => {
            return callback(error)
        })
        return proxyRequest.end()
      })
    }


