/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')

describe(`/api/user/connect/set-company-registration-submitted`, async () => {
  describe('SetCompanyRegistrationSubmitted#PATCH', () => {
    it('should reject invalid stripeid', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/api/user/connect/set-company-registration-submitted?stripeid=invalid')
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

    it('should reject individual account', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'US'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
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

    it('should reject submitted registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'US'
      })
      await TestHelper.createStripeRegistration(user, {
        company_name: 'Company',
        company_tax_id: '8',
        company_phone: '456-123-7890',
        company_address_city: 'New York',
        company_address_line1: '123 Park Lane',
        company_address_postal_'secret-code': '10001',
        company_address_state: 'NY',
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123',
        relationship_account_opener_ssn_last_4: '0000',
        relationship_account_opener_address_city: 'New York',
        relationship_account_opener_address_state: 'NY',
        relationship_account_opener_address_line1: '285 Fulton St',
        relationship_account_opener_address_postal_'secret-code': '10007'
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
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
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

    it('should reject other account\'s registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'DE'
      })
      const user2 = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
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

    it('should require payment details', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'DE'
      })
      await TestHelper.createStripeRegistration(user, {
        company_address_city: 'Berlin',
        company_address_line1: '123 Park Lane',
        company_address_postal_'secret-code': '01067',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Berlin',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_'secret-code': '01067',
        relationship_account_opener_phone: '456-789-0123',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
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

    it(`should submit AT-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'AT'
      })
      await TestHelper.createStripeRegistration(user, {
        company_address_country: 'AT',
        company_address_city: 'Vienna',
        company_address_line1: '123 Park Lane',
        company_address_postal_'secret-code': '1020',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123',
        relationship_account_opener_address_country: 'AT',
        relationship_account_opener_address_city: 'Vienna',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_'secret-code': '1020'
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'eur',
        country: 'AT',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        iban: 'AT89370400440532013000'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
    })

    it(`should submit AU-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'AU'
      })
      await TestHelper.createStripeRegistration(user, {
        company_address_city: 'Brisbane',
        company_address_state: 'QLD',
        company_address_line1: '123 Park Lane',
        company_address_postal_'secret-code': '4000',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123',
        relationship_account_opener_address_city: 'Brisbane',
        relationship_account_opener_address_line1: '845 Oxford St',
        relationship_account_opener_address_postal_'secret-code': '4000'
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'aud',
        country: 'AU',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        account_number: '000123456',
        bsb_number: '110000'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
    })

    it(`should submit BE-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'BE'
      })
      await TestHelper.createStripeRegistration(user, {
        company_address_city: 'Brussels',
        company_address_line1: '123 Park Lane',
        company_address_postal_'secret-code': '1020',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Brussels',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_'secret-code': '1020',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_phone: '456-789-0123',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'eur',
        country: 'BE',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        iban: 'BE89370400440532013000'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
    })

    it(`should submit CA-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'CA'
      })
      await TestHelper.createStripeRegistration(user, {
        company_address_city: 'Vancouver',
        company_address_state: 'BC',
        company_address_line1: '123 Park Lane',
        company_address_postal_'secret-code': 'V5K 0A1',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_id_number: '7',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123',
        relationship_account_opener_address_city: 'Vancouver',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_'secret-code': 'V5K 0A1'
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'cad',
        country: 'CA',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        account_number: '000123456789',
        transit_number: '11000',
        institution_number: '000'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
    })

    it(`should submit CH-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'CH'
      })
      await TestHelper.createStripeRegistration(user, {
        company_address_city: 'Bern',
        company_address_line1: '123 Park Lane',
        company_address_postal_'secret-code': '1020',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Bern',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_'secret-code': '1020',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'eur',
        country: 'CH',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        iban: 'CH89370400440532013000'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
    })

    it(`should submit DE-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'DE'
      })
      await TestHelper.createStripeRegistration(user, {
        company_address_city: 'Berlin',
        company_address_line1: '123 Park Lane',
        company_address_postal_'secret-code': '01067',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Berlin',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_'secret-code': '01067',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'eur',
        country: 'DE',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        iban: 'DE89370400440532013000'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
    })

    it(`should submit DK-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'DK'
      })
      await TestHelper.createStripeRegistration(user, {
        company_address_city: 'Copenhagen',
        company_address_line1: '123 Park Lane',
        company_address_postal_'secret-code': '1000',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Copenhagen',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_'secret-code': '1000',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'eur',
        country: 'DK',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        iban: 'DK89370400440532013000'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
    })

    it(`should submit ES-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'ES'
      })
      await TestHelper.createStripeRegistration(user, {
        company_address_city: 'Madrid',
        company_address_line1: '123 Park Lane',
        company_address_postal_'secret-code': '03179',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Madrid',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_'secret-code': '03179',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'eur',
        country: 'ES',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        iban: 'ES89370400440532013000'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
    })

    it(`should submit FI-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'FI'
      })
      await TestHelper.createStripeRegistration(user, {
        company_address_city: 'Helsinki',
        company_address_line1: '123 Park Lane',
        company_address_postal_'secret-code': '00990',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Helsinki',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_'secret-code': '00990',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'eur',
        country: 'FI',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        iban: 'FI89370400440532013000'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
    })

    it(`should submit FR-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'FR'
      })
      await TestHelper.createStripeRegistration(user, {
        company_address_city: 'Paris',
        company_address_line1: '123 Park Lane',
        company_address_postal_'secret-code': '75001',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Paris',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_'secret-code': '75001',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'eur',
        country: 'FR',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        iban: 'FR89370400440532013000'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
    })

    it(`should submit GB-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'GB'
      })
      await TestHelper.createStripeRegistration(user, {
        company_address_city: 'London',
        company_address_line1: '123 Park Lane',
        company_address_postal_'secret-code': 'EC1A 1AA',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'London',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_'secret-code': 'EC1A 1AA',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'eur',
        country: 'GB',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        iban: 'GB89370400440532013000'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
    })

    it(`should submit HK-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'HK'
      })
      await TestHelper.createStripeRegistration(user, {
        company_address_city: 'Hong Kong',
        company_address_line1: '123 Park Lane',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123',
        relationship_account_opener_address_city: 'Hong Kong',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_'secret-code': '999077'
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'hkd',
        country: 'HK',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        account_number: '000123-456',
        clearing_'secret-code': '110',
        branch_'secret-code': '000'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
    })

    it(`should submit IE-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'IE'
      })
      await TestHelper.createStripeRegistration(user, {
        company_address_city: 'Dublin',
        company_address_state: 'Dublin',
        company_address_line1: '123 Park Lane',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Dublin',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123',
        relationship_account_opener_address_postal_'secret-code': 'Dublin 1'
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'eur',
        country: 'IE',
        company_state: 'Dublin',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        iban: 'IE89370400440532013000'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
    })

    it(`should submit IT-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'IT'
      })
      await TestHelper.createStripeRegistration(user, {
        company_address_city: 'Rome',
        company_address_line1: '123 Park Lane',
        company_address_postal_'secret-code': '00010',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Rome',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_'secret-code': '00010',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'eur',
        country: 'IT',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        iban: 'IT89370400440532013000'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
    })

    it(`should submit JP-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'JP'
      })
      await TestHelper.createStripeRegistration(user, {
        company_tax_id: '8',
        company_name: 'Company',
        company_phone: '011-271-6677',
        company_business_name_kana: 'Company',
        company_business_name_kanji: 'Company',
        company_address_kana_postal_'secret-code': '1500001',
        company_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        company_address_kana_city: 'ｼﾌﾞﾔ',
        company_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        company_address_kana_line1: '27-15',
        company_address_kanji_postal_'secret-code': '1500001',
        company_address_kanji_state: '東京都',
        company_address_kanji_city: '渋谷区',
        company_address_kanji_town: '神宮前　３丁目',
        company_address_kanji_line1: '２７－１５',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123',
        relationship_account_opener_gender: 'female',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name_kana: 'ﾄｳｷﾖｳﾄ',
        relationship_account_opener_last_name_kana: 'ﾄｳｷﾖｳﾄ',
        relationship_account_opener_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        relationship_account_opener_address_kana_city: 'ｼﾌﾞﾔ',
        relationship_account_opener_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        relationship_account_opener_address_kana_line1: '27-15',
        relationship_account_opener_address_kana_postal_'secret-code': '1500001',
        relationship_account_opener_first_name_kanji: '東京都',
        relationship_account_opener_last_name_kanji: '東京都',
        relationship_account_opener_address_kanji_postal_'secret-code': '1500001',
        relationship_account_opener_address_kanji_state: '東京都',
        relationship_account_opener_address_kanji_city: '渋谷区',
        relationship_account_opener_address_kanji_town: '神宮前　３丁目',
        relationship_account_opener_address_kanji_line1: '２７－１５'
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'jpy',
        country: 'JP',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        account_number: '00012345',
        bank_'secret-code': '1100',
        branch_'secret-code': '000'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
    })

    it(`should submit LU-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'LU'
      })
      await TestHelper.createStripeRegistration(user, {
        company_address_city: 'Luxemburg',
        company_address_line1: '123 Park Lane',
        company_address_postal_'secret-code': '1623',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Luxemburg',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_'secret-code': '1623',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'eur',
        country: 'LU',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        iban: 'LU89370400440532013000'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
    })

    it(`should submit NL-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'NL'
      })
      await TestHelper.createStripeRegistration(user, {
        company_address_city: 'Amsterdam',
        company_address_line1: '123 Park Lane',
        company_address_postal_'secret-code': '1071 JA',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Amsterdam',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_'secret-code': '1071 JA',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'eur',
        country: 'NL',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        iban: 'NL89370400440532013000'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
    })

    it(`should submit NO-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'NO'
      })
      await TestHelper.createStripeRegistration(user, {
        company_address_city: 'Oslo',
        company_address_line1: '123 Park Lane',
        company_address_postal_'secret-code': '0001',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Oslo',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_'secret-code': '0001',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'eur',
        country: 'NO',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        iban: 'NO89370400440532013000'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
    })

    it(`should submit NZ-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'NZ'
      })
      await TestHelper.createStripeRegistration(user, {
        company_address_city: 'Auckland',
        company_address_line1: '123 Park Lane',
        company_address_postal_'secret-code': '6011',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123',
        relationship_account_opener_address_city: 'Auckland',
        relationship_account_opener_address_postal_'secret-code': '6011',
        relationship_account_opener_address_line1: '844 Fleet Street'
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'nzd',
        country: 'NZ',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        account_number: '0000000010',
        routing_number: '110000'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
    })

    it(`should submit PT-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'PT'
      })
      await TestHelper.createStripeRegistration(user, {
        company_address_city: 'Lisbon',
        company_address_line1: '123 Park Lane',
        company_address_postal_'secret-code': '4520',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Lisbon',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_'secret-code': '4520',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'eur',
        country: 'PT',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        iban: 'PT89370400440532013000'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
    })

    it(`should submit SE-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'SE'
      })
      await TestHelper.createStripeRegistration(user, {
        company_address_city: 'Stockholm',
        company_address_line1: '123 Park Lane',
        company_address_postal_'secret-code': '00150',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Stockholm',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_'secret-code': '00150',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'eur',
        country: 'SE',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        iban: 'SE89370400440532013000'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
    })

    it(`should submit SG-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'SG'
      })
      await TestHelper.createStripeRegistration(user, {
        company_address_line1: '123 Park Lane',
        company_address_postal_'secret-code': '339696',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_'secret-code': '339696',
        relationship_account_opener_address_city: 'Singapore',
        relationship_account_opener_phone: '456-789-0123'
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'sgd',
        country: 'SG',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        account_number: '000123456',
        bank_'secret-code': '1100',
        branch_'secret-code': '000'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
    })

    it(`should submit US-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'US'
      })
      await TestHelper.createStripeRegistration(user, {
        company_name: 'Company',
        company_tax_id: '8',
        company_phone: '456-123-7890',
        company_address_city: 'New York',
        company_address_line1: '285 Fulton St',
        company_address_postal_'secret-code': '10007',
        company_address_state: 'NY',
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_ssn_last_4: '0000',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123',
        relationship_account_opener_address_city: 'New York',
        relationship_account_opener_address_state: 'NY',
        relationship_account_opener_address_line1: '285 Fulton St',
        relationship_account_opener_address_postal_'secret-code': '10007'
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'usd',
        country: 'US',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        account_number: '000123456789',
        routing_number: '110000000'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
    })
  })
})
