/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')

describe('/api/administrator/connect/delete-stripe-account', () => {
  describe('exceptions', () => {
    describe('invalid-stripeid', () => {
      it('missing querystring stripeid', async () => {
        const administrator = await TestHelper.createAdministrator()
        const req = TestHelper.createRequest('/api/administrator/connect/delete-stripe-account')
        req.account = administrator.account
        req.session = administrator.session
        let errorMessage
        try {
          await req.delete()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-stripeid')
      })

      it('invalid querystring stripeid', async () => {
        const administrator = await TestHelper.createAdministrator()
        const req = TestHelper.createRequest('/api/administrator/connect/delete-stripe-account?stripeid=invalid')
        req.account = administrator.account
        req.session = administrator.session
        let errorMessage
        try {
          await req.delete()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-stripeid')
      })
    })

    describe('returns', () => {
      it('boolean', async () => {
        const administrator = await TestHelper.createAdministrator()
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'DE'
        })
        const req = TestHelper.createRequest(`/api/administrator/connect/delete-stripe-account?stripeid=${user.stripeAccount.id}`)
        req.account = administrator.account
        req.session = administrator.session
        const deleted = await req.delete()
        assert.strictEqual(deleted, true)
      })
    })
  })
})
