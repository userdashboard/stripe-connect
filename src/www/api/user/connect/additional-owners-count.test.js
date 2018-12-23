/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')

describe('/api/user/connect/additional-owners-count', () => {
  describe('AdditionalOwnersCount#GET', () => {
    it('should reject invalid stripeid', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/api/user/connect/additional-owners-count?stripeid=invalid`)
      req.account = user.account
      req.session = user.session
      const owners = await req.get()
      assert.strictEqual(owners.message, 'invalid-stripeid')
    })

    it('should reject individual account', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'US' })
      await TestHelper.createStripeRegistration(user, { city: 'New York City', postal_code: '10001', personal_id_number: '000000000', line1: 'First Street', day: '1', month: '1', year: '1950', state: 'New York', ssn_last_4: '0000' })
      const req = TestHelper.createRequest(`/api/user/connect/additional-owners-count?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const owners = await req.get()
      assert.strictEqual(owners.message, 'invalid-stripe-account')
    })

    it('should reject company that doesn\'t require owner info', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'US' })
      await TestHelper.createStripeRegistration(user, { business_tax_id: 1, business_name: user.profile.firstName + '\'s company', country: 'US', city: 'New York City', personal_city: 'New York City', postal_code: '10001', personal_id_number: '000000000', line1: 'First Street', day: '1', month: '1', year: '1950', company_city: 'New York City', company_state: 'New York', company_line1: 'First Street', company_postal_code: '10001', ssn_last_4: '0000' })
      const req = TestHelper.createRequest(`/api/user/connect/additional-owners-count?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const owners = await req.get()
      assert.strictEqual(owners.message, 'invalid-stripe-account')
    })

    it('should reject other account\'s registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'US' })
      await TestHelper.createStripeRegistration(user, { business_tax_id: 1, business_name: user.profile.firstName + '\'s company', country: 'US', city: 'New York City', personal_city: 'New York City', postal_code: '10001', personal_id_number: '000000000', line1: 'First Street', day: '1', month: '1', year: '1950', company_city: 'New York City', company_state: 'New York', company_line1: 'First Street', company_postal_code: '10001', ssn_last_4: '0000' })
      const user2 = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/api/user/connect/additional-owners-count?stripeid=${user.stripeAccount.id}`)
      req.account = user2.account
      req.session = user2.session
      const owners = await req.get()
      assert.strictEqual(owners.message, 'invalid-account')
    })

    it('should return count of owners', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'DE' })
      await TestHelper.createStripeRegistration(user, { business_tax_id: 1, business_name: user.profile.firstName + '\'s company', country: 'DE', day: '1', month: '1', year: '1950', company_city: 'Berlin', company_line1: 'First Street', company_postal_code: '01067', personal_city: 'Berlin', personal_line1: 'First Street', personal_postal_code: '01067' })
      await TestHelper.createAdditionalOwner(user, { country: 'DE', city: 'Berlin', postal_code: '01067', line1: 'First Street', day: 1, month: 1, year: 1950 })
      await TestHelper.createAdditionalOwner(user, { country: 'DE', city: 'Berlin', postal_code: '01067', line1: 'Second Street', day: 1, month: 1, year: 1950 })
      const req = TestHelper.createRequest(`/api/user/connect/additional-owners-count?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const total = await req.get()
      assert.strictEqual(total, 2)
    })
  })
})
