/* eslint-env mocha */
const assert = require('assert')
const connect = require('../../../../index.js')
const TestHelper = require('../../../../test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts.js')

describe('/account/connect/submit-individual-registration', () => {
  describe('SubmitIndividualRegistration#BEFORE', () => {
    it('should reject invalid stripeid', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/account/connect/submit-individual-registration?stripeid=invalid')
      req.account = user.account
      req.session = user.session
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-stripeid')
    })

    it('should reject company registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/submit-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-stripe-account')
    })

    it('should bind Stripe account to req', async () => {
      const user = await TestStripeAccounts.createIndividualReadyForSubmission('US')
      const req = TestHelper.createRequest(`/account/connect/submit-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.stripeAccount.id, user.stripeAccount.id)
    })
  })

  describe('SubmitIndividualRegistration#GET', () => {
    it('should reject registration that hasn\'t submitted payment details', async () => {
      const user = await TestStripeAccounts.createIndividualMissingPaymentDetails()
      const req = TestHelper.createRequest(`/account/connect/submit-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const page = await req.get()
      const doc = TestHelper.extractDoc(page)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-payment-details')
    })

    it('should reject registration that hasn\'t submitted individual information', async () => {
      const user = await TestStripeAccounts.createIndividualMissingIndividualDetails()
      const req = TestHelper.createRequest(`/account/connect/submit-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const page = await req.get()
      const doc = TestHelper.extractDoc(page)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-registration')
    })

    for (const country of connect.countrySpecs) {
      it('should present the form (' + country.id + ')', async () => {
        const user = await TestStripeAccounts.createIndividualReadyForSubmission(country.id)
        const req = TestHelper.createRequest(`/account/connect/submit-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const page = await req.get()
        const doc = TestHelper.extractDoc(page)
        assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
        assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
      })
    }
  })

  describe('SubmitIndividualRegistration#POST', () => {
    for (const country of connect.countrySpecs) {
      it('should submit registration (' + country.id + ') (screenshots)', async () => {
        const user = await TestStripeAccounts.createIndividualReadyForSubmission(country.id)
        const req = TestHelper.createRequest(`/account/connect/submit-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {}
        req.filename = __filename
        req.screenshots = [
          { hover: '#account-menu-container' },
          { click: '/account/connect' },
          { click: '/account/connect/stripe-accounts' },
          { click: `/account/connect/stripe-account?stripeid=${user.stripeAccount.id}` },
          { click: `/account/connect/submit-individual-registration?stripeid=${user.stripeAccount.id}` },
          { fill: '#submit-form' }
        ]
        const page = await req.post()
        const doc = TestHelper.extractDoc(page)
        const messageContainer = doc.getElementById('message-container')
        const message = messageContainer.child[0]
        assert.strictEqual(message.attr.template, 'success')
      })
    }
  })
})
