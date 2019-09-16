/* eslint-env mocha */
const assert = require('assert')
const BindStripeKey = require('./bind-stripekey.js')
const TestHelper = require('../../test-helper.js')

describe('server/bind-stripekey', async () => {
  describe('BindStripeKey#AFTER', () => {
    it('should bind stripekey data to req', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/account/change-username')
      delete (req.stripeKey)
      req.account = user.account
      req.session = user.session
      await BindStripeKey.after(req)
      assert.notStrictEqual(req.stripeKey.api_key, undefined)
      assert.notStrictEqual(req.stripeKey.api_key, null)
    })
  })
})
