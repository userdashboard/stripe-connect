/* eslint-env mocha */
const assert = require('assert')
const connect = require('../../../../../index.js')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')

describe('/api/user/connect/set-stripe-account-submitted', function () {
  after(TestHelper.deleteOldWebhooks)
  before(TestHelper.setupWebhook)
  describe('exceptions', () => {
    describe('invalid-stripeid', () => {
      it('missing querystring stripeid', async () => {
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/connect/set-stripe-account-submitted')
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-stripeid')
      })

      it('invalid querystring stripeid', async () => {
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/connect/set-stripe-account-submitted?stripeid=invalid')
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-stripeid')
      })
    })

    describe('invalid-stripe-account', () => {
      it('ineligible stripe account is submitted', async () => {
        // const user = await TestStripeAccounts.createSubmittedIndividual('NZ')
        // TODO: swap with individual account
        // the Stripe test api has an error creating fully-activated accounts
        // so when that gets fixed this code can be changed to speed it up
        const user = await TestStripeAccounts.createSubmittedCompany('NZ')
        const req = TestHelper.createRequest(`/api/user/connect/set-stripe-account-submitted?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-stripe-account')
      })
    })

    describe('invalid-account', () => {
      it('ineligible accessing account', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'DE',
          type: 'company'
        })
        const user2 = await TestHelper.createUser()
        const req = TestHelper.createRequest(`/api/user/connect/set-stripe-account-submitted?stripeid=${user.stripeAccount.id}`)
        req.account = user2.account
        req.session = user2.session
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-account')
      })
    })

    describe('invalid-payment-details', () => {
      it('ineligible Stripe account missing payment details', async () => {
        const user = await TestStripeAccounts.createCompanyMissingPaymentDetails('US')
        const req = TestHelper.createRequest(`/api/user/connect/set-stripe-account-submitted?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-payment-details')
      })
    })

    describe('invalid-registration', () => {
      it('ineligible Stripe account missing information', async () => {
        const user = await TestStripeAccounts.createIndividualMissingIndividualDetails('US')
        const req = TestHelper.createRequest(`/api/user/connect/set-stripe-account-submitted?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-registration')
      })
    })

    describe('invalid-person', () => {
      it('ineligible company person missing information', async () => {
        const user = await TestStripeAccounts.createCompanyMissingPaymentDetails('US')
        const req = TestHelper.createRequest(`/api/user/connect/set-stripe-account-submitted?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-payment-details')
      })
    })
  })

  describe('returns', () => {
    it('object (individual)', async () => {
      const country = connect.countrySpecs[Math.floor(Math.random() * connect.countrySpecs.length)]
      const user = await TestStripeAccounts.createIndividualReadyForSubmission(country.id)
      assert.strictEqual(user.stripeAccount.metadata.submitted, undefined)
      assert.strictEqual(user.stripeAccount.requirements.currently_due.length, 2)
      assert.strictEqual(user.stripeAccount.requirements.currently_due[0].startsWith('tos_acceptance'), true)
      assert.strictEqual(user.stripeAccount.requirements.currently_due[1].startsWith('tos_acceptance'), true)
      const req = TestHelper.createRequest(`/api/user/connect/set-stripe-account-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const stripeAccountNow = await req.patch()
      assert.notStrictEqual(stripeAccountNow.metadata.submitted, undefined)
      assert.notStrictEqual(stripeAccountNow.metadata.submitted, null)
      assert.strictEqual(stripeAccountNow.requirements.past_due.length, 0)
      assert.strictEqual(stripeAccountNow.requirements.eventually_due.length, 0)
      assert.strictEqual(stripeAccountNow.requirements.currently_due.length, 0)
    })

    it('object (company)', async () => {
      const country = connect.countrySpecs[Math.floor(Math.random() * connect.countrySpecs.length)]
      const user = await TestStripeAccounts.createCompanyReadyForSubmission(country.id)
      assert.strictEqual(user.stripeAccount.metadata.submitted, undefined)
      assert.strictEqual(user.stripeAccount.requirements.currently_due.length, 2)
      assert.strictEqual(user.stripeAccount.requirements.currently_due[0].startsWith('tos_acceptance'), true)
      assert.strictEqual(user.stripeAccount.requirements.currently_due[1].startsWith('tos_acceptance'), true)
      const req = TestHelper.createRequest(`/api/user/connect/set-stripe-account-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const stripeAccountNow = await req.patch()
      assert.notStrictEqual(stripeAccountNow.metadata.submitted, undefined)
      assert.notStrictEqual(stripeAccountNow.metadata.submitted, null)
      assert.strictEqual(stripeAccountNow.requirements.past_due.length, 0)
      assert.strictEqual(stripeAccountNow.requirements.eventually_due.length, 0)
      assert.strictEqual(stripeAccountNow.requirements.currently_due.length, 0)
    })
  })
})
