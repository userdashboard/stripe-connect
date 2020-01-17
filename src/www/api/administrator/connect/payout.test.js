/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')

describe('/api/administrator/connect/payout', () => {
  describe('exceptions', () => {
    describe('invalid-payoputid', () => {
      it('missing querystring payoutid', async () => {
        const administrator = await TestHelper.createOwner()
        const req = TestHelper.createRequest('/api/administrator/connect/payout')
        req.account = administrator.account
        req.session = administrator.session
        let errorMessage
        try {
          await req.get()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-payoutid')
      })

      it('invalid querystring payoutid', async () => {
        const administrator = await TestHelper.createOwner()
        const req = TestHelper.createRequest('/api/administrator/connect/payout?payoutid=invalid')
        req.account = administrator.account
        req.session = administrator.session
        let errorMessage
        try {
          await req.get()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-payoutid')
      })
    })
  })

  describe('returns', () => {
    it('object', async () => {
      const administrator = await TestHelper.createOwner()
      const user = await TestStripeAccounts.createSubmittedIndividual('NZ')
      await TestHelper.waitForPayoutsEnabled(user)
      await TestHelper.createPayout(user)
      await TestHelper.waitForPayout(administrator, user.stripeAccount.id, null)
      const req = TestHelper.createRequest(`/api/administrator/connect/payout?payoutid=${user.payout.id}`)
      req.account = administrator.account
      req.session = administrator.session
      req.filename = __filename
      req.saveResponse = true
      const payout = await req.get()
      assert.strictEqual(payout.id, user.payout.id)
    })
  })
})
