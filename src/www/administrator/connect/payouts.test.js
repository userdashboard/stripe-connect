/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts.js')

describe('/administrator/connect/payouts', () => {
  describe('Payouts#BEFORE', () => {
    it('should bind payouts to req', async () => {
      const administrator = await TestHelper.createOwner()
      // const user = await TestStripeAccounts.createSubmittedIndividual('NZ')
      // TODO: swap with individual account
      // the Stripe test api has an error creating fully-activated accounts
      // so when that gets fixed this code can be changed to speed it up
      const user = await TestStripeAccounts.createSubmittedCompany('NZ')
      const payout1 = await TestHelper.createPayout(user)
      await TestHelper.waitForPayout(administrator, user.stripeAccount.id, null)
      const user2 = await TestStripeAccounts.createSubmittedCompany('NZ')
      const payout2 = await TestHelper.createPayout(user2)
      await TestHelper.waitForPayout(administrator, user2.stripeAccount.id, null)
      const req = TestHelper.createRequest('/administrator/connect/payouts')
      req.account = administrator.account
      req.session = administrator.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.payouts[0].id, payout2.id)
      assert.strictEqual(req.data.payouts[1].id, payout1.id)
    })
  })

  describe('Payouts#GET', () => {
    it('should have row for each payout (screenshots)', async () => {
      const administrator = await TestHelper.createOwner()
      // const user = await TestStripeAccounts.createSubmittedIndividual('NZ')
      // TODO: swap with individual account
      // the Stripe test api has an error creating fully-activated accounts
      // so when that gets fixed this code can be changed to speed it up
      const user1 = await TestStripeAccounts.createSubmittedCompany('NZ')
      const payout1 = await TestHelper.createPayout(user1)
      await TestHelper.waitForPayout(administrator, user1.stripeAccount.id, null)
      const user2 = await TestStripeAccounts.createSubmittedCompany('GB')
      const payout2 = await TestHelper.createPayout(user2)
      await TestHelper.waitForPayout(administrator, user2.stripeAccount.id, null)
      const req = TestHelper.createRequest('/administrator/connect/payouts')
      req.account = administrator.account
      req.session = administrator.session
      req.filename = __filename
      req.screenshots = [
        { hover: '#administrator-menu-container' },
        { click: '/administrator/connect' },
        { click: '/administrator/connect/payouts' }
      ]
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      const payout1Row = doc.getElementById(payout1.id)
      const payout2Row = doc.getElementById(payout2.id)
      assert.strictEqual(payout1Row.tag, 'tr')
      assert.strictEqual(payout2Row.tag, 'tr')
    })
  })
})
