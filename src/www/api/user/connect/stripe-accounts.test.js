
/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')

describe(`/api/user/connect/stripe-accounts`, () => {
  describe('AccountStripeAccounts#GET', () => {
    it('should limit Stripe accounts to one page', async () => {
      const user = await TestHelper.createUser()
      for (let i = 0, len = global.pageSize + 1; i < len; i++) {
        await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'US'
      })
      }
      const req = TestHelper.createRequest(`/api/user/connect/stripe-accounts?accountid=${user.account.accountid}`)
      req.account = user.account
      req.session = user.session
      const stripeAccounts = await req.get()
      assert.strictEqual(stripeAccounts.length, global.pageSize)
    })

    it('should enforce page size', async () => {
      global.pageSize = 3
      const user = await TestHelper.createUser()
      for (let i = 0, len = global.pageSize + 1; i < len; i++) {
        await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'US'
      })
      }
      const req = TestHelper.createRequest(`/api/user/connect/stripe-accounts?accountid=${user.account.accountid}`)
      req.account = user.account
      req.session = user.session
      const stripeAccounts = await req.get()
      assert.strictEqual(stripeAccounts.length, global.pageSize)
    })

    it('should enforce specified offset', async () => {
      const offset = 1
      const stripeAccounts = []
      const user = await TestHelper.createUser()
      for (let i = 0, len = global.pageSize + 1; i < len; i++) {
        const stripeAccount = await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'US'
      })
        stripeAccounts.unshift(stripeAccount)
      }
      const req = TestHelper.createRequest(`/api/user/connect/stripe-accounts?accountid=${user.account.accountid}&offset=${offset}`)
      req.account = user.account
      req.session = user.session
      const stripeAccountsNow = await req.get()
      for (let i = 0, len = global.pageSize; i < len; i++) {
        assert.strictEqual(stripeAccountsNow[i].id, stripeAccounts[offset + i].id)
      }
    })

    it('should return all records', async () => {
      const user = await TestHelper.createUser()
      const stripeAccounts = []
      for (let i = 0, len = global.pageSize + 1; i < len; i++) {
        const stripeAccount = await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'US'
      })
        stripeAccounts.unshift(stripeAccount)
      }
      const req = TestHelper.createRequest(`/api/user/connect/stripe-accounts?accountid=${user.account.accountid}&all=true`)
      req.account = user.account
      req.session = user.session
      const stripeAccountsNow = await req.get()
      for (let i = 0, len = global.pageSize + 1; i < len; i++) {
        assert.strictEqual(stripeAccountsNow[i].id, stripeAccounts[i].id)
      }
    })
  })
})
