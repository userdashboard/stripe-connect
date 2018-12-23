/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../..//test-helper.js')

describe(`/administrator/connect/stripe-account`, () => {
  describe('StripeAccount#BEFORE', () => {
    it('should bind reject invalid stripeid', async () => {
      const administrator = await TestHelper.createAdministrator()
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'US' })
      await TestHelper.createStripeRegistration(user, { city: 'New York City', postal_code: '10001', personal_id_number: '000000000', line1: 'First Street', day: '1', month: '1', year: '1950', state: 'New York', ssn_last_4: '0000' })
      const req = TestHelper.createRequest(`/administrator/connect/stripe-account?stripeid=invalid`)
      req.account = administrator.account
      req.session = administrator.session
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-stripeid')
    })

    it('should bind Stripe account to req', async () => {
      const administrator = await TestHelper.createAdministrator()
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'US' })
      await TestHelper.createStripeRegistration(user, { city: 'New York City', postal_code: '10001', personal_id_number: '000000000', line1: 'First Street', day: '1', month: '1', year: '1950', state: 'New York', ssn_last_4: '0000' })
      const req = TestHelper.createRequest(`/administrator/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
      req.account = administrator.account
      req.session = administrator.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.stripeAccount.id, user.stripeAccount.id)
    })
  })

  describe('StripeAccount#GET', () => {
    it('should have row for Stripe account', async () => {
      const administrator = await TestHelper.createAdministrator()
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'US' })
      await TestHelper.createStripeRegistration(user, { city: 'New York City', postal_code: '10001', personal_id_number: '000000000', line1: 'First Street', day: '1', month: '1', year: '1950', state: 'New York', ssn_last_4: '0000' })
      const req = TestHelper.createRequest(`/administrator/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
      req.account = administrator.account
      req.session = administrator.session
      const page = await req.get()
      const doc = TestHelper.extractDoc(page)
      const tbody = doc.getElementById(user.stripeAccount.id)
      assert.strictEqual(tbody.tag, 'tbody')
    })
  })
})
