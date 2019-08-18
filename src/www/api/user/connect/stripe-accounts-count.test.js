/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')

describe('/api/user/connect/stripe-accounts-count', async () => {
  describe('StripeAccountsCount#GET', () => {
    it('should count Stripe accounts', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'US'
      })
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'US'
      })
      const req = TestHelper.createRequest(`/api/user/connect/stripe-accounts-count?accountid=${user.account.accountid}`)
      req.account = user.account
      req.session = user.session
      const result = await req.get()
      assert.strictEqual(result, 2)
    })
  })
})
