
/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const DashboardTestHelper = require('@userdashboard/dashboard/test-helper.js')

describe('/api/user/connect/stripe-accounts', function () {
  this.retries(10)
  this.timeout(960000)
  const cachedResponses = {}
  const cachedStripeAccounts = []
  before(async () => {
    await DashboardTestHelper.setupBeforeEach()
    await TestHelper.setupBeforeEach()
    global.delayDiskWrites = true
    const user = await TestHelper.createUser()
    for (let i = 0, len = global.pageSize + 2; i < len; i++) {
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'company'
      })
      cachedStripeAccounts.unshift(user.stripeAccount.id)
    }
    const req1 = TestHelper.createRequest(`/api/user/connect/stripe-accounts?accountid=${user.account.accountid}`)
    req1.account = user.account
    req1.session = user.session
    cachedResponses.returns = await req1.get()
    global.pageSize = 3
    cachedResponses.pageSize = await req1.get()
    const req2 = TestHelper.createRequest(`/api/user/connect/stripe-accounts?accountid=${user.account.accountid}&offset=1`)
    req2.account = user.account
    req2.session = user.session
    cachedResponses.offset = await req2.get()
    const req3 = TestHelper.createRequest(`/api/user/connect/stripe-accounts?accountid=${user.account.accountid}&limit=1`)
    req3.account = user.account
    req3.session = user.session
    cachedResponses.limit = await req3.get()
    const req4 = TestHelper.createRequest(`/api/user/connect/stripe-accounts?accountid=${user.account.accountid}&all=true`)
    req4.account = user.account
    req4.session = user.session
    cachedResponses.all = await req4.get()
  })
  describe('exceptions', () => {
    describe('invalid-accountid', () => {
      it('missing querystring accountid', async () => {
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/connect/stripe-accounts')
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

      it('invalid querystring accountid', async () => {
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/connect/stripe-accounts?accountid=invalid')
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
        const req = TestHelper.createRequest(`/api/user/connect/stripe-accounts?accountid=${user.account.accountid}`)
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
      const stripeAccountsNow = cachedResponses.offset
      for (let i = 0, len = global.pageSize; i < len; i++) {
        assert.strictEqual(stripeAccountsNow[i].id, cachedStripeAccounts[offset + i])
      }
    })

    it('optional querystring limit (integer)', async () => {
      const limit = 1
      const stripeAccountsNow = cachedResponses.limit
      assert.strictEqual(stripeAccountsNow.length, limit)
    })

    it('optional querystring all (boolean)', async () => {
      const stripeAccountsNow = cachedResponses.all
      assert.strictEqual(stripeAccountsNow.length, cachedStripeAccounts.length)
    })
  })

  describe('returns', function () {
    it('array', async () => {
      const accounts = cachedResponses.returns
      assert.strictEqual(accounts.length, global.pageSize)
    })
  })

  describe('configuration', function () {
    it('environment PAGE_SIZE', async () => {
      global.pageSize = 3
      const accounts = cachedResponses.pageSize
      assert.strictEqual(accounts.length, global.pageSize)
    })
  })
})
