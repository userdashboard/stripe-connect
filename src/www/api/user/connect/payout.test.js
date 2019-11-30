/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')

describe('/api/user/connect/payout', () => {
  describe('exceptions', () => {
    describe('invalid-payoutid', () => {
      it('missing querystring payoutid', async () => {
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/connect/payout')
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.get()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-payoutid')
      })

      it('invalid querystring payoutid', async () => {
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/connect/payout?payoutid=invalid')
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.get()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-payoutid')
      })
    })

    describe('invalid-account', () => {
      it('ineligible accessing account', async () => {
        const administrator = await TestHelper.createOwner()
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'individual',
          country: 'NZ'
        })
        await TestHelper.createStripeRegistration(user, {
          business_profile_url: 'https://www.abcde.com',
          business_profile_mcc: '7531',
          individual_address_city: 'Auckland',
          individual_address_state: 'AUK',
          individual_address_country: 'NZ',
          individual_address_line1: '123 Sesame St',
          individual_address_postal_code: '6011',
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_first_name: user.profile.firstName,
          individual_last_name: user.profile.lastName,
          individual_email: user.profile.contactEmail,
          individual_phone: '456 789 0123'
        }, {
          individual_verification_document_front: TestHelper['success_id_scan_front.png'],
          individual_verification_document_back: TestHelper['success_id_scan_back.png'],
          individual_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
          individual_verification_additional_document_back: TestHelper['success_id_scan_back.png']
        })
        await TestHelper.createExternalAccount(user, {
          currency: 'nzd',
          country: 'NZ',
          account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
          account_holder_type: 'individual',
          account_number: '0000000010',
          routing_number: '110000'
        })
        await TestHelper.submitStripeAccount(user)
        await TestHelper.waitForVerification(user.stripeAccount.id)
        await TestHelper.createPayout(user)
        await TestHelper.waitForPayout(administrator, user.stripeAccount.id, null)
        const user2 = await TestHelper.createUser()
        const req = TestHelper.createRequest(`/api/user/connect/payout?payoutid=${user.payout.id}`)
        req.account = user2.account
        req.session = user2.session
        let errorMessage
        try {
          await req.get()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-account')
      })
    })
  })

  describe('returns', () => {
    it('array', async () => {
      const administrator = await TestHelper.createOwner()
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'NZ'
      })
      await TestHelper.createStripeRegistration(user, {
        business_profile_url: 'https://www.abcde.com',
        business_profile_mcc: '7531',
        individual_address_city: 'Auckland',
        individual_address_state: 'AUK',
        individual_address_country: 'NZ',
        individual_address_line1: '123 Sesame St',
        individual_address_postal_code: '6011',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName,
        individual_email: user.profile.contactEmail,
        individual_phone: '456 789 0123'
      }, {
        individual_verification_document_front: TestHelper['success_id_scan_front.png'],
        individual_verification_document_back: TestHelper['success_id_scan_back.png'],
        individual_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        individual_verification_additional_document_back: TestHelper['success_id_scan_back.png']
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'nzd',
        country: 'NZ',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_holder_type: 'individual',
        account_number: '0000000010',
        routing_number: '110000'
      })
      await TestHelper.submitStripeAccount(user)
      await TestHelper.waitForVerification(user.stripeAccount.id)
      await TestHelper.createPayout(user)
      await TestHelper.waitForPayout(administrator, user.stripeAccount.id, null)
      const req = TestHelper.createRequest(`/api/user/connect/payout?payoutid=${user.payout.id}`)
      req.account = user.account
      req.session = user.session
      const payout = await req.get()
      assert.strictEqual(payout.id, user.payout.id)
    })
  })
})
