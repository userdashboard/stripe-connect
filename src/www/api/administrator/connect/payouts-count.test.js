/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')

describe('/api/administrator/connect/payouts-count', () => {
  describe('returns', () => {
    it('integer', async () => {
      const administrator = await TestHelper.createAdministrator()
      for (let i = 0, len = global.pageSize + 1; i < len; i++) {
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
      }
      const req = TestHelper.createRequest('/api/administrator/connect/payouts-count')
      req.account = administrator.account
      req.session = administrator.session
      const result = await req.get()
      assert.strictEqual(result, global.pageSize + 1)
    })
  })
})
