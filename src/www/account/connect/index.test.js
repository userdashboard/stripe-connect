/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts.js')

describe('/account/connect', () => {
  describe('before', () => {
    it('should bind data to req', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'individual'
      })
      await TestHelper.updateStripeAccount(user, TestStripeAccounts.createPostData(TestStripeAccounts.individualData.US, user.profile))
      const req = TestHelper.createRequest('/account/connect')
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.stripeAccounts[0].id, user.stripeAccount.id)
    })
  })

  describe('view', () => {
    it('should have row for each Stripe account (screenshots)', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'individual'
      })
      await TestHelper.updateStripeAccount(user, TestStripeAccounts.createPostData(TestStripeAccounts.individualData.US, user.profile))
      const req = TestHelper.createRequest('/account/connect')
      req.account = user.account
      req.session = user.session
      req.filename = __filename
      req.screenshots = [
        { hover: '#account-menu-container' },
        { click: '/account/connect' }
      ]
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      const row = doc.getElementById(user.stripeAccount.id)
      assert.strictEqual(row.tag, 'tr')
    })
  })
})
