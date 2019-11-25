/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')

describe('/api/administrator/connect/set-stripe-account-rejected', () => {
  describe('exceptions', () => {
    describe('invalid-stripeid', () => {
      it('missing querystring stripeid', async () => {
        const administrator = await TestHelper.createAdministrator()
        const req = TestHelper.createRequest('/api/administrator/connect/set-stripe-account-rejected')
        req.account = administrator.account
        req.session = administrator.session
        req.body = {
          reason: 'fraud'
        }
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-stripeid')
      })

      it('invalid querystring stripeid', async () => {
        const administrator = await TestHelper.createAdministrator()
        const req = TestHelper.createRequest('/api/administrator/connect/set-stripe-account-rejected?stripeid=invalid')
        req.account = administrator.account
        req.session = administrator.session
        req.body = {
          reason: 'fraud'
        }
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-stripeid')
      })
    })

    describe('invalid-reason', () => {
      it('missing posted reason', async () => {
        const administrator = await TestHelper.createAdministrator()
        const req = TestHelper.createRequest('/api/administrator/connect/set-stripe-account-rejected?stripeid=invalid')
        req.account = administrator.account
        req.session = administrator.session
        req.body = {
          reason: ''
        }
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-reason')
      })

      it('invalid posted reason', async () => {
        const administrator = await TestHelper.createAdministrator()
        const req = TestHelper.createRequest('/api/administrator/connect/set-stripe-account-rejected?stripeid=invalid')
        req.account = administrator.account
        req.session = administrator.session
        req.body = {
          reason: 'invalid'
        }
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-reason')
      })
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
        company_address_city: 'Bern',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '1020',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_representative_address_city: 'Bern',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: '1020',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_executive: 'true',
        relationship_representative_title: 'Owner',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_phone: '456-789-1230'
      })
      const req = TestHelper.createRequest(`/api/administrator/connect/set-stripe-account-rejected?stripeid=${user.stripeAccount.id}`)
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        reason: 'fraud'
      }
      const accountNow = await req.patch()
      assert.strictEqual(accountNow.requirements.disabled_reason, 'rejected.fraud')
    })
  })
})
