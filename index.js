global.stripeAPIVersion = '2019-08-14'

const packageJSON = require('./package.json')
const stripe = require('stripe')()
stripe.setApiVersion(global.stripeAPIVersion)
stripe.setAppInfo({
  version: packageJSON.version,
  name: '@userdashboard/stripe-connect',
  url: 'https://github.com/userdashboard/stripe-connect'
})

module.exports = {
  MetaData: require('./src/meta-data.js')
}
