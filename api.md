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
|global.api.administrator.connect.AccountStripeAccounts.get(req)        | accountid=     |            |
|global.api.administrator.connect.AccountStripeAccountsCount.get(req)   | accountid=     |            |
|global.api.administrator.connect.DeleteStripeAccount.delete(req)       | stripeid=      |            |
|global.api.administrator.connect.Payout.get(req)                       | payoutid=      |            |
|global.api.administrator.connect.Payouts.get(req)                      | -              |            |
|global.api.administrator.connect.PayoutsCount.get(req)                 | -              |            |
|global.api.administrator.connect.SetStripeAccountRejected.patch(req)   | stripeid=      | reason=    |
|global.api.administrator.connect.StripeAccount.get(req)                | stripeid=      |            |
|global.api.administrator.connect.StripeAccountPayouts.get(req)         | stripeid=      |            |
|global.api.administrator.connect.StripeAccountPayoutsCount.get(req)    | stripeid=      |            |
|global.api.administrator.connect.StripeAccounts.get(req)               | -              |            |
|global.api.administrator.connect.StripeAccountsCount.get(req)          | -              |            |      
|global.api.user.connect.AdditionalOwner.get(req)                       | ownerid=       |            |
|global.api.user.connect.AdditionalOwners.get(req)                      | stripeid=      |            |
|global.api.user.connect.AdditionalOwnersCount.get(req)                 | stripeid=      |            |
|global.api.user.connect.CountrySpec.get(req)                           | country=       |            |
|global.api.user.connect.CountrySpecs.get(req)                          | -              |            |
|global.api.user.connect.CreateAdditionalOwner.post(req)                | stripeid=      |            |
|global.api.user.connect.CreateStripeAccount.post(req)                  | accountid=     | type=&country= |
|global.api.user.connect.DeleteAdditionalOwner.delete(req)              | ownerid=       |            |
|global.api.user.connect.DeleteStripeAccount.delete(req)                | stripeid=      |            |
|global.api.user.connect.Payout.get(req)                                | payoutid=      |            |
|global.api.user.connect.Payouts.get(req)                               | accountid=     |            |
|global.api.user.connect.PayoutsCount.get(req)                          | accountid=     |            |
|global.api.user.connect.ResubmitRequiredInformation.patch(req)         | stripeid=      |            |
|global.api.user.connect.ReuploadIdentity-document.patch(req)           | stripeid=      |            |
|global.api.user.connect.ReuploadOwnerIdentity-document.patch(req)      | stripeid=      |            |
|global.api.user.connect.SetAdditionalOwnersSubmitted.patch(req)        | stripeid=      |            |
|global.api.user.connect.SetCompanyRegistrationSubmitted.patch(req)     | stripeid=      |            |
|global.api.user.connect.SetIndividualRegistrationSubmitted.patch(req)  | stripeid=      |            |
|global.api.user.connect.StripeAccount.get(req)                         | stripeid=      |            |
|global.api.user.connect.StripeAccountPayouts.get(req)                  | stripeid=      |            |
|global.api.user.connect.StripeAccountPayoutsCount.get(req)             | stripeid=      |            |
|global.api.user.connect.StripeAccounts.get(req)                        | -              |            |
|global.api.user.connect.StripeAccountsCount.get(req)                   | -              |            |
|global.api.user.connect.UpdateAdditionalOwner.patch(req)               | ownerid=       | Identity & address |
|global.api.user.connect.UpdateCompanyRegistration.patch(req)           | stripeid=      | Country-specific identity & address |
|global.api.user.connect.UpdateIndividualRegistration.patch(req)        | stripeid=      | Country-specific identity & address |
|global.api.user.connect.UpdatePaymentInformation.patch(req)            | stripeid=      | Country-specific banking fields |
