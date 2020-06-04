/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const DashboardTestHelper = require('@userdashboard/dashboard/test-helper.js')

describe('/administrator/connect/stripe-accounts', function () {
  this.timeout(30 * 60 * 1000)
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
    const req1 = TestHelper.createRequest('/administrator/connect/stripe-accounts')
    req1.account = administrator.account
    req1.session = administrator.session
    req1.filename = __filename
    req1.screenshots = [
      { hover: '#administrator-menu-container' },
      { click: '/administrator/connect' },
      { click: '/administrator/connect/stripe-accounts' }
    ]
    await req1.route.api.before(req1)
    cachedResponses.before = req1.data
    cachedResponses.returns = await req1.get()
    global.pageSize = 3
    cachedResponses.pageSize = await req1.get()
    const req2 = TestHelper.createRequest('/administrator/connect/stripe-accounts?offset=1')
    req2.account = administrator.account
    req2.session = administrator.session
    cachedResponses.offset = await req2.get()
  })
  describe('before', () => {
    it('should bind data to req', async () => {
      const data = cachedResponses.before
      assert.strictEqual(data.stripeAccounts.length, global.pageSize)
      assert.strictEqual(data.stripeAccounts[0].id, cachedStripeAccounts[0])
      assert.strictEqual(data.stripeAccounts[1].id, cachedStripeAccounts[1])
    })
  })

  describe('view', () => {
    it('should return one page (screenshots)', async () => {
      const result = cachedResponses.returns
      const doc = TestHelper.extractDoc(result.html)
      const table = doc.getElementById('stripe-accounts-table')
      const rows = table.getElementsByTagName('tr')
      assert.strictEqual(rows.length, global.pageSize + 1)
    })

    it('should change page size', async () => {
      global.pageSize = 3
      const result = cachedResponses.pageSize
      const doc = TestHelper.extractDoc(result.html)
      const table = doc.getElementById('stripe-accounts-table')
      const rows = table.getElementsByTagName('tr')
      assert.strictEqual(rows.length, global.pageSize + 1)
    })

    it('should change offset', async () => {
      const offset = 1
      const result = cachedResponses.offset
      const doc = TestHelper.extractDoc(result.html)
      for (let i = 0, len = global.pageSize; i < len; i++) {
        assert.strictEqual(doc.getElementById(cachedStripeAccounts[offset + i]).tag, 'tr')
      }
    })
  })
})
