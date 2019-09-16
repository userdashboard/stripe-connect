/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')

describe('/api/administrator/connect/payout', () => {
  describe('exceptions', () => {
    describe('invalid-payoputid', () => {
      it('missing querystring payoutid', async () => {
        const administrator = await TestHelper.createAdministrator()
        const req = TestHelper.createRequest('/api/administrator/connect/payout')
        req.account = administrator.account
        req.session = administrator.session
        const payout = await req.get()
        assert.strictEqual(payout.message, 'invalid-payoutid')
      })

      it('invalid querystring payoutid', async () => {
        const administrator = await TestHelper.createAdministrator()
        const req = TestHelper.createRequest('/api/administrator/connect/payout?payoutid=invalid')
        req.account = administrator.account
        req.session = administrator.session
        const payout = await req.get()
        assert.strictEqual(payout.message, 'invalid-payoutid')
      })
    })
  })

  describe('returns', () => {
    it('object', async () => {
      const administrator = await TestHelper.createAdministrator()
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'NZ'
      })
      await TestHelper.createStripeRegistration(user, {
        individual_address_city: 'Auckland',
        individual_address_line1: '123 Sesame St',
        individual_address_postal_code: '6011',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'nzd',
        country: 'NZ',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        account_number: '0000000010',
        routing_number: '110000'
      })
      await TestHelper.submitStripeAccount(user)
      await TestHelper.waitForVerification(user.stripeAccount.id)
      await TestHelper.createPayout(user)
      await TestHelper.waitForPayout(user.stripeAccount.id, null)
      const req = TestHelper.createRequest(`/api/administrator/connect/payout?payoutid=${user.payout.id}`)
      req.account = administrator.account
      req.session = administrator.session
      const payout = await req.get()
      assert.strictEqual(payout.id, user.payout.id)
    })
  })
})
