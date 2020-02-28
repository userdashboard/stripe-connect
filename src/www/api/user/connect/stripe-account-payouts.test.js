/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')

describe('/api/user/connect/stripe-account-payouts', () => {
  describe('exceptions', () => {
    describe('invalid-payoutid', () => {
      it('missing querystring payoutid', async () => {
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/connect/stripe-account-payouts')
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.get()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-stripeid')
      })

      it('invalid querystring payoutid', async () => {
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/connect/stripe-account-payouts?stripeid=invalid')
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.get()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-stripeid')
      })
    })

    describe('invalid-account', () => {
      it('ineligible accessing account', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'NZ',
          type: 'individual'
        })
        const user2 = await TestHelper.createUser()
        const req = TestHelper.createRequest(`/api/user/connect/stripe-account-payouts?stripeid=${user.stripeAccount.id}`)
        req.account = user2.account
        req.session = user2.session
        let errorMessage
        try {
          await req.get()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-account')
      })
    })
  })

  describe('receives', () => {
    it('optional querystring offset (integer)', async () => {
      const offset = 1
      global.delayDiskWrites = true
      const administrator = await TestHelper.createOwner()
      // const user = await TestStripeAccounts.createSubmittedIndividual('NZ')
      // TODO: swap with individual account
      // the Stripe test api has an error creating fully-activated accounts
      // so when that gets fixed this code can be changed to speed it up
      const user = await TestStripeAccounts.createSubmittedCompany('NZ')
      const payouts = []
      for (let i = 0, len = global.pageSize + 1; i < len; i++) {
        await TestHelper.createPayout(user)
        await TestHelper.waitForPayout(administrator, user.stripeAccount.id, payouts.length ? payouts[payouts.length - 1] : null)
        payouts.unshift(user.payout.id)
      }
      const req = TestHelper.createRequest(`/api/user/connect/stripe-account-payouts?stripeid=${user.stripeAccount.id}&offset=${offset}`)
      req.account = user.account
      req.session = user.session
      const payoutsNow = await req.get()
      for (let i = 0, len = global.pageSize; i < len; i++) {
        assert.strictEqual(payoutsNow[i].id, payouts[offset + i])
      }
    })

    it('optional querystring limit (integer)', async () => {
      const limit = 1
      const administrator = await TestHelper.createOwner()
      // const user = await TestStripeAccounts.createSubmittedIndividual('NZ')
      // TODO: swap with individual account
      // the Stripe test api has an error creating fully-activated accounts
      // so when that gets fixed this code can be changed to speed it up
      const user = await TestStripeAccounts.createSubmittedCompany('NZ')
      const payouts = []
      for (let i = 0, len = limit + 1; i < len; i++) {
        await TestHelper.createPayout(user)
        await TestHelper.waitForPayout(administrator, user.stripeAccount.id, payouts.length ? payouts[payouts.length - 1] : null)
        payouts.unshift(user.payout.id)
      }
      const req = TestHelper.createRequest(`/api/user/connect/stripe-account-payouts?stripeid=${user.stripeAccount.id}&limit=${limit}`)
      req.account = user.account
      req.session = user.session
      const payoutsNow = await req.get()
      assert.strictEqual(payoutsNow.length, limit)
    })

    it('optional querystring all (boolean)', async () => {
      const administrator = await TestHelper.createOwner()
      // const user = await TestStripeAccounts.createSubmittedIndividual('NZ')
      // TODO: swap with individual account
      // the Stripe test api has an error creating fully-activated accounts
      // so when that gets fixed this code can be changed to speed it up
      const user = await TestStripeAccounts.createSubmittedCompany('NZ')
      const payouts = []
      for (let i = 0, len = global.pageSize + 1; i < len; i++) {
        await TestHelper.createPayout(user)
        await TestHelper.waitForPayout(administrator, user.stripeAccount.id, payouts.length ? payouts[payouts.length - 1] : null)
        payouts.unshift(user.payout.id)
      }
      const req = TestHelper.createRequest(`/api/user/connect/stripe-account-payouts?stripeid=${user.stripeAccount.id}&all=true`)
      req.account = user.account
      req.session = user.session
      const payoutsNow = await req.get()
      assert.strictEqual(payoutsNow.length, payouts.length)
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
      const payouts = []
      for (let i = 0, len = global.pageSize + 1; i < len; i++) {
        await TestHelper.createPayout(user)
        await TestHelper.waitForPayout(administrator, user.stripeAccount.id, payouts.length ? payouts[payouts.length - 1] : null)
        payouts.unshift(user.payout.id)
      }
      const req = TestHelper.createRequest(`/api/user/connect/stripe-account-payouts?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const payoutsNow = await req.get()
      assert.strictEqual(payoutsNow.length, global.pageSize)
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
      const payouts = []
      for (let i = 0, len = global.pageSize + 1; i < len; i++) {
        await TestHelper.createPayout(user)
        await TestHelper.waitForPayout(administrator, user.stripeAccount.id, payouts.length ? payouts[payouts.length - 1] : null)
        payouts.unshift(user.payout.id)
      }
      const req = TestHelper.createRequest(`/api/user/connect/stripe-account-payouts?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.filename = __filename
      req.saveResponse = true
      const payoutsNow = await req.get()
      assert.strictEqual(payoutsNow.length, global.pageSize)
    })
  })
})
