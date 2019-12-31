/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')

describe('/api/user/connect/set-company-registration-submitted', () => {
  describe('exceptions', () => {
    describe('invalid-stripeid', () => {
      it('missing querystring stripeid', async () => {
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/connect/set-company-registration-submitted')
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
    })

    describe('invalid-stripe-account', () => {
      it('ineligible stripe account for individual', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'US',
          type: 'individual'
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

      it('ineligible stripe account is submitted', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'US',
          type: 'company'
        })
        await TestHelper.createStripeRegistration(user, {
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          address_city: 'New York',
          address_line1: '123 Park Lane',
          address_postal_code: '10001',
          address_state: 'NY',
          name: 'Company',
          phone: '456-789-0123',
          tax_id: '00000000000'
        })
        await TestHelper.createCompanyRepresentative(user, {
          address_city: 'New York',
          address_country: 'US',
          address_line1: '285 Fulton St',
          address_postal_code: '10007',
          address_state: 'NY',
          dob_day: '1',
          dob_month: '1',
          dob_year: '1950',
          email: user.profile.contactEmail,
          first_name: user.profile.firstName,
          last_name: user.profile.lastName,
          relationship_percent_ownership: '0',
          phone: '456-789-0123',
          relationship_executive: 'true',
          relationship_title: 'Owner',
          ssn_last_4: '0000'
        }, {
          verification_additional_document_back: TestHelper['success_id_scan_back.png'],
          verification_additional_document_front: TestHelper['success_id_scan_front.png'],
          verification_document_back: TestHelper['success_id_scan_back.png'],
          verification_document_front: TestHelper['success_id_scan_front.png']
        })
        await TestHelper.createExternalAccount(user, {
          account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
          account_holder_type: 'individual',
          account_number: '000123456789',
          country: 'US',
          currency: 'usd',
          routing_number: '110000000'
        })
        await TestHelper.submitBeneficialOwners(user)
        await TestHelper.setCompanyRepresentative(user)
        await TestHelper.submitStripeAccount(user)
        await TestHelper.waitForVerificationStart(user)
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
    })

    describe('invalid-account', () => {
      it('ineligible accessing account', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'DE',
          type: 'company'
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
    })

    describe('invalid-payment-details', () => {
      it('ineligible registration missing payment details', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'DE',
          type: 'company'
        })
        await TestHelper.createStripeRegistration(user, {
          business_profile_mcc: '7531',
          business_profile_url: 'https://www.abcde.com',
          address_city: 'Frederiksberg',
          address_line1: '123 Park Lane',
          address_postal_code: '1020',
          address_state: 'BW',
          name: 'Company',
          phone: '456-789-0123',
          tax_id: '00000000000'
        })
        await TestHelper.createCompanyRepresentative(user, {
          address_city: 'Frederiksberg',
          address_country: 'DE',
          address_line1: '123 Sesame St',
          address_postal_code: '1020',
          address_state: 'BW',
          dob_day: '1',
          dob_month: '1',
          dob_year: '1950',
          email: user.profile.contactEmail,
          first_name: user.profile.firstName,
          last_name: user.profile.lastName,
          phone: '456-789-1230',
          relationship_executive: 'true',
          relationship_title: 'Owner'
        }, {
          verification_additional_document_back: TestHelper['success_id_scan_back.png'],
          verification_additional_document_front: TestHelper['success_id_scan_front.png'],
          verification_document_back: TestHelper['success_id_scan_back.png'],
          verification_document_front: TestHelper['success_id_scan_front.png']
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
    })
  })

  describe('returns', () => {
    it('object for AT registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'AT',
        type: 'company'
      })
      await TestHelper.createStripeRegistration(user, {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        address_city: 'Vienna',
        address_line1: '123 Park Lane',
        address_postal_code: '1020',
        address_state: '1',
        name: 'Company',
        phone: '456-789-0123',
        tax_id: '00000000000'
      })
      await TestHelper.createCompanyRepresentative(user, {
        address_city: 'Vienna',
        address_country: 'AT',
        address_line1: '123 Sesame St',
        address_postal_code: '1020',
        address_state: '1',
        dob_day: '1',
        dob_month: '1',
        dob_year: '1950',
        email: user.profile.contactEmail,
        first_name: user.profile.firstName,
        last_name: user.profile.lastName,
        phone: '456-789-0123',
        relationship_executive: 'true',
        relationship_title: 'Owner'
      }, {
        verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        verification_document_back: TestHelper['success_id_scan_back.png'],
        verification_document_front: TestHelper['success_id_scan_front.png']
      })
      await TestHelper.createExternalAccount(user, {
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_holder_type: 'individual',
        country: 'AT',
        currency: 'eur',
        iban: 'AT89370400440532013000'
      })
      await TestHelper.setCompanyRepresentative(user)
      await TestHelper.submitBeneficialOwners(user)
      await TestHelper.submitCompanyDirectors(user)
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      await req.patch()
      await TestHelper.waitForVerificationStart(user)
      const req2 = TestHelper.createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
      req2.account = user.account
      req2.session = user.session
      const accountNow = await req2.get()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
      assert.strictEqual(accountNow.requirements.past_due.length, 0)
      assert.strictEqual(accountNow.requirements.eventually_due.length, 0)
      assert.strictEqual(accountNow.requirements.currently_due.length, 0)
    })

    it('object for AU registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'AU',
        type: 'company'
      })
      await TestHelper.createStripeRegistration(user, {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        address_city: 'Brisbane',
        address_line1: '123 Park Lane',
        address_postal_code: '4000',
        address_state: 'QLD',
        name: 'Company',
        phone: '456-789-0123',
        tax_id: '00000000000'
      })
      await TestHelper.createCompanyRepresentative(user, {
        address_city: 'Brisbane',
        address_country: 'AU',
        address_line1: '845 Oxford St',
        address_postal_code: '4000',
        address_state: 'QLD',
        dob_day: '1',
        dob_month: '1',
        dob_year: '1950',
        email: user.profile.contactEmail,
        first_name: user.profile.firstName,
        last_name: user.profile.lastName,
        phone: '456-789-0123',
        relationship_executive: 'true',
        relationship_title: 'Owner'
      }, {
        verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        verification_document_back: TestHelper['success_id_scan_back.png'],
        verification_document_front: TestHelper['success_id_scan_front.png']
      })
      await TestHelper.createExternalAccount(user, {
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_holder_type: 'individual',
        account_number: '000123456',
        bsb_number: '110000',
        country: 'AU',
        currency: 'aud'
      })
      await TestHelper.setCompanyRepresentative(user)
      await TestHelper.submitBeneficialOwners(user)
      await TestHelper.submitCompanyDirectors(user)
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      await req.patch()
      await TestHelper.waitForVerificationStart(user)
      const req2 = TestHelper.createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
      req2.account = user.account
      req2.session = user.session
      const accountNow = await req2.get()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
      assert.strictEqual(accountNow.requirements.past_due.length, 0)
      assert.strictEqual(accountNow.requirements.eventually_due.length, 0)
      assert.strictEqual(accountNow.requirements.currently_due.length, 0)
    })

    it('object for BE registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'BE',
        type: 'company'
      })
      await TestHelper.createStripeRegistration(user, {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        address_city: 'Brussels',
        address_line1: '123 Park Lane',
        address_postal_code: '1020',
        address_state: 'BRU',
        name: 'Company',
        phone: '456-789-0123',
        tax_id: '00000000000'
      }, {
        verification_document_back: TestHelper['success_id_scan_back.png'],
        verification_document_front: TestHelper['success_id_scan_front.png']
      })
      await TestHelper.createCompanyRepresentative(user, {
        address_city: 'Brussels',
        address_country: 'BE',
        address_line1: '123 Sesame St',
        address_postal_code: '1020',
        address_state: 'BRU',
        dob_day: '1',
        dob_month: '1',
        dob_year: '1950',
        email: user.profile.contactEmail,
        first_name: user.profile.firstName,
        last_name: user.profile.lastName,
        phone: '456-789-0123',
        relationship_executive: 'true',
        relationship_title: 'Owner'
      }, {
        verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        verification_document_back: TestHelper['success_id_scan_back.png'],
        verification_document_front: TestHelper['success_id_scan_front.png']
      })
      await TestHelper.createExternalAccount(user, {
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_holder_type: 'individual',
        country: 'BE',
        currency: 'eur',
        iban: 'BE89370400440532013000'
      })
      await TestHelper.setCompanyRepresentative(user)
      await TestHelper.submitBeneficialOwners(user)
      await TestHelper.submitCompanyDirectors(user)
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      await req.patch()
      await TestHelper.waitForVerificationStart(user)
      const req2 = TestHelper.createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
      req2.account = user.account
      req2.session = user.session
      const accountNow = await req2.get()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
      assert.strictEqual(accountNow.requirements.past_due.length, 0)
      assert.strictEqual(accountNow.requirements.eventually_due.length, 0)
      assert.strictEqual(accountNow.requirements.currently_due.length, 0)
    })

    it('object for CA registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'CA',
        type: 'company'
      })
      await TestHelper.createStripeRegistration(user, {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        address_city: 'Vancouver',
        address_line1: '123 Park Lane',
        address_postal_code: 'V5K 0A1',
        address_state: 'BC',
        name: 'Company',
        phone: '456-789-0123',
        tax_id: '00000000000'
      })
      await TestHelper.createCompanyRepresentative(user, {
        address_city: 'Vancouver',
        address_country: 'CA',
        address_line1: '123 Sesame St',
        address_postal_code: 'V5K 0A1',
        address_state: 'BC',
        dob_day: '1',
        dob_month: '1',
        dob_year: '1950',
        email: user.profile.contactEmail,
        first_name: user.profile.firstName,
        id_number: '000000000',
        last_name: user.profile.lastName,
        relationship_percent_ownership: '0',
        phone: '456-789-0123',
        relationship_executive: 'true',
        relationship_title: 'Owner'
      }, {
        verification_document_back: TestHelper['success_id_scan_back.png'],
        verification_document_front: TestHelper['success_id_scan_front.png']
      })
      await TestHelper.setCompanyRepresentative(user)
      await TestHelper.createExternalAccount(user, {
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_holder_type: 'individual',
        account_number: '000123456789',
        country: 'CA',
        currency: 'cad',
        institution_number: '000',
        transit_number: '11000'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      await req.patch()
      await TestHelper.waitForVerificationStart(user)
      const req2 = TestHelper.createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
      req2.account = user.account
      req2.session = user.session
      const accountNow = await req2.get()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
      assert.strictEqual(accountNow.requirements.past_due.length, 0)
      assert.strictEqual(accountNow.requirements.eventually_due.length, 0)
      assert.strictEqual(accountNow.requirements.currently_due.length, 0)
    })

    it('object for CH registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'CH',
        type: 'company'
      })
      await TestHelper.createStripeRegistration(user, {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        address_city: 'Bern',
        address_line1: '123 Park Lane',
        address_postal_code: '1020',
        address_state: 'BE',
        name: 'Company',
        phone: '456-789-0123',
        tax_id: '00000000000'
      })
      await TestHelper.createCompanyRepresentative(user, {
        address_city: 'Bern',
        address_country: 'CH',
        address_line1: '123 Sesame St',
        address_postal_code: '1020',
        address_state: 'BE',
        dob_day: '1',
        dob_month: '1',
        dob_year: '1950',
        email: user.profile.contactEmail,
        first_name: user.profile.firstName,
        last_name: user.profile.lastName,
        phone: '456-789-0123',
        relationship_executive: 'true',
        relationship_title: 'Owner'
      }, {
        verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        verification_document_back: TestHelper['success_id_scan_back.png'],
        verification_document_front: TestHelper['success_id_scan_front.png']
      })
      await TestHelper.createExternalAccount(user, {
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_holder_type: 'individual',
        country: 'CH',
        currency: 'eur',
        iban: 'CH89370400440532013000'
      })
      await TestHelper.setCompanyRepresentative(user)
      await TestHelper.submitBeneficialOwners(user)
      await TestHelper.submitCompanyDirectors(user)
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      await req.patch()
      await TestHelper.waitForVerificationStart(user)
      const req2 = TestHelper.createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
      req2.account = user.account
      req2.session = user.session
      const accountNow = await req2.get()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
      assert.strictEqual(accountNow.requirements.past_due.length, 0)
      assert.strictEqual(accountNow.requirements.eventually_due.length, 0)
      assert.strictEqual(accountNow.requirements.currently_due.length, 0)
    })

    it('object for DE registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'DE',
        type: 'company'
      })
      await TestHelper.createStripeRegistration(user, {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        address_city: 'Berlin',
        address_line1: '123 Park Lane',
        address_postal_code: '01067',
        address_state: 'BE',
        name: 'Company',
        phone: '456-789-0123',
        tax_id: '00000000000'
      })
      await TestHelper.createCompanyRepresentative(user, {
        address_city: 'Berlin',
        address_country: 'DE',
        address_line1: '123 Sesame St',
        address_postal_code: '01067',
        address_state: 'BE',
        dob_day: '1',
        dob_month: '1',
        dob_year: '1950',
        email: user.profile.contactEmail,
        first_name: user.profile.firstName,
        last_name: user.profile.lastName,
        phone: '456-789-0123',
        relationship_executive: 'true',
        relationship_title: 'Owner'
      }, {
        verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        verification_document_back: TestHelper['success_id_scan_back.png'],
        verification_document_front: TestHelper['success_id_scan_front.png']
      })
      await TestHelper.createExternalAccount(user, {
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_holder_type: 'individual',
        country: 'DE',
        currency: 'eur',
        iban: 'DE89370400440532013000'
      })
      await TestHelper.setCompanyRepresentative(user)
      await TestHelper.submitBeneficialOwners(user)
      await TestHelper.submitCompanyDirectors(user)
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      await req.patch()
      await TestHelper.waitForVerificationStart(user)
      const req2 = TestHelper.createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
      req2.account = user.account
      req2.session = user.session
      const accountNow = await req2.get()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
      assert.strictEqual(accountNow.requirements.past_due.length, 0)
      assert.strictEqual(accountNow.requirements.eventually_due.length, 0)
      assert.strictEqual(accountNow.requirements.currently_due.length, 0)
    })

    it('object for DK registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'DK',
        type: 'company'
      })
      await TestHelper.createStripeRegistration(user, {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        address_city: 'Copenhagen',
        address_line1: '123 Park Lane',
        address_postal_code: '1000',
        address_state: '147',
        name: 'Company',
        phone: '456-789-0123',
        tax_id: '00000000000'
      })
      await TestHelper.createCompanyRepresentative(user, {
        address_city: 'Copenhagen',
        address_country: 'DK',
        address_line1: '123 Sesame St',
        address_postal_code: '1000',
        address_state: '147',
        dob_day: '1',
        dob_month: '1',
        dob_year: '1950',
        email: user.profile.contactEmail,
        first_name: user.profile.firstName,
        last_name: user.profile.lastName,
        phone: '456-789-0123',
        relationship_executive: 'true',
        relationship_title: 'Owner'
      }, {
        verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        verification_document_back: TestHelper['success_id_scan_back.png'],
        verification_document_front: TestHelper['success_id_scan_front.png']
      })
      await TestHelper.createExternalAccount(user, {
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_holder_type: 'individual',
        country: 'DK',
        currency: 'eur',
        iban: 'DK89370400440532013000'
      })
      await TestHelper.setCompanyRepresentative(user)
      await TestHelper.submitBeneficialOwners(user)
      await TestHelper.submitCompanyDirectors(user)
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      await req.patch()
      await TestHelper.waitForVerificationStart(user)
      const req2 = TestHelper.createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
      req2.account = user.account
      req2.session = user.session
      const accountNow = await req2.get()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
      assert.strictEqual(accountNow.requirements.past_due.length, 0)
      assert.strictEqual(accountNow.requirements.eventually_due.length, 0)
      assert.strictEqual(accountNow.requirements.currently_due.length, 0)
    })

    it('object for EE registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'EE',
        type: 'company'
      })
      await TestHelper.createStripeRegistration(user, {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        address_city: 'Talin',
        address_line1: '123 Park Lane',
        address_postal_code: '10128',
        address_state: '37',
        name: 'Company',
        phone: '456-789-0123',
        tax_id: '00000000000'
      })
      await TestHelper.createCompanyRepresentative(user, {
        address_city: 'Tallinn',
        address_country: 'EE',
        address_line1: '123 Sesame St',
        address_postal_code: '10128',
        address_state: '37',
        dob_day: '1',
        dob_month: '1',
        dob_year: '1950',
        email: user.profile.contactEmail,
        first_name: user.profile.firstName,
        last_name: user.profile.lastName,
        phone: '456-789-0123',
        relationship_executive: 'true',
        relationship_title: 'Owner'
      }, {
        verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        verification_document_back: TestHelper['success_id_scan_back.png'],
        verification_document_front: TestHelper['success_id_scan_front.png']
      })
      await TestHelper.createExternalAccount(user, {
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_holder_type: 'individual',
        country: 'EE',
        currency: 'eur',
        iban: 'EE89370400440532013000'
      })
      await TestHelper.setCompanyRepresentative(user)
      await TestHelper.submitBeneficialOwners(user)
      await TestHelper.submitCompanyDirectors(user)
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      await req.patch()
      await TestHelper.waitForVerificationStart(user)
      const req2 = TestHelper.createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
      req2.account = user.account
      req2.session = user.session
      const accountNow = await req2.get()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
      assert.strictEqual(accountNow.requirements.past_due.length, 0)
      assert.strictEqual(accountNow.requirements.eventually_due.length, 0)
      assert.strictEqual(accountNow.requirements.currently_due.length, 0)
    })

    it('object for ES registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'ES',
        type: 'company'
      })
      await TestHelper.createStripeRegistration(user, {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        address_city: 'Madrid',
        address_line1: '123 Park Lane',
        address_postal_code: '03179',
        address_state: 'AN',
        name: 'Company',
        phone: '456-789-01234',
        tax_id: '00000000000'
      })
      await TestHelper.createCompanyRepresentative(user, {
        address_city: 'Madrid',
        address_country: 'ES',
        address_line1: '123 Sesame St',
        address_postal_code: '03179',
        address_state: 'AN',
        dob_day: '1',
        dob_month: '1',
        dob_year: '1950',
        email: user.profile.contactEmail,
        first_name: user.profile.firstName,
        last_name: user.profile.lastName,
        phone: '456-789-0123',
        relationship_executive: 'true',
        relationship_title: 'Owner'
      }, {
        verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        verification_document_back: TestHelper['success_id_scan_back.png'],
        verification_document_front: TestHelper['success_id_scan_front.png']
      })
      await TestHelper.createExternalAccount(user, {
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_holder_type: 'individual',
        country: 'ES',
        currency: 'eur',
        iban: 'ES89370400440532013000'
      })
      await TestHelper.setCompanyRepresentative(user)
      await TestHelper.submitBeneficialOwners(user)
      await TestHelper.submitCompanyDirectors(user)
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      await req.patch()
      await TestHelper.waitForVerificationStart(user)
      const req2 = TestHelper.createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
      req2.account = user.account
      req2.session = user.session
      const accountNow = await req2.get()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
      assert.strictEqual(accountNow.requirements.past_due.length, 0)
      assert.strictEqual(accountNow.requirements.eventually_due.length, 0)
      assert.strictEqual(accountNow.requirements.currently_due.length, 0)
    })

    it('object for FI registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'FI',
        type: 'company'
      })
      await TestHelper.createStripeRegistration(user, {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        address_city: 'Helsinki',
        address_line1: '123 Park Lane',
        address_postal_code: '00990',
        address_state: 'AL',
        name: 'Company',
        phone: '456-789-0123',
        tax_id: '00000000000'
      })
      await TestHelper.createCompanyRepresentative(user, {
        address_city: 'Helsinki',
        address_country: 'FI',
        address_line1: '123 Sesame St',
        address_postal_code: '00990',
        address_state: 'AL',
        dob_day: '1',
        dob_month: '1',
        dob_year: '1950',
        email: user.profile.contactEmail,
        first_name: user.profile.firstName,
        last_name: user.profile.lastName,
        phone: '456-789-0123',
        relationship_executive: 'true',
        relationship_title: 'Owner'
      }, {
        verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        verification_document_back: TestHelper['success_id_scan_back.png'],
        verification_document_front: TestHelper['success_id_scan_front.png']
      })
      await TestHelper.createExternalAccount(user, {
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_holder_type: 'individual',
        country: 'FI',
        currency: 'eur',
        iban: 'FI89370400440532013000'
      })
      await TestHelper.setCompanyRepresentative(user)
      await TestHelper.submitBeneficialOwners(user)
      await TestHelper.submitCompanyDirectors(user)
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      await req.patch()
      await TestHelper.waitForVerificationStart(user)
      const req2 = TestHelper.createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
      req2.account = user.account
      req2.session = user.session
      const accountNow = await req2.get()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
      assert.strictEqual(accountNow.requirements.past_due.length, 0)
      assert.strictEqual(accountNow.requirements.eventually_due.length, 0)
      assert.strictEqual(accountNow.requirements.currently_due.length, 0)
    })

    it('object for FR registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'FR',
        type: 'company'
      })
      await TestHelper.createStripeRegistration(user, {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        address_city: 'Paris',
        address_line1: '123 Park Lane',
        address_postal_code: '75001',
        address_state: 'A',
        name: 'Company',
        phone: '456-789-0123',
        tax_id: '00000000000'
      })
      await TestHelper.createCompanyRepresentative(user, {
        address_city: 'Paris',
        address_country: 'FR',
        address_line1: '123 Sesame St',
        address_postal_code: '75001',
        address_state: 'A',
        dob_day: '1',
        dob_month: '1',
        dob_year: '1950',
        email: user.profile.contactEmail,
        first_name: user.profile.firstName,
        last_name: user.profile.lastName,
        phone: '456-789-0123',
        relationship_executive: 'true',
        relationship_title: 'Owner'
      }, {
        verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        verification_document_back: TestHelper['success_id_scan_back.png'],
        verification_document_front: TestHelper['success_id_scan_front.png']
      })
      await TestHelper.createExternalAccount(user, {
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_holder_type: 'individual',
        country: 'FR',
        currency: 'eur',
        iban: 'FR89370400440532013000'
      })
      await TestHelper.setCompanyRepresentative(user)
      await TestHelper.submitBeneficialOwners(user)
      await TestHelper.submitCompanyDirectors(user)
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      await req.patch()
      await TestHelper.waitForVerificationStart(user)
      const req2 = TestHelper.createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
      req2.account = user.account
      req2.session = user.session
      const accountNow = await req2.get()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
      assert.strictEqual(accountNow.requirements.past_due.length, 0)
      assert.strictEqual(accountNow.requirements.eventually_due.length, 0)
      assert.strictEqual(accountNow.requirements.currently_due.length, 0)
    })

    it('object for GB registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'GB',
        type: 'company'
      })
      await TestHelper.createStripeRegistration(user, {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        address_city: 'London',
        address_line1: '123 Park Lane',
        address_postal_code: 'EC1A 1AA',
        address_state: 'LND',
        name: 'Company',
        phone: '456-789-0123',
        tax_id: '00000000000'
      }, {
        verification_document_back: TestHelper['success_id_scan_back.png'],
        verification_document_front: TestHelper['success_id_scan_front.png']
      })
      await TestHelper.createCompanyRepresentative(user, {
        address_city: 'London',
        address_country: 'GB',
        address_line1: '123 Sesame St',
        address_postal_code: 'EC1A 1AA',
        address_state: 'LND',
        dob_day: '1',
        dob_month: '1',
        dob_year: '1950',
        email: user.profile.contactEmail,
        first_name: user.profile.firstName,
        last_name: user.profile.lastName,
        phone: '456-789-0123',
        relationship_executive: 'true',
        relationship_title: 'Owner'
      }, {
        verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        verification_document_back: TestHelper['success_id_scan_back.png'],
        verification_document_front: TestHelper['success_id_scan_front.png']
      })
      await TestHelper.createExternalAccount(user, {
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_holder_type: 'individual',
        country: 'GB',
        currency: 'eur',
        iban: 'GB89370400440532013000'
      })
      await TestHelper.setCompanyRepresentative(user)
      await TestHelper.submitBeneficialOwners(user)
      await TestHelper.submitCompanyDirectors(user)
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      await req.patch()
      await TestHelper.waitForVerificationStart(user)
      const req2 = TestHelper.createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
      req2.account = user.account
      req2.session = user.session
      const accountNow = await req2.get()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
      assert.strictEqual(accountNow.requirements.past_due.length, 0)
      assert.strictEqual(accountNow.requirements.eventually_due.length, 0)
      assert.strictEqual(accountNow.requirements.currently_due.length, 0)
    })

    it('object for HK registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'HK',
        type: 'company'
      })
      await TestHelper.createStripeRegistration(user, {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        address_city: 'Hong Kong',
        address_line1: '123 Park Lane',
        address_postal_code: '00000',
        address_state: 'HK',
        name: 'Company',
        phone: '456-789-0234',
        tax_id: '00000000000'
      })
      await TestHelper.createCompanyRepresentative(user, {
        address_city: 'Hong Kong',
        address_country: 'HK',
        address_line1: '123 Sesame St',
        address_postal_code: '999077',
        address_state: 'HK',
        dob_day: '1',
        dob_month: '1',
        dob_year: '1950',
        email: user.profile.contactEmail,
        first_name: user.profile.firstName,
        id_number: '000000000',
        last_name: user.profile.lastName,
        relationship_percent_ownership: '0',
        phone: '456-789-0123',
        relationship_executive: 'true',
        relationship_title: 'Owner'
      }, {
        verification_document_back: TestHelper['success_id_scan_back.png'],
        verification_document_front: TestHelper['success_id_scan_front.png']
      })
      await TestHelper.setCompanyRepresentative(user)
      await TestHelper.createExternalAccount(user, {
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_holder_type: 'individual',
        account_number: '000123456',
        branch_code: '000',
        clearing_code: '110',
        country: 'HK',
        currency: 'hkd'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      await req.patch()
      await TestHelper.waitForVerificationStart(user)
      const req2 = TestHelper.createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
      req2.account = user.account
      req2.session = user.session
      const accountNow = await req2.get()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
      assert.strictEqual(accountNow.requirements.past_due.length, 0)
      assert.strictEqual(accountNow.requirements.eventually_due.length, 0)
      assert.strictEqual(accountNow.requirements.currently_due.length, 0)
    })

    it('object for IE registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'IE',
        type: 'company'
      })
      await TestHelper.createStripeRegistration(user, {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        address_city: 'Dublin',
        address_line1: '123 Park Lane',
        address_postal_code: 'Dublin 1',
        address_state: 'D',
        name: 'Company',
        phone: '456-789-0123',
        tax_id: '00000000000'
      })
      await TestHelper.createCompanyRepresentative(user, {
        address_city: 'Dublin',
        address_country: 'IE',
        address_line1: '123 Sesame St',
        address_postal_code: 'Dublin 1',
        address_state: 'D',
        dob_day: '1',
        dob_month: '1',
        dob_year: '1950',
        email: user.profile.contactEmail,
        first_name: user.profile.firstName,
        last_name: user.profile.lastName,
        phone: '456-789-0123',
        relationship_executive: 'true',
        relationship_title: 'Owner'
      }, {
        verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        verification_document_back: TestHelper['success_id_scan_back.png'],
        verification_document_front: TestHelper['success_id_scan_front.png']
      })
      await TestHelper.createExternalAccount(user, {
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_holder_type: 'individual',
        state: 'Dublin',
        country: 'IE',
        currency: 'eur',
        iban: 'IE89370400440532013000'
      })
      await TestHelper.setCompanyRepresentative(user)
      await TestHelper.submitBeneficialOwners(user)
      await TestHelper.submitCompanyDirectors(user)
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      await req.patch()
      await TestHelper.waitForVerificationStart(user)
      const req2 = TestHelper.createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
      req2.account = user.account
      req2.session = user.session
      const accountNow = await req2.get()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
      assert.strictEqual(accountNow.requirements.past_due.length, 0)
      assert.strictEqual(accountNow.requirements.eventually_due.length, 0)
      assert.strictEqual(accountNow.requirements.currently_due.length, 0)
    })

    it('object for IT registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'IT',
        type: 'company'
      })
      await TestHelper.createStripeRegistration(user, {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        address_city: 'Rome',
        address_line1: '123 Park Lane',
        address_postal_code: '00010',
        address_state: '65',
        name: 'Company',
        phone: '456-789-0123',
        tax_id: '00000000000'
      })
      await TestHelper.createCompanyRepresentative(user, {
        address_city: 'Rome',
        address_country: 'IT',
        address_line1: '123 Sesame St',
        address_postal_code: '00010',
        address_state: '65',
        dob_day: '1',
        dob_month: '1',
        dob_year: '1950',
        email: user.profile.contactEmail,
        first_name: user.profile.firstName,
        last_name: user.profile.lastName,
        phone: '456-789-0123',
        relationship_executive: 'true',
        relationship_title: 'Owner'
      }, {
        verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        verification_document_back: TestHelper['success_id_scan_back.png'],
        verification_document_front: TestHelper['success_id_scan_front.png']
      })
      await TestHelper.createExternalAccount(user, {
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_holder_type: 'individual',
        country: 'IT',
        currency: 'eur',
        iban: 'IT89370400440532013000'
      })
      await TestHelper.setCompanyRepresentative(user)
      await TestHelper.submitBeneficialOwners(user)
      await TestHelper.submitCompanyDirectors(user)
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      await req.patch()
      await TestHelper.waitForVerificationStart(user)
      const req2 = TestHelper.createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
      req2.account = user.account
      req2.session = user.session
      const accountNow = await req2.get()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
      assert.strictEqual(accountNow.requirements.past_due.length, 0)
      assert.strictEqual(accountNow.requirements.eventually_due.length, 0)
      assert.strictEqual(accountNow.requirements.currently_due.length, 0)
    })

    it('object for JP registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'JP',
        type: 'company'
      })
      await TestHelper.createStripeRegistration(user, {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        address_kana_city: 'ｼﾌﾞﾔ',
        address_kana_line1: '27-15',
        address_kana_postal_code: '1500001',
        address_kana_state: 'ﾄｳｷﾖｳﾄ',
        address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        address_kanji_city: '渋谷区',
        address_kanji_line1: '２７－１５',
        address_kanji_postal_code: '1500001',
        address_kanji_state: '東京都',
        address_kanji_town: '神宮前 ３丁目',
        name: 'Company',
        name_kana: 'Company',
        name_kanji: 'Company',
        phone: '011-271-6677',
        tax_id: '00000000000'
      })
      await TestHelper.createCompanyRepresentative(user, {
        address_kana_city: 'ｼﾌﾞﾔ',
        address_kana_line1: '27-15',
        address_kana_postal_code: '1500001',
        address_kana_state: 'ﾄｳｷﾖｳﾄ',
        address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        address_kanji_city: '渋谷区',
        address_kanji_line1: '２７－１５',
        address_kanji_postal_code: '1500001',
        address_kanji_state: '東京都',
        address_kanji_town: '神宮前 ３丁目',
        dob_day: '1',
        dob_month: '1',
        dob_year: '1950',
        email: user.profile.contactEmail,
        first_name: user.profile.firstName,
        first_name_kana: 'ﾄｳｷﾖｳﾄ',
        first_name_kanji: '東京都',
        gender: 'female',
        last_name: user.profile.lastName,
        last_name_kana: 'ﾄｳｷﾖｳﾄ',
        last_name_kanji: '東京都',
        relationship_percent_ownership: '0',
        phone: '456-789-0123',
        relationship_executive: 'true',
        relationship_title: 'Owner'
      }, {
        verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        verification_document_back: TestHelper['success_id_scan_back.png'],
        verification_document_front: TestHelper['success_id_scan_front.png']
      })
      await TestHelper.createExternalAccount(user, {
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_holder_type: 'individual',
        account_number: '0001234',
        bank_code: '110',
        branch_code: '0000',
        country: 'JP',
        currency: 'jpy'
      })
      await TestHelper.setCompanyRepresentative(user)
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      await req.patch()
      await TestHelper.waitForVerificationStart(user)
      const req2 = TestHelper.createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
      req2.account = user.account
      req2.session = user.session
      const accountNow = await req2.get()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
      assert.strictEqual(accountNow.requirements.past_due.length, 0)
      assert.strictEqual(accountNow.requirements.eventually_due.length, 0)
      assert.strictEqual(accountNow.requirements.currently_due.length, 0)
    })

    it('object for LT registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'LT',
        type: 'company'
      })
      await TestHelper.createStripeRegistration(user, {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        address_city: 'Vilnius',
        address_line1: '123 Sesame St',
        address_postal_code: 'LT-00000',
        address_state: 'AL',
        name: 'Company',
        phone: '456-789-0123',
        tax_id: '00000000000'
      })
      await TestHelper.createCompanyRepresentative(user, {
        address_city: 'Vilnius',
        address_country: 'LT',
        address_line1: '123 Sesame St',
        address_postal_code: 'LT-00000',
        address_state: 'AL',
        dob_day: '1',
        dob_month: '1',
        dob_year: '1950',
        email: user.profile.contactEmail,
        first_name: user.profile.firstName,
        last_name: user.profile.lastName,
        phone: '456-789-0123',
        relationship_executive: 'true',
        relationship_title: 'Owner'
      }, {
        verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        verification_document_back: TestHelper['success_id_scan_back.png'],
        verification_document_front: TestHelper['success_id_scan_front.png']
      })
      await TestHelper.createExternalAccount(user, {
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_holder_type: 'individual',
        country: 'LT',
        currency: 'eur',
        iban: 'LT89370400440532013000'
      })
      await TestHelper.setCompanyRepresentative(user)
      await TestHelper.submitBeneficialOwners(user)
      await TestHelper.submitCompanyDirectors(user)
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      await req.patch()
      await TestHelper.waitForVerificationStart(user)
      const req2 = TestHelper.createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
      req2.account = user.account
      req2.session = user.session
      const accountNow = await req2.get()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
      assert.strictEqual(accountNow.requirements.past_due.length, 0)
      assert.strictEqual(accountNow.requirements.eventually_due.length, 0)
      assert.strictEqual(accountNow.requirements.currently_due.length, 0)
    })

    it('object for LU registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'LU',
        type: 'company'
      })
      await TestHelper.createStripeRegistration(user, {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        address_city: 'Luxemburg',
        address_line1: '123 Park Lane',
        address_postal_code: '1623',
        address_state: 'L',
        name: 'Company',
        phone: '456-789-0123',
        tax_id: '00000000000'
      })
      await TestHelper.createCompanyRepresentative(user, {
        address_city: 'Luxemburg',
        address_country: 'LU',
        address_line1: '123 Sesame St',
        address_postal_code: '1623',
        address_state: 'L',
        dob_day: '1',
        dob_month: '1',
        dob_year: '1950',
        email: user.profile.contactEmail,
        first_name: user.profile.firstName,
        last_name: user.profile.lastName,
        phone: '456-789-0123',
        relationship_executive: 'true',
        relationship_title: 'Owner'
      }, {
        verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        verification_document_back: TestHelper['success_id_scan_back.png'],
        verification_document_front: TestHelper['success_id_scan_front.png']
      })
      await TestHelper.createExternalAccount(user, {
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_holder_type: 'individual',
        country: 'LU',
        currency: 'eur',
        iban: 'LU89370400440532013000'
      })
      await TestHelper.setCompanyRepresentative(user)
      await TestHelper.submitBeneficialOwners(user)
      await TestHelper.submitCompanyDirectors(user)
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      await req.patch()
      await TestHelper.waitForVerificationStart(user)
      const req2 = TestHelper.createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
      req2.account = user.account
      req2.session = user.session
      const accountNow = await req2.get()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
      assert.strictEqual(accountNow.requirements.past_due.length, 0)
      assert.strictEqual(accountNow.requirements.eventually_due.length, 0)
      assert.strictEqual(accountNow.requirements.currently_due.length, 0)
    })

    it('object for LV registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'LV',
        type: 'company'
      })
      await TestHelper.createStripeRegistration(user, {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        address_city: 'Riga',
        address_line1: '123 Sesame St',
        address_postal_code: 'LV–1073',
        address_state: 'AI',
        name: 'Company',
        phone: '456-789-0123',
        tax_id: '00000000000'
      })
      await TestHelper.createCompanyRepresentative(user, {
        address_city: 'Riga',
        address_country: 'LV',
        address_line1: '123 Sesame St',
        address_postal_code: 'LV–1073',
        address_state: 'AI',
        dob_day: '1',
        dob_month: '1',
        dob_year: '1950',
        email: user.profile.contactEmail,
        first_name: user.profile.firstName,
        last_name: user.profile.lastName,
        phone: '456-789-0123',
        relationship_executive: 'true',
        relationship_title: 'Owner'
      }, {
        verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        verification_document_back: TestHelper['success_id_scan_back.png'],
        verification_document_front: TestHelper['success_id_scan_front.png']
      })
      await TestHelper.createExternalAccount(user, {
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_holder_type: 'individual',
        country: 'LV',
        currency: 'eur',
        iban: 'LV89370400440532013000'
      })
      await TestHelper.setCompanyRepresentative(user)
      await TestHelper.submitBeneficialOwners(user)
      await TestHelper.submitCompanyDirectors(user)
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      await req.patch()
      await TestHelper.waitForVerificationStart(user)
      const req2 = TestHelper.createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
      req2.account = user.account
      req2.session = user.session
      const accountNow = await req2.get()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
      assert.strictEqual(accountNow.requirements.past_due.length, 0)
      assert.strictEqual(accountNow.requirements.eventually_due.length, 0)
      assert.strictEqual(accountNow.requirements.currently_due.length, 0)
    })

    it('object for NL registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'NL',
        type: 'company'
      })
      await TestHelper.createStripeRegistration(user, {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        address_city: 'Amsterdam',
        address_line1: '123 Park Lane',
        address_postal_code: '1071 JA',
        address_state: 'DR',
        name: 'Company',
        phone: '456-789-0123',
        tax_id: '00000000000'
      })
      await TestHelper.createCompanyRepresentative(user, {
        address_city: 'Amsterdam',
        address_country: 'NL',
        address_line1: '123 Sesame St',
        address_postal_code: '1071 JA',
        address_state: 'DR',
        dob_day: '1',
        dob_month: '1',
        dob_year: '1950',
        email: user.profile.contactEmail,
        first_name: user.profile.firstName,
        last_name: user.profile.lastName,
        phone: '456-789-0123',
        relationship_executive: 'true',
        relationship_title: 'Owner'
      }, {
        verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        verification_document_back: TestHelper['success_id_scan_back.png'],
        verification_document_front: TestHelper['success_id_scan_front.png']
      })
      await TestHelper.createExternalAccount(user, {
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_holder_type: 'individual',
        country: 'NL',
        currency: 'eur',
        iban: 'NL89370400440532013000'
      })
      await TestHelper.setCompanyRepresentative(user)
      await TestHelper.submitBeneficialOwners(user)
      await TestHelper.submitCompanyDirectors(user)
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      await req.patch()
      await TestHelper.waitForVerificationStart(user)
      const req2 = TestHelper.createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
      req2.account = user.account
      req2.session = user.session
      const accountNow = await req2.get()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
      assert.strictEqual(accountNow.requirements.past_due.length, 0)
      assert.strictEqual(accountNow.requirements.eventually_due.length, 0)
      assert.strictEqual(accountNow.requirements.currently_due.length, 0)
    })

    // it('object for MX registration', async () => {
    //   const user = await TestHelper.createUser()
    //   await TestHelper.createStripeAccount(user,{
    //     country: 'MX',
    //     type: 'company'
    // })
    //   await TestHelper.createStripeRegistration(user,{
    //     business_profile_mcc: '8931',
    //     business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
    //     address_city: 'Talin',
    //         //     address_line1: '123 Park Lane',
    //     address_postal_code: '10128',
    //     address_state: '37',
    //     name: 'Company',
    //     tax_id: '00000000000'
    // })
    //   await TestHelper.createCompanyRepresentative(user,{
    //     address_city: 'Mexico City',
    //     address_country: 'MX',
    //     address_line1: '123 Sesame St',
    //     address_postal_code: '11000',
    //     address_state: 'DIF',
    //     dob_day: '1',
    //     dob_month: '1',
    //     dob_year: '1950',
    //     email: user.profile.contactEmail,
    //     first_name: user.profile.firstName,
    //     last_name: user.profile.lastName,
    //     phone: '456-789-0123',
    //     relationship_executive: 'true',
    //     relationship_title: 'Owner'
    // },{
    //     verification_document_back: TestHelper['success_id_scan_back.png'],
    //     verification_document_front: TestHelper['success_id_scan_front.png']
    // })
    //   await TestHelper.createExternalAccount(user,{
    //     account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
    //     account_holder_type: 'individual',
    //     country: 'MX',
    //     currency: 'eur',
    //     iban: 'MX89370400440532013000'
    // })
    //   const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
    //   req.account = user.account
    //   req.session = user.session
    //   await req.patch()
    // await TestHelper.waitForVerificationStart(user)
    //       const req2 = TestHelper.createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
    //       req2.account = user.account
    //       req2.session = user.session
    //       const accountNow = await req2.get()
    //   assert.notStrictEqual(accountNow.metadata.submitted, undefined)
    //   assert.notStrictEqual(accountNow.metadata.submitted, null)
    // assert.strictEqual(accountNow.requirements.past_due.length, 0)
    // assert.strictEqual(accountNow.requirements.eventually_due.length, 0)
    // assert.strictEqual(accountNow.requirements.currently_due.length, 0)
    // })

    it('object for NO registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'NO',
        type: 'company'
      })
      await TestHelper.createStripeRegistration(user, {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        address_city: 'Oslo',
        address_line1: '123 Park Lane',
        address_postal_code: '0001',
        address_state: '02',
        name: 'Company',
        phone: '456-789-0123',
        tax_id: '00000000000'
      })
      await TestHelper.createCompanyRepresentative(user, {
        address_city: 'Oslo',
        address_country: 'NO',
        address_line1: '123 Sesame St',
        address_postal_code: '0001',
        address_state: '02',
        dob_day: '1',
        dob_month: '1',
        dob_year: '1950',
        email: user.profile.contactEmail,
        first_name: user.profile.firstName,
        last_name: user.profile.lastName,
        phone: '456-789-0123',
        relationship_executive: 'true',
        relationship_title: 'Owner'
      }, {
        verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        verification_document_back: TestHelper['success_id_scan_back.png'],
        verification_document_front: TestHelper['success_id_scan_front.png']
      })
      await TestHelper.createExternalAccount(user, {
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_holder_type: 'individual',
        country: 'NO',
        currency: 'eur',
        iban: 'NO89370400440532013000'
      })
      await TestHelper.setCompanyRepresentative(user)
      await TestHelper.submitBeneficialOwners(user)
      await TestHelper.submitCompanyDirectors(user)
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      await req.patch()
      await TestHelper.waitForVerificationStart(user)
      const req2 = TestHelper.createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
      req2.account = user.account
      req2.session = user.session
      const accountNow = await req2.get()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
      assert.strictEqual(accountNow.requirements.past_due.length, 0)
      assert.strictEqual(accountNow.requirements.eventually_due.length, 0)
      assert.strictEqual(accountNow.requirements.currently_due.length, 0)
    })

    it('object for NZ registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'NZ',
        type: 'company'
      })
      await TestHelper.createStripeRegistration(user, {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        address_city: 'Auckland',
        address_line1: '123 Park Lane',
        address_postal_code: '6011',
        address_state: 'N',
        name: 'Company',
        phone: '456-789-0123',
        tax_id: '00000000000'
      }, {
        verification_document_back: TestHelper['success_id_scan_back.png'],
        verification_document_front: TestHelper['success_id_scan_front.png']
      })
      await TestHelper.createCompanyRepresentative(user, {
        address_city: 'Auckland',
        address_country: 'NZ',
        address_line1: '844 Fleet Street',
        address_postal_code: '6011',
        address_state: 'N',
        dob_day: '1',
        dob_month: '1',
        dob_year: '1950',
        email: user.profile.contactEmail,
        first_name: user.profile.firstName,
        last_name: user.profile.lastName,
        phone: '456-789-0123',
        relationship_executive: 'true',
        relationship_title: 'Owner'
      }, {
        verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        verification_document_back: TestHelper['success_id_scan_back.png'],
        verification_document_front: TestHelper['success_id_scan_front.png']
      })
      await TestHelper.createExternalAccount(user, {
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_holder_type: 'individual',
        account_number: '0000000010',
        country: 'NZ',
        currency: 'nzd',
        routing_number: '110000'
      })
      await TestHelper.setCompanyRepresentative(user)
      await TestHelper.submitBeneficialOwners(user)
      await TestHelper.submitCompanyDirectors(user)
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      await req.patch()
      await TestHelper.waitForVerificationStart(user)
      const req2 = TestHelper.createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
      req2.account = user.account
      req2.session = user.session
      const accountNow = await req2.get()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
      assert.strictEqual(accountNow.requirements.past_due.length, 0)
      assert.strictEqual(accountNow.requirements.eventually_due.length, 0)
      assert.strictEqual(accountNow.requirements.currently_due.length, 0)
    })

    it('object for PT registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'PT',
        type: 'company'
      })
      await TestHelper.createStripeRegistration(user, {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        address_city: 'Lisbon',
        address_line1: '123 Park Lane',
        address_postal_code: '4520',
        address_state: '01',
        name: 'Company',
        phone: '456-789-0123',
        tax_id: '00000000000'
      })
      await TestHelper.createCompanyRepresentative(user, {
        address_city: 'Lisbon',
        address_country: 'PT',
        address_line1: '123 Sesame St',
        address_postal_code: '4520',
        address_state: '01',
        dob_day: '1',
        dob_month: '1',
        dob_year: '1950',
        email: user.profile.contactEmail,
        first_name: user.profile.firstName,
        last_name: user.profile.lastName,
        phone: '456-789-0123',
        relationship_executive: 'true',
        relationship_title: 'Owner'
      }, {
        verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        verification_document_back: TestHelper['success_id_scan_back.png'],
        verification_document_front: TestHelper['success_id_scan_front.png']
      })
      await TestHelper.createExternalAccount(user, {
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_holder_type: 'individual',
        country: 'PT',
        currency: 'eur',
        iban: 'PT89370400440532013000'
      })
      await TestHelper.setCompanyRepresentative(user)
      await TestHelper.submitBeneficialOwners(user)
      await TestHelper.submitCompanyDirectors(user)
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      await req.patch()
      await TestHelper.waitForVerificationStart(user)
      const req2 = TestHelper.createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
      req2.account = user.account
      req2.session = user.session
      const accountNow = await req2.get()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
      assert.strictEqual(accountNow.requirements.past_due.length, 0)
      assert.strictEqual(accountNow.requirements.eventually_due.length, 0)
      assert.strictEqual(accountNow.requirements.currently_due.length, 0)
    })

    it('object for SE registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'SE',
        type: 'company'
      })
      await TestHelper.createStripeRegistration(user, {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        address_city: 'Stockholm',
        address_line1: '123 Park Lane',
        address_postal_code: '00150',
        address_state: 'K',
        name: 'Company',
        phone: '456-789-0123',
        tax_id: '00000000000'
      })
      await TestHelper.createCompanyRepresentative(user, {
        address_city: 'Stockholm',
        address_country: 'SE',
        address_line1: '123 Sesame St',
        address_postal_code: '00150',
        address_state: 'K',
        dob_day: '1',
        dob_month: '1',
        dob_year: '1950',
        email: user.profile.contactEmail,
        first_name: user.profile.firstName,
        last_name: user.profile.lastName,
        phone: '456-789-0123',
        relationship_executive: 'true',
        relationship_title: 'Owner'
      }, {
        verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        verification_document_back: TestHelper['success_id_scan_back.png'],
        verification_document_front: TestHelper['success_id_scan_front.png']
      })
      await TestHelper.createExternalAccount(user, {
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_holder_type: 'individual',
        country: 'SE',
        currency: 'eur',
        iban: 'SE89370400440532013000'
      })
      await TestHelper.setCompanyRepresentative(user)
      await TestHelper.submitBeneficialOwners(user)
      await TestHelper.submitCompanyDirectors(user)
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      await req.patch()
      await TestHelper.waitForVerificationStart(user)
      const req2 = TestHelper.createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
      req2.account = user.account
      req2.session = user.session
      const accountNow = await req2.get()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
      assert.strictEqual(accountNow.requirements.past_due.length, 0)
      assert.strictEqual(accountNow.requirements.eventually_due.length, 0)
      assert.strictEqual(accountNow.requirements.currently_due.length, 0)
    })

    it('object for SG registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'SG',
        type: 'company'
      })
      await TestHelper.createStripeRegistration(user, {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        address_city: 'Singapore',
        address_line1: '123 Park Lane',
        address_postal_code: '339696',
        address_state: 'SG',
        name: 'Company',
        phone: '456-789-0123',
        tax_id: '00000000000'
      })
      await TestHelper.createCompanyRepresentative(user, {
        address_city: 'Singapore',
        address_country: 'SG',
        address_line1: '123 Sesame St',
        address_postal_code: '339696',
        address_state: 'SG',
        dob_day: '1',
        dob_month: '1',
        dob_year: '1950',
        email: user.profile.contactEmail,
        first_name: user.profile.firstName,
        id_number: '000000000',
        last_name: user.profile.lastName,
        relationship_percent_ownership: '0',
        phone: '456-789-0123',
        relationship_executive: 'true',
        relationship_title: 'Owner'
      }, {
        verification_document_back: TestHelper['success_id_scan_back.png'],
        verification_document_front: TestHelper['success_id_scan_front.png']
      })
      await TestHelper.createExternalAccount(user, {
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_holder_type: 'individual',
        account_number: '000123456',
        bank_code: '1100',
        branch_code: '000',
        country: 'SG',
        currency: 'sgd'
      })
      await TestHelper.submitBeneficialOwners(user)
      await TestHelper.setCompanyRepresentative(user)
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      await req.patch()
      await TestHelper.waitForVerificationStart(user)
      const req2 = TestHelper.createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
      req2.account = user.account
      req2.session = user.session
      const accountNow = await req2.get()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
      assert.strictEqual(accountNow.requirements.past_due.length, 0)
      assert.strictEqual(accountNow.requirements.eventually_due.length, 0)
      assert.strictEqual(accountNow.requirements.currently_due.length, 0)
    })

    it('object for SI registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'SI',
        type: 'company'
      })
      await TestHelper.createStripeRegistration(user, {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        address_city: 'Ljubljana',
        address_line1: '123 Sesame St',
        address_postal_code: '1210',
        address_state: '07',
        name: 'Company',
        phone: '456-789-0123',
        tax_id: '00000000000'
      })
      await TestHelper.createCompanyRepresentative(user, {
        address_city: 'Ljubljana',
        address_country: 'SI',
        address_line1: '123 Sesame St',
        address_postal_code: '1210',
        address_state: '07',
        dob_day: '1',
        dob_month: '1',
        dob_year: '1950',
        email: user.profile.contactEmail,
        first_name: user.profile.firstName,
        last_name: user.profile.lastName,
        phone: '456-789-0123',
        relationship_executive: 'true',
        relationship_title: 'Owner'
      }, {
        verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        verification_document_back: TestHelper['success_id_scan_back.png'],
        verification_document_front: TestHelper['success_id_scan_front.png']
      })
      await TestHelper.createExternalAccount(user, {
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_holder_type: 'individual',
        country: 'SI',
        currency: 'eur',
        iban: 'SI89370400440532013000'
      })
      await TestHelper.setCompanyRepresentative(user)
      await TestHelper.submitBeneficialOwners(user)
      await TestHelper.submitCompanyDirectors(user)
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      await req.patch()
      await TestHelper.waitForVerificationStart(user)
      const req2 = TestHelper.createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
      req2.account = user.account
      req2.session = user.session
      const accountNow = await req2.get()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
      assert.strictEqual(accountNow.requirements.past_due.length, 0)
      assert.strictEqual(accountNow.requirements.eventually_due.length, 0)
      assert.strictEqual(accountNow.requirements.currently_due.length, 0)
    })

    it('object for SK registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'SK',
        type: 'company'
      })
      await TestHelper.createStripeRegistration(user, {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        address_city: 'Slovakia',
        address_line1: '123 Sesame St',
        address_postal_code: '00102',
        address_state: 'BC',
        name: 'Company',
        phone: '456-789-0123',
        tax_id: '00000000000'
      })
      await TestHelper.createCompanyRepresentative(user, {
        address_city: 'Slovakia',
        address_country: 'SK',
        address_line1: '123 Sesame St',
        address_postal_code: '00102',
        address_state: 'BC',
        dob_day: '1',
        dob_month: '1',
        dob_year: '1950',
        email: user.profile.contactEmail,
        first_name: user.profile.firstName,
        last_name: user.profile.lastName,
        phone: '456-789-0123',
        relationship_executive: 'true',
        relationship_title: 'Owner'
      }, {
        verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        verification_document_back: TestHelper['success_id_scan_back.png'],
        verification_document_front: TestHelper['success_id_scan_front.png']
      })
      await TestHelper.createExternalAccount(user, {
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_holder_type: 'individual',
        country: 'SK',
        currency: 'eur',
        iban: 'SK89370400440532013000'
      })
      await TestHelper.setCompanyRepresentative(user)
      await TestHelper.submitBeneficialOwners(user)
      await TestHelper.submitCompanyDirectors(user)
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      await req.patch()
      await TestHelper.waitForVerificationStart(user)
      const req2 = TestHelper.createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
      req2.account = user.account
      req2.session = user.session
      const accountNow = await req2.get()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
      assert.strictEqual(accountNow.requirements.past_due.length, 0)
      assert.strictEqual(accountNow.requirements.eventually_due.length, 0)
      assert.strictEqual(accountNow.requirements.currently_due.length, 0)
    })

    it('object for US registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'company'
      })
      await TestHelper.createStripeRegistration(user, {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        address_city: 'New York',
        address_line1: '285 Fulton St',
        address_postal_code: '10007',
        address_state: 'NY',
        name: 'Company',
        phone: '456-789-0123',
        tax_id: '00000000000'
      })
      await TestHelper.createCompanyRepresentative(user, {
        address_city: 'New York',
        address_country: 'US',
        address_line1: '285 Fulton St',
        address_postal_code: '10007',
        address_state: 'NY',
        dob_day: '1',
        dob_month: '1',
        dob_year: '1950',
        email: user.profile.contactEmail,
        first_name: user.profile.firstName,
        last_name: user.profile.lastName,
        phone: '456-789-0123',
        relationship_executive: 'true',
        relationship_title: 'Owner',
        ssn_last_4: '0000'
      }, {
        verification_document_back: TestHelper['success_id_scan_back.png'],
        verification_document_front: TestHelper['success_id_scan_front.png']
      })
      await TestHelper.createExternalAccount(user, {
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_holder_type: 'individual',
        account_number: '000123456789',
        country: 'US',
        currency: 'usd',
        routing_number: '110000000'
      })
      await TestHelper.submitBeneficialOwners(user)
      await TestHelper.setCompanyRepresentative(user)
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      await req.patch()
      await TestHelper.waitForVerificationStart(user)
      const req2 = TestHelper.createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
      req2.account = user.account
      req2.session = user.session
      const accountNow = await req2.get()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
      assert.strictEqual(accountNow.requirements.past_due.length, 0)
      assert.strictEqual(accountNow.requirements.eventually_due.length, 0)
      assert.strictEqual(accountNow.requirements.currently_due.length, 0)
    })
  })

  describe('configuration', () => {
    it('environment STRIPE_JS', async () => {
      global.stripeJS = 3
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.waitOnSubmit = true
      req.account = user.account
      req.session = user.session
      req.body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        address_city: 'New York',
        address_line1: '285 Fulton St',
        address_postal_code: '10007',
        address_state: 'NY',
        name: 'Company',
        phone: '456-789-0123',
        tax_id: '00000000000'
      }
      await req.post()
      const req2 = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
      req2.waitOnSubmit = true
      req2.account = user.account
      req2.session = user.session
      req2.uploads = {
        verification_document_back: TestHelper['success_id_scan_back.png'],
        verification_document_front: TestHelper['success_id_scan_front.png']
      }
      req2.body = {
        address_city: 'New York',
        address_country: 'US',
        address_line1: '285 Fulton St',
        address_postal_code: '10007',
        address_state: 'NY',
        dob_day: '1',
        dob_month: '1',
        dob_year: '1950',
        email: user.profile.contactEmail,
        first_name: user.profile.firstName,
        last_name: user.profile.lastName,
        phone: '456-789-0123',
        relationship_executive: 'true',
        relationship_title: 'Owner',
        ssn_last_4: '0000'
      }
      await req2.post()
      const req3 = TestHelper.createRequest(`/account/connect/edit-payment-information?stripeid=${user.stripeAccount.id}`)
      req3.account = user.account
      req3.session = user.session
      req3.body = {
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_holder_type: 'individual',
        account_number: '000123456789',
        country: 'US',
        currency: 'usd',
        routing_number: '110000000'
      }
      await req3.post()
      const req4 = TestHelper.createRequest(`/api/user/connect/set-beneficial-owners-submitted?stripeid=${user.stripeAccount.id}`)
      req4.account = user.account
      req4.session = user.session
      await req4.patch()
      const req5 = TestHelper.createRequest(`/api/user/connect/set-company-representative?stripeid=${user.stripeAccount.id}`)
      req5.account = user.account
      req5.session = user.session
      await req5.patch()
      const req6 = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req6.account = user.account
      req6.session = user.session
      await req6.patch()
      await TestHelper.waitForVerificationStart(user)
      await TestHelper.waitForVerificationFieldsToLeave(user, 'person_')
      const req7 = TestHelper.createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
      req7.account = user.account
      req7.session = user.session
      const accountNow = await req7.get()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
      assert.strictEqual(accountNow.requirements.past_due.length, 0)
      assert.strictEqual(accountNow.requirements.eventually_due.length, 0)
      assert.strictEqual(accountNow.requirements.currently_due.length, 0)
    })
  })
})
