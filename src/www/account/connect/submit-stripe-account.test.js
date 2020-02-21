/* eslint-env mocha */
const assert = require('assert')
const connect = require('../../../../index.js')
const TestHelper = require('../../../../test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts.js')

describe('/account/connect/submit-stripe-account', () => {
  describe('SubmitStripeAccount#BEFORE', () => {
    it('should reject invalid stripeid', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/account/connect/submit-stripe-account?stripeid=invalid')
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

    it('should bind Stripe account to req', async () => {
      const user = await TestStripeAccounts.createCompanyReadyForSubmission('DE')
      const req = TestHelper.createRequest(`/account/connect/submit-stripe-account?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.stripeAccount.id, user.stripeAccount.id)
    })
  })

  describe('SubmitStripeAccount#GET', () => {
    it('should reject registration that hasn\'t submitted payment details', async () => {
      const user = await TestStripeAccounts.createCompanyMissingPaymentDetails()
      const req = TestHelper.createRequest(`/account/connect/submit-stripe-account?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-payment-details')
    })

    it('should reject company that hasn\'t submitted beneficial owners', async () => {
      const user = await TestStripeAccounts.createCompanyMissingOwners()
      const req = TestHelper.createRequest(`/account/connect/submit-stripe-account?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-beneficial-owners')
    })

    it('should reject company that hasn\'t submitted company directors', async () => {
      const user = await TestStripeAccounts.createCompanyMissingDirectors('DE')
      const req = TestHelper.createRequest(`/account/connect/submit-stripe-account?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-company-directors')
    })

    it('should reject company that hasn\'t submitted representative information', async () => {
      const user = await TestStripeAccounts.createCompanyMissingRepresentative()
      const req = TestHelper.createRequest(`/account/connect/submit-stripe-account?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-company-representative')
    })

    it('should reject company that hasn\'t submitted information', async () => {
      const user = await TestStripeAccounts.createCompanyMissingCompanyDetails()
      const req = TestHelper.createRequest(`/account/connect/submit-stripe-account?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-registration')
    })

    it('should reject individual that hasn\'t submitted information', async () => {
      const user = await TestStripeAccounts.createIndividualMissingIndividualDetails()
      const req = TestHelper.createRequest(`/account/connect/submit-stripe-account?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-registration')
    })

    it('should present the form (individual)', async () => {
      const country = connect.countrySpecs[Math.floor(Math.random() * connect.countrySpecs.length)]
      const user = await TestStripeAccounts.createIndividualReadyForSubmission(country.id)
      const req = TestHelper.createRequest(`/account/connect/submit-stripe-account?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
      assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
    })

    it('should present the form (company)', async () => {
      const country = connect.countrySpecs[Math.floor(Math.random() * connect.countrySpecs.length)]
      const user = await TestStripeAccounts.createCompanyReadyForSubmission(country.id)
      const req = TestHelper.createRequest(`/account/connect/submit-stripe-account?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
      assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
    })
  })

  describe('SubmitStripeAccount#POST', () => {
    it('should submit registration (company) (screenshots)', async () => {
      const country = connect.countrySpecs[Math.floor(Math.random() * connect.countrySpecs.length)]
      const user = await TestStripeAccounts.createCompanyReadyForSubmission(country.id)
      const req = TestHelper.createRequest(`/account/connect/submit-stripe-account?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {}
      req.filename = __filename
      req.screenshots = [
        { hover: '#account-menu-container' },
        { click: '/account/connect' },
        { click: `/account/connect/stripe-account?stripeid=${user.stripeAccount.id}` },
        { click: `/account/connect/submit-stripe-account?stripeid=${user.stripeAccount.id}` },
        { fill: '#submit-form' }
      ]
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should submit registration (individual)', async () => {
      const country = connect.countrySpecs[Math.floor(Math.random() * connect.countrySpecs.length)]
      const user = await TestStripeAccounts.createIndividualReadyForSubmission(country.id)
      const req = TestHelper.createRequest(`/account/connect/submit-stripe-account?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {}
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })
  })
})
