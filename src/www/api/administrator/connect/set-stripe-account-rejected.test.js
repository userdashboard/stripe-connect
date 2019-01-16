/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')

describe(`/api/administrator/connect/set-stripe-account-rejected`, async () => {
  describe('RejectStripeAccount#BEFORE', () => {
    it('should reject invalid stripeid', async () => {
      const administrator = await TestHelper.createAdministrator()
      const req = TestHelper.createRequest(`/api/administrator/connect/set-stripe-account-rejected?stripeid=invalid`)
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        reason: 'fraud'
      }
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-stripeid')
    })

    it('should reject invalid reason', async () => {
      const administrator = await TestHelper.createAdministrator()
      const req = TestHelper.createRequest(`/api/administrator/connect/set-stripe-account-rejected?stripeid=invalid`)
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        reason: 'invalid'
      }
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-reason')
    })
  })

  describe('RejectStripeAccount#PATCH', () => {
    it('should update the Stripe account as rejected', async () => {
      const administrator = await TestHelper.createAdministrator()
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'DE' })
      await TestHelper.createStripeRegistration(user, { business_tax_id: 1, business_name: user.profile.firstName + '\'s company', country: 'DE', day: '1', month: '1', year: '1950', company_city: 'Berlin', company_line1: 'First Street', company_postal_code: '01067', personal_city: 'Berlin', personal_line1: 'First Street', personal_postal_code: '01067' })
      const req = TestHelper.createRequest(`/api/administrator/connect/set-stripe-account-rejected?stripeid=${user.stripeAccount.id}`)
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        reason: 'fraud'
      }
      const accountNow = await req.patch()
      assert.strictEqual(accountNow.verification.disabled_reason, 'rejected.fraud')
    })
  })
})
