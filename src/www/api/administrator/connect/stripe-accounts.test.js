
/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')

describe('/api/administrator/connect/stripe-accounts', () => {
  describe('receives', () => {
    it('optional querystring offset (integer)', async () => {
      const offset = 1
      global.delayDiskWrites = true
      const stripeAccounts = []
      const administrator = await TestHelper.createAdministrator()
      for (let i = 0, len = global.pageSize + 1; i < len; i++) {
        const user = await TestHelper.createUser()
        const stripeAccount = await TestHelper.createStripeAccount(user, {
          country: 'US',
          type: 'company'
        })
        stripeAccounts.unshift(stripeAccount.id)
      }
      const req = TestHelper.createRequest(`/api/administrator/connect/stripe-accounts?offset=${offset}`)
      req.account = administrator.account
      req.session = administrator.session
      const stripeAccountsNow = await req.get()
      for (let i = 0, len = global.pageSize; i < len; i++) {
        assert.strictEqual(stripeAccountsNow[i].id, stripeAccounts[offset + i])
      }
    })

    it('optional querystring limit (integer)', async () => {
      const limit = 1
      const stripeAccounts = []
      const administrator = await TestHelper.createAdministrator()
      for (let i = 0, len = global.pageSize + 1; i < len; i++) {
        const user = await TestHelper.createUser()
        const stripeAccount = await TestHelper.createStripeAccount(user, {
          country: 'US',
          type: 'company'
        })
        stripeAccounts.unshift(stripeAccount)
      }
      const req = TestHelper.createRequest(`/api/administrator/connect/stripe-accounts?limit=${limit}`)
      req.account = administrator.account
      req.session = administrator.session
      const stripeAccountsNow = await req.get()
      assert.strictEqual(stripeAccountsNow.length, limit)
    })

    it('optional querystring all (boolean)', async () => {
      const administrator = await TestHelper.createAdministrator()
      const stripeAccounts = []
      for (let i = 0, len = global.pageSize + 1; i < len; i++) {
        const user = await TestHelper.createUser()
        const stripeAccount = await TestHelper.createStripeAccount(user, {
          country: 'US',
          type: 'company'
        })
        stripeAccounts.unshift(stripeAccount)
      }
      const req = TestHelper.createRequest('/api/administrator/connect/stripe-accounts?all=true')
      req.account = administrator.account
      req.session = administrator.session
      const stripeAccountsNow = await req.get()
      assert.strictEqual(stripeAccountsNow.length, stripeAccounts.length)
    })
  })

  describe('returns', () => {
    it('array', async () => {
      const administrator = await TestHelper.createAdministrator()
      for (let i = 0, len = global.pageSize + 1; i < len; i++) {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'US',
          type: 'company'
        })
      }
      const req = TestHelper.createRequest('/api/administrator/connect/stripe-accounts')
      req.account = administrator.account
      req.session = administrator.session
      req.filename = __filename
      req.saveResponse = true
      const stripeAccounts = await req.get()
      assert.strictEqual(stripeAccounts.length, global.pageSize)
    })
  })

  describe('configuration', () => {
    it('environment PAGE_SIZE', async () => {
      global.pageSize = 3
      const administrator = await TestHelper.createAdministrator()
      for (let i = 0, len = global.pageSize + 1; i < len; i++) {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'US',
          type: 'company'
        })
      }
      const req = TestHelper.createRequest('/api/administrator/connect/stripe-accounts')
      req.account = administrator.account
      req.session = administrator.session
      const stripeAccounts = await req.get()
      assert.strictEqual(stripeAccounts.length, global.pageSize)
    })
  })
})
