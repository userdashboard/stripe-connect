const dashboard = require('@userdashboard/dashboard')
const stripe = require('stripe')()
stripe.setApiVersion(global.stripeAPIVersion)
stripe.setMaxNetworkRetries(global.maximumStripeRetries)
const stripeCache = require('../../../../stripe-cache.js')

module.exports = {
  post: async (req) => {
    if (!req.query || !req.query.accountid) {
      throw new Error('invalid-accountid')
    }
    const account = await global.api.user.Account.get(req)
    if (!account) {
      throw new Error('invalid-account')
    }
    if (!req.body || (req.body.type !== 'individual' && req.body.type !== 'company')) {
      throw new Error('invalid-type')
    }
    if (!req.body.country) {
      throw new Error('invalid-country')
    }
    req.query.country = req.body.country
    const countrySpec = await global.api.user.connect.CountrySpec.get(req)
    if (!countrySpec) {
      throw new Error('invalid-country')
    }
    const accountInfo = {
      type: 'custom',
      business_type: req.body.type,
      country: req.body.country,
      requested_capabilities: ['card_payments', 'transfers'],
      metadata: {
        appid: req.appid,
        accountid: req.query.accountid,
        ip: req.ip,
        userAgent: req.userAgent
      }
    }
    try {
      let stripeAccountNow = await stripe.accounts.create(accountInfo, req.stripeKey)
      await dashboard.StorageList.add(`${req.appid}/stripeAccounts`, stripeAccountNow.id)
      await dashboard.StorageList.add(`${req.appid}/account/stripeAccounts/${req.query.accountid}`, stripeAccountNow.id)
      await dashboard.Storage.write(`${req.appid}/map/stripeid/accountid/${stripeAccountNow.id}`, req.query.accountid)
      if (req.body.type === 'company') {
        const companyDirector = await stripe.accounts.createPerson(stripeAccountNow.id, { relationship: { director: true } }, req.stripeKey)
        const beneficialOwner = await stripe.accounts.createPerson(stripeAccountNow.id, { relationship: { owner: true } }, req.stripeKey)
        const companyRepresentative = await stripe.accounts.createPerson(stripeAccountNow.id, { relationship: { owner: true } }, req.stripeKey)
        await dashboard.Storage.write(`${req.appid}/map/personid/stripeid/${companyDirector.id}`, req.query.stripeid)
        await dashboard.Storage.write(`${req.appid}/map/personid/stripeid/${beneficialOwner.id}`, req.query.stripeid)
        await dashboard.Storage.write(`${req.appid}/map/personid/stripeid/${companyRepresentative.id}`, req.query.stripeid)
        stripeAccountNow = await stripe.accounts.update(stripeAccountNow.id, {
          metadata: {
            companyDirectorTemplate: JSON.stringify(companyDirector.requirements),
            beneficialOwnerTemplate: JSON.stringify(beneficialOwner.requirements),
            companyRepresentativeTemplate: JSON.stringify(companyRepresentative.requirements)
          }
        }, req.stripeKey)
      }
      req.success = true
      await stripeCache.update(stripeAccountNow)
      return stripeAccountNow
    } catch (error) {
      throw new Error('unknown-error')
    }
  }
}
