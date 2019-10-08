/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')

describe('/api/user/connect/create-stripe-account', () => {
  describe('exceptions', () => {
    describe('invalid-accountid', () => {
      it('missing querystring accountid', async () => {
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/connect/create-stripe-account')
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-accountid')
      })

      it('invalid querystring accountid', async () => {
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/connect/create-stripe-account?accountid=invalid')
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.post()
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
        const req = TestHelper.createRequest(`/api/user/connect/create-stripe-account?accountid=${user.account.accountid}`)
        req.account = user2.account
        req.session = user2.session
        req.body = {
          type: '',
          country: 'US'
        }
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-account')
      })
    })

    describe('invalid-type', () => {
      it('missing posted type', async () => {
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest(`/api/user/connect/create-stripe-account?accountid=${user.account.accountid}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          type: '',
          country: 'US'
        }
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-type')
      })

      it('invalid posted type', async () => {
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest(`/api/user/connect/create-stripe-account?accountid=${user.account.accountid}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          type: 'invalid',
          country: 'US'
        }
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-type')
      })
    })

    describe('invalid-country', () => {
      it('invalid posted country', async () => {
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest(`/api/user/connect/create-stripe-account?accountid=${user.account.accountid}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          type: 'individual',
          country: ''
        }
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-country')
      })

      it('invalid posted country', async () => {
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest(`/api/user/connect/create-stripe-account?accountid=${user.account.accountid}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          type: 'individual',
          country: 'invalid'
        }
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-country')
      })
    })
  })

  describe('returns', () => {
    it('object', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/api/user/connect/create-stripe-account?accountid=${user.account.accountid}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        type: 'individual',
        country: 'US'
      }
      const stripeAccount = await req.post()
      assert.strictEqual(stripeAccount.business_type, 'individual')
    })
  })
})
