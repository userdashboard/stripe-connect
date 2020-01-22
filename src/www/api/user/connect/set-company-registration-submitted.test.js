/* eslint-env mocha */
const assert = require('assert')
const connect = require('../../../../../index.js')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')

describe('/api/user/connect/set-company-registration-submitted', () => {
  describe('exceptions', () => {
    describe('invalid-stripeid', () => {
      it('missing querystring stripeid', async () => {
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/connect/set-company-registration-submitted')
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-stripeid')
      })

      it('invalid querystring stripeid', async () => {
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/connect/set-company-registration-submitted?stripeid=invalid')
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-stripeid')
      })
    })

    describe('invalid-stripe-account', () => {
      it('ineligible stripe account for individual', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'US',
          type: 'individual'
        })
        const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-stripe-account')
      })

      it('ineligible stripe account is submitted', async () => {
        const user = await TestStripeAccounts.createSubmittedIndividual('NZ')
        const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-stripe-account')
      })
    })

    describe('invalid-account', () => {
      it('ineligible accessing account', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'DE',
          type: 'company'
        })
        const user2 = await TestHelper.createUser()
        const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
        req.account = user2.account
        req.session = user2.session
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-account')
      })
    })

    describe('invalid-payment-details', () => {
      it('ineligible registration missing payment details', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'DE',
          type: 'company'
        })
        await TestHelper.createStripeRegistration(user, {
          business_profile_mcc: '7531',
          business_profile_url: 'https://www.abcde.com',
          address_city: 'Frederiksberg',
          address_line1: '123 Park Lane',
          address_postal_code: '01067',
          address_state: 'BW',
          name: 'Company',
          phone: '456-789-0123',
          tax_id: '00000000000'
        })
        await TestHelper.createCompanyRepresentative(user, {
          address_city: 'Frederiksberg',
          address_country: 'DE',
          address_line1: '123 Sesame St',
          address_postal_code: '1020',
          address_state: 'BW',
          dob_day: '1',
          dob_month: '1',
          dob_year: '1950',
          email: user.profile.contactEmail,
          first_name: user.profile.firstName,
          last_name: user.profile.lastName,
          phone: '456-789-1230',
          relationship_executive: 'true',
          relationship_title: 'Owner'
        }, {
          verification_additional_document_back: TestHelper['success_id_scan_back.png'],
          verification_additional_document_front: TestHelper['success_id_scan_front.png'],
          verification_document_back: TestHelper['success_id_scan_back.png'],
          verification_document_front: TestHelper['success_id_scan_front.png']
        })
        const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-payment-details')
      })
    })
  })

  describe('returns', () => {
    for (const country of connect.countrySpecs) {
      it('object (' + country.id + ')', async () => {
        const user = await TestStripeAccounts.createCompanyReadyForSubmission(country.id)
        assert.strictEqual(user.stripeAccount.metadata.submitted, undefined)
        assert.strictEqual(user.stripeAccount.requirements.currently_due.length, 2)
        assert.strictEqual(user.stripeAccount.requirements.currently_due[0].startsWith('tos_acceptance'), true)
        assert.strictEqual(user.stripeAccount.requirements.currently_due[1].startsWith('tos_acceptance'), true)
        const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const stripeAccountNow = await req.patch()
        assert.notStrictEqual(stripeAccountNow.metadata.submitted, undefined)
        assert.notStrictEqual(stripeAccountNow.metadata.submitted, null)
        assert.strictEqual(stripeAccountNow.requirements.past_due.length, 0)
        assert.strictEqual(stripeAccountNow.requirements.eventually_due.length, 0)
        assert.strictEqual(stripeAccountNow.requirements.currently_due.length, 0)
      })
    }
  })
})
