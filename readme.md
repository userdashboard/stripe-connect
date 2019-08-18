# Stripe Connect for Dashboard

[Dashboard](https://github.com/userdashboard/dashboard) is a NodeJS project that provides a reusable account management system for web applications.  This module adds a complete user and administrator `Private API` and `Web UI` for a [Stripe Connect](https://stripe.com/connect) custom integration.

## Import this module

Edit your `package.json` to activate the module:

    "dashboard": {
      "modules": [
        "@userdashboard/stripe-connect
      ]
    }

Install the module with NPM:

    $ npm install @userdashboard/stripe-connect

## Setting up your Stripe credentials

You will need to retrieve various keys from [Stripe](https://stripe.com).

- create your Stripe account 
- find your API credentials
- create a webhook for https://your_domain/webhooks/connect/index-connect-data 
- receive events for capability.updated and payout.created
- note the webhook signing secret `whsec_`

## Startup configuration variables

Check `start-dev.sh` to see the rest of the `env` variables that configure Dashboard:

    $ STRIPE_KEY=sk_test_xxxxx \
      STRIPE_PUBLISHABLE_KEY=pk_test_xxxx \
      CONNECT_ENDPOINT_SECRET=whsec_xxxxxx \
      node main.js

# Dashboard

Dashboard proxies your application server to create a single website where pages like signing in or changing your password are provided by Dashboard.  Your application server can be anything you want, and use Dashboard's API to access data as required.  Using modules you can expand Dashboard to include organizations, subscriptions powered by Stripe, or a Stripe Connect platform.

- [Developer documentation home](https://userdashboard.github.io/developers/)
- [Administrator documentation home](https://userdashboard.github.io/administrators/)
- [User documentation home](https://userdashboard.github.io/users/)

### Case studies 

`Hastebin` is an open source pastebin web application.  It started as a service for anonymous guests only, and was transformed with Dashboard and modules into a web application for registered users, with support for sharing posts with organizations and paid subscriptions.

- [Hastebin - free web application](https://userdashboard.github.io/integrations/hastebin-free-saas.html)
- [Hastebin - subscription web application](https://userdashboard.github.io/integrations/hastebin-saas-subscription.html)

## Screenshots of Dashboard

The user and administration documentation contain screenshots demonstrating Dashboard and its modules in use. 

| ![Guest landing page](https://userdashboard.github.io/developers/integrations/hastebin-subscription-saas/1-index-page.png?raw=true) | 
|:---------------------------------------------------------------------------------------------------------------:|
| Example app integrating Dashboard with `/` served by its application server |

| ![Administration page](https://userdashboard.github.io/developers/integrations/hastebin-subscription-saas/3-owner-views-subscription-administration.png?raw=true) |
|:---------------------------------------------------------------------------------------------------------------:|
| Administration page provided by Dashboard |

| ![Example app integrating Dashboard ](https://userdashboard.github.io/developers/integrations/hastebin-subscription-saas/14-second-user-creates-shared-post.png?raw=true) |
|:---------------------------------------------------------------------------------------------------------------:|
| Example app integrating Dashboard with `/home` served by its application server |

## Dashboard modules

Additional APIs, content and functionality can be added by `npm install` and nominating Dashboard modules in your `package.json`.  You can read more about this on the [Dashboard package.json documentation](https://userdashboard.github.io/developers/dashboard-package-json.html)

    "dashboard": {
      "modules": [ "package", "package2" ]
    }

Modules can supplement the global.sitemap with additional routes which automatically maps them into the `Private API` shared as global.api.

| Name | Description | Package   | Repository |
|------|-------------|-----------|------------|
| MaxMind GeoIP | IP address-based geolocation | [@userdashboard/maxmind-geoip](https://npmjs.com/package/userdashboard/maxmind-geoip)| [github](https://github.com/userdashboard/maxmind-geoip) |
| Organizations | User created groups | [@userdashboard/organizations](https://npmjs.com/package/userdashboard/organizations) | [github](https://github.com/userdashboard/organizations) |
| Stripe Subscriptions | SaaS functionality | [@userdashboard/stripe-subscriptions](https://npmjs.com/package/userdashboard/stripe-subscriptions) | [github](https://github.com/userdashboard/stripe-subscriptions) |
| Stripe Connect | Marketplace functionality | [@userdashboard/stripe-connect](https://npmjs.com/package/userdashboard/stripe-connect) | [github](https://github.com/userdashboard/stripe-connect)

#### Development

Development takes place on [Github](https://github.com/userdashboard/stripe-connect) with releases on [NPM](https://www.npmjs.com/package/@userdashboard/stripe-connect).

#### License

This software is distributed under the MIT license.