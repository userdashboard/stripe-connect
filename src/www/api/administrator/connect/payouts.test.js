/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@userdashboard/dashboard/test-helper.js')

describe('/api/administrator/connect/payouts', function () {
  const cachedResponses = {}
  const cachedPayouts = []
  const accountPayouts = []
  const stripeAccountPayouts = []
  after(TestHelper.deleteOldWebhooks)
  before(async () => {
    await DashboardTestHelper.setupBeforeEach()
    await TestHelper.setupBeforeEach()
    await TestHelper.setupWebhook()
    global.delayDiskWrites = true
    const administrator = await TestHelper.createOwner()
    for (let i = 0, len = global.pageSize + 2; i < len; i++) {
      // TODO: swap with individual account
      // the Stripe test api has an error creating fully-activated accounts
      // so when that gets fixed this code can be changed to speed it up
      const user = await TestStripeAccounts.createSubmittedCompany('NZ')
      await TestHelper.createPayout(user)
      cachedPayouts.unshift(user.payout.id)
    }
    let user = await TestStripeAccounts.createSubmittedCompany('NZ')
    const stripeid = user.stripeAccount.id
    await TestHelper.createPayout(user)
    cachedPayouts.unshift(user.payout.id)
    accountPayouts.unshift(user.payout.id)
    stripeAccountPayouts.unshift(user.payout.id)
    await TestHelper.createPayout(user)
    cachedPayouts.unshift(user.payout.id)
    accountPayouts.unshift(user.payout.id)
    stripeAccountPayouts.unshift(user.payout.id)
    user = await TestStripeAccounts.createSubmittedCompany('NZ', user)
    await TestHelper.createPayout(user)
    cachedPayouts.unshift(user.payout.id)
    accountPayouts.unshift(user.payout.id)
    const req1 = TestHelper.createRequest('/api/administrator/connect/payouts')
    req1.account = administrator.account
    req1.session = administrator.session
    cachedResponses.returns = await req1.get()
    global.pageSize = 3
    cachedResponses.pageSize = await req1.get()
    const req2 = TestHelper.createRequest('/api/administrator/connect/payouts?offset=1')
    req2.account = administrator.account
    req2.session = administrator.session
    cachedResponses.offset = await req2.get()
    const req3 = TestHelper.createRequest('/api/administrator/connect/payouts?limit=1')
    req3.account = administrator.account
    req3.session = administrator.session
    cachedResponses.limit = await req3.get()
    const req4 = TestHelper.createRequest('/api/administrator/connect/payouts?all=true')
    req4.account = administrator.account
    req4.session = administrator.session
    cachedResponses.all = await req4.get()
    const req5 = TestHelper.createRequest(`/api/administrator/connect/payouts?accountid=${user.account.accountid}&all=true`)
    req5.account = administrator.account
    req5.session = administrator.session
    cachedResponses.accountid = await req5.get()
    const req6 = TestHelper.createRequest(`/api/administrator/connect/payouts?stripeid=${stripeid}&all=true`)
    req6.account = administrator.account
    req6.session = administrator.session
    cachedResponses.stripeid = await req6.get()
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

    it('optional querystring accountid (string)', async () => {
      const payoutsNow = cachedResponses.accountid
      assert.strictEqual(payoutsNow.length, accountPayouts.length)
    })

    it('optional querystring stripeid (string)', async () => {
      const payoutsNow = cachedResponses.stripeid
      assert.strictEqual(payoutsNow.length, stripeAccountPayouts.length)
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
