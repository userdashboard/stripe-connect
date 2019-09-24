/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')

describe('/api/administrator/connect/delete-stripe-account', async () => {
  describe('exceptions', () => {
    describe('invalid-stripeid', () => {
      it('missing querystring stripeid', async () => {
        const administrator = await TestHelper.createAdministrator()
        const req = TestHelper.createRequest('/api/administrator/connect/delete-stripe-account')
        req.account = administrator.account
        req.session = administrator.session
        let errorMessage
        try {
          await req.delete()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-stripeid')
      })

      it('invalid querystring stripeid', async () => {
        const administrator = await TestHelper.createAdministrator()
        const req = TestHelper.createRequest('/api/administrator/connect/delete-stripe-account?stripeid=invalid')
        req.account = administrator.account
        req.session = administrator.session
        let errorMessage
        try {
          await req.delete()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-stripeid')
      })
    })

    describe('returns', () => {
      it('boolean', async () => {
        const administrator = await TestHelper.createAdministrator()
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'DE'
        })
        await TestHelper.createStripeRegistration(user, {
          company_tax_id: '00000000',
          company_name: user.profile.firstName + '\'s company',
          company_address_country: 'DE',
          relationship_account_opener_first_name: user.profile.firstName,
          relationship_account_opener_last_name: user.profile.lastName,
          relationship_account_opener_email: user.profile.contactEmail,
          relationship_account_opener_phone: '456-789-0123',
          relationship_account_opener_dob_day: '1',
          relationship_account_opener_dob_month: '1',
          relationship_account_opener_dob_year: '1950',
          company_address_city: 'Berlin',
          company_address_line1: 'First Street',
          company_address_postal_code: '01067',
          relationship_account_opener_address_city: 'Berlin',
          relationship_account_opener_address_line1: 'First Street',
          relationship_account_opener_address_postal_code: '01067'
        })
        const req = TestHelper.createRequest(`/api/administrator/connect/delete-stripe-account?stripeid=${user.stripeAccount.id}`)
        req.account = administrator.account
        req.session = administrator.session
        const deleted = await req.delete()
        assert.strictEqual(deleted, true)
      })
    })
  })
})
