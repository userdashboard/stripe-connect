
/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const DashboardTestHelper = require('@userdashboard/dashboard/test-helper.js')

describe('/api/administrator/connect/stripe-accounts', function () {
  this.retries(10)
  this.timeout(960000)
  const cachedResponses = {}
  const cachedStripeAccounts = []
  before(async () => {
    await DashboardTestHelper.setupBeforeEach()
    await TestHelper.setupBeforeEach()
    global.delayDiskWrites = true
    const administrator = await TestHelper.createOwner()
    for (let i = 0, len = global.pageSize + 2; i < len; i++) {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'company'
      })
      cachedStripeAccounts.unshift(user.stripeAccount.id)
    }
    const user = await TestHelper.createUser()
    await TestHelper.createStripeAccount(user, {
      country: 'US',
      type: 'individual'
    })
    cachedStripeAccounts.unshift(user.stripeAccount.id)
    await TestHelper.createStripeAccount(user, {
      country: 'US',
      type: 'company'
    })
    cachedStripeAccounts.unshift(user.stripeAccount.id)
    const req1 = TestHelper.createRequest('/api/administrator/connect/stripe-accounts')
    req1.account = administrator.account
    req1.session = administrator.session
    cachedResponses.returns = await req1.get()
    global.pageSize = 3
    cachedResponses.pageSize = await req1.get()
    const req2 = TestHelper.createRequest('/api/administrator/connect/stripe-accounts?offset=1')
    req2.account = administrator.account
    req2.session = administrator.session
    cachedResponses.offset = await req2.get()
    const req3 = TestHelper.createRequest('/api/administrator/connect/stripe-accounts?limit=1')
    req3.account = administrator.account
    req3.session = administrator.session
    cachedResponses.limit = await req3.get()
    const req4 = TestHelper.createRequest('/api/administrator/connect/stripe-accounts?all=true')
    req4.account = administrator.account
    req4.session = administrator.session
    cachedResponses.all = await req4.get()
    const req5 = TestHelper.createRequest(`/api/administrator/connect/stripe-accounts?accountid=${user.account.accountid}`)
    req5.account = administrator.account
    req5.session = administrator.session
    cachedResponses.accountid = await req5.get()
  })
  describe('exceptions', () => {
    describe('invalid-accountid', () => {
      it('invalid querystring accountid', async () => {
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/administrator/connect/stripe-accounts?accountid=invalid')
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

    it('optional querystring accountid (string)', async () => {
      const stripeAccountsNow = cachedResponses.accountid
      assert.strictEqual(stripeAccountsNow.length, 2)
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
