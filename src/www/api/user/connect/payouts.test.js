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

  describe('receives', () => {
    it('optional querystring offset (integer)', async () => {
      const offset = 1
      global.delayDiskWrites = true
      const user = await TestStripeAccounts.createSubmittedCompany('NZ')
      const payouts = []
      for (let i = 0, len = global.pageSize + 1; i < len; i++) {
        const payout = await TestHelper.createPayout(user)
        payouts.unshift(payout.id)
      }
      const req = TestHelper.createRequest(`/api/user/connect/payouts?accountid=${user.account.accountid}&offset=${offset}`)
      req.account = user.account
      req.session = user.session
      const payoutsNow = await req.get()
      for (let i = 0, len = global.pageSize; i < len; i++) {
        assert.strictEqual(payoutsNow[i].id, payouts[offset + i])
      }
    })

    it('optional querystring limit (integer)', async () => {
      const limit = 1
      const user = await TestStripeAccounts.createSubmittedCompany('NZ')
      for (let i = 0, len = limit + 1; i < len; i++) {
        await TestHelper.createPayout(user)
      }
      const req = TestHelper.createRequest(`/api/user/connect/payouts?accountid=${user.account.accountid}&limit=${limit}`)
      req.account = user.account
      req.session = user.session
      const payoutsNow = await req.get()
      assert.strictEqual(payoutsNow.length, limit)
    })

    it('optional querystring all (boolean)', async () => {
      global.pageSize = 1
      const user = await TestStripeAccounts.createSubmittedCompany('NZ')
      for (let i = 0, len = global.pageSize + 1; i < len; i++) {
        await TestHelper.createPayout(user)
      }
      const req = TestHelper.createRequest(`/api/user/connect/payouts?accountid=${user.account.accountid}&all=true`)
      req.account = user.account
      req.session = user.session
      const payoutsNow = await req.get()
      assert.strictEqual(payoutsNow.length, global.pageSize + 1)
    })
  })

  describe('returns', () => {
    it('array', async () => {
      // const user = await TestStripeAccounts.createSubmittedIndividual('NZ')
      // TODO: swap with individual account
      // the Stripe test api has an error creating fully-activated accounts
      // so when that gets fixed this code can be changed to speed it up
      const user = await TestStripeAccounts.createSubmittedCompany('NZ')
      for (let i = 0, len = global.pageSize + 1; i < len; i++) {
        await TestHelper.createPayout(user)
      }
      const req = TestHelper.createRequest(`/api/user/connect/payouts?accountid=${user.account.accountid}`)
      req.account = user.account
      req.session = user.session
      req.filename = __filename
      req.saveResponse = true
      const payouts = await req.get()
      assert.strictEqual(payouts.length, global.pageSize)
    })
  })
})
