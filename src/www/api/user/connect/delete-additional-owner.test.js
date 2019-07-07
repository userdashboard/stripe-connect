/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')

describe(`/api/user/connect/delete-additional-owner`, async () => {
  describe('DeleteAdditionalOwner#DELETE', () => {
    it('should reject invalid ownerid', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/api/user/connect/delete-additional-owner?ownerid=invalid`)
      req.account = user.account
      req.session = user.session
      let errorMessage
      try {
        await req.route.api.delete(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-ownerid')
    })

    it('should reject other account\'s registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'DE' })
      await TestHelper.createStripeRegistration(user, { business_tax_id: 1, business_name: user.profile.firstName + '\'s company', country: 'DE', day: '1', month: '1', year: '1950', company_city: 'Berlin', company_line1: 'First Street', company_postal_code: '01067', personal_city: 'Berlin', personal_line1: 'First Street', personal_postal_code: '01067' })
      const owner = await TestHelper.createAdditionalOwner(user, { country: 'DE', city: 'Berlin', postal_code: '01067', line1: 'First Street', day: 1, month: 1, year: 1950 })
      const user2 = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/api/user/connect/delete-additional-owner?ownerid=${owner.ownerid}`)
      req.account = user2.account
      req.session = user2.session
      let errorMessage
      try {
        await req.route.api.delete(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-account')
    })

    it('should delete owner', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'DE' })
      await TestHelper.createStripeRegistration(user, { business_tax_id: 1, business_name: user.profile.firstName + '\'s company', country: 'DE', day: '1', month: '1', year: '1950', company_city: 'Berlin', company_line1: 'First Street', company_postal_code: '01067', personal_city: 'Berlin', personal_line1: 'First Street', personal_postal_code: '01067' })
      const owner = await TestHelper.createAdditionalOwner(user, { country: 'DE', city: 'Berlin', postal_code: '01067', line1: 'First Street', day: 1, month: 1, year: 1950 })
      const req = TestHelper.createRequest(`/api/user/connect/delete-additional-owner?ownerid=${owner.ownerid}`)
      req.account = user.account
      req.session = user.session
      await req.delete(req)
      const req2 = TestHelper.createRequest(`/api/user/connect/additional-owner?ownerid=${owner.ownerid}`)
      req2.account = user.account
      req2.session = user.session
      const ownerNow = await req2.get()
      assert.strictEqual(ownerNow.message, 'invalid-ownerid')
    })
  })
})
