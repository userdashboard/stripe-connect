/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')

describe('/api/user/connect/stripe-account', () => {
  describe('StripeAccount#GET', () => {
    it('should reject invalid stripeid', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/api/user/connect/stripe-account?stripeid=invalid`)
      req.account = user.account
      req.session = user.session
      const stripeAccount = await req.get()
      assert.strictEqual(stripeAccount.message, 'invalid-stripeid')
    })

    it('should reject other account\'s Stripe account', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'US' })
      await TestHelper.createStripeRegistration(user, { business_tax_id: 1, business_name: user.profile.firstName + '\'s company', country: 'US', city: 'New York City', personal_city: 'New York City', postal_code: '10001', personal_id_number: '000000000', line1: 'First Street', day: '1', month: '1', year: '1950', company_city: 'New York City', company_state: 'New York', company_line1: 'First Street', company_postal_code: '10001', ssn_last_4: '0000' })
      const user2 = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
      req.account = user2.account
      req.session = user2.session
      const stripeAccount = await req.get()
      assert.strictEqual(stripeAccount.message, 'invalid-account')
    })

    it('should return Stripe account data', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'US' })
      await TestHelper.createStripeRegistration(user, { business_tax_id: 1, business_name: user.profile.firstName + '\'s company', country: 'US', city: 'New York City', personal_city: 'New York City', postal_code: '10001', personal_id_number: '000000000', line1: 'First Street', day: '1', month: '1', year: '1950', company_city: 'New York City', company_state: 'New York', company_line1: 'First Street', company_postal_code: '10001', ssn_last_4: '0000' })
      const req = TestHelper.createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const stripeAccount = await req.get()
      assert.strictEqual(stripeAccount.id, user.stripeAccount.id)
    })
  })
})
