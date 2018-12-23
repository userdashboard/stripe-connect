/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../..//test-helper.js')

describe(`/administrator/connect/delete-stripe-account`, async () => {
  describe('DeleteStripeAccount#BEFORE', () => {
    it('should bind Stripe account to req', async () => {
      const administrator = await TestHelper.createAdministrator()
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'US' })
      await TestHelper.createStripeRegistration(user, { city: 'New York City', postal_code: '10001', personal_id_number: '000000000', line1: 'First Street', day: '1', month: '1', year: '1950', state: 'New York', ssn_last_4: '0000' })
      const req = TestHelper.createRequest(`/administrator/connect/delete-stripe-account?stripeid=${user.stripeAccount.id}`)
      req.account = administrator.account
      req.session = administrator.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.stripeAccount.id, user.stripeAccount.id)
    })
  })

  describe('DeleteStripeAccount#GET', () => {
    it('should present the form', async () => {
      const administrator = await TestHelper.createAdministrator()
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'US' })
      await TestHelper.createStripeRegistration(user, { city: 'New York City', postal_code: '10001', personal_id_number: '000000000', line1: 'First Street', day: '1', month: '1', year: '1950', state: 'New York', ssn_last_4: '0000' })
      const req = TestHelper.createRequest(`/administrator/connect/delete-stripe-account?stripeid=${user.stripeAccount.id}`)
      req.account = administrator.account
      req.session = administrator.session
      const page = await req.get()
      const doc = TestHelper.extractDoc(page)
      assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
      assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
    })

    it('should present the Stripe account table', async () => {
      const administrator = await TestHelper.createAdministrator()
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'US' })
      await TestHelper.createStripeRegistration(user, { city: 'New York City', postal_code: '10001', personal_id_number: '000000000', line1: 'First Street', day: '1', month: '1', year: '1950', state: 'New York', ssn_last_4: '0000' })
      const req = TestHelper.createRequest(`/administrator/connect/delete-stripe-account?stripeid=${user.stripeAccount.id}`)
      req.account = administrator.account
      req.session = administrator.session
      const page = await req.get()
      const doc = TestHelper.extractDoc(page)
      const row = doc.getElementById(user.stripeAccount.id)
      assert.strictEqual(row.tag, 'tr')
    })
  })

  describe('DeleteStripeAccount#POST', () => {
    it('should delete Stripe account', async () => {
      const administrator = await TestHelper.createAdministrator()
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'US' })
      await TestHelper.createStripeRegistration(user, { city: 'New York City', postal_code: '10001', personal_id_number: '000000000', line1: 'First Street', day: '1', month: '1', year: '1950', state: 'New York', ssn_last_4: '0000' })
      const req = TestHelper.createRequest(`/administrator/connect/delete-stripe-account?stripeid=${user.stripeAccount.id}`)
      req.account = administrator.account
      req.session = administrator.session
      await req.post()
      const req2 = TestHelper.createRequest(`/api/administrator/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
      req2.account = administrator.account
      req2.session = administrator.session
      const stripeAccount = await req2.get()
      assert.strictEqual(stripeAccount.message, 'invalid-stripeid')
    })
  })
})
