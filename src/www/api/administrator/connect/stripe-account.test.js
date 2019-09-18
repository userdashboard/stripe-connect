/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')

describe('/api/administrator/connect/stripe-account', () => {
  describe('exceptions', () => {
    describe('invalid-stripeid', () => {
      it('missing querystring stripeid', async () => {
        const administrator = await TestHelper.createAdministrator()
        const req = TestHelper.createRequest('/api/administrator/connect/stripe-account-payouts-count')
        req.account = administrator.account
        req.session = administrator.session
        let errorMessage
        try {
          await req.get(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-stripeid')
      })

      it('invalid querystring stripeid', async () => {
        const administrator = await TestHelper.createAdministrator()
        const req = TestHelper.createRequest('/api/administrator/connect/stripe-account-payouts-count?stripeid=invalid')
        req.account = administrator.account
        req.session = administrator.session
        let errorMessage
        try {
          await req.get(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-stripeid')
      })
    })
  })

  describe('returns', () => {
    it('should reject invalid stripeid', async () => {
      const administrator = await TestHelper.createAdministrator()
      const req = TestHelper.createRequest('/api/administrator/connect/stripe-account?stripeid=invalid')
      req.account = administrator.account
      req.session = administrator.session
      let errorMessage
      try {
        await req.get()
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-stripeid')
    })

    it('object', async () => {
      const administrator = await TestHelper.createAdministrator()
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
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123',
        relationship_account_opener_address_city: 'New York',
        relationship_account_opener_id_number: '000000000',
        relationship_account_opener_ssn_last_4: '0000',
        relationship_account_opener_address_state: 'NY',
        relationship_account_opener_address_line1: '285 Fulton St',
        relationship_account_opener_address_postal_code: '10007'
      })
      const req = TestHelper.createRequest(`/api/administrator/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
      req.account = administrator.account
      req.session = administrator.session
      const stripeAccountNow = await req.get()
      assert.strictEqual(stripeAccountNow.id, user.stripeAccount.id)
    })
  })
})
