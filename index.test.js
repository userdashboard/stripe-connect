/* eslint-env mocha */
const assert = require('assert')
const properties = [
  { camelCase: 'stripeJS', raw: 'STRIPE_JS', description: 'Use client-side stripe.js in browser', value: '3', default: '', valueDescription: 'Integer' },
  { camelCase: 'maximumStripeRetries', raw: 'MAXIMUM_STRIPE_RETRIES', description: 'Retry Stripe web requests', value: '2', default: '', valueDescription: 'Integer', defaultDescription: '0' },
  { camelCase: 'connectWebhookEndPointSecret', raw: 'CONNECT_WEBHOOK_ENDPOINT_SECRET', description: 'Secret provided by Stripe to sign webhooks', value: 'wh_sec_xxx', valueDescription: 'String', noDefaultValue: true },
  { camelCase: 'stripeKey', raw: 'STRIPE_KEY', description: 'The `sk_test_xxx` key from Stripe', value: 'sk_test_xxx', valueDescription: 'String', noDefaultValue: true },
  { camelCase: 'stripePublishableKey', raw: 'STRIPE_PUBLISHABLE_KEY', description: 'The `pk_test_xxx` key from Stripe', value: 'pk_test_xxx', valueDescription: 'String', noDefaultValue: true }
]

const stripeKey = process.env.STRIPE_KEY
const stripePublishableKey = process.env.STRIPE_PUBLISHABLE_KEY
const webhookSecret = process.env.CONNECT_WEBHOOK_ENDPOINT_SECRET

describe('index', () => {
  afterEach(() => {
    process.env.STRIPE_KEY = stripeKey
    process.env.STRIPE_PUBLISHABLE_KEY = stripePublishableKey
    process.env.CONNECT_WEBHOOK_ENDPOINT_SECRET = webhookSecret
    global.connectWebhookEndPointSecret = false
    delete (require.cache[require.resolve('./index.js')])
    require('./index.js').setup(global.applicationPath)
  })
  after(() => {
    delete (require.cache[require.resolve('./index.js')])
    require('./index.js').setup(global.applicationPath)
  })
  for (const property of properties) {
    describe(property.raw, () => {
      describe(property.description, () => {
        if (!property.noDefaultValue) {
          it('default ' + (property.default || property.defaultDescription || 'unset'), async () => {
            if (property.raw.startsWith('STRIPE_')) {
              process.env.CONNECT_WEBHOOK_ENDPOINT_SECRET = 'wh_sec_xxx'
              process.env.STRIPE_KEY = 'sk_test_xxx'
              process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test_xxx'
            }
            delete (process.env[property.raw])
            delete (require.cache[require.resolve('./index.js')])
            require('./index.js')
            delete (require.cache[require.resolve('./index.js')])
            assert.strictEqual((global[property.camelCase] || '').toString().trim(), property.default.toString())
          })
        }
        it(property.valueDescription, async () => {
          if (property.raw.startsWith('STRIPE_')) {
            process.env.CONNECT_WEBHOOK_ENDPOINT_SECRET = 'wh_sec_xxx'
            process.env.STRIPE_KEY = 'sk_test_xxx'
            process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test_xxx'
          }
          delete (require.cache[require.resolve('./index.js')])
          process.env[property.raw] = property.value
          global.connectWebhookEndPointSecret = false
          require('./index.js')
          assert.strictEqual(global[property.camelCase].toString(), property.value)
          delete (require.cache[require.resolve('./index.js')])
        })
      })
      process.env.CONNECT_WEBHOOK_ENDPOINT_SECRET = webhookSecret
      process.env.STRIPE_KEY = stripeKey
      process.env.STRIPE_PUBLISHABLE_KEY = stripePublishableKey
      delete (require.cache[require.resolve('./index.js')])
      require('./index.js').setup(global.applicationPath)
    })
  }
})
