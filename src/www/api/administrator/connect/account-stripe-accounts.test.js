
/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')

describe('/api/administrator/connect/account-stripe-accounts', () => {
  describe('exceptions', () => {
    describe('invalid-accountid', () => {
      it('missing querystring accountid', async () => {
        const administrator = await TestHelper.createAdministrator()
        const req = TestHelper.createRequest('/api/administrator/connect/account-stripe-accounts')
        req.account = administrator.account
        req.session = administrator.session
        let errorMessage
        try {
          errorMessage = await req.get()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-accountid')
      })

      it('invalid querystring accountid', async () => {
        const administrator = await TestHelper.createAdministrator()
        const req = TestHelper.createRequest('/api/administrator/connect/account-stripe-accounts?accountid=invalid')
        req.account = administrator.account
        req.session = administrator.session
        let errorMessage
        try {
          errorMessage = await req.get()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-accountid')
      })
    })

    describe('invalid-account', () => {
      it('missing querystring accountid', async () => {
        const administrator = await TestHelper.createAdministrator()
        const req = TestHelper.createRequest('/api/administrator/connect/account-stripe-accounts?accountid=')
        req.account = administrator.account
        req.session = administrator.session
        let errorMessage
        try {
          errorMessage = await req.get()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-accountid')
      })
    })
  })

  describe('receives', () => {
    it('optional querystring offset (integer)', async () => {
      const offset = 1
      global.delayDiskWrites = true
      const stripeAccounts = []
      const administrator = await TestHelper.createAdministrator()
      const user = await TestHelper.createUser()
      for (let i = 0, len = global.pageSize + 1; i < len; i++) {
        await TestHelper.createStripeAccount(user, {
          country: 'US',
          type: 'company'
        })
        stripeAccounts.unshift(user.stripeAccount.id)
      }
      const req = TestHelper.createRequest(`/api/administrator/connect/account-stripe-accounts?accountid=${user.account.accountid}&offset=${offset}`)
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
      const user = await TestHelper.createUser()
      for (let i = 0, len = global.pageSize + 1; i < len; i++) {
        const stripeAccount = await TestHelper.createStripeAccount(user, {
          country: 'US',
          type: 'company'
        })
        stripeAccounts.unshift(stripeAccount.id)
      }
      const req = TestHelper.createRequest(`/api/administrator/connect/account-stripe-accounts?accountid=${user.account.accountid}&limit=${limit}`)
      req.account = administrator.account
      req.session = administrator.session
      const stripeAccountsNow = await req.get()
      assert.strictEqual(stripeAccountsNow.length, limit)
    })

    it('optional querystring all (boolean)', async () => {
      const administrator = await TestHelper.createAdministrator()
      const stripeAccounts = []
      const user = await TestHelper.createUser()
      for (let i = 0, len = global.pageSize + 1; i < len; i++) {
        const stripeAccount = await TestHelper.createStripeAccount(user, {
          country: 'US',
          type: 'company'
        })
        stripeAccounts.unshift(stripeAccount.id)
      }
      const req = TestHelper.createRequest(`/api/administrator/connect/account-stripe-accounts?accountid=${user.account.accountid}&all=true`)
      req.account = administrator.account
      req.session = administrator.session
      const stripeAccountsNow = await req.get()
      assert.strictEqual(stripeAccountsNow.length, stripeAccounts.length)
    })
  })
  describe('returns', () => {
    it('array', async () => {
      const administrator = await TestHelper.createAdministrator()
      const user = await TestHelper.createUser()
      for (let i = 0, len = global.pageSize + 1; i < len; i++) {
        await TestHelper.createStripeAccount(user, {
          country: 'US',
          type: 'company'
        })
      }
      const req = TestHelper.createRequest(`/api/administrator/connect/account-stripe-accounts?accountid=${user.account.accountid}`)
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
      const user = await TestHelper.createUser()
      for (let i = 0, len = global.pageSize + 1; i < len; i++) {
        await TestHelper.createStripeAccount(user, {
          country: 'US',
          type: 'company'
        })
      }
      const req = TestHelper.createRequest(`/api/administrator/connect/account-stripe-accounts?accountid=${user.account.accountid}`)
      req.account = administrator.account
      req.session = administrator.session
      const stripeAccounts = await req.get()
      assert.strictEqual(stripeAccounts.length, global.pageSize)
    })
  })
})
