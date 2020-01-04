/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')

describe('/api/administrator/connect/payouts-count', () => {
  describe('returns', () => {
    it('integer', async () => {
      const administrator = await TestHelper.createOwner()
      for (let i = 0, len = global.pageSize + 1; i < len; i++) {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'NZ',
          type: 'individual'
        })
        await TestHelper.createStripeRegistration(user, {
          business_profile_mcc: '7531',
          business_profile_url: 'https://www.abcde.com',
          address_city: 'Auckland',
          address_line1: '123 Sesame St',
          address_postal_code: '6011',
          address_state: 'AUK',
          dob_day: '1',
          dob_month: '1',
          dob_year: '1950',
          email: user.profile.contactEmail,
          first_name: user.profile.firstName,
          last_name: user.profile.lastName,
          phone: '456 789 0123'
        })
        await TestHelper.createExternalAccount(user, {
          account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
          account_holder_type: 'individual',
          account_number: '0000000010',
          country: 'NZ',
          currency: 'nzd',
          routing_number: '110000'
        })
        await TestHelper.submitStripeAccount(user)
        await TestHelper.waitForVerificationFailure(user)
        await TestHelper.createStripeRegistration(user, null, {
          verification_document_back: TestHelper['success_id_scan_back.png'],
          verification_document_front: TestHelper['success_id_scan_front.png'],
          verification_additional_document_back: TestHelper['success_id_scan_back.png'],
          verification_additional_document_front: TestHelper['success_id_scan_front.png']
        })
        await TestHelper.waitForPayoutsEnabled(user)
        await TestHelper.createPayout(user)
        await TestHelper.waitForPayout(administrator, user.stripeAccount.id, null)
      }
      const req = TestHelper.createRequest('/api/administrator/connect/payouts-count')
      req.account = administrator.account
      req.session = administrator.session
      req.filename = __filename
      req.saveResponse = true
      const result = await req.get()
      assert.strictEqual(result, global.pageSize + 1)
    })
  })
})
