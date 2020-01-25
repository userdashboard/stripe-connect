const connect = require('../../../../../index.js')
const dashboard = require('@userdashboard/dashboard')
const stripe = require('stripe')()
stripe.setApiVersion(global.stripeAPIVersion)
if (global.maxmimumStripeRetries) {
  stripe.setMaxNetworkRetries(global.maximumStripeRetries)
}
stripe.setTelemetryEnabled(false)
const stripeCache = require('../../../../stripe-cache.js')

module.exports = {
  patch: async (req) => {
    if (!req.query || !req.query.stripeid) {
      throw new Error('invalid-stripeid')
    }
    const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
    if (stripeAccount.metadata.accountid !== req.account.accountid) {
      throw new Error('invalid-stripe-account')
    }
    if (!req.body || !req.body.currency || !req.body.currency.length) {
      throw new Error('invalid-currency')
    }
    if (!req.body.country || !req.body.country.length) {
      throw new Error('invalid-country')
    }
    if (!connect.countrySpecIndex[req.body.country]) {
      throw new Error('invalid-country')
    }
    if (!req.body.account_holder_name || !req.body.account_holder_name.length) {
      throw new Error('invalid-account_holder_name')
    }
    if (!req.body.account_holder_type || !req.body.account_holder_type.length) {
      throw new Error('invalid-account_holder_type')
    }
    if (req.body.account_holder_type !== 'individual' &&
        req.body.account_holder_type !== 'company') {
      throw new Error('invalid-account_holder_type')
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
      case 'MY':
      case 'US':
      case 'NZ':
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
      default:
        requiredFields = ['iban']
        break
    }
    for (const field of requiredFields) {
      if (!req.body[field]) {
        throw new Error(`invalid-${field}`)
      }
      if (field === 'iban') {
        const countryPart = req.body[field].substring(0, 2).toUpperCase()
        if (!connect.countryCurrencyIndex[countryPart]) {
          throw new Error('invalid-iban')
        }
        const numericPart = req.body[field].substring(2)
        const integers = '0123456789'
        for (let i = 0, len = numericPart.length; i < len; i++) {
          if (integers.indexOf(numericPart.charAt(i)) === -1) {
            throw new Error('invalid-iban')
          }
        }
        continue
      }
      if (process.env.NODE_ENV === 'testing' && req.body[field] === 'TESTMYKL') {
        // do nothing
      } else {
        const int = parseInt(req.body[field], 10)
        if (!int && int !== 0) {
          throw new Error(`invalid-${field}`)
        }
        if (int.toString() !== req.body[field]) {
          if (req.body[field].startsWith('0')) {
            let zeroes = ''
            for (let i = 0, len = req.body[field].length; i < len; i++) {
              if (req.body[field].charAt(i) !== '0') {
                break
              }
              zeroes += '0'
            }
            if (int > 0) {
              zeroes += int.toString()
            }
            if (zeroes !== req.body[field]) {
              throw new Error(`invalid-${field}`)
            }
          } else {
            throw new Error(`invalid-${field}`)
          }
        }
      }
    }
    const currencies = connect.countryCurrencyIndex[stripeAccount.country]
    let foundCurrency = false
    for (const currency of currencies) {
      foundCurrency = currency.currency === req.body.currency
      if (foundCurrency) {
        break
      }
    }
    if (!foundCurrency) {
      throw new Error('invalid-currency')
    }
    const stripeData = {
      external_account: {
        object: 'bank_account',
        currency: req.body.currency,
        country: req.body.country,
        account_holder_name: req.body.account_holder_name,
        account_holder_type: req.body.account_holder_type
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
      case 'HK':
        stripeData.external_account.account_number = req.body.account_number
        stripeData.external_account.routing_number = req.body.clearing_code + '-' + req.body.branch_code
        break
      case 'JP':
      case 'BR':
        stripeData.external_account.account_number = req.body.account_number
        stripeData.external_account.routing_number = req.body.bank_code + '' + req.body.branch_code
        break
      case 'SG':
        stripeData.external_account.account_number = req.body.account_number
        stripeData.external_account.routing_number = req.body.bank_code + '-' + req.body.branch_code
        break
      case 'NZ':
      case 'US':
      case 'MY':
        stripeData.external_account.account_number = req.body.account_number
        stripeData.external_account.routing_number = req.body.routing_number
        break
      default:
        stripeData.external_account.account_number = req.body.iban
        break
    }
    while (true) {
      try {
        const accountNow = await stripe.accounts.update(req.query.stripeid, stripeData, req.stripeKey)
        if (!accountNow.external_accounts || !accountNow.external_accounts.data || !accountNow.external_accounts.data.length) {
          console.log('no exeternal account created', JSON.stringify(accountNow, null, '  '))
          continue
        }
        const bankAccount = accountNow.external_accounts.data[0]
        await dashboard.StorageList.add(`${req.appid}/stripeAccount/bankAccounts/${req.query.stripeid}`, bankAccount.id)
        await dashboard.Storage.write(`${req.appid}/map/bankAccount/stripeid/${bankAccount.id}`, req.query.stripeid)
        await stripeCache.update(accountNow)
        return accountNow
      } catch (error) {
        if (error.raw && error.raw.code === 'lock_timeout') {
          continue
        }
        if (error.raw && error.raw.code === 'rate_limit') {
          continue
        }
        if (error.raw && error.raw.code === 'account_invalid') {
          continue
        }
        if (error.raw && error.raw.code === 'idempotency_key_in_use') {
          continue
        }
        if (error.raw && error.raw.code === 'resource_missing') {
          continue
        }
        if (error.type === 'StripeConnectionError') {
          continue
        }
        if (error.type === 'StripeAPIError') {
          continue
        }
        if (error.message.startsWith('invalid-')) {
          throw error
        }
        if (process.env.DEBUG_ERRORS) { console.log(error) } throw new Error('unknown-error')
      }
    }
  }
}
