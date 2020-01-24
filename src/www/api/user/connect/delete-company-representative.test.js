/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')

describe('/api/user/connect/delete-company-representative', () => {
  describe('exceptions', () => {
    describe('invalid-stripeid', () => {
      it('missing querystring stripeid', async () => {
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/connect/delete-company-representative')
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.delete(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-stripeid')
      })

      it('invalid querystring stripeid', async () => {
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/connect/delete-company-representative?stripeid=invalid')
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.delete(req)
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
        const req = TestHelper.createRequest(`/api/user/connect/delete-company-representative?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.delete(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-stripe-account')
      })
    })

    describe('invalid-stripe-account', () => {
      it('ineligible stripe account has no representative', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'US',
          type: 'individual'
        })
        const req = TestHelper.createRequest(`/api/user/connect/delete-company-representative?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.delete(req)
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
        const req = TestHelper.createRequest(`/api/user/connect/delete-company-representative?stripeid=${user.stripeAccount.id}`)
        req.account = user2.account
        req.session = user2.session
        let errorMessage
        try {
          await req.delete(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-account')
      })
    })
  })

  describe('returns', () => {
    it('boolean', async () => {
      const user = await TestStripeAccounts.createCompanyWithRepresentative('DE')
      const req = TestHelper.createRequest(`/api/user/connect/delete-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const deleted = await req.delete()
      assert.strictEqual(deleted, true)
    })
  })

  describe('configuration', () => {
    it('environment STRIPE_JS', async () => {
      global.stripeJS = 3
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'company'
      })
      const req2 = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
      req2.waitOnSubmit = true
      req2.account = user.account
      req2.session = user.session
      req2.uploads = {
        verification_document_back: TestHelper['success_id_scan_back.png'],
        verification_document_front: TestHelper['success_id_scan_front.png']
      }
      req2.body = {
        address_city: 'New York',
        address_country: 'US',
        address_line1: '285 Fulton St',
        address_postal_code: '10007',
        address_state: 'NY',
        dob_day: '1',
        dob_month: '1',
        dob_year: '1950',
        email: user.profile.contactEmail,
        first_name: user.profile.firstName,
        last_name: user.profile.lastName,
        phone: '456-789-0123',
        relationship_executive: 'true',
        relationship_title: 'Owner',
        ssn_last_4: '0000'
      }
      await req2.post()
      const req3 = TestHelper.createRequest(`/api/user/connect/delete-company-representative?stripeid=${user.stripeAccount.id}`)
      req3.account = user.account
      req3.session = user.session
      req3.filename = __filename
      req3.saveResponse = true
      const deleted = await req3.delete()
      assert.strictEqual(deleted, true)
    })
  })
})
