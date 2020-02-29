/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')

describe('/api/administrator/connect/stripe-account-payouts', () => {
  describe('exceptions', () => {
    describe('invalid-stripeid', () => {
      it('missing querystring stripeid', async () => {
        const administrator = await TestHelper.createOwner()
        const req = TestHelper.createRequest('/api/administrator/connect/stripe-account-payouts')
        req.account = administrator.account
        req.session = administrator.session
        let errorMessage
        try {
          await req.get(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-stripeid')
      })

      it('invalid querystring stripeid', async () => {
        const administrator = await TestHelper.createOwner()
        const req = TestHelper.createRequest('/api/administrator/connect/stripe-account-payouts?stripeid=invalid')
        req.account = administrator.account
        req.session = administrator.session
        let errorMessage
        try {
          await req.get(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-stripeid')
      })
    })
  })

  describe('receives', () => {
    it('optional querystring offset (integer)', async () => {
      const offset = 1
      global.delayDiskWrites = true
      const administrator = await TestHelper.createOwner()
      const user = await TestStripeAccounts.createSubmittedCompany('NZ')
      const payouts = []
      for (let i = 0, len = global.pageSize + 1; i < len; i++) {
        const payout = await TestHelper.createPayout(user)
        payouts.unshift(payout.id)
      }
      const req = TestHelper.createRequest(`/api/administrator/connect/stripe-account-payouts?stripeid=${user.stripeAccount.id}&offset=${offset}`)
      req.account = administrator.account
      req.session = administrator.session      
      const payoutsNow = await req.get()
      for (let i = 0, len = global.pageSize; i < len; i++) {
        assert.strictEqual(payoutsNow[i].id, payouts[offset + i])
      }
    })

    it('optional querystring limit (integer)', async () => {
      const limit = 1
      const administrator = await TestHelper.createOwner()
      const user = await TestStripeAccounts.createSubmittedCompany('NZ')
      for (let i = 0, len = limit + 1; i < len; i++) {
        await TestHelper.createPayout(user)
      }
      const req = TestHelper.createRequest(`/api/administrator/connect/stripe-account-payouts?stripeid=${user.stripeAccount.id}&limit=${limit}`)
      req.account = administrator.account
      req.session = administrator.session      
      const payoutsNow = await req.get()
      assert.strictEqual(payoutsNow.length, limit)
    })

    it('optional querystring all (boolean)', async () => {
      global.pageSize = 1
      const administrator = await TestHelper.createOwner()
      const user = await TestStripeAccounts.createSubmittedCompany('NZ')
      for (let i = 0, len = global.pageSize + 1; i < len; i++) {
        await TestHelper.createPayout(user)
      }
      const req = TestHelper.createRequest(`/api/administrator/connect/stripe-account-payouts?stripeid=${user.stripeAccount.id}&all=true`)
      req.account = administrator.account
      req.session = administrator.session      
      const payoutsNow = await req.get()
      assert.strictEqual(payoutsNow.length, global.pageSize + 1)
    })
  })

  describe('returns', () => {
    it('array', async () => {
      const administrator = await TestHelper.createOwner()
      // const user = await TestStripeAccounts.createSubmittedIndividual('NZ')
      // TODO: swap with individual account
      // the Stripe test api has an error creating fully-activated accounts
      // so when that gets fixed this code can be changed to speed it up
      const user = await TestStripeAccounts.createSubmittedCompany('NZ')
      for (let i = 0, len = global.pageSize + 1; i < len; i++) {
        await TestHelper.createPayout(user)
        await TestHelper.waitForPayout(administrator, user.stripeAccount.id, null)
      }
      const req = TestHelper.createRequest(`/api/administrator/connect/stripe-account-payouts?stripeid=${user.stripeAccount.id}`)
      req.account = administrator.account
      req.session = administrator.session
      const payouts = await req.get()
      assert.strictEqual(payouts.length, global.pageSize)
    })
  })

  describe('configuration', () => {
    it('environment PAGE_SIZE', async () => {
      global.pageSize = 3
      const administrator = await TestHelper.createOwner()
      // const user = await TestStripeAccounts.createSubmittedIndividual('NZ')
      // TODO: swap with individual account
      // the Stripe test api has an error creating fully-activated accounts
      // so when that gets fixed this code can be changed to speed it up
      const user = await TestStripeAccounts.createSubmittedCompany('NZ')
      for (let i = 0, len = global.pageSize + 1; i < len; i++) {
        await TestHelper.createPayout(user)
        await TestHelper.waitForPayout(administrator, user.stripeAccount.id, null)
      }
      const req = TestHelper.createRequest(`/api/administrator/connect/stripe-account-payouts?stripeid=${user.stripeAccount.id}`)
      req.account = administrator.account
      req.session = administrator.session
      req.filename = __filename
      req.saveResponse = true
      const payouts = await req.get()
      assert.strictEqual(payouts.length, global.pageSize)
    })
  })
})
