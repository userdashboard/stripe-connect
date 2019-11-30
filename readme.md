# Stripe Connect module for Dashboard

![Guest landing page](https://userdashboard.github.io/outline.png?raw=true) 

Dashboard is a parallel web application that accompanies your web app, subscription service, or Stripe Connect platform to provide all the "boilerplate" a modern web app requires to serve its users.  Use Dashboard instead of rewriting user account and login systems.  This module adds UI and APIs for a complete [Stripe Connect](https://stripe.com/connect) custom integration.

## Development status

Stripe Connect module is ready-ish to use.  The following work remains:

- translations required for everything in /languages [(please help)](https://github.com/userdashboard/stripe-connect)
- there is no "resubmission" flow for rejected/erroneous data pending a reliable way to trigger it on Stripe API, until there is users who fail validation can delete and start new registrations
- some fields in `update-x` have a 'missing' test but no accompanying 'invalid' test that verifies the information is correct or correctly-structured or correctly-sized or whatever, such as `line1`, `city`, `postal_code`, `first_name`, `last_name` 
- JP tests for `update-payment-information` and `set-x-registration-submitted` is throwing an error that you can't use live bank account numbers
- MX tests are in place but it is not available for all accounts

## Adding countries

Periodically Stripe Connect adds support for new countries.  When this happens:

1) Add new 'kyc-requirements/XX.json' documenting all the required fields

2) Update the UI `edit-payment-details` page and the API `update-payment-information` to support whatever bank account fields

3) Update the UI `edit-individual-registration` + `edit-company-registration` and the API `update-individual-registration` + `update-company-registration` with any new fields or conditions

## Import this module

Edit your `package.json` to activate the module:

    "dashboard": {
      "modules": [
        "@userdashboard/stripe-connect"
      ]
    }

Install the module with NPM:

    $ npm install @userdashboard/stripe-connect

## Setting up your Stripe credentials

In development your webhook can be created automatically, but in production since you might have multiple Dashboard server instances you must set it up manually.

- create your Stripe account and find your API keys
- create a webhook for https://your_domain/webhooks/connect/index-connect-data 
- environment STRIPE_KEY=sk_test_xxxxxxx
- environment STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxx
- environment CONNECT_WEBHOOK_ENDPOINT_SECRET=whsec_xxxxxxxx

## Local documentation

| File | Description | 
|------|-------------|
| `/documentation/1. Stripe Connect module.md` | Markdown version of the developer documentation |
| `/documentation/2. Building a Stripe Connect platform.md` | Markdown version of the developer documentation |
| `/api.txt` | How to use the API via NodeJS or your application server |
| `/sitemap.txt` | Runtime configuration and map of URLs to modules & local files |
| `/start-dev.sh` | Environment variables you can use to configure Dashboard |

## Online documentation

Join the freenode IRC #dashboard chatroom for support.  [Web IRC client](https://kiwiirc.com/nextclient/)

- [Developer documentation home](https://userdashboard.github.io/home)
- [Administrator manual](https://userdashboard.github.io/administrators/home)
- [User manual](https://userdashboard.github.io/users/home)

### Case studies 

`Hastebin` is an open source pastebin web application.  It started as a service for anonymous guests only, and was transformed with Dashboard and modules into a web application for registered users with support for sharing posts with organizations and paid subscriptions.

- [Hastebin - free web application](https://userdashboard.github.io/integrations/converting-hastebin-free-saas.html)
- [Hastebin - subscription web application](https://userdashboard.github.io/integrations/converting-hastebin-subscription-saas.html)

## Privacy

Dashboard accounts optionally support anonymous registration and irreversibly encrypt signin username and passwords.  There are no third-party trackers, analytics or resources embedded in Dashboard pages.  

#### Development

Development takes place on [Github](https://github.com/userdashboard/dashboard) with releases on [NPM](https://www.npmjs.com/package/@userdashboard/dashboard).

#### License

This software is distributed under the MIT license.
