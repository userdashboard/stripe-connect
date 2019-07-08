# Stripe Connect for Dashboard

[Dashboard](https://github.com/userdashboard/dashboard) is a NodeJS project that provides a reusable account management system for web applications.  This module adds a complete user and administrator `Private API` and `Web UI` for a [Stripe Connect](https://stripe.com/connect) custom integration.

## Access Connect information from your application server

| URL                                                      | Method | Querystring    | POST data  |
|----------------------------------------------------------|--------|----------------|------------|  
|/api/administrator/connect/account-stripe-accounts        | GET    | accountid=     |            |
|/api/administrator/connect/account-stripe-accounts-count  | GET    | accountid=     |            |
|/api/administrator/connect/delete-stripe-account          | DELETE | stripeid=      |            |
|/api/administrator/connect/payout                         | GET    | payoutid=      |            |
|/api/administrator/connect/payouts                        | GET    | -              |            |
|/api/administrator/connect/payouts-count                  | GET    | -              |            |
|/api/administrator/connect/set-stripe-account-rejected    | PATCH  | stripeid=      | reason=    |
|/api/administrator/connect/stripe-account                 | GET    | stripeid=      |            |
|/api/administrator/connect/stripe-account-payouts         | GET    | stripeid=      |            |
|/api/administrator/connect/stripe-account-payouts-count   | GET    | stripeid=      |            |
|/api/administrator/connect/stripe-accounts                | GET    | -              |            |
|/api/administrator/connect/stripe-accounts-count          | GET    | -              |            |      
|/api/user/connect/additional-owner                        | GET    | ownerid=       |            |
|/api/user/connect/additional-owners                       | GET    | stripeid=      |            |
|/api/user/connect/additional-owners-count                 | GET    | stripeid=      |            |
|/api/user/connect/country-spec                            | GET    | country=       |            |
|/api/user/connect/country-specs                           | GET    | -              |            |
|/api/user/connect/create-additional-owner                 | POST   | stripeid=      |            |
|/api/user/connect/create-stripe-account                   | POST   | accountid=     | type=&country= |
|/api/user/connect/delete-additional-owner                 | DELETE | ownerid=       |            |
|/api/user/connect/delete-stripe-account                   | DELETE | stripeid=      |            |
|/api/user/connect/payout                                  | GET    | payoutid=      |            |
|/api/user/connect/payouts                                 | GET    | accountid=     |            |
|/api/user/connect/payouts-count                           | GET    | accountid=     |            |
|/api/user/connect/resubmit-required-information           | PATCH  | stripeid=      |            |
|/api/user/connect/reupload-identity-document              | PATCH  | stripeid=      |            |
|/api/user/connect/reupload-owner-identity-document        | PATCH  | stripeid=      |            |
|/api/user/connect/set-additional-owners-submitted         | PATCH  | stripeid=      |            |
|/api/user/connect/set-company-registration-submitted      | PATCH  | stripeid=      |            |
|/api/user/connect/set-individual-registration-submitted   | PATCH  | stripeid=      |            |
|/api/user/connect/stripe-account                          | GET    | stripeid=      |            |
|/api/user/connect/stripe-account-payouts                  | GET    | stripeid=      |            |
|/api/user/connect/stripe-account-payouts-count            | GET    | stripeid=      |            |
|/api/user/connect/stripe-accounts                         | GET    | -              |            |
|/api/user/connect/stripe-accounts-count                   | GET    | -              |            |
|/api/user/connect/update-additional-owner                 | PATCH  | ownerid=       | Identity & address |
|/api/user/connect/update-company-registration             | PATCH  | stripeid=      | Country-specific identity & address |
|/api/user/connect/update-individual-registration          | PATCH  | stripeid=      | Country-specific identity & address |
|/api/user/connect/update-payment-information              | PATCH  | stripeid=      | Country-specific banking fields |

## Access Connect information from the dashboard server

| URL                                                             | Querystring    | POST data  |
|-----------------------------------------------------------------|----------------|------------|  
|/api/administrator/connect/AccountStripeAccounts.get(req)        | accountid=     |            |
|/api/administrator/connect/AccountStripeAccountsCount.get(req)   | accountid=     |            |
|/api/administrator/connect/DeleteStripeAccount.delete(req)       | stripeid=      |            |
|/api/administrator/connect/Payout.get(req)                       | payoutid=      |            |
|/api/administrator/connect/Payouts.get(req)                      | -              |            |
|/api/administrator/connect/PayoutsCount.get(req)                 | -              |            |
|/api/administrator/connect/SetStripeAccountRejected.patch(req)   | stripeid=      | reason=    |
|/api/administrator/connect/StripeAccount.get(req)                | stripeid=      |            |
|/api/administrator/connect/StripeAccountPayouts.get(req)         | stripeid=      |            |
|/api/administrator/connect/StripeAccountPayoutsCount.get(req)    | stripeid=      |            |
|/api/administrator/connect/StripeAccounts.get(req)               | -              |            |
|/api/administrator/connect/StripeAccountsCount.get(req)          | -              |            |      
|/api/user/connect/AdditionalOwner.get(req)                       | ownerid=       |            |
|/api/user/connect/AdditionalOwners.get(req)                      | stripeid=      |            |
|/api/user/connect/AdditionalOwnersCount.get(req)                 | stripeid=      |            |
|/api/user/connect/CountrySpec.get(req)                           | country=       |            |
|/api/user/connect/CountrySpecs.get(req)                          | -              |            |
|/api/user/connect/CreateAdditionalOwner.post(req)                | stripeid=      |            |
|/api/user/connect/CreateStripeAccount.post(req)                  | accountid=     | type=&country= |
|/api/user/connect/DeleteAdditionalOwner.delete(req)              | ownerid=       |            |
|/api/user/connect/DeleteStripeAccount.delete(req)                | stripeid=      |            |
|/api/user/connect/Payout.get(req)                                | payoutid=      |            |
|/api/user/connect/Payouts.get(req)                               | accountid=     |            |
|/api/user/connect/PayoutsCount.get(req)                          | accountid=     |            |
|/api/user/connect/ResubmitRequiredInformation.patch(req)         | stripeid=      |            |
|/api/user/connect/ReuploadIdentity-document.patch(req)           | stripeid=      |            |
|/api/user/connect/ReuploadOwnerIdentity-document.patch(req)      | stripeid=      |            |
|/api/user/connect/SetAdditionalOwnersSubmitted.patch(req)        | stripeid=      |            |
|/api/user/connect/SetCompanyRegistrationSubmitted.patch(req)     | stripeid=      |            |
|/api/user/connect/SetIndividualRegistrationSubmitted.patch(req)  | stripeid=      |            |
|/api/user/connect/StripeAccount.get(req)                         | stripeid=      |            |
|/api/user/connect/StripeAccountPayouts.get(req)                  | stripeid=      |            |
|/api/user/connect/StripeAccountPayoutsCount.get(req)             | stripeid=      |            |
|/api/user/connect/StripeAccounts.get(req)                        | -              |            |
|/api/user/connect/StripeAccountsCount.get(req)                   | -              |            |
|/api/user/connect/UpdateAdditionalOwner.patch(req)               | ownerid=       | Identity & address |
|/api/user/connect/UpdateCompanyRegistration.patch(req)           | stripeid=      | Country-specific identity & address |
|/api/user/connect/UpdateIndividualRegistration.patch(req)        | stripeid=      | Country-specific identity & address |
|/api/user/connect/UpdatePaymentInformation.patch(req)            | stripeid=      | Country-specific banking fields |

# Dashboard

Dashboard is a NodeJS project that provides a reusable account management system for web applications. 

Dashboard proxies your application server to create a single website where pages like signing in or changing your password are provided by Dashboard.  Your application server can be anything you want, and use Dashboard's API to access data as required.

Using modules you can expand Dashboard to include organizations, subscriptions powered by Stripe, or a Stripe Connect platform.

Application servers written for Dashboard can be published on websites running our [app store](https://github.com/userdashboard/app-store-dashboard-server) software like [UserAppStore](https://userappstore.com).

- [Introduction](https://github.com/userdashboard/dashboard/wiki)
- [Configuring Dashboard](https://github.com/userdashboard/dashboard/wiki/Configuring-Dashboard)
- [Dashboard code structure](https://github.com/userdashboard/dashboard/wiki/Dashboard-code-structure)
- [Server request lifecycle](https://github.com/userdashboard/dashboard/wiki/Server-Request-Lifecycle)

### Demonstrations

- [Dashboard](https://dashboard-demo-2344.herokuapp.com)
- [Dashboard + Organizations module](https://organizations-demo-7933.herokuapp.com)
- [Dashboard + Stripe Subscriptions module](https://stripe-subscriptions-5701.herokuapp.com)
- [Dashboard + Stripe Connect module](https://stripe-connect-8509.herokuapp.com)

#### Development

Development takes place on [Github](https://github.com/userdashboard/stripe-connect) with releases on [NPM](https://www.npmjs.com/package/@userdashboard/stripe-connect).

 #### License

This is free and unencumbered software released into the public domain.  The MIT License is provided for countries that have not established a public domain.