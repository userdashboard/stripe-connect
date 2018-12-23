/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../..//test-helper.js')

describe(`/account/connect/stripe-account`, () => {
  describe('StripeAccount#BEFORE', () => {
    it('should bind reject invalid stripeid', async () => {
      const administrator = await TestHelper.createAdministrator()
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'US' })
      const req = TestHelper.createRequest(`/account/connect/stripe-account?stripeid=invalid`)
      req.account = administrator.account
      req.session = administrator.session
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-stripeid')
    })

    it('should reject other account\'s stripeid', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'US' })
      const user2 = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/account/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
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

    it('should bind Stripe account to req', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'US' })
      const req = TestHelper.createRequest(`/account/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.stripeAccount.id, user.stripeAccount.id)
    })
  })

  describe('StripeAccount#GET', () => {
    it('should show registration unstarted', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'US' })
      const req = TestHelper.createRequest(`/account/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const page = await req.get()
      const doc = TestHelper.extractDoc(page)
      const messageContainer = doc.getElementById('registration-status')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'unstarted-registration')
    })

    it('should show registration completed', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'US' })
      await TestHelper.createStripeRegistration(user, { city: 'New York City', postal_code: '10001', personal_id_number: '000000000', line1: 'First Street', day: '1', month: '1', year: '1950', state: 'New York', ssn_last_4: '0000' })
      const req = TestHelper.createRequest(`/account/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const page = await req.get()
      const doc = TestHelper.extractDoc(page)
      const messageContainer = doc.getElementById('registration-status')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'completed-registration')
    })

    it('should hide registration after submitting registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'US' })
      await TestHelper.createStripeRegistration(user, { city: 'New York City', postal_code: '10001', personal_id_number: '000000000', line1: 'First Street', day: '1', month: '1', year: '1950', state: 'New York', ssn_last_4: '0000' })
      await TestHelper.createExternalAccount(user, { currency: 'usd', country: 'US', account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`, account_type: 'individual', account_number: '000123456789', routing_number: '110000000' })
      await TestHelper.submitStripeAccount(user)
      const req = TestHelper.createRequest(`/account/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const page = await req.get()
      const doc = TestHelper.extractDoc(page)
      const registrationContainer = doc.getElementById('registration-container')
      assert.strictEqual(registrationContainer, undefined)
    })

    it('should show additional owner information required', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'AT' })
      await TestHelper.createStripeRegistration(user, { business_tax_id: 1, business_name: user.profile.firstName + '\'s company', country: 'AT', day: '1', month: '1', year: '1950', company_city: 'Vienna', company_postal_code: '1020', company_line1: 'First Street', personal_city: 'Vienna', personal_line1: 'First Street', personal_postal_code: '1020' })
      const req = TestHelper.createRequest(`/account/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const page = await req.get()
      const doc = TestHelper.extractDoc(page)
      const messageContainer = doc.getElementById('owners-status')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'owners-not-submitted')
    })

    it('should show additional owners submitted', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'AT' })
      await TestHelper.createStripeRegistration(user, { business_tax_id: 1, business_name: user.profile.firstName + '\'s company', country: 'AT', day: '1', month: '1', year: '1950', company_city: 'Vienna', company_postal_code: '1020', company_line1: 'First Street', personal_city: 'Vienna', personal_line1: 'First Street', personal_postal_code: '1020' })
      await TestHelper.submitAdditionalOwners(user)
      const req = TestHelper.createRequest(`/account/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const page = await req.get()
      const doc = TestHelper.extractDoc(page)
      const messageContainer = doc.getElementById('owners-status')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'owners-submitted')
    })

    it('should hide additional owners after submitting registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'AT' })
      await TestHelper.createStripeRegistration(user, { business_tax_id: 1, business_name: user.profile.firstName + '\'s company', country: 'AT', day: '1', month: '1', year: '1950', company_city: 'Vienna', company_postal_code: '1020', company_line1: 'First Street', personal_city: 'Vienna', personal_line1: 'First Street', personal_postal_code: '1020' })
      await TestHelper.createExternalAccount(user, { currency: 'eur', country: 'AT', account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`, account_type: 'company', iban: 'AT89370400440532013000' })
      await TestHelper.submitAdditionalOwners(user)
      await TestHelper.submitStripeAccount(user)
      const req = TestHelper.createRequest(`/account/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const page = await req.get()
      const doc = TestHelper.extractDoc(page)
      const ownersContainer = doc.getElementById('owners-container')
      assert.strictEqual(ownersContainer, undefined)
    })

    it('should hide additional owners when not required', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'US' })
      await TestHelper.createStripeRegistration(user, { city: 'New York City', postal_code: '10001', personal_id_number: '000000000', line1: 'First Street', day: '1', month: '1', year: '1950', state: 'New York', ssn_last_4: '0000' })
      const req = TestHelper.createRequest(`/account/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const page = await req.get()
      const doc = TestHelper.extractDoc(page)
      const ownersContainer = doc.getElementById('owners-container')
      assert.strictEqual(ownersContainer, undefined)
    })


    it('should show payment information required', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'US' })
      await TestHelper.createStripeRegistration(user, { city: 'New York City', postal_code: '10001', personal_id_number: '000000000', line1: 'First Street', day: '1', month: '1', year: '1950', state: 'New York', ssn_last_4: '0000' })
      const req = TestHelper.createRequest(`/account/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const page = await req.get()
      const doc = TestHelper.extractDoc(page)
      const messageContainer = doc.getElementById('payment-information-status')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'no-payment-information')
    })

    it('should show payment information created', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'US' })
      await TestHelper.createStripeRegistration(user, { city: 'New York City', postal_code: '10001', personal_id_number: '000000000', line1: 'First Street', day: '1', month: '1', year: '1950', state: 'New York', ssn_last_4: '0000' })
      await TestHelper.createExternalAccount(user, { currency: 'usd', country: 'US', account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`, account_type: 'individual', account_number: '000123456789', routing_number: '110000000' })
      const req = TestHelper.createRequest(`/account/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const page = await req.get()
      const doc = TestHelper.extractDoc(page)
      const messageContainer = doc.getElementById('payment-information-status')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'payment-information')
    })

    it('should show ready to submit', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'US' })
      await TestHelper.createStripeRegistration(user, { city: 'New York City', postal_code: '10001', personal_id_number: '000000000', line1: 'First Street', day: '1', month: '1', year: '1950', state: 'New York', ssn_last_4: '0000' })
      const req = TestHelper.createRequest(`/account/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const page = await req.get()
      const doc = TestHelper.extractDoc(page)
      const messageContainer = doc.getElementById('submission-status')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'not-submitted-information')
    })

    it('should show registration is submitted', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'US' })
      await TestHelper.createStripeRegistration(user, { city: 'New York City', postal_code: '10001', personal_id_number: '000000000', line1: 'First Street', day: '1', month: '1', year: '1950', state: 'New York', ssn_last_4: '0000' })
      await TestHelper.createExternalAccount(user, { currency: 'usd', country: 'US', account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`, account_type: 'individual', account_number: '000123456789', routing_number: '110000000' })
      await TestHelper.submitStripeAccount(user)
      const req = TestHelper.createRequest(`/account/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const page = await req.get()
      const doc = TestHelper.extractDoc(page)
      const messageContainer = doc.getElementById('submission-status')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'submitted-information')

    })
  })
})
