/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')

describe('/api/user/connect/payouts', () => {
  describe('exceptions', () => {
    describe('invalid-payoutid', () => {
      it('missing querystring payoutid', async () => {
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/connect/payouts')
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.get()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-accountid')
      })

      it('invalid querystring payoutid', async () => {
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/connect/payouts?accountid=invalid')
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.get()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-accountid')
      })
    })

    describe('invalid-account', () => {
      it('ineligible accessing account', async () => {
        const user = await TestHelper.createUser()
        const user2 = await TestHelper.createUser()
        const req = TestHelper.createRequest(`/api/user/connect/payouts?accountid=${user.account.accountid}`)
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
      // const user = await TestStripeAccounts.createSubmittedIndividual('NZ')
      // TODO: swap with individual account
      // the Stripe test api has an error creating fully-activated accounts
      // so when that gets fixed this code can be changed to speed it up
      const user = await TestStripeAccounts.createSubmittedCompany('NZ')
      const payout1 = await TestHelper.createPayout(user)
      await TestHelper.waitForPayout(administrator, user.stripeAccount.id, null)
      const payout2 = await TestHelper.createPayout(user)
      await TestHelper.waitForPayout(administrator, user.stripeAccount.id, payout1.id)
      const payout3 = await TestHelper.createPayout(user)
      await TestHelper.waitForPayout(administrator, user.stripeAccount.id, payout2.id)
      const req = TestHelper.createRequest(`/api/user/connect/payouts?accountid=${user.account.accountid}`)
      req.account = user.account
      req.session = user.session
      req.filename = __filename
      req.saveResponse = true
      const payouts = await req.get()
      assert.strictEqual(payouts.length, global.pageSize)
      assert.strictEqual(payouts[0].id, payout3.id)
      assert.strictEqual(payouts[1].id, payout2.id)
    })
  })
})
