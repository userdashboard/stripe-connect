/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')

describe('/api/administrator/connect/payouts', () => {
  describe('receives', () => {
    it('optional querystring offset (integer)', async () => {
      const offset = 1
      global.delayDiskWrites = true
      const administrator = await TestHelper.createOwner()
      const payouts = []
      for (let i = 0, len = global.pageSize + 1; i < len; i++) {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'NZ',
          type: 'individual'
        })
        await TestHelper.createStripeRegistration(user, {
          business_profile_mcc: '7531',
          business_profile_url: 'https://www.abcde.com',
          individual_address_city: 'Auckland',
          individual_address_country: 'NZ',
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
        payouts.unshift(user.payout.id)
      }
      const req = TestHelper.createRequest(`/api/administrator/connect/payouts?offset=${offset}`)
      req.account = administrator.account
      req.session = administrator.session
      const payoutsNow = await req.get()
      for (let i = 0, len = global.pageSize; i < len; i++) {
        assert.strictEqual(payoutsNow[i].id, payouts[offset + i])
      }
    })

    it('optional querystring limit (integer)', async () => {
      const limit = 1
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
          individual_address_city: 'Auckland',
          individual_address_country: 'NZ',
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
      }
      const req = TestHelper.createRequest(`/api/administrator/connect/payouts?limit=${limit}`)
      req.account = administrator.account
      req.session = administrator.session
      const payoutsNow = await req.get()
      assert.strictEqual(payoutsNow.length, limit)
    })

    it('optional querystring all (boolean)', async () => {
      const administrator = await TestHelper.createOwner()
      const payouts = []
      for (let i = 0, len = global.pageSize + 1; i < len; i++) {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'NZ',
          type: 'individual'
        })
        await TestHelper.createStripeRegistration(user, {
          business_profile_mcc: '7531',
          business_profile_url: 'https://www.abcde.com',
          individual_address_city: 'Auckland',
          individual_address_country: 'NZ',
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
        payouts.unshift(user.payout.id)
      }
      const req = TestHelper.createRequest('/api/administrator/connect/payouts?all=true')
      req.account = administrator.account
      req.session = administrator.session
      const payoutsNow = await req.get()
      assert.strictEqual(payoutsNow.length, payouts.length)
    })
  })

  describe('returns', () => {
    it('array', async () => {
      const administrator = await TestHelper.createAdministrator()
      for (let i = 0, len = global.pageSize + 1; i < len; i++) {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'NZ',
          type: 'individual'
        })
        await TestHelper.createStripeRegistration(user, {
          business_profile_mcc: '7531',
          business_profile_url: 'https://www.abcde.com',
          individual_address_city: 'Auckland',
          individual_address_country: 'NZ',
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
      }
      const req = TestHelper.createRequest('/api/administrator/connect/payouts')
      req.account = administrator.account
      req.session = administrator.session
      const payouts = await req.get()
      assert.strictEqual(payouts.length, global.pageSize)
    })
  })

  describe('configuration', () => {
    it('environment PAGE_SIZE', async () => {
      global.pageSize = 3
      const administrator = await TestHelper.createAdministrator()
      for (let i = 0, len = global.pageSize + 1; i < len; i++) {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'NZ',
          type: 'individual'
        })
        await TestHelper.createStripeRegistration(user, {
          business_profile_mcc: '7531',
          business_profile_url: 'https://www.abcde.com',
          individual_address_city: 'Auckland',
          individual_address_country: 'NZ',
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
      }
      const req = TestHelper.createRequest('/api/administrator/connect/payouts')
      req.account = administrator.account
      req.session = administrator.session
      const payouts = await req.get()
      assert.strictEqual(payouts.length, global.pageSize)
    })
  })
})
