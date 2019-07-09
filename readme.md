# Stripe Connect for Dashboard

[Dashboard](https://github.com/userdashboard/dashboard) is a NodeJS project that provides a reusable account management system for web applications.  This module adds a complete user and administrator `Private API` and `Web UI` for a [Stripe Connect](https://stripe.com/connect) custom integration.

# Dashboard

Dashboard proxies your application server to create a single website where pages like signing in or changing your password are provided by Dashboard.  Your application server can be anything you want, and use Dashboard's API to access data as required.  Using modules you can expand Dashboard to include organizations, subscriptions powered by Stripe, or a Stripe Connect platform.

- [Dashboard Wiki](https://github.com/userdashboard/dashboard/wiki)
- [Configuring Dashboard](https://github.com/userdashboard/dashboard/wiki/Configuring-Dashboard)
- [Dashboard code structure](https://github.com/userdashboard/dashboard/wiki/Dashboard-code-structure)
- [Server request lifecycle](https://github.com/userdashboard/dashboard/wiki/Server-Request-Lifecycle)
- [API access from application server](https://github.com/userdashboard/dashboard/wiki/API-access-from-application-server)
- [API access from module](https://github.com/userdashboard/dashboard/wiki/API-access-from-module)
- [API access from web browser](https://github.com/userdashboard/dashboard/wiki/API-access-from-web-browser)
- [Creating web applications with Dashboard](https://github.com/userdashboard/dashboard/wiki/Creating-web-applications-with-Dashboard)
- [Integrating Dashboard with existing web applications](https://github.com/userdashboard/dashboard/wiki/Integrating-Dashboard-with-existing-web-applications)
- [Creating modules for Dashboard](https://github.com/userdashboard/dashboard/wiki/Creating-modules-for-Dashboard)

### Case studies 

`Hastebin` is an open source pastebin web application.  It started as a service for anonymous guests only, and was transformed with Dashboard and modules into a web application for registered users, with support for sharing posts with organizations and paid subscriptions.

- [Hastebin - free web application](https://github.com/userdashboard/integration-examples/blob/master/hastebin/hastebin-saas-free.md)
- [Hastebin - subscription web application](https://github.com/userdashboard/integration-examples/blob/master/hastebin/hastebin-saas-subscription.md)

## Dashboard modules

Additional APIs, content and functionality can be added by `npm install` and nominating Dashboard modules in your `package.json`.  You can read more about this on the [Dashboard configuration wiki page](https://github.com/userdashboard/dashboard/wiki/Configuring-Dashboard)

    "dashboard": {
      "modules": [ "package", "package2" ]
    }

Modules can supplement the global.sitemap with additional routes which automatically maps them into the `Private API` shared as global.api.

| Name | Description | Package   | Repository |
|------|-------------|-----------|------------|
| MaxMind GeoIP | IP address-based geolocation | @userdashboard/maxmind-geoip | [github](https://github.com/userdashboard/maxmind-geoip) |
| Organizations | User created groups | @userdashboard/organizations | [github](https://github.com/userdashboard/organizations) |
| Stripe Subscriptions | SaaS functionality | @userdashboard/stripe-subscriptions | [github](https://github.com/userdashboard/stripe-subscriptions) |
| Stripe Connect | Marketplace functionality | @userdashboard/stripe-connect | [github](https://github.com/userdashboard/stripe-connect)

#### Development

Development takes place on [Github](https://github.com/userdashboard/stripe-connect) with releases on [NPM](https://www.npmjs.com/package/@userdashboard/stripe-connect).

#### License

This is free and unencumbered software released into the public domain.  The MIT License is provided for countries that have not established a public domain.