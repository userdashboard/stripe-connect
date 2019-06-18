/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')

describe(`/account/connect/create-additional-owner`, async () => {
  describe('CreateAdditionalOwner#BEFORE', () => {
    it('should reject invalid stripeid', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/account/connect/create-additional-owner?stripeid=invalid`)
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

    it('should reject registration with owners submitted', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'DE' })
      await TestHelper.submitAdditionalOwners(user)
      const req = TestHelper.createRequest(`/account/connect/create-additional-owner?stripeid=${user.stripeAccount.id}`)
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

    it('should reject submitted registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'DE' })
      await TestHelper.createStripeRegistration(user, { business_tax_id: 1, business_name: user.profile.firstName + '\'s company', country: 'DE', day: '1', month: '1', year: '1950', company_city: 'Berlin', company_line1: 'First Street', company_postal_code: '01067', personal_city: 'Berlin', personal_line1: 'First Street', personal_postal_code: '01067' })
      await TestHelper.createExternalAccount(user, { currency: 'usd', country: 'US', account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`, account_type: 'individual', account_number: '000123456789', routing_number: '110000000' })
      await TestHelper.submitAdditionalOwners(user)
      await TestHelper.submitStripeAccount(user)
      const req = TestHelper.createRequest(`/account/connect/create-additional-owner?stripeid=${user.stripeAccount.id}`)
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

    it('should require own Stripe account', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'DE' })
      const user2 = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/account/connect/create-additional-owner?stripeid=${user.stripeAccount.id}`)
      req.account = user2.account
      req.session = user2.session
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-account')
    })
  })

  describe('CreateAdditionalOwner#GET', () => {
    it('should present the form', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'DE' })
      const req = TestHelper.createRequest(`/account/connect/create-additional-owner?stripeid=${user.stripeAccount.id}`)
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
      const req = TestHelper.createRequest(`/account/connect/create-additional-owner?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const page = await req.get()
      const doc = TestHelper.extractDoc(page)
      const row = doc.getElementById(user.stripeAccount.id)
      assert.strictEqual(row.tag, 'tr')
    })
  })

  describe('CreateAdditionalOwner#POST', () => {
    it('should require each field', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'DE' })
      const req = TestHelper.createRequest(`/account/connect/create-additional-owner?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        first_name: 'First name',
        last_name: 'First name',
        country: 'GB',
        city: 'London',
        line1: 'A building',
        postal_code: 'EC1A 1AA',
        day: '1',
        month: '1',
        year: '1950'
      }
      for (const field in req.body) {
        const value = req.body[field]
        req.body[field] = null
        const page = await req.post(req)
        req.body[field] = value
        const doc = TestHelper.extractDoc(page)
        const messageContainer = doc.getElementById('message-container')
        const message = messageContainer.child[0]
        assert.strictEqual(message.attr.template, `invalid-${field}`)
      }
    })

    it('should require a document id upload', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'DE' })
      const req = TestHelper.createRequest(`/account/connect/create-additional-owner?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        first_name: 'First name',
        last_name: 'First name',
        country: 'GB',
        city: 'London',
        line1: 'A building',
        postal_code: 'EC1A 1AA',
        day: '1',
        month: '1',
        year: '1950'
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-upload')
    })

    it('should reject fifth 25% owner', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'DE' })
      await TestHelper.createAdditionalOwner(user, { country: 'DE', city: 'Berlin', postal_code: '01067', line1: 'First Street', day: 1, month: 1, year: 1951 })
      await TestHelper.createAdditionalOwner(user, { country: 'DE', city: 'Berlin', postal_code: '01067', line1: 'Second Street', day: 2, month: 2, year: 1952 })
      await TestHelper.createAdditionalOwner(user, { country: 'DE', city: 'Berlin', postal_code: '01067', line1: 'Third Street', day: 3, month: 3, year: 1953 })
      await TestHelper.createAdditionalOwner(user, { country: 'DE', city: 'Berlin', postal_code: '01067', line1: 'Fourth Street', day: 4, month: 4, year: 1954 })
      const req = TestHelper.createRequest(`/account/connect/create-additional-owner?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        first_name: 'First name',
        last_name: 'First name',
        country: 'GB',
        city: 'London',
        line1: 'A building',
        postal_code: 'EC1A 1AA',
        day: '1',
        month: '1',
        year: '1950'
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'maximum-owners')
    })

    it('should create owner', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'DE' })
      const req = TestHelper.createRequest(`/account/connect/create-additional-owner?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      TestHelper.createMultiPart(req, {
        file: 'test-documentid-success.png',
        first_name: 'First name',
        last_name: 'First name',
        country: 'GB',
        city: 'London',
        line1: 'A building',
        postal_code: 'EC1A 1AA',
        day: '1',
        month: '1',
        year: '1950'
      })
      const page = await req.post()
      const redirectURL = TestHelper.extractRedirectURL(page)
      assert.strictEqual(true, redirectURL.startsWith(`/account/connect/additional-owner?ownerid=`))
    })
  })
})
