global.stripeAPIVersion = '2019-08-14'
global.stripeJS = process.env.STRIPE_JS === 'false' ? false : parseInt(process.env.STRIPE_JS, 10)
global.maximumStripeRetries = parseInt(process.env.MAXIMUM_STRIPE_RETRIES || '2', 10)
global.connectWebhookEndPointSecret = global.connectWebhookEndPointSecret || process.env.CONNECT_WEBHOOK_ENDPOINT_SECRET
if (!global.connectWebhookEndPointSecret) {
  throw new Error('invalid-connect-webhook-endpoint-secret')
}
global.stripePublishableKey = process.env.STRIPE_PUBLISHABLE_KEY
if (global.stripeJS > 0 && !global.stripePublishableKey) {
  throw new Error('invalid-stripe-publishable-key')
}

(async () => {
  const packageJSON = require('./package.json')
  const stripe = require('stripe')()
  stripe.setApiVersion(global.stripeAPIVersion)
  stripe.setMaxNetworkRetries(global.maximumStripeRetries)
  stripe.setAppInfo({
    version: packageJSON.version,
    name: '@userdashboard/stripe-connect',
    url: 'https://github.com/userdashboard/stripe-connect'
  })
  const countryList = require('./countries.json')
  const countryNameIndex = {}
  for (const country of countryList) {
    countryNameIndex[country.code] = country.name
  }
  const fs = require('fs')
  const os = require('os')
  const cachedCountrySpecs = os.tmpdir() + '/stripe_country_specs.json'
  const countrySpecIndex = {}
  let countrySpecs
  if (fs.existsSync(cachedCountrySpecs)) {
    countrySpecs = require(cachedCountrySpecs)
  } else {
    countrySpecs = await stripe.countrySpecs.list({ limit: 100 }, { api_key: process.env.STRIPE_KEY })
    countrySpecs = countrySpecs.data
    countrySpecs.sort((a, b) => {
      a.name = countryNameIndex[a.id]
      b.name = countryNameIndex[b.id]
      countrySpecIndex[a.id] = a
      countrySpecIndex[b.id] = b
      return a.id.toLowerCase() > b.id.toLowerCase() ? 1 : -1
    })
    fs.writeFileSync(cachedCountrySpecs, JSON.stringify(countrySpecs))
  }
  const countryCurrencyIndex = {}
  for (const countrySpec of countrySpecs) {
    countryCurrencyIndex[countrySpec.id] = []
    for (const currency in countrySpec.supported_bank_account_currencies) {
      countryCurrencyIndex[countrySpec.id].push({ name: currency.toUpperCase(), currency, object: 'currency' })
    }
  }
  const countryDivisions = {}
  const raw = require('./countries-divisions.json')
  for (const object in raw) {
    countryDivisions[raw[object].code] = []
    for (const item in raw[object].divisions) {
      countryDivisions[raw[object].code].push({
        object: 'option',
        text: raw[object].divisions[item],
        value: item
      })
    }
    countryDivisions[raw[object].code].sort((a, b) => {
      return a.text.toLowerCase() < b.text.toLowerCase() ? -1 : 1
    })
  }

  const merchantCategoryCodes = require('./merchant-category-codes.json')
  
  module.exports = {
    countryList,
    countryDivisions,
    countryNameIndex,
    countrySpecs,
    countrySpecIndex,
    countryCurrencyIndex,
    euCountries: ['AT', 'BE', 'DE', 'ES', 'FI', 'FR', 'GB', 'IE', 'IT', 'LU', 'NL', 'NO', 'PT', 'SE'],
    getMerchantCategoryCodes: (language) => {
      return merchantCategoryCodes[language || global.language] || merchantCategoryCodes.en
    },
    MetaData: require('./src/meta-data.js')    
  }
})()
