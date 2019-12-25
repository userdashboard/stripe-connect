/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')

describe('/administrator/connect/payout', () => {
  describe('Payout#BEFORE', () => {
    it('should reject invalid payoutid', async () => {
      const administrator = await TestHelper.createAdministrator()
      const req = TestHelper.createRequest('/administrator/connect/payout?payoutid=invalid')
      req.account = administrator.account
      req.session = administrator.session
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-payoutid')
    })

    it('should bind payout to req', async () => {
      const administrator = await TestHelper.createAdministrator()
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'NZ',
        type: 'individual'
      })
      await TestHelper.createStripeRegistration(user, {
        business_profile_mcc: '7531',
        business_profile_url: 'https://www.abcde.com',
        individual_address_city: 'Auckland',
        individual_address_line1: '123 Sesame St',
        individual_address_postal_code: '6011',
        individual_address_state: 'AUK',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_email: user.profile.contactEmail,
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName,
        individual_phone: '456 789 0123'
      }, {
        individual_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        individual_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        individual_verification_document_back: TestHelper['success_id_scan_back.png'],
        individual_verification_document_front: TestHelper['success_id_scan_front.png']
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
      await TestHelper.waitForVerification(user.stripeAccount.id)
      await TestHelper.createPayout(user)
      await TestHelper.waitForPayout(administrator, user.stripeAccount.id, null)
      const req = TestHelper.createRequest(`/administrator/connect/payout?payoutid=${user.payout.id}`)
      req.account = administrator.account
      req.session = administrator.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.payout.id, user.payout.id)
    })
  })

  describe('Payout#GET', () => {
    it('should have row for payout', async () => {
      const administrator = await TestHelper.createAdministrator()
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'NZ',
        type: 'individual'
      })
      await TestHelper.createStripeRegistration(user, {
        business_profile_mcc: '7531',
        business_profile_url: 'https://www.abcde.com',
        individual_address_city: 'Auckland',
        individual_address_line1: '123 Sesame St',
        individual_address_postal_code: '6011',
        individual_address_state: 'AUK',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_email: user.profile.contactEmail,
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName,
        individual_phone: '456 789 0123'
      }, {
        individual_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        individual_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        individual_verification_document_back: TestHelper['success_id_scan_back.png'],
        individual_verification_document_front: TestHelper['success_id_scan_front.png']
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
      await TestHelper.waitForVerification(user.stripeAccount.id)
      await TestHelper.createPayout(user)
      await TestHelper.waitForPayout(administrator, user.stripeAccount.id, null)
      const req = TestHelper.createRequest(`/administrator/connect/payout?payoutid=${user.payout.id}`)
      req.account = administrator.account
      req.session = administrator.session
      req.filename = __filename
      req.screenshots = [
        { hover: '#administrator-menu-container' },
        { click: '/administrator/connect' },
        { click: '/administrator/connect/payouts' },
        { click: `/administrator/connect/payout?payoutid=${user.payout.id}` }
      ]
      const page = await req.get()
      const doc = TestHelper.extractDoc(page)
      const row = doc.getElementById(user.payout.id)
      assert.strictEqual(row.tag, 'tbody')
    })
  })
})
