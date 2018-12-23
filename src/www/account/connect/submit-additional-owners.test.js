/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../..//test-helper.js')

describe(`/account/connect/submit-additional-owners`, async () => {
  describe('SubmitAdditionalOwners#BEFORE', () => {
    it('should reject invalid stripeid', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/account/connect/submit-additional-owners?stripeid=invalid`)
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

    it('should reject individual registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'US' })
      const req = TestHelper.createRequest(`/account/connect/submit-additional-owners?stripeid=${user.stripeAccount.id}`)
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

    it('should reject registration that doesn\'t require additional owners', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'US' })
      const req = TestHelper.createRequest(`/account/connect/submit-additional-owners?stripeid=${user.stripeAccount.id}`)
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

    it('should reject registration with submitted owners', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'DE' })
      await TestHelper.submitAdditionalOwners(user)
      let errorMessage
      const req = TestHelper.createRequest(`/account/connect/submit-additional-owners?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-stripe-account')
    })

    it('should bind Stripe account to req', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'DE' })
      const req = TestHelper.createRequest(`/account/connect/submit-additional-owners?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.stripeAccount.id, user.stripeAccount.id)
    })
  })

  describe('SubmitAdditionalOwners#GET', () => {
    it('should present the form', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'DE' })
      const req = TestHelper.createRequest(`/account/connect/submit-additional-owners?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const page = await req.get()
      const doc = TestHelper.extractDoc(page)
      assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
      assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
    })

    it('should present the Stripe account table', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'DE' })
      const req = TestHelper.createRequest(`/account/connect/submit-additional-owners?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const page = await req.get()
      const doc = TestHelper.extractDoc(page)
      const row = doc.getElementById(user.stripeAccount.id)
      assert.strictEqual(row.tag, 'tr')
    })
  })

  describe('SubmitAdditionalOwners#POST', () => {
    it('should submit blank owners after authorization', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'DE' })
      const req = TestHelper.createRequest(`/account/connect/submit-additional-owners?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {}
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should submit additional owners after authorization', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'DE' })
      await TestHelper.createAdditionalOwner(user, { country: 'DE', city: 'Berlin', postal_code: '01067', line1: 'First Street', day: 1, month: 1, year: 1950 })
      const req = TestHelper.createRequest(`/account/connect/submit-additional-owners?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {}
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })
  })
})
