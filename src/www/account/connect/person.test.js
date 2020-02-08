/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts.js')

describe('/account/connect/person', () => {
  describe('Person#BEFORE', () => {
    it('should reject invalid personid', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/account/connect/person?personid=invalid')
      req.account = user.account
      req.session = user.session
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-personid')
    })

    it('should bind owner to req', async () => {
      const user = await TestStripeAccounts.createCompanyWithOwners('FR', 1)
      const req = TestHelper.createRequest(`/account/connect/person?personid=${user.owner.id}`)
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.owner.id, user.owner.id)
    })
  })

  describe('Person#GET', () => {
    it('should show table for owner (screenshots)', async () => {
      const user = await TestStripeAccounts.createCompanyWithOwners('GB', 1)
      const req = TestHelper.createRequest(`/account/connect/person?personid=${user.owner.id}`)
      req.account = user.account
      req.session = user.session
      req.filename = __filename
      req.screenshots = [
        { hover: '#account-menu-container' },
        { click: '/account/connect' },
        { click: '/account/connect/stripe-accounts' },
        { click: `/account/connect/stripe-account?stripeid=${user.stripeAccount.id}` },
        { click: `/account/connect/persons?stripeid=${user.stripeAccount.id}` },
        { click: `/account/connect/person?personid=${user.owner.id}` }
      ]
      const page = await req.get()
      const doc = TestHelper.extractDoc(page)
      const row = doc.getElementById(user.owner.id)
      assert.strictEqual(row.tag, 'tbody')
    })
  })
})
