/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')

describe('/api/administrator/connect/account-stripe-accounts-count', () => {
  describe('returns', () => {
    it('integer', async () => {
      const administrator = await TestHelper.createAdministrator()
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'US'
      })
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'US'
      })
      const req = TestHelper.createRequest(`/api/administrator/connect/account-stripe-accounts-count?accountid=${user.account.accountid}`)
      req.account = administrator.account
      req.session = administrator.session
      const result = await req.get()
      assert.strictEqual(result, 2)
    })
  })
})
