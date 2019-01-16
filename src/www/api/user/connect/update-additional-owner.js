const connect = require('../../../../../index.js')
const stripe = require('stripe')()
const stripeCache = require('../../../../stripe-cache.js')

module.exports = {
  lock: true,
  before: async (req) => {
    if (!req.query || !req.query.ownerid) {
      throw new Error('invalid-ownerid')
    }
    if (!req.body || !req.body.city) {
      throw new Error('invalid-city')
    }
    if (!req.body.country) {
      throw new Error('invalid-country')
    }
    if (!req.body.line1) {
      throw new Error('invalid-line1')
    }
    if (!req.body.postal_code) {
      throw new Error('invalid-postal_code')
    }
    if (!req.body.day) {
      throw new Error('invalid-day')
    }
    if (!req.body.month) {
      throw new Error('invalid-month')
    }
    if (!req.body.year) {
      throw new Error('invalid-year')
    }
    if (!req.body.first_name) {
      throw new Error('invalid-first_name')
    }
    if (!req.body.last_name) {
      throw new Error('invalid-last_name')
    }
    if (req.file) {
      req.body.documentid = req.file.id
    }
    const owner = await global.api.user.connect.AdditionalOwner._get(req)
    req.query.stripeid = owner.stripeid
    const stripeAccount = await global.api.user.connect.StripeAccount._get(req)
    if (stripeAccount.metadata.submitted || stripeAccount.metadata.submittedOwners) {
      throw new Error('invalid-stripe-account')
    }
    const owners = connect.MetaData.parse(stripeAccount.metadata, 'owners')
    req.data = { owner, owners, stripeAccount }
  },
  patch: async (req) => {
    for (const field in req.body) {
      req.data.owner[field] = req.body[field]
    }
    if (req.data.owners && req.data.owners.length) {
      for (const i in req.data.owners) {
        if (req.data.owners[i].ownerid === req.query.ownerid) {
          req.data.owners[i] = req.data.owner
          break
        }
      }
    } else {
      req.data.owners = [req.data.owner]
    }
    const accountInfo = {
      metadata: {
      }
    }
    connect.MetaData.store(accountInfo.metadata, 'owners', req.data.owners)
    try {
      const accountNow = await stripe.accounts.update(req.data.stripeAccount.id, accountInfo, req.stripeKey)
      await stripeCache.update(accountNow, req.stripeKey)
      req.success = true
      return req.data.owner
    } catch (error) {
      if (error.message.startsWith('invalid-')) {
        throw error
      }
      throw new Error('unknown-error')
    }
  }
}
