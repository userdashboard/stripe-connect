const dashboard = require('@userdashboard/dashboard')
const stripe = require('stripe')()
stripe.setApiVersion(global.stripeAPIVersion)
stripe.setMaxNetworkRetries(global.maximumStripeRetries)
const stripeCache = require('../../../../stripe-cache.js')

module.exports = {
  patch: async (req) => {
    if (!req.query || !req.query.stripeid) {
      throw new Error('invalid-stripeid')
    }
    const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
    if (stripeAccount.metadata.submitted ||
      stripeAccount.business_type !== 'individual' ||
      stripeAccount.metadata.accountid !== req.account.accountid) {
      throw new Error('invalid-stripe-account')
    }
    if (!stripeAccount.external_accounts.data.length) {
      throw new Error('invalid-payment-details')
    }
    if (stripeAccount.requirements.currently_due.length) {
      throw new Error('invalid-registration')
    }
    const accountInfo = {
      tos_acceptance: {
        ip: req.ip,
        user_agent: req.userAgent,
        date: dashboard.Timestamp.now
      },
      metadata: {
        submitted: dashboard.Timestamp.now
      }
    }
    let stripeAccountNow
    try {
      stripeAccountNow = await stripe.accounts.update(req.query.stripeid, accountInfo, req.stripeKey)
      req.success = true
      await stripeCache.update(stripeAccountNow)
    } catch (error) {
      const errorMessage = error.raw && error.raw.param ? error.raw.param : error.message
      if (errorMessage.startsWith('individual[address]')) {
        let field = errorMessage.substring('individual[address]['.length)
        field = field.substring(0, field.length - 1)
        throw new Error(`invalid-${field}`)
      } else if (errorMessage.startsWith('individual[personal_address]')) {
        let field = errorMessage.substring('individual[personal_address]['.length)
        field = field.substring(0, field.length - 1)
        throw new Error(`invalid-${field}`)
      } else if (errorMessage.startsWith('individual[address_kana]')) {
        let field = errorMessage.substring('individual[address_kana]['.length)
        field = field.substring(0, field.length - 1)
        throw new Error(`invalid-${field}_kana`)
      } else if (errorMessage.startsWith('individual[address_kanji]')) {
        let field = errorMessage.substring('individual[address_kanji]['.length)
        field = field.substring(0, field.length - 1)
        throw new Error(`invalid-${field}_kanji`)
      } else if (errorMessage.startsWith('individual')) {
        let field = errorMessage.substring('individual['.length)
        field = field.substring(0, field.length - 1)
        throw new Error(`invalid-${field}`)
      }
      throw new Error('unknown-error')
    }
    if (global.stripeJS !== 3) {
      return stripeAccountNow
    }
    const accountInfoNow = {
      metadata: {
        submitted: dashboard.Timestamp.now
      },
      tos_acceptance: {
        ip: req.ip,
        user_agent: req.userAgent,
        date: dashboard.Timestamp.now
      }
    }
    while (true) {
      try {
        stripeAccountNow = await stripe.accounts.update(req.query.stripeid, accountInfoNow, req.stripeKey)
        await stripeCache.update(stripeAccountNow)
        return stripeAccountNow
      } catch (error) {
        if (error.raw && error.raw.code === 'lock_timeout') {
          continue
        }
        const errorMessage = error.raw && error.raw.param ? error.raw.param : error.message
        if (errorMessage.startsWith('company[address]')) {
          let field = errorMessage.substring('company[address]['.length)
          field = field.substring(0, field.length - 1)
          throw new Error(`invalid-address_${field}`)
        } else if (errorMessage.startsWith('company[personal_address]')) {
          let field = errorMessage.substring('company[personal_address]['.length)
          field = field.substring(0, field.length - 1)
          throw new Error(`invalid-${field}`)
        } else if (errorMessage.startsWith('company[address_kana]')) {
          let field = errorMessage.substring('company[address_kana]['.length)
          field = field.substring(0, field.length - 1)
          throw new Error(`invalid-address_${field}_kana`)
        } else if (errorMessage.startsWith('company[address_kanji]')) {
          let field = errorMessage.substring('company[address_kanji]['.length)
          field = field.substring(0, field.length - 1)
          throw new Error(`invalid-address_${field}_kanji`)
        } else if (errorMessage.startsWith('company[verification]')) {
          let field = errorMessage.substring('company[verification][document]['.length)
          field = field.substring(0, field.length - 1)
          throw new Error(`invalid-verification_document_${field}`)
        } else if (errorMessage.startsWith('company')) {
          let field = errorMessage.substring('company['.length)
          field = field.substring(0, field.length - 1)
          throw new Error(`invalid-${field}`)
        }
        throw new Error('unknown-error')
      }
    }
  }
}
