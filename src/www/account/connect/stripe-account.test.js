/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')

describe(`/account/connect/stripe-account`, () => {
  describe('StripeAccount#BEFORE', () => {
    it('should reject invalid stripeid', async () => {
      const administrator = await TestHelper.createAdministrator()
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'US'
      })
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
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'US'
      })
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
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'US'
      })
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
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'US'
      })
      const req = TestHelper.createRequest(`/account/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const page = await req.get()
      const doc = TestHelper.extractDoc(page)
      const messageContainer = doc.getElementById('account-status')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'unstarted-registration')
    })

    it('should show registration completed', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'US'
      })
      await TestHelper.createStripeRegistration(user, {
        business_profile_url: 'https://www.' + user.profile.contactEmail.split('@')[1],
        business_profile_mcc: '7333',
        individual_address_city: 'New York',
        individual_address_line1: '285 Fulton St',
        individual_address_postal_'secret-code': '10007',
        individual_address_state: 'NY',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_ssn_last_4: '0000',
        individual_email: user.profile.contactEmail,
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName,
        individual_phone: '456-123-7890',
        individual_id_number: '000000000'
      })
      const req = TestHelper.createRequest(`/account/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const page = await req.get()
      const doc = TestHelper.extractDoc(page)
      const messageContainer = doc.getElementById('account-status')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'completed-registration')
    })

    it('should hide registration after submitting registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'US'
      })
      await TestHelper.createStripeRegistration(user, {
        business_profile_url: 'https://www.' + user.profile.contactEmail.split('@')[1],
        business_profile_mcc: '7333',
        individual_address_city: 'New York',
        individual_address_line1: '285 Fulton St',
        individual_address_postal_'secret-code': '10007',
        individual_address_state: 'NY',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_ssn_last_4: '0000',
        individual_email: user.profile.contactEmail,
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName,
        individual_phone: '456-123-7890',
        individual_id_number: '000000000'
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'usd',
        country: 'US',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        account_number: '000123456789',
        routing_number: '110000000'
      })
      await TestHelper.submitStripeAccount(user)
      const req = TestHelper.createRequest(`/account/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const page = await req.get()
      const doc = TestHelper.extractDoc(page)
      const registrationContainer = doc.getElementById('registration-container')
      assert.strictEqual(registrationContainer, undefined)
    })

    it('should hide company owners after submitting registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'AT'
      })
      await TestHelper.createStripeRegistration(user, {
        company_tax_id: '00000000',
        company_name: user.profile.firstName + '\'s company',
        company_address_country: 'AT',
        company_address_city: 'Vienna',
        company_address_postal_'secret-code': '1020',
        company_address_line1: 'First Street',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_address_city: 'Vienna',
        relationship_account_opener_address_line1: 'First Street',
        relationship_account_opener_address_postal_'secret-code': '1020'
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'eur',
        country: 'AT',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'company',
        iban: 'AT89370400440532013000'
      })
      await TestHelper.submitStripeAccount(user)
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
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'US'
      })
      await TestHelper.createStripeRegistration(user, {
        business_profile_url: 'https://www.' + user.profile.contactEmail.split('@')[1],
        business_profile_mcc: '7333',
        individual_address_city: 'New York',
        individual_address_line1: '285 Fulton St',
        individual_address_postal_'secret-code': '10007',
        individual_address_state: 'NY',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_ssn_last_4: '0000',
        individual_email: user.profile.contactEmail,
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName,
        individual_phone: '456-123-7890',
        individual_id_number: '000000000'
      })
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
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'US'
      })
      await TestHelper.createStripeRegistration(user, {
        business_profile_url: 'https://www.' + user.profile.contactEmail.split('@')[1],
        business_profile_mcc: '7333',
        individual_address_city: 'New York',
        individual_address_line1: '285 Fulton St',
        individual_address_postal_'secret-code': '10007',
        individual_address_state: 'NY',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_ssn_last_4: '0000',
        individual_email: user.profile.contactEmail,
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName,
        individual_phone: '456-123-7890',
        individual_id_number: '000000000'
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'usd',
        country: 'US',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        account_number: '000123456789',
        routing_number: '110000000'
      })
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
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'US'
      })
      await TestHelper.createStripeRegistration(user, {
        business_profile_url: 'https://www.' + user.profile.contactEmail.split('@')[1],
        business_profile_mcc: '7333',
        individual_address_city: 'New York',
        individual_address_line1: '285 Fulton St',
        individual_address_postal_'secret-code': '10007',
        individual_address_state: 'NY',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_ssn_last_4: '0000',
        individual_email: user.profile.contactEmail,
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName,
        individual_phone: '456-123-7890',
        individual_id_number: '000000000'
      })
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
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'US'
      })
      await TestHelper.createStripeRegistration(user, {
        business_profile_url: 'https://www.' + user.profile.contactEmail.split('@')[1],
        business_profile_mcc: '7333',
        individual_address_city: 'New York',
        individual_address_line1: '285 Fulton St',
        individual_address_postal_'secret-code': '10007',
        individual_address_state: 'NY',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_ssn_last_4: '0000',
        individual_email: user.profile.contactEmail,
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName,
        individual_phone: '456-123-7890',
        individual_id_number: '000000000'
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'usd',
        country: 'US',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        account_number: '000123456789',
        routing_number: '110000000'
      })
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
