/* eslint-env mocha */
const assert = require('assert')
const properties = [
  { camelCase: 'stripeJS', raw: 'STRIPE_JS', description: 'Use client-side stripe.js in browser', value: '3', default: 'false', valueDescription: 'Integer', defaultDescription: false },
  { camelCase: 'maximumStripeRetries', raw: 'MAXIMUM_STRIPE_RETRIES', description: 'Retry Stripe web requests', value: 'true', default: '', valueDescription: 'Boolean', defaultDescription: false },
  { camelCase: 'connectWebhookEndPointSecret', raw: 'CONNECT_WEBHOOK_ENDPOINT_SECRET', description: 'Secret provided by Stripe to sign webhooks', value: 'wh_sec_xxx', default: 'localhost', valueDescription: 'IP address' },
  { camelCase: 'stripeKey', raw: 'STRIPE_KEY', description: 'The `sk_test_xxx` key from Stripe', value: 'sk_test_xxx', default: '', valueDescription: 'String' },
  { camelCase: 'stripePublishableKey', raw: 'STRIPE_PUBLISHABLE_KEY', description: 'The `pk_test_xxx` key from Stripe', value: 'pk_test_xxx', default: '', valueDescription: 'String' },
]

describe('index', () => {
  afterEach(() => {
    require('./index.js').setup(global.applicationPath)
  })
  for (const property of properties) {
    describe(property.raw, () => {
      describe(property.description, () => {
        if (!property.noDefaultValue) {
          it('default ' + (property.default || property.defaultDescription || 'unset'), async () => {
            delete (process.env[property.raw])
            delete require.cache[require.resolve('./index.js')]
            require('./index.js')
            delete require.cache[require.resolve('./index.js')]
            assert.strictEqual((global[property.camelCase] || '').toString().trim(), property.default.toString())
          })
        }
        it(property.valueDescription, async () => {
          process.env[property.raw] = property.value
          delete require.cache[require.resolve('./index.js')]
          require('./index.js')
          delete require.cache[require.resolve('./index.js')]
          assert.strictEqual(global[property.camelCase].toString(), property.value)
        })
      })
    })
  }
})
