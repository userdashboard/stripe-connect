global.stripeAPIVersion = '2020-03-02'
global.stripeJS = process.env.STRIPE_JS === 'false' ? false : parseInt(process.env.STRIPE_JS, 10)
global.maximumStripeRetries = parseInt(process.env.MAXIMUM_STRIPE_RETRIES || '0', 10)
global.connectWebhookEndPointSecret = global.connectWebhookEndPointSecret || process.env.CONNECT_WEBHOOK_ENDPOINT_SECRET
if (!global.connectWebhookEndPointSecret) {
  throw new Error('invalid-connect-webhook-endpoint-secret')
}
global.stripePublishableKey = process.env.STRIPE_PUBLISHABLE_KEY
if (global.stripeJS > 0 && !global.stripePublishableKey) {
  throw new Error('invalid-stripe-publishable-key')
}

const packageJSON = require('./package.json')
const stripe = require('stripe')()
stripe.setApiVersion(global.stripeAPIVersion)
if (global.maxmimumStripeRetries) {
  stripe.setMaxNetworkRetries(global.maximumStripeRetries)
}
stripe.setTelemetryEnabled(false)
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
const countrySpecIndex = {}
const countryCurrencyIndex = {}
const countrySpecs = require('./stripe-country-specs.json')
for (const countrySpec of countrySpecs) {
  countrySpecIndex[countrySpec.id] = countrySpec
  countryCurrencyIndex[countrySpec.id] = []
  for (const currency in countrySpec.supported_bank_account_currencies) {
    countryCurrencyIndex[countrySpec.id].push({ name: currency.toUpperCase(), currency, object: 'currency' })
  }
}

const countryDivisions = {}
const raw = require('./country-divisions.json')
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
  countryList: countryList,
  countryDivisions: countryDivisions,
  countryNameIndex: countryNameIndex,
  countrySpecs: countrySpecs,
  countrySpecIndex: countrySpecIndex,
  countryCurrencyIndex: countryCurrencyIndex,
  euCountries: ['AT', 'BE', 'DE', 'DK', 'EE', 'ES', 'FI', 'FR', 'GB', 'GR', 'IE', 'IT', 'LU', 'LT', 'LV', 'NL', 'NO', 'PL', 'PT', 'SE', 'SI', 'SK'],
  getMerchantCategoryCodes: (language) => {
    return merchantCategoryCodes[language || global.language] || merchantCategoryCodes.en
  },
  setup: async () => {
    if (process.env.CONNECT_STORAGE) {
      const Storage = require('@userdashboard/dashboard/src/storage.js')
      const storage = await Storage.setup('CONNECT')
      const StorageList = require('@userdashboard/dashboard/src/storage-list.js')
      const storageList = await StorageList.setup(storage, 'CONNECT')
      const StorageObject = require('@userdashboard/dashboard/src/storage-object.js')
      const storageObject = await StorageObject.setup(storage, 'CONNECT')
      module.exports.Storage = storage
      module.exports.StorageList = storageList
      module.exports.StorageObject = storageObject
    } else {
      const dashboard = require('@userdashboard/dashboard')
      module.exports.Storage = dashboard.Storage
      module.exports.StorageList = dashboard.StorageList
      module.exports.StorageObject = dashboard.StorageObject
    }
  }
}
