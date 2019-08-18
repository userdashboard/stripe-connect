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
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'US'
      })
      const user2 = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
      req.account = user2.account
      req.session = user2.session
      const stripeAccount = await req.get()
      assert.strictEqual(stripeAccount.message, 'invalid-account')
    })

    it('should return Stripe account data', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'US'
      })
      await TestHelper.createStripeRegistration(user, {
        company_name: 'Company',
        company_tax_id: '8',
        company_phone: '456-123-7890',
        company_address_city: 'New York',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '10001',
        company_address_state: 'NY',
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.email.split('@')[1],
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.email,
        relationship_account_opener_phone: '456-789-0123',
        relationship_account_opener_address_city: 'New York',
        relationship_account_opener_address_state: 'NY',
        relationship_account_opener_address_line1: '285 Fulton St',
        relationship_account_opener_address_postal_code: '10007'
      })
      const req = TestHelper.createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const stripeAccount = await req.get()
      assert.strictEqual(stripeAccount.id, user.stripeAccount.id)
    })
  })
})
