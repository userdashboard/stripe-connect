/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')

describe(`/account/connect/create-registration`, async () => {
  describe('CreateRegistration#GET', () => {
    it('should present the form', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/account/connect/create-registration`)
      req.account = user.account
      req.session = user.session
      const page = await req.get()
      const doc = TestHelper.extractDoc(page)
      assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
      assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
    })
  })

  describe('CreateRegistration#POST', () => {
    it('should create authorized Stripe account', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/account/connect/create-registration`)
      req.account = user.account
      req.session = user.session
      req.body = {
        type: 'company',
        country: 'AT'
      }
      await req.post()
      const req2 = TestHelper.createRequest(`/api/user/connect/stripe-accounts?accountid=${user.account.accountid}`)
      req2.account = user.account
      req2.session = user.session
      const stripeAccounts = await req2.get()
      assert.strictEqual(stripeAccounts.length, 1)
    })
  })
})
