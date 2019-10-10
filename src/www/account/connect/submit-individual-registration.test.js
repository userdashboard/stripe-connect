/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')

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
        type: 'company',
        country: 'US'
      })
      await TestHelper.createStripeRegistration(user, {
        business_profile_mcc: '7542',
        business_profile_url: 'https://www.' + user.profile.contactEmail.split('@')[1],
        company_tax_id: '00000000',
        company_name: user.profile.firstName + '\'s company',
        company_phone: '456-123-7890',
        company_address_country: 'US',
        company_address_city: 'New York',
        company_address_state: 'New York',
        company_address_line1: 'First Street',
        company_address_postal_code: '10001',
        relationship_account_opener_ssn_last_4: '0000',
        relationship_account_opener_address_city: 'New York',
        relationship_account_opener_address_state: 'NY',
        relationship_account_opener_address_postal_code: '10007',
        relationship_account_opener_address_line1: 'First Street',
        // relationship_account_opener_id_number: '000000000',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_executive: 'true',
        relationship_account_opener_title: 'Owner',
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-123-7890',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950'
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
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'US'
      })
      await TestHelper.createStripeRegistration(user, {
        business_profile_mcc: '7542',
        business_profile_url: 'https://www.' + user.profile.contactEmail.split('@')[1],
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName,
        individual_email: user.profile.contactEmail,
        individual_phone: '456-789-0123',
        individual_address_city: 'New York',
        individual_id_number: '000000000',
        individual_address_line1: '285 Fulton St',
        individual_address_postal_code: '10007',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_address_state: 'NY',
        individual_ssn_last_4: '0000'
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'usd',
        country: 'US',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        account_number: '000123456789',
        routing_number: '110000000'
      })
      const req = TestHelper.createRequest(`/account/connect/submit-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.stripeAccount.id, user.stripeAccount.id)
    })
  })

  describe('SubmitIndividualRegistration#GET', () => {
    it('should present the form', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'US'
      })
      await TestHelper.createStripeRegistration(user, {
        business_profile_mcc: '7542',
        business_profile_url: 'https://www.' + user.profile.contactEmail.split('@')[1],
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName,
        individual_email: user.profile.contactEmail,
        individual_phone: '456-789-0123',
        individual_address_city: 'New York',
        individual_address_line1: '285 Fulton St',
        individual_address_postal_code: '10007',
        individual_id_number: '000000000',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_address_state: 'NY',
        individual_ssn_last_4: '0000'
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'usd',
        country: 'US',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        account_number: '000123456789',
        routing_number: '110000000'
      })
      const req = TestHelper.createRequest(`/account/connect/submit-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const page = await req.get()
      const doc = TestHelper.extractDoc(page)
      assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
      assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
    })

    it('should reject registration that hasn\'t submitted payment details', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'US'
      })
      await TestHelper.createStripeRegistration(user, {
        business_profile_mcc: '7542',
        business_profile_url: 'https://www.' + user.profile.contactEmail.split('@')[1],
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName,
        individual_email: user.profile.contactEmail,
        individual_phone: '456-789-0123',
        individual_address_city: 'New York',
        individual_address_line1: '285 Fulton St',
        individual_address_postal_code: '10007',
        individual_id_number: '000000000',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_address_state: 'NY',
        individual_ssn_last_4: '0000'
      })
      const req = TestHelper.createRequest(`/account/connect/submit-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const page = await req.get()
      const doc = TestHelper.extractDoc(page)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-payment-details')
    })
  })

  describe('SubmitIndividualRegistration#POST', () => {
    it('should submit registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'US'
      })
      await TestHelper.createStripeRegistration(user, {
        business_profile_mcc: '7542',
        business_profile_url: 'https://www.' + user.profile.contactEmail.split('@')[1],
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName,
        individual_email: user.profile.contactEmail,
        individual_phone: '456-789-0123',
        individual_address_city: 'New York',
        individual_address_line1: '285 Fulton St',
        individual_address_postal_code: '10007',
        individual_id_number: '000000000',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_address_state: 'NY',
        individual_ssn_last_4: '0000'
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'usd',
        country: 'US',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        account_number: '000123456789',
        routing_number: '110000000'
      })
      const req = TestHelper.createRequest(`/account/connect/submit-individual-registration?stripeid=${user.stripeAccount.id}`)
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
