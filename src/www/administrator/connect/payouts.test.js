/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')

describe('/administrator/connect/payouts', () => {
  describe('Payouts#BEFORE', () => {
    it('should bind payouts to req', async () => {
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
      const payout1 = await TestHelper.createPayout(user)
      await TestHelper.waitForPayout(administrator, user.stripeAccount.id, null)
      const user2 = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user2, {
        country: 'NZ',
        type: 'individual'
      })
      await TestHelper.createStripeRegistration(user2, {
        business_profile_mcc: '7531',
        business_profile_url: 'https://www.abcde.com',
        individual_address_city: 'Auckland',
        individual_address_line1: '123 Sesame St',
        individual_address_postal_code: '6011',
        individual_address_state: 'AUK',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_email: user2.profile.contactEmail,
        individual_first_name: user2.profile.firstName,
        individual_last_name: user2.profile.lastName,
        individual_phone: '456 789 0123'
      }, {
        individual_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        individual_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        individual_verification_document_back: TestHelper['success_id_scan_back.png'],
        individual_verification_document_front: TestHelper['success_id_scan_front.png']
      })
      await TestHelper.createExternalAccount(user2, {
        account_holder_name: `${user2.profile.firstName} ${user2.profile.lastName}`,
        account_holder_type: 'individual',
        account_number: '0000000010',
        country: 'NZ',
        currency: 'nzd',
        routing_number: '110000'
      })
      await TestHelper.submitStripeAccount(user2)
      await TestHelper.waitForVerification(user2.stripeAccount.id)
      const payout2 = await TestHelper.createPayout(user2)
      await TestHelper.waitForPayout(administrator, user2.stripeAccount.id, null)
      const req = TestHelper.createRequest('/administrator/connect/payouts')
      req.account = administrator.account
      req.session = administrator.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.payouts[0].id, payout2.id)
      assert.strictEqual(req.data.payouts[1].id, payout1.id)
    })
  })

  describe('Payouts#GET', () => {
    it('should have row for each payout', async () => {
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
      const payout1 = await TestHelper.createPayout(user)
      await TestHelper.waitForPayout(administrator, user.stripeAccount.id, null)
      const user2 = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user2, {
        country: 'NZ',
        type: 'individual'
      })
      await TestHelper.createStripeRegistration(user2, {
        business_profile_mcc: '7531',
        business_profile_url: 'https://www.abcde.com',
        individual_address_city: 'Auckland',
        individual_address_line1: '123 Sesame St',
        individual_address_postal_code: '6011',
        individual_address_state: 'AUK',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_email: user2.profile.contactEmail,
        individual_first_name: user2.profile.firstName,
        individual_last_name: user2.profile.lastName,
        individual_phone: '456 789 0123'
      }, {
        individual_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        individual_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        individual_verification_document_back: TestHelper['success_id_scan_back.png'],
        individual_verification_document_front: TestHelper['success_id_scan_front.png']
      })
      await TestHelper.createExternalAccount(user2, {
        account_holder_name: `${user2.profile.firstName} ${user2.profile.lastName}`,
        account_holder_type: 'individual',
        account_number: '0000000010',
        country: 'NZ',
        currency: 'nzd',
        routing_number: '110000'
      })
      await TestHelper.submitStripeAccount(user2)
      await TestHelper.waitForVerification(user2.stripeAccount.id)
      const payout2 = await TestHelper.createPayout(user2)
      await TestHelper.waitForPayout(administrator, user2.stripeAccount.id, null)
      const req = TestHelper.createRequest('/administrator/connect/payouts')
      req.account = administrator.account
      req.session = administrator.session
      req.filename = __filename
      req.screenshots = [
        { hover: '#administrator-menu-container' },
        { click: '/administrator/stripe-connect' },
        { click: '/administrator/stripe-connect/payouts' }
      ]
      const page = await req.get()
      const doc = TestHelper.extractDoc(page)
      const payout1Row = doc.getElementById(payout1.id)
      const payout2Row = doc.getElementById(payout2.id)
      assert.strictEqual(payout1Row.tag, 'tr')
      assert.strictEqual(payout2Row.tag, 'tr')
    })
  })
})
