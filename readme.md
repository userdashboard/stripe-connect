# Documentation for Stripe Connect

#### Index

- [Introduction](#introduction)
- [Module contents](#module-contents)
- [Import this module](#import-this-module)
- [Setting up your Stripe credentials](#setting-up-your-stripe-credentials)
- [Storage engine](#storage-engine)
- [Access the API](#access-the-api)
- [Github repository](https://github.com/userdashboard/stripe-connect)
- [NPM package](https://npmjs.org/userdashboard/stripe-connect)

# Introduction

Dashboard bundles everything a web app needs, all the "boilerplate" like signing in and changing passwords, into a parallel server so you can write a much smaller web app.

The Stripe Connect module adds a complete "custom" integration of Stripe's Connect API, allowing your users to provide personal or company information and receive payouts on your platform.  A UI is provided for users to create and manage their registrations, and a basic administrator UI is provided for oversight.  When a user has completed a Stripe account registration and it has been approved by Stripe their status will be changed to `payouts_enabled` and your application can use this property to control access to your platform functionality.

Currently only automatic payouts are supported.  Countries that are "in beta" support by Stripe are not supported and need to be added as they become generally available.  The [Stripe API documentation](https://stripe.com/docs/api) supplements this documentation.

# Module contents 

Dashboard modules can add pages and API routes.  For more details check the `sitemap.txt` and `api.txt` or `env.txt` also contained in the online documentation.

| Content type             |     |
|--------------------------|-----|
| Proxy scripts            |     |
| Server scripts           | Yes |
| Content scripts          |     |
| User pages               | Yes |
| User API routes          | Yes | 
| Administrator pages      | Yes |
| Administrator API routes | Yes | 

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

## Storage engine

By default this module will share whatever storage you use for Dashboard.  You can specify an alternate storage module to use instead, or the same module with a separate database.

    CONNECT_STORAGE=@userdashboard/storage-mongodb
    CONNECT_MONGODB_URL=mongo://localhost:27017/connect

### Access the API

Dashboard and official modules are completely API-driven and you can access the same APIs on behalf of the user making requests.  You perform `GET`, `POST`, `PATCH`, and `DELETE` HTTP requests against the API endpoints to fetch or modify data.  This example fetches the user's Connect accounts using NodeJS, you can do this with any language:

You can view API documentation within the NodeJS modules' `api.txt` files, or on the [documentation site](https://userdashboard.github.io/organizations-api).

    const stripeAccounts = await proxy(`/api/user/connect/stripe-accounts?accountid=${accountid}&all=true`, accountid, sessionid)

    const proxy = util.promisify((path, accountid, sessionid, callback) => {
        const requestOptions = {
            host: 'dashboard.example.com',
            path: path,
            port: '443',
            method: 'GET',
            headers: {
                'x-application-server': 'application.example.com',
                'x-application-server-token': process.env.APPLICATION_SERVER_TOKEN
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
