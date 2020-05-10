/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@userdashboard/dashboard/test-helper.js')

describe('/api/user/connect/payouts', function () {
  this.retries(10)
  this.timeout(360000)
  const cachedResponses = {}
  const cachedPayouts = []
  before(async () => {
    await DashboardTestHelper.setupBeforeEach()
    await TestHelper.setupBeforeEach()
    global.delayDiskWrites = true
    const user = await TestStripeAccounts.createSubmittedCompany('NZ')
    for (let i = 0, len = global.pageSize + 2; i < len; i++) {
      await TestHelper.createPayout(user)
      cachedPayouts.unshift(user.payout.id)
      if (i === 2) {
        await TestStripeAccounts.createSubmittedCompany('NZ', user)
      }
    }
    const req1 = TestHelper.createRequest(`/api/user/connect/payouts?accountid=${user.account.accountid}`)
    req1.account = user.account
    req1.session = user.session
    cachedResponses.returns = await req1.get()
    global.pageSize = 3
    cachedResponses.pageSize = await req1.get()
    const req2 = TestHelper.createRequest(`/api/user/connect/payouts?accountid=${user.account.accountid}&stripeid=${user.stripeAccount.id}`)
    req2.account = user.account
    req2.session = user.session
    cachedResponses.stripeid = await req2.get()
    const req3 = TestHelper.createRequest(`/api/user/connect/payouts?accountid=${user.account.accountid}&offset=1`)
    req3.account = user.account
    req3.session = user.session
    cachedResponses.offset = await req3.get()
    const req4 = TestHelper.createRequest(`/api/user/connect/payouts?accountid=${user.account.accountid}&limit=1`)
    req4.account = user.account
    req4.session = user.session
    cachedResponses.limit = await req4.get()
    const req5 = TestHelper.createRequest(`/api/user/connect/payouts?accountid=${user.account.accountid}&all=true`)
    req5.account = user.account
    req5.session = user.session
    cachedResponses.all = await req5.get()
  })

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

  describe('receives', function () {
    it('optional querystring offset (integer)', async () => {
      const offset = 1
      const payoutsNow = cachedResponses.offset
      for (let i = 0, len = global.pageSize; i < len; i++) {
        assert.strictEqual(payoutsNow[i].id, cachedPayouts[offset + i])
      }
    })

    it('optional querystring limit (integer)', async () => {
      const limit = 1
      const payoutsNow = cachedResponses.limit
      assert.strictEqual(payoutsNow.length, limit)
    })

    it('optional querystring all (boolean)', async () => {
      const payoutsNow = cachedResponses.all
      assert.strictEqual(payoutsNow.length, cachedPayouts.length)
    })

    it('optional querystring stripeid (boolean)', async () => {
      const payoutsNow = cachedResponses.stripeid
      assert.strictEqual(payoutsNow.length, cachedPayouts.length - 3)
    })
  })

  describe('returns', function () {
    it('array', async () => {
      const payouts = cachedResponses.returns
      assert.strictEqual(payouts.length, global.pageSize)
    })
  })

  describe('configuration', function () {
    it('environment PAGE_SIZE', async () => {
      global.pageSize = 3
      const payouts = cachedResponses.pageSize
      assert.strictEqual(payouts.length, global.pageSize)
    })
  })
})
