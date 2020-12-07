/* eslint-env mocha */
const assert = require('assert')
const BindStripeKey = require('./bind-stripekey.js')
const TestHelper = require('../../../test-helper.js')

describe('server/stripe-connect/bind-stripekey', () => {
  describe('after', () => {
    it('should bind data to req', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/account/change-username')
      delete (req.stripeKey)
      req.account = user.account
      req.session = user.session
      await BindStripeKey.after(req)
      assert.notStrictEqual(req.stripeKey.apiKey, undefined)
      assert.notStrictEqual(req.stripeKey.apiKey, null)
    })
  })
})
