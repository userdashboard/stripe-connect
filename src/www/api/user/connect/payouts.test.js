/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')

describe(`/api/user/connect/payouts`, () => {
  describe('Payouts#GET', () => {
    it('array', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'NZ'
      })
      await TestHelper.createStripeRegistration(user, {
        individual_address_city: 'Auckland',
        individual_address_line1: '123 Sesame St',
        individual_address_postal_'secret-code': '6011',
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
      const payout1 = await TestHelper.createPayout(user)
      await TestHelper.waitForPayout(user.stripeAccount.id, null)
      const payout2 = await TestHelper.createPayout(user)
      await TestHelper.waitForPayout(user.stripeAccount.id, payout1.id)
      const payout3 = await TestHelper.createPayout(user)
      await TestHelper.waitForPayout(user.stripeAccount.id, payout2.id)
      const req = TestHelper.createRequest(`/api/user/connect/payouts?accountid=${user.account.accountid}`)
      req.account = user.account
      req.session = user.session
      const payouts = await req.get()
      assert.strictEqual(payouts.length, global.pageSize)
      assert.strictEqual(payouts[0].id, payout3.id)
      assert.strictEqual(payouts[1].id, payout2.id)
    })
  })
})
