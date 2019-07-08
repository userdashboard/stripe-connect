const dashboard = require('@userdashboard/dashboard')
const stripe = require('stripe')()
const stripeCache = require('../../../../stripe-cache.js')

module.exports = {
  patch: async (req) => {
    if (!req.query || !req.query.stripeid) {
      throw new Error('invalid-stripeid')
    }
    if (!req.body || !req.body.currency || !req.body.currency.length) {
      throw new Error('invalid-currency')
    }
    if (!req.body.country || !req.body.country.length) {
      throw new Error('invalid-country')
    }
    if (!req.body.account_holder_name || !req.body.account_holder_name.length) {
      throw new Error('invalid-account_holder_name')
    }
    if (!req.body.account_type || !req.body.account_type.length) {
      throw new Error('invalid-account_type')
    }
    let requiredFields
    switch (req.body.country) {
      case 'AU':
        requiredFields = ['account_number', 'bsb_number']
        break
      case 'GB':
        if (req.body.currency === 'gbp') {
          requiredFields = ['account_number', 'sort_code']
        } else {
          requiredFields = ['iban']
        }
        break
      case 'CA':
        requiredFields = ['account_number', 'institution_number', 'transit_number']
        break
      case 'US':
        requiredFields = ['account_number', 'routing_number']
        break
      case 'HK':
        requiredFields = ['account_number', 'clearing_code', 'branch_code']
        break
      case 'JP':
      case 'SG':
      case 'BR':
        requiredFields = ['account_number', 'bank_code', 'branch_code']
        break
      case 'NZ':
        requiredFields = ['account_number', 'routing_number']
        break
      default:
        requiredFields = ['iban']
        break
    }
    for (const field of requiredFields) {
      if (!req.body[field]) {
        throw new Error(`invalid-${field}`)
      }
    }
    const stripeAccount = await global.api.user.connect.StripeAccount._get(req)
    if (stripeAccount.metadata.accountid !== req.account.accountid) {
      throw new Error('invalid-stripe-account')
    }
    const stripeData = {
      external_account: {
        object: 'bank_account',
        currency: req.body.currency,
        country: req.body.country,
        account_holder_name: req.body.account_holder_name,
        account_type: req.body.account_type
      }
    }
    switch (req.body.country) {
      case 'AU':
        stripeData.external_account.account_number = req.body.account_number
        stripeData.external_account.routing_number = req.body.bsb_number
        break
      case 'GB':
        if (req.body.currency === 'gbp') {
          stripeData.external_account.account_number = req.body.account_number
          stripeData.external_account.routing_number = req.body.sort_code
        } else {
          stripeData.external_account.account_number = req.body.iban
        }
        break
      case 'CA':
        stripeData.external_account.account_number = req.body.account_number
        stripeData.external_account.routing_number = req.body.transit_number + '-' + req.body.institution_number
        break
      case 'US':
        stripeData.external_account.account_number = req.body.account_number
        stripeData.external_account.routing_number = req.body.routing_number
        break
      case 'HK':
        stripeData.external_account.account_number = req.body.account_number
        stripeData.external_account.routing_number = req.body.clearing_code + '-' + req.body.branch_code
        break
      case 'JP':
      case 'SG':
      case 'BR':
        stripeData.external_account.account_number = req.body.account_number
        stripeData.external_account.routing_number = req.body.bank_code + '' + req.body.branch_code
        break
      case 'NZ':
        stripeData.external_account.account_number = req.body.account_number
        stripeData.external_account.routing_number = req.body.routing_number
        break
      default:
        stripeData.external_account.account_number = req.body.iban
        break
    }
    for (const field of requiredFields) {
      if (!req.body[field]) {
        throw new Error(`invalid-${field}`)
      }
    }
    try {
      const accountNow = await stripe.accounts.update(req.query.stripeid, stripeData, req.stripeKey)
      req.success = true
      const bankAccount = accountNow.external_accounts.data[0]
      await dashboard.StorageList.add(`${req.appid}/stripeAccount:bankAccounts/${req.query.stripeid}`, bankAccount.id)
      await dashboard.Storage.write(`${req.appid}/map/bankAccount/stripeid/${bankAccount.id}`, req.query.stripeid)
      await stripeCache.update(accountNow, req.stripeKey)
      return accountNow
    } catch (error) {
      if (error.message.startsWith('invalid-')) {
        throw error
      }
      throw new Error('unknown-error')
    }
  }
}
