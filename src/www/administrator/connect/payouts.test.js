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
      }, {
        verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        verification_document_back: TestHelper['success_id_scan_back.png'],
        verification_document_front: TestHelper['success_id_scan_front.png']
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
      await TestHelper.waitForVerification(user)
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
        address_city: 'Auckland',
        address_line1: '123 Sesame St',
        address_postal_code: '6011',
        address_state: 'AUK',
        dob_day: '1',
        dob_month: '1',
        dob_year: '1950',
        email: user2.profile.contactEmail,
        first_name: user2.profile.firstName,
        last_name: user2.profile.lastName,
        phone: '456 789 0123'
      }, {
        verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        verification_document_back: TestHelper['success_id_scan_back.png'],
        verification_document_front: TestHelper['success_id_scan_front.png']
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
      await TestHelper.waitForVerification(user2)
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
      }, {
        verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        verification_document_back: TestHelper['success_id_scan_back.png'],
        verification_document_front: TestHelper['success_id_scan_front.png']
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
      await TestHelper.waitForVerification(user)
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
        address_city: 'Auckland',
        address_line1: '123 Sesame St',
        address_postal_code: '6011',
        address_state: 'AUK',
        dob_day: '1',
        dob_month: '1',
        dob_year: '1950',
        email: user2.profile.contactEmail,
        first_name: user2.profile.firstName,
        last_name: user2.profile.lastName,
        phone: '456 789 0123'
      }, {
        verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        verification_document_back: TestHelper['success_id_scan_back.png'],
        verification_document_front: TestHelper['success_id_scan_front.png']
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
      await TestHelper.waitForVerification(user2)
      const payout2 = await TestHelper.createPayout(user2)
      await TestHelper.waitForPayout(administrator, user2.stripeAccount.id, null)
      const req = TestHelper.createRequest('/administrator/connect/payouts')
      req.account = administrator.account
      req.session = administrator.session
      req.filename = __filename
      req.screenshots = [
        { hover: '#administrator-menu-container' },
        { click: '/administrator/connect' },
        { click: '/administrator/connect/payouts' }
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
