/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')

describe(`/api/user/connect/create-stripe-account`, async () => {
  describe('CreateStripeAccount#POST', () => {
    it('should reject invalid account type', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/api/user/connect/create-stripe-account?accountid=${user.account.accountid}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        type: 'invalid',
        country: 'US'
      }
      let errorMessage
      try {
        await req.post()
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-type')
    })

    it('should reject invalid country', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/api/user/connect/create-stripe-account?accountid=${user.account.accountid}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        type: 'individual',
        country: 'invalid'
      }
      let errorMessage
      try {
        await req.post()
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-country')
    })

    it('should create registration', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/api/user/connect/create-stripe-account?accountid=${user.account.accountid}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        type: 'individual',
        country: 'US'
      }
      const stripeAccount = await req.post()
      assert.strictEqual(stripeAccount.business_type, 'individual')
    })
  })
})
