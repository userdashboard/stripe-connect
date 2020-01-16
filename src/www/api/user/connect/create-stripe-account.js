const dashboard = require('@userdashboard/dashboard')
const stripe = require('stripe')()
stripe.setApiVersion(global.stripeAPIVersion)
stripe.setMaxNetworkRetries(global.maximumStripeRetries)
stripe.setTelemetryEnabled(false)
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
    let stripeAccount
    while (true) {
      try {
        stripeAccount = await stripe.accounts.create(accountInfo, req.stripeKey)
        await dashboard.StorageList.add(`${req.appid}/stripeAccounts`, stripeAccount.id)
        await dashboard.StorageList.add(`${req.appid}/account/stripeAccounts/${req.query.accountid}`, stripeAccount.id)
        await dashboard.Storage.write(`${req.appid}/map/stripeid/accountid/${stripeAccount.id}`, req.query.accountid)
        await stripeCache.update(stripeAccount)
        break
      } catch (error) {
        if (error.raw && error.raw.code === 'lock_timeout') {
          continue
        }
        if (error.raw && error.raw.code === 'rate_limit') {
          continue
        }
        if (error.raw && error.raw.code === 'idempotency_key_in_use') {
          continue
        }
        if (error.type === 'StripeConnectionError') {
          continue
        }
        if (process.env.DEBUG_ERRORS) { console.log(error) } throw new Error('unknown-error')
      }
    }
    if (stripeAccount.business_type === 'individual') {
      return stripeAccount
    }
    let companyDirector, beneficialOwner, companyRepresentative
    const directorInfo = {
      metadata: {
        template: true
      },
      relationship: {
        director: true
      }
    }
    const ownerInfo = {
      metadata: {
        template: true
      },
      relationship: {
        owner: true
      }
    }
    const representativeInfo = {
      metadata: {
        template: true,
        token: false
      },
      relationship: {
        representative: true
      }
    }
    while (true) {
      try {
        companyDirector = await stripe.accounts.createPerson(stripeAccount.id, directorInfo, req.stripeKey)
        break
      } catch (error) {
        if (error.raw && error.raw.code === 'lock_timeout') {
          continue
        }
        if (error.raw && error.raw.code === 'rate_limit') {
          continue
        }
        if (error.raw && error.raw.code === 'idempotency_key_in_use') {
          continue
        }
        if (error.type === 'StripeConnectionError') {
          continue
        }
        if (process.env.DEBUG_ERRORS) { console.log(error) } throw new Error('unknown-error')
      }
    }
    while (true) {
      try {
        beneficialOwner = await stripe.accounts.createPerson(stripeAccount.id, ownerInfo, req.stripeKey)
        break
      } catch (error) {
        if (error.raw && error.raw.code === 'lock_timeout') {
          continue
        }
        if (error.raw && error.raw.code === 'rate_limit') {
          continue
        }
        if (error.raw && error.raw.code === 'idempotency_key_in_use') {
          continue
        }
        if (error.type === 'StripeConnectionError') {
          continue
        }
        if (process.env.DEBUG_ERRORS) { console.log(error) } throw new Error('unknown-error')
      }
    }
    while (true) {
      try {
        companyRepresentative = await stripe.accounts.createPerson(stripeAccount.id, representativeInfo, req.stripeKey)
        await dashboard.Storage.write(`${req.appid}/map/personid/stripeid/${companyRepresentative.id}`, stripeAccount.id)
        break
      } catch (error) {
        if (error.raw && error.raw.code === 'lock_timeout') {
          continue
        }
        if (error.raw && error.raw.code === 'rate_limit') {
          continue
        }
        if (error.raw && error.raw.code === 'idempotency_key_in_use') {
          continue
        }
        if (error.type === 'StripeConnectionError') {
          continue
        }
        if (process.env.DEBUG_ERRORS) { console.log(error) } throw new Error('unknown-error')
      }
    }
    delete (companyDirector.requirements.pending_verification)
    delete (companyDirector.requirements.past_due)
    for (const item of companyDirector.requirements.eventually_due) {
      const duplicate = companyDirector.requirements.currently_due.indexOf(item)
      if (duplicate > -1) {
        companyDirector.requirements.eventually_due = companyDirector.requirements.eventually_due.splice(duplicate, 1)
      }
    }
    delete (beneficialOwner.requirements.pending_verification)
    delete (beneficialOwner.requirements.past_due)
    for (const item of beneficialOwner.requirements.eventually_due) {
      const duplicate = beneficialOwner.requirements.currently_due.indexOf(item)
      if (duplicate > -1) {
        beneficialOwner.requirements.eventually_due = beneficialOwner.requirements.eventually_due.splice(duplicate, 1)
      }
    }
    const accountUpdate = {
      metadata: {
        companyDirectorTemplate: JSON.stringify(companyDirector.requirements),
        beneficialOwnerTemplate: JSON.stringify(beneficialOwner.requirements),
        representative: companyRepresentative.id
      }
    }
    while (true) {
      try {
        const stripeAccountNow = await stripe.accounts.update(stripeAccount.id, accountUpdate, req.stripeKey)
        await stripeCache.update(stripeAccountNow)
        return stripeAccountNow
      } catch (error) {
        if (error.raw && error.raw.code === 'lock_timeout') {
          continue
        }
        if (error.raw && error.raw.code === 'rate_limit') {
          continue
        }
        if (error.raw && error.raw.code === 'idempotency_key_in_use') {
          continue
        }
        if (error.type === 'StripeConnectionError') {
          continue
        }
        if (process.env.DEBUG_ERRORS) { console.log(error) } throw new Error('unknown-error')
      }
    }
  }
}
