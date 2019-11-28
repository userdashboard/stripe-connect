/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')

describe('/api/user/connect/set-individual-registration-submitted', () => {
  describe('exceptions', () => {
    describe('invalid-stripeid', () => {
      it('missing querystring stripeid', async () => {
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/connect/set-individual-registration-submitted')
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
        const req = TestHelper.createRequest('/api/user/connect/set-individual-registration-submitted?stripeid=invalid')
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
      it('ineligible stripe account for companies', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'US'
        })
        const req = TestHelper.createRequest(`/api/user/connect/set-individual-registration-submitted?stripeid=${user.stripeAccount.id}`)
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

      it('ineligible stripe account is submitted', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'individual',
          country: 'US'
        })
        await TestHelper.createStripeRegistration(user, {
          business_profile_mcc: '7997',
          business_profile_url: 'https://www.' + user.profile.contactEmail.split('@')[1],
          individual_address_city: 'New York',
          individual_address_state: 'NY',
          individual_address_country: 'US',
          individual_address_line1: '285 Fulton St',
          individual_address_postal_code: '10007',
          individual_ssn_last_4: '0000',
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_phone: '456-123-7890',
          individual_email: user.profile.contactEmail,
          individual_first_name: user.profile.firstName,
          individual_last_name: user.profile.lastName
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
        const req = TestHelper.createRequest(`/api/user/connect/set-individual-registration-submitted?stripeid=${user.stripeAccount.id}`)
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
          type: 'individual',
          country: 'DE'
        })
        const user2 = await TestHelper.createUser()
        const req = TestHelper.createRequest(`/api/user/connect/set-individual-registration-submitted?stripeid=${user.stripeAccount.id}`)
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
      it('ineligible registration missing payment details', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'individual',
          country: 'DE'
        })
        await TestHelper.createStripeRegistration(user, {
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          individual_address_city: 'Berlin',
          individual_address_state: 'BE',
          individual_address_country: 'DE',
          individual_address_line1: '123 Sesame St',
          individual_address_postal_code: '01067',
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_first_name: user.profile.firstName,
          individual_last_name: user.profile.lastName,
          individual_email: user.profile.contactEmail,
          individual_phone: '456-789-0123'

        })
        const req = TestHelper.createRequest(`/api/user/connect/set-individual-registration-submitted?stripeid=${user.stripeAccount.id}`)
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
    it('returns object for AT registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'AT'
      })
      await TestHelper.createStripeRegistration(user, {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName,
        individual_email: user.profile.contactEmail,
        individual_phone: '456-789-0123',
        individual_address_country: 'AT',
        individual_address_city: 'Vienna',
        individual_address_state: '1',
        individual_address_line1: '123 Sesame St',
        individual_address_postal_code: '1020'
      }, {
        individual_verification_document_front: TestHelper['success_id_scan_front.png'],
        individual_verification_document_back: TestHelper['success_id_scan_back.png']
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'eur',
        country: 'AT',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        iban: 'AT89370400440532013000'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-individual-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
    })

    it('returns object for AU registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'AU'
      })
      await TestHelper.createStripeRegistration(user, {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName,
        individual_email: user.profile.contactEmail,
        individual_phone: '456-789-0123',
        individual_address_city: 'Brisbane',
        individual_address_state: 'QLD',
        individual_address_country: 'AU',
        individual_address_line1: '845 Oxford St',
        individual_address_postal_code: '4000'
      }, {
        individual_verification_document_front: TestHelper['success_id_scan_front.png'],
        individual_verification_document_back: TestHelper['success_id_scan_back.png']
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'aud',
        country: 'AU',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        account_number: '000123456',
        bsb_number: '110000'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-individual-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
    })

    it('returns object for BE registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'BE'
      })
      await TestHelper.createStripeRegistration(user, {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        individual_address_city: 'Brussels',
        individual_address_state: 'BRU',
        individual_address_country: 'BE',
        individual_address_line1: '123 Sesame St',
        individual_address_postal_code: '1020',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_phone: '456-789-0123',
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName,
        individual_email: user.profile.contactEmail
      }, {
        individual_verification_document_front: TestHelper['success_id_scan_front.png'],
        individual_verification_document_back: TestHelper['success_id_scan_back.png']
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'eur',
        country: 'BE',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        iban: 'BE89370400440532013000'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-individual-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
    })

    it('returns object for CA registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'CA'
      })
      await TestHelper.createStripeRegistration(user, {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName,
        individual_email: user.profile.contactEmail,
        individual_phone: '456-789-0123',
        individual_address_city: 'Vancouver',
        individual_address_line1: '123 Sesame St',
        individual_address_state: 'BC',
        individual_address_country: 'CA',
        individual_address_postal_code: 'V5K 0A1',
        individual_id_number: '000000000'
      }, {
        individual_verification_document_front: TestHelper['success_id_scan_front.png'],
        individual_verification_document_back: TestHelper['success_id_scan_back.png']
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
      const req = TestHelper.createRequest(`/api/user/connect/set-individual-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
    })

    it('returns object for CH registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'CH'
      })
      await TestHelper.createStripeRegistration(user, {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        individual_address_city: 'Bern',
        individual_address_state: 'BE',
        individual_address_country: 'CH',
        individual_address_line1: '123 Sesame St',
        individual_address_postal_code: '1020',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName,
        individual_email: user.profile.contactEmail,
        individual_phone: '456-789-0123'
      }, {
        individual_verification_document_front: TestHelper['success_id_scan_front.png'],
        individual_verification_document_back: TestHelper['success_id_scan_back.png']
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'eur',
        country: 'CH',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        iban: 'CH89370400440532013000'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-individual-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
    })

    it('returns object for DE registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'DE'
      })
      await TestHelper.createStripeRegistration(user, {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        individual_address_city: 'Berlin',
        individual_address_state: 'BE',
        individual_address_country: 'DE',
        individual_address_line1: '123 Sesame St',
        individual_address_postal_code: '01067',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName,
        individual_email: user.profile.contactEmail,
        individual_phone: '456-789-0123'
      }, {
        individual_verification_document_front: TestHelper['success_id_scan_front.png'],
        individual_verification_document_back: TestHelper['success_id_scan_back.png']
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'eur',
        country: 'DE',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        iban: 'DE89370400440532013000'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-individual-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
    })

    it('returns object for DK registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'DK'
      })
      await TestHelper.createStripeRegistration(user, {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        individual_address_city: 'Copenhagen',
        individual_address_state: '147',
        individual_address_country: 'DK',
        individual_address_line1: '123 Sesame St',
        individual_address_postal_code: '1000',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName,
        individual_email: user.profile.contactEmail,
        individual_phone: '456-789-0123'
      }, {
        individual_verification_document_front: TestHelper['success_id_scan_front.png'],
        individual_verification_document_back: TestHelper['success_id_scan_back.png']
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'eur',
        country: 'DK',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        iban: 'DK89370400440532013000'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-individual-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
    })

    it('returns object for EE registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'EE'
      })
      await TestHelper.createStripeRegistration(user, {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        individual_address_city: 'Tallinn',
        individual_address_line1: '123 Sesame St',
        individual_address_state: '37',
        individual_address_country: 'EE',
        individual_address_postal_code: '10128',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName,
        individual_email: user.profile.contactEmail,
        individual_phone: '456-789-0123'
      }, {
        individual_verification_document_front: TestHelper['success_id_scan_front.png'],
        individual_verification_document_back: TestHelper['success_id_scan_back.png']
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'eur',
        country: 'EE',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        iban: 'EE89370400440532013000'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-individual-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
    })

    it('returns object for ES registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'ES'
      })
      await TestHelper.createStripeRegistration(user, {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        individual_address_city: 'Madrid',
        individual_address_line1: '123 Sesame St',
        individual_address_state: 'AN',
        individual_address_country: 'ES',
        individual_address_postal_code: '03179',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName,
        individual_email: user.profile.contactEmail,
        individual_phone: '456-789-0123'
      }, {
        individual_verification_document_front: TestHelper['success_id_scan_front.png'],
        individual_verification_document_back: TestHelper['success_id_scan_back.png']
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'eur',
        country: 'ES',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        iban: 'ES89370400440532013000'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-individual-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
    })

    it('returns object for FI registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'FI'
      })
      await TestHelper.createStripeRegistration(user, {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        individual_address_city: 'Helsinki',
        individual_address_state: 'AL',
        individual_address_country: 'FI',
        individual_address_line1: '123 Sesame St',
        individual_address_postal_code: '00990',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName,
        individual_email: user.profile.contactEmail,
        individual_phone: '456-789-0123'
      }, {
        individual_verification_document_front: TestHelper['success_id_scan_front.png'],
        individual_verification_document_back: TestHelper['success_id_scan_back.png']
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'eur',
        country: 'FI',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        iban: 'FI89370400440532013000'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-individual-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
    })

    it('returns object for FR registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'FR'
      })
      await TestHelper.createStripeRegistration(user, {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        individual_address_city: 'Paris',
        individual_address_line1: '123 Sesame St',
        individual_address_state: 'A',
        individual_address_country: 'FR',
        individual_address_postal_code: '75001',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName,
        individual_email: user.profile.contactEmail,
        individual_phone: '456-789-0123'
      }, {
        individual_verification_document_front: TestHelper['success_id_scan_front.png'],
        individual_verification_document_back: TestHelper['success_id_scan_back.png']
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'eur',
        country: 'FR',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        iban: 'FR89370400440532013000'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-individual-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
    })

    it('returns object for GB registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'GB'
      })
      await TestHelper.createStripeRegistration(user, {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        individual_address_city: 'London',
        individual_address_state: 'LND',
        individual_address_country: 'GB',
        individual_address_line1: '123 Sesame St',
        individual_address_postal_code: 'EC1A 1AA',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName,
        individual_email: user.profile.contactEmail,
        individual_phone: '456-789-0123'
      }, {
        individual_verification_document_front: TestHelper['success_id_scan_front.png'],
        individual_verification_document_back: TestHelper['success_id_scan_back.png']
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'eur',
        country: 'GB',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        iban: 'GB89370400440532013000'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-individual-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
    })

    it('returns object for HK registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'HK'
      })
      await TestHelper.createStripeRegistration(user, {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName,
        individual_id_number: '000000000',
        individual_email: user.profile.contactEmail,
        individual_phone: '456-789-0123',
        individual_address_city: 'Hong Kong',
        individual_address_line1: '123 Sesame St',
        individual_address_state: 'HK',
        individual_address_postal_code: '999077',
        individual_address_country: 'HK'
      }, {
        individual_verification_document_front: TestHelper['success_id_scan_front.png'],
        individual_verification_document_back: TestHelper['success_id_scan_back.png']
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'hkd',
        country: 'HK',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        account_number: '000123-456',
        clearing_code: '110',
        branch_code: '000'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-individual-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
    })

    it('returns object for IE registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'IE'
      })
      await TestHelper.createStripeRegistration(user, {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        individual_address_city: 'Dublin',
        individual_address_state: 'D',
        individual_address_country: 'IE',
        individual_address_line1: '123 Sesame St',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName,
        individual_email: user.profile.contactEmail,
        individual_phone: '456-789-0123',
        individual_address_postal_code: 'Dublin 1'
      }, {
        individual_verification_document_front: TestHelper['success_id_scan_front.png'],
        individual_verification_document_back: TestHelper['success_id_scan_back.png']
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'eur',
        country: 'IE',
        state: 'Dublin',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        iban: 'IE89370400440532013000'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-individual-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
    })

    it('returns object for IT registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'IT'
      })
      await TestHelper.createStripeRegistration(user, {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        individual_address_city: 'Rome',
        individual_address_state: '65',
        individual_address_country: 'IT',
        individual_address_line1: '123 Sesame St',
        individual_address_postal_code: '00010',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName,
        individual_email: user.profile.contactEmail,
        individual_phone: '456-789-0123'
      }, {
        individual_verification_document_front: TestHelper['success_id_scan_front.png'],
        individual_verification_document_back: TestHelper['success_id_scan_back.png']
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'eur',
        country: 'IT',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        iban: 'IT89370400440532013000'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-individual-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
    })

    // it('returns object for JP registration', async () => {
    //   const user = await TestHelper.createUser()
    //   await TestHelper.createStripeAccount(user, {
    //     type: 'individual',
    //     country: 'JP'
    //   })
    //   await TestHelper.createStripeRegistration(user, {
    //     individual_dob_day: '1',
    //     individual_dob_month: '1',
    //     individual_dob_year: '1950',
    //     individual_gender: 'female',
    //     individual_phone: '+81112345678',
    //     individual_first_name_kana: 'ﾄｳｷﾖｳﾄ',
    //     individual_last_name_kana: 'ﾄｳｷﾖｳﾄ',
    //     individual_first_name_kanji: '東京都',
    //     individual_last_name_kanji: '東京都',
    //     individual_address_kana_postal_code: '1500001',
    //     individual_address_kana_state: 'ﾄｳｷﾖｳﾄ',
    //     individual_address_kana_city: 'ｼﾌﾞﾔ',
    //     individual_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
    //     individual_address_kana_line1: '27-15',
    //     individual_address_kanji_postal_code: '1500001',
    //     individual_address_kanji_state: '東京都',
    //     individual_address_kanji_city: '渋谷区',
    //     individual_address_kanji_town: '神宮前 ３丁目',
    //     individual_address_kanji_line1: '２７－１５'
    //   })
    //   await TestHelper.createExternalAccount(user, {
    //     currency: 'jpy',
    //     country: 'JP',
    //     account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
    //     account_type: 'individual',
    //     account_number: '00012345',
    //     bank_code: '1100',
    //     branch_code: '000'
    //   })
    //   const req = TestHelper.createRequest(`/api/user/connect/set-individual-registration-submitted?stripeid=${user.stripeAccount.id}`)
    //   req.account = user.account
    //   req.session = user.session
    //   const accountNow = await req.patch()
    //   assert.notStrictEqual(accountNow.metadata.submitted, undefined)
    //   assert.notStrictEqual(accountNow.metadata.submitted, null)
    // })

    it('returns object for LT registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'LT'
      })
      await TestHelper.createStripeRegistration(user, {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        individual_address_city: 'Vilnius',
        individual_address_line1: '123 Sesame St',
        individual_address_postal_code: 'LT-00000',
        individual_address_state: 'AL',
        individual_address_country: 'LT',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName,
        individual_email: user.profile.contactEmail,
        individual_phone: '456-789-0123'
      }, {
        individual_verification_document_front: TestHelper['success_id_scan_front.png'],
        individual_verification_document_back: TestHelper['success_id_scan_back.png']
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'eur',
        country: 'LT',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        iban: 'LT89370400440532013000'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-individual-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
    })

    it('returns object for LU registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'LU'
      })
      await TestHelper.createStripeRegistration(user, {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        individual_address_city: 'Luxemburg',
        individual_address_line1: '123 Sesame St',
        individual_address_postal_code: '1623',
        individual_address_state: 'L',
        individual_address_country: 'LU',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName,
        individual_email: user.profile.contactEmail,
        individual_phone: '456-789-0123'
      }, {
        individual_verification_document_front: TestHelper['success_id_scan_front.png'],
        individual_verification_document_back: TestHelper['success_id_scan_back.png']
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'eur',
        country: 'LU',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        iban: 'LU89370400440532013000'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-individual-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
    })

    it('returns object for LV registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'LV'
      })
      await TestHelper.createStripeRegistration(user, {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        individual_address_city: 'Riga',
        individual_address_line1: '123 Sesame St',
        individual_address_postal_code: 'LV–1073',
        individual_address_state: 'AI',
        individual_address_country: 'LV',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName,
        individual_email: user.profile.contactEmail,
        individual_phone: '456-789-0123'
      }, {
        individual_verification_document_front: TestHelper['success_id_scan_front.png'],
        individual_verification_document_back: TestHelper['success_id_scan_back.png']
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'eur',
        country: 'LV',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        iban: 'LV89370400440532013000'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-individual-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
    })

    // it.only('returns object for MX registration', async () => {
    //   const user = await TestHelper.createUser()
    //   await TestHelper.createStripeAccount(user, {
    //     type: 'individual',
    //     country: 'MX'
    //   })
    //   await TestHelper.createStripeRegistration(user, {
    //     business_profile_mcc: '8931',
    //     business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
    //     individual_address_city: 'Mexico City',
    //     individual_address_line1: '123 Sesame St',
    //     individual_address_postal_code: '11000',
    //     individual_address_state: 'DIF',
    //     individual_address_country: 'MX',
    //     individual_dob_day: '1',
    //     individual_dob_month: '1',
    //     individual_dob_year: '1950',
    //     individual_first_name: user.profile.firstName,
    //     individual_last_name: user.profile.lastName,
    //     individual_email: user.profile.contactEmail,
    //     individual_phone: '456-789-0123',
    //   }, {
    //     individual_verification_document_front: TestHelper['success_id_scan_front.png'],
    //     individual_verification_document_back: TestHelper['success_id_scan_back.png']
    //   })
    //   await TestHelper.createExternalAccount(user, {
    //     currency: 'eur',
    //     country: 'MX',
    //     account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
    //     account_type: 'individual',
    //     iban: 'MX89370400440532013000'
    //   })
    //   const req = TestHelper.createRequest(`/api/user/connect/set-individual-registration-submitted?stripeid=${user.stripeAccount.id}`)
    //   req.account = user.account
    //   req.session = user.session
    //   const accountNow = await req.patch()
    //   assert.notStrictEqual(accountNow.metadata.submitted, undefined)
    //   assert.notStrictEqual(accountNow.metadata.submitted, null)
    // })

    it('returns object for NL registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'NL'
      })
      await TestHelper.createStripeRegistration(user, {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        individual_address_city: 'Amsterdam',
        individual_address_line1: '123 Sesame St',
        individual_address_postal_code: '1071 JA',
        individual_address_state: 'DR',
        individual_address_country: 'NL',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName,
        individual_email: user.profile.contactEmail,
        individual_phone: '456-789-0123'
      }, {
        individual_verification_document_front: TestHelper['success_id_scan_front.png'],
        individual_verification_document_back: TestHelper['success_id_scan_back.png']
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'eur',
        country: 'NL',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        iban: 'NL89370400440532013000'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-individual-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
    })

    it('returns object for NO registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'NO'
      })
      await TestHelper.createStripeRegistration(user, {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        individual_address_city: 'Oslo',
        individual_address_line1: '123 Sesame St',
        individual_address_postal_code: '0001',
        individual_address_state: '02',
        individual_address_country: 'NO',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName,
        individual_email: user.profile.contactEmail,
        individual_phone: '456-789-0123'
      }, {
        individual_verification_document_front: TestHelper['success_id_scan_front.png'],
        individual_verification_document_back: TestHelper['success_id_scan_back.png']
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'eur',
        country: 'NO',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        iban: 'NO89370400440532013000'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-individual-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
    })

    it('returns object for NZ registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'NZ'
      })
      await TestHelper.createStripeRegistration(user, {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName,
        individual_email: user.profile.contactEmail,
        individual_phone: '456-789-0123',
        individual_address_city: 'Auckland',
        individual_address_postal_code: '6011',
        individual_address_line1: '844 Fleet Street',
        individual_address_state: 'N',
        individual_address_country: 'NZ'
      }, {
        individual_verification_document_front: TestHelper['success_id_scan_front.png'],
        individual_verification_document_back: TestHelper['success_id_scan_back.png'],
        individual_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        individual_verification_additional_document_back: TestHelper['success_id_scan_back.png']
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'nzd',
        country: 'NZ',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        account_number: '0000000010',
        routing_number: '110000'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-individual-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
    })

    it('returns object for PT registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'PT'
      })
      await TestHelper.createStripeRegistration(user, {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        individual_address_city: 'Lisbon',
        individual_address_line1: '123 Sesame St',
        individual_address_postal_code: '4520',
        individual_address_state: '01',
        individual_address_country: 'PT',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName,
        individual_email: user.profile.contactEmail,
        individual_phone: '456-789-0123'
      }, {
        individual_verification_document_front: TestHelper['success_id_scan_front.png'],
        individual_verification_document_back: TestHelper['success_id_scan_back.png']
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'eur',
        country: 'PT',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        iban: 'PT89370400440532013000'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-individual-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
    })

    it('returns object for SE registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'SE'
      })
      await TestHelper.createStripeRegistration(user, {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        individual_address_city: 'Stockholm',
        individual_address_line1: '123 Sesame St',
        individual_address_postal_code: '00150',
        individual_address_state: 'K',
        individual_address_country: 'SE',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName,
        individual_email: user.profile.contactEmail,
        individual_phone: '456-789-0123'
      }, {
        individual_verification_document_front: TestHelper['success_id_scan_front.png'],
        individual_verification_document_back: TestHelper['success_id_scan_back.png']
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'eur',
        country: 'SE',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        iban: 'SE89370400440532013000'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-individual-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
    })

    it('returns object for SG registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'SG'
      })
      await TestHelper.createStripeRegistration(user, {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName,
        individual_email: user.profile.contactEmail,
        individual_address_line1: '123 Sesame St',
        individual_address_postal_code: '339696',
        individual_address_city: 'Singapore',
        individual_address_state: 'SG',
        individual_address_country: 'SG',
        individual_phone: '456-789-0123',
        individual_id_number: '000000000'
      }, {
        individual_verification_document_front: TestHelper['success_id_scan_front.png'],
        individual_verification_document_back: TestHelper['success_id_scan_back.png']
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'sgd',
        country: 'SG',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        account_number: '000123456',
        bank_code: '1100',
        branch_code: '000'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-individual-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
    })

    it('returns object for SI registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'SI'
      })
      await TestHelper.createStripeRegistration(user, {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        individual_address_city: 'Ljubljana',
        individual_address_line1: '123 Sesame St',
        individual_address_postal_code: '1210',
        individual_address_state: '07',
        individual_address_country: 'SI',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName,
        individual_email: user.profile.contactEmail,
        individual_phone: '456-789-0123'
      }, {
        individual_verification_document_front: TestHelper['success_id_scan_front.png'],
        individual_verification_document_back: TestHelper['success_id_scan_back.png']
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'eur',
        country: 'SI',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        iban: 'SI89370400440532013000'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-individual-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
    })

    it('returns object for SK registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'SK'
      })
      await TestHelper.createStripeRegistration(user, {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        individual_address_city: 'Slovakia',
        individual_address_line1: '123 Sesame St',
        individual_address_postal_code: '00102',
        individual_address_state: 'BC',
        individual_address_country: 'SK',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName,
        individual_email: user.profile.contactEmail,
        individual_phone: '456-789-0123'
      }, {
        individual_verification_document_front: TestHelper['success_id_scan_front.png'],
        individual_verification_document_back: TestHelper['success_id_scan_back.png']
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'eur',
        country: 'SK',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        iban: 'SK89370400440532013000'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-individual-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
    })

    it('returns object for US registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'US'
      })
      await TestHelper.createStripeRegistration(user, {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName,
        individual_email: user.profile.contactEmail,
        individual_phone: '456-789-0123',
        individual_address_city: 'New York',
        individual_ssn_last_4: '0000',
        individual_address_state: 'NY',
        individual_address_country: 'US',
        individual_address_line1: '285 Fulton St',
        individual_address_postal_code: '10007'
      }, {
        individual_verification_document_front: TestHelper['success_id_scan_front.png'],
        individual_verification_document_back: TestHelper['success_id_scan_back.png']
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'usd',
        country: 'US',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        account_number: '000123456789',
        routing_number: '110000000'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-individual-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
    })
  })
})
