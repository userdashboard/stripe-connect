/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')

describe.only('/api/administrator/connect/account-stripe-accounts-count', () => {
  describe('exceptions', () => {
    describe('invalid-accountid', () => {
      it('missing querystring accountid', async () => {
        const administrator = await TestHelper.createOwner()
        const req = TestHelper.createRequest('/api/administrator/connect/account-stripe-accounts-count')
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
        const administrator = await TestHelper.createOwner()
        const req = TestHelper.createRequest('/api/administrator/connect/account-stripe-accounts-count?accountid=invalid')
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
        const administrator = await TestHelper.createOwner()
        const req = TestHelper.createRequest('/api/administrator/connect/account-stripe-accounts-count?accountid=')
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

  describe('returns', () => {
    it('integer', async () => {
      const administrator = await TestHelper.createOwner()
      const user = await TestHelper.createUser()
      for (let i = 0, len = global.pageSize + 1; i < len; i++) {
        await TestHelper.createStripeAccount(user, {
          country: 'US',
          type: 'individual'
        })
      }
      const req = TestHelper.createRequest(`/api/administrator/connect/account-stripe-accounts-count?accountid=${user.account.accountid}`)
      req.account = administrator.account
      req.session = administrator.session
      req.filename = __filename
      req.saveResponse = true
      const result = await req.get()
      assert.strictEqual(result, global.pageSize + 1)
    })
  })
})
