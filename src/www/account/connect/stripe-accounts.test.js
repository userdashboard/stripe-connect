/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const DashboardTestHelper = require('@userdashboard/dashboard/test-helper.js')

describe('/account/connect/stripe-accounts', function () {
  this.retries(10)
  this.timeout(360000)
  const cachedResponses = {}
  const cachedStripeAccounts = []
  before(async () => {
    await DashboardTestHelper.setupBeforeEach()
    await TestHelper.setupBeforeEach()
    global.delayDiskWrites = true
    const user = await TestHelper.createUser()
    await TestHelper.createStripeAccount(user, {
      country: 'US',
      type: 'individual'
    })
    cachedStripeAccounts.unshift(user.stripeAccount.id)
    for (let i = 0, len = global.pageSize + 2; i < len; i++) {
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'company'
      })
      cachedStripeAccounts.unshift(user.stripeAccount.id)
    }
    const req1 = TestHelper.createRequest('/account/connect/stripe-accounts')
    req1.account = user.account
    req1.session = user.session
    req1.filename = __filename
    req1.screenshots = [
      { hover: '#account-menu-container' },
      { click: '/account/connect' },
      { click: '/account/connect/stripe-accounts' }
    ]
    await req1.route.api.before(req1)
    cachedResponses.before = req1.data
    cachedResponses.returns = await req1.get()
  })
  describe('before', () => {
    it('should bind data to req', async () => {
      const data = cachedResponses.before
      assert.strictEqual(data.stripeAccounts.length, cachedStripeAccounts.length)
      assert.strictEqual(data.stripeAccounts[0].id, cachedStripeAccounts[0])
      assert.strictEqual(data.stripeAccounts[1].id, cachedStripeAccounts[1])
    })
  })

  describe('view', () => {
    it('should return one page (screenshots)', async () => {
      const result = cachedResponses.returns
      const doc = TestHelper.extractDoc(result.html)
      const companyTable = doc.getElementById('company-accounts-table')
      const companyRows = companyTable.getElementsByTagName('tr')
      assert.strictEqual(companyRows.length, global.pageSize + 2 + 1)
      const individualTable = doc.getElementById('individual-accounts-table')
      const individualRows = individualTable.getElementsByTagName('tr')
      assert.strictEqual(individualRows.length, 1 + 1)
    })
  })
})
