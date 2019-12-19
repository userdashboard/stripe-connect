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
          company_address_city: 'New York',
          company_address_country: 'US',
          company_address_line1: '123 Park Lane',
          company_address_postal_code: '10001',
          company_address_state: 'NY',
          company_name: 'Company',
          company_phone: '456-123-7890',
          company_tax_id: '8'
        })
        await TestHelper.createCompanyRepresentative(user, {
          relationship_representative_address_city: 'New York',
          relationship_representative_address_country: 'US',
          relationship_representative_address_line1: '285 Fulton St',
          relationship_representative_address_postal_code: '10007',
          relationship_representative_address_state: 'NY',
          relationship_representative_dob_day: '1',
          relationship_representative_dob_month: '1',
          relationship_representative_dob_year: '1950',
          relationship_representative_email: user.profile.contactEmail,
          relationship_representative_first_name: user.profile.firstName,
          relationship_representative_last_name: user.profile.lastName,
          relationship_representative_percent_ownership: '0',
          relationship_representative_phone: '456-789-0123',
          relationship_representative_relationship_executive: 'true',
          relationship_representative_relationship_title: 'Owner',
          relationship_representative_ssn_last_4: '0000'
        }, {
          relationship_representative_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
          relationship_representative_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
          relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
          relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
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
          company_address_city: 'Frederiksberg',
          company_address_country: 'DE',
          company_address_line1: '123 Park Lane',
          company_address_postal_code: '1020',
          company_address_state: 'BW',
          company_name: 'Company',
          company_phone: '456-789-0123',
          company_tax_id: '8'
        })
        await TestHelper.createCompanyRepresentative(user, {
          relationship_representative_address_city: 'Frederiksberg',
          relationship_representative_address_country: 'DE',
          relationship_representative_address_line1: '123 Sesame St',
          relationship_representative_address_postal_code: '1020',
          relationship_representative_address_state: 'BW',
          relationship_representative_dob_day: '1',
          relationship_representative_dob_month: '1',
          relationship_representative_dob_year: '1950',
          relationship_representative_email: user.profile.contactEmail,
          relationship_representative_first_name: user.profile.firstName,
          relationship_representative_last_name: user.profile.lastName,
          relationship_representative_phone: '456-789-1230',
          relationship_representative_relationship_executive: 'true',
          relationship_representative_relationship_title: 'Owner'
        }, {
          relationship_representative_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
          relationship_representative_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
          relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
          relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
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
        company_address_city: 'Vienna',
        company_address_country: 'AT',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '1020',
        company_address_state: '1',
        company_name: 'Company',
        company_phone: '456-789-0123',
        company_tax_id: '8'
      })
      await TestHelper.createCompanyRepresentative(user, {
        relationship_representative_address_city: 'Vienna',
        relationship_representative_address_country: 'AT',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: '1020',
        relationship_representative_address_state: '1',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }, {
        relationship_representative_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
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
        company_address_city: 'Brisbane',
        company_address_country: 'AU',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '4000',
        company_address_state: 'QLD',
        company_name: 'Company',
        company_phone: '456-789-0123',
        company_tax_id: '8'
      })
      await TestHelper.createCompanyRepresentative(user, {
        relationship_representative_address_city: 'Brisbane',
        relationship_representative_address_country: 'AU',
        relationship_representative_address_line1: '845 Oxford St',
        relationship_representative_address_postal_code: '4000',
        relationship_representative_address_state: 'QLD',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }, {
        relationship_representative_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
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
        company_address_city: 'Brussels',
        company_address_country: 'BE',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '1020',
        company_address_state: 'BRU',
        company_name: 'Company',
        company_phone: '456-789-0123',
        company_tax_id: '8'
      }, {
        company_verification_document_back: TestHelper['success_id_scan_back.png'],
        company_verification_document_front: TestHelper['success_id_scan_front.png']
      })
      await TestHelper.createCompanyRepresentative(user, {
        relationship_representative_address_city: 'Brussels',
        relationship_representative_address_country: 'BE',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: '1020',
        relationship_representative_address_state: 'BRU',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }, {
        relationship_representative_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
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
        company_address_city: 'Vancouver',
        company_address_country: 'CA',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: 'V5K 0A1',
        company_address_state: 'BC',
        company_name: 'Company',
        company_phone: '456-789-0123',
        company_tax_id: '8'
      })
      await TestHelper.createCompanyRepresentative(user, {
        relationship_representative_address_city: 'Vancouver',
        relationship_representative_address_country: 'CA',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: 'V5K 0A1',
        relationship_representative_address_state: 'BC',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_id_number: '7',
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_percent_ownership: '0',
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }, {
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
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
        company_address_city: 'Bern',
        company_address_country: 'CH',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '1020',
        company_address_state: 'BE',
        company_name: 'Company',
        company_phone: '456-789-0123',
        company_tax_id: '8'
      })
      await TestHelper.createCompanyRepresentative(user, {
        relationship_representative_address_city: 'Bern',
        relationship_representative_address_country: 'CH',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: '1020',
        relationship_representative_address_state: 'BE',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }, {
        relationship_representative_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
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
        company_address_city: 'Berlin',
        company_address_country: 'DE',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '01067',
        company_address_state: 'BE',
        company_name: 'Company',
        company_phone: '456-789-0123',
        company_tax_id: '8'
      })
      await TestHelper.createCompanyRepresentative(user, {
        relationship_representative_address_city: 'Berlin',
        relationship_representative_address_country: 'DE',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: '01067',
        relationship_representative_address_state: 'BE',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }, {
        relationship_representative_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
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
        company_address_city: 'Copenhagen',
        company_address_country: 'DK',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '1000',
        company_address_state: '147',
        company_name: 'Company',
        company_phone: '456-789-0123',
        company_tax_id: '8'
      })
      await TestHelper.createCompanyRepresentative(user, {
        relationship_representative_address_city: 'Copenhagen',
        relationship_representative_address_country: 'DK',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: '1000',
        relationship_representative_address_state: '147',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }, {
        relationship_representative_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
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
        company_address_city: 'Talin',
        company_address_country: 'EE',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '10128',
        company_address_state: '37',
        company_name: 'Company',
        company_phone: '456-789-0123',
        company_tax_id: '8'
      })
      await TestHelper.createCompanyRepresentative(user, {
        relationship_representative_address_city: 'Tallinn',
        relationship_representative_address_country: 'EE',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: '10128',
        relationship_representative_address_state: '37',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }, {
        relationship_representative_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
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
        company_address_city: 'Madrid',
        company_address_country: 'ES',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '03179',
        company_address_state: 'AN',
        company_name: 'Company',
        company_phone: '456-789-01234',
        company_tax_id: '8'
      })
      await TestHelper.createCompanyRepresentative(user, {
        relationship_representative_address_city: 'Madrid',
        relationship_representative_address_country: 'ES',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: '03179',
        relationship_representative_address_state: 'AN',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }, {
        relationship_representative_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
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
        company_address_city: 'Helsinki',
        company_address_country: 'FI',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '00990',
        company_address_state: 'AL',
        company_name: 'Company',
        company_phone: '456-789-0123',
        company_tax_id: '8'
      })
      await TestHelper.createCompanyRepresentative(user, {
        relationship_representative_address_city: 'Helsinki',
        relationship_representative_address_country: 'FI',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: '00990',
        relationship_representative_address_state: 'AL',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }, {
        relationship_representative_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
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
        company_address_city: 'Paris',
        company_address_country: 'FR',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '75001',
        company_address_state: 'A',
        company_name: 'Company',
        company_phone: '456-789-0123',
        company_tax_id: '8'
      })
      await TestHelper.createCompanyRepresentative(user, {
        relationship_representative_address_city: 'Paris',
        relationship_representative_address_country: 'FR',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: '75001',
        relationship_representative_address_state: 'A',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }, {
        relationship_representative_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
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
        company_address_city: 'London',
        company_address_country: 'GB',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: 'EC1A 1AA',
        company_address_state: 'LND',
        company_name: 'Company',
        company_phone: '456-789-0123',
        company_tax_id: '8'
      })
      await TestHelper.createCompanyRepresentative(user, {
        relationship_representative_address_city: 'London',
        relationship_representative_address_country: 'GB',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: 'EC1A 1AA',
        relationship_representative_address_state: 'LND',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }, {
        relationship_representative_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
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
        company_address_city: 'Hong Kong',
        company_address_country: 'HK',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '00000',
        company_address_state: 'HK',
        company_name: 'Company',
        company_phone: '456-789-0234',
        company_tax_id: '8'
      })
      await TestHelper.createCompanyRepresentative(user, {
        relationship_representative_address_city: 'Hong Kong',
        relationship_representative_address_country: 'HK',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: '999077',
        relationship_representative_address_state: 'HK',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_id_number: '000000000',
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_percent_ownership: '0',
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }, {
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
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
        company_address_city: 'Dublin',
        company_address_country: 'IE',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: 'Dublin 1',
        company_address_state: 'D',
        company_name: 'Company',
        company_phone: '456-789-0123',
        company_tax_id: '8'
      })
      await TestHelper.createCompanyRepresentative(user, {
        relationship_representative_address_city: 'Dublin',
        relationship_representative_address_country: 'IE',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: 'Dublin 1',
        relationship_representative_address_state: 'D',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }, {
        relationship_representative_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
      })
      await TestHelper.createExternalAccount(user, {
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_holder_type: 'individual',
        company_state: 'Dublin',
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
        company_address_city: 'Rome',
        company_address_country: 'IT',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '00010',
        company_address_state: '65',
        company_name: 'Company',
        company_phone: '456-789-0123',
        company_tax_id: '8'
      })
      await TestHelper.createCompanyRepresentative(user, {
        relationship_representative_address_city: 'Rome',
        relationship_representative_address_country: 'IT',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: '00010',
        relationship_representative_address_state: '65',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }, {
        relationship_representative_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
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

    // it('object for JP registration', async () => {
    //   const user = await TestHelper.createUser()
    //   await TestHelper.createStripeAccount(user,{
    //     country: 'JP',
    //     type: 'company'
    // })
    //   await TestHelper.createStripeRegistration(user,{
    //     business_profile_mcc: '8931',
    //     business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
    //     company_address_kana_city: 'ｼﾌﾞﾔ',
    //     company_address_kana_line1: '27-15',
    //     company_address_kana_postal_code: '1500001',
    //     company_address_kana_state: 'ﾄｳｷﾖｳﾄ',
    //     company_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
    //     company_address_kanji_city: '渋谷区',
    //     company_address_kanji_line1: '２７－１５',
    //     company_address_kanji_postal_code: '1500001',
    //     company_address_kanji_state: '東京都',
    //     company_address_kanji_town: '神宮前 ３丁目',
    //     company_name: 'Company',
    //     company_name_kana: 'Company',
    //     company_name_kanji: 'Company',
    //     company_phone: '011-271-6677',
    //     company_tax_id: '8'
    // })
    //   await TestHelper.createCompanyRepresentative(user,{
    //     relationship_representative_address_kana_city: 'ｼﾌﾞﾔ',
    //     relationship_representative_address_kana_line1: '27-15',
    //     relationship_representative_address_kana_postal_code: '1500001',
    //     relationship_representative_address_kana_state: 'ﾄｳｷﾖｳﾄ',
    //     relationship_representative_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
    //     relationship_representative_address_kanji_city: '渋谷区',
    //     relationship_representative_address_kanji_line1: '２７－１５',
    //     relationship_representative_address_kanji_postal_code: '1500001',
    //     relationship_representative_address_kanji_state: '東京都',
    //     relationship_representative_address_kanji_town: '神宮前 ３丁目',
    //     relationship_representative_dob_day: '1',
    //     relationship_representative_dob_month: '1',
    //     relationship_representative_dob_year: '1950',
    //     relationship_representative_email: user.profile.contactEmail,
    //     relationship_representative_first_name: user.profile.firstName,
    //     relationship_representative_first_name_kana: 'ﾄｳｷﾖｳﾄ',
    //     relationship_representative_first_name_kanji: '東京都',
    //     relationship_representative_gender: 'female',
    //     relationship_representative_last_name: user.profile.lastName,
    //     relationship_representative_last_name_kana: 'ﾄｳｷﾖｳﾄ',
    //     relationship_representative_last_name_kanji: '東京都',
    //     relationship_representative_percent_ownership: '0',
    //     relationship_representative_phone: '456-789-0123',
    //     relationship_representative_relationship_executive: 'true',
    //     relationship_representative_relationship_title: 'Owner'
    // },{
    //     relationship_representative_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
    //     relationship_representative_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
    //     relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
    //     relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
    // })
    //   await TestHelper.createExternalAccount(user,{
    //     account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
    //     account_holder_type: 'individual',
    //     account_number: '00012345',
    //     bank_code: '110',
    //     branch_code: '0000',
    //     country: 'JP',
    //     currency: 'jpy'
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

    it('object for LT registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'LT',
        type: 'company'
      })
      await TestHelper.createStripeRegistration(user, {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        company_address_city: 'Vilnius',
        company_address_country: 'LT',
        company_address_line1: '123 Sesame St',
        company_address_postal_code: 'LT-00000',
        company_address_state: 'AL',
        company_name: 'Company',
        company_phone: '456-789-0123',
        company_tax_id: '8'
      })
      await TestHelper.createCompanyRepresentative(user, {
        relationship_representative_address_city: 'Vilnius',
        relationship_representative_address_country: 'LT',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: 'LT-00000',
        relationship_representative_address_state: 'AL',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }, {
        relationship_representative_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
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
        company_address_city: 'Luxemburg',
        company_address_country: 'LU',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '1623',
        company_address_state: 'L',
        company_name: 'Company',
        company_phone: '456-789-0123',
        company_tax_id: '8'
      })
      await TestHelper.createCompanyRepresentative(user, {
        relationship_representative_address_city: 'Luxemburg',
        relationship_representative_address_country: 'LU',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: '1623',
        relationship_representative_address_state: 'L',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }, {
        relationship_representative_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
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
        company_address_city: 'Riga',
        company_address_country: 'LV',
        company_address_line1: '123 Sesame St',
        company_address_postal_code: 'LV–1073',
        company_address_state: 'AI',
        company_name: 'Company',
        company_phone: '456-789-0123',
        company_tax_id: '8'
      })
      await TestHelper.createCompanyRepresentative(user, {
        relationship_representative_address_city: 'Riga',
        relationship_representative_address_country: 'LV',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: 'LV–1073',
        relationship_representative_address_state: 'AI',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }, {
        relationship_representative_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
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
        company_address_city: 'Amsterdam',
        company_address_country: 'NL',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '1071 JA',
        company_address_state: 'DR',
        company_name: 'Company',
        company_phone: '456-789-0123',
        company_tax_id: '8'
      })
      await TestHelper.createCompanyRepresentative(user, {
        relationship_representative_address_city: 'Amsterdam',
        relationship_representative_address_country: 'NL',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: '1071 JA',
        relationship_representative_address_state: 'DR',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }, {
        relationship_representative_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
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
    //     company_address_city: 'Talin',
    //     company_address_country: 'MX',
    //     company_address_line1: '123 Park Lane',
    //     company_address_postal_code: '10128',
    //     company_address_state: '37',
    //     company_name: 'Company',
    //     company_tax_id: '8'
    // })
    //   await TestHelper.createCompanyRepresentative(user,{
    //     relationship_representative_address_city: 'Mexico City',
    //     relationship_representative_address_country: 'MX',
    //     relationship_representative_address_line1: '123 Sesame St',
    //     relationship_representative_address_postal_code: '11000',
    //     relationship_representative_address_state: 'DIF',
    //     relationship_representative_dob_day: '1',
    //     relationship_representative_dob_month: '1',
    //     relationship_representative_dob_year: '1950',
    //     relationship_representative_email: user.profile.contactEmail,
    //     relationship_representative_first_name: user.profile.firstName,
    //     relationship_representative_last_name: user.profile.lastName,
    //     relationship_representative_phone: '456-789-0123',
    //     relationship_representative_relationship_executive: 'true',
    //     relationship_representative_relationship_title: 'Owner'
    // },{
    //     relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
    //     relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
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
        company_address_city: 'Oslo',
        company_address_country: 'NO',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '0001',
        company_address_state: '02',
        company_name: 'Company',
        company_phone: '456-789-0123',
        company_tax_id: '8'
      })
      await TestHelper.createCompanyRepresentative(user, {
        relationship_representative_address_city: 'Oslo',
        relationship_representative_address_country: 'NO',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: '0001',
        relationship_representative_address_state: '02',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }, {
        relationship_representative_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
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
        company_address_city: 'Auckland',
        company_address_country: 'NZ',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '6011',
        company_address_state: 'N',
        company_name: 'Company',
        company_phone: '456-789-0123',
        company_tax_id: '8'
      })
      await TestHelper.createCompanyRepresentative(user, {
        relationship_representative_address_city: 'Auckland',
        relationship_representative_address_country: 'NZ',
        relationship_representative_address_line1: '844 Fleet Street',
        relationship_representative_address_postal_code: '6011',
        relationship_representative_address_state: 'N',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }, {
        relationship_representative_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
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
        company_address_city: 'Lisbon',
        company_address_country: 'PT',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '4520',
        company_address_state: '01',
        company_name: 'Company',
        company_phone: '456-789-0123',
        company_tax_id: '8'
      })
      await TestHelper.createCompanyRepresentative(user, {
        relationship_representative_address_city: 'Lisbon',
        relationship_representative_address_country: 'PT',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: '4520',
        relationship_representative_address_state: '01',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }, {
        relationship_representative_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
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
        company_address_city: 'Stockholm',
        company_address_country: 'SE',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '00150',
        company_address_state: 'K',
        company_name: 'Company',
        company_phone: '456-789-0123',
        company_tax_id: '8'
      })
      await TestHelper.createCompanyRepresentative(user, {
        relationship_representative_address_city: 'Stockholm',
        relationship_representative_address_country: 'SE',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: '00150',
        relationship_representative_address_state: 'K',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }, {
        relationship_representative_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
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
        company_address_city: 'Singapore',
        company_address_country: 'SG',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '339696',
        company_address_state: 'SG',
        company_name: 'Company',
        company_phone: '456-789-0123',
        company_tax_id: '8'
      })
      await TestHelper.createCompanyRepresentative(user, {
        relationship_representative_address_city: 'Singapore',
        relationship_representative_address_country: 'SG',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: '339696',
        relationship_representative_address_state: 'SG',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_id_number: '000000000',
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_percent_ownership: '0',
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }, {
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
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
        company_address_city: 'Ljubljana',
        company_address_country: 'SI',
        company_address_line1: '123 Sesame St',
        company_address_postal_code: '1210',
        company_address_state: '07',
        company_name: 'Company',
        company_phone: '456-789-0123',
        company_tax_id: '8'
      })
      await TestHelper.createCompanyRepresentative(user, {
        relationship_representative_address_city: 'Ljubljana',
        relationship_representative_address_country: 'SI',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: '1210',
        relationship_representative_address_state: '07',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }, {
        relationship_representative_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
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
        company_address_city: 'Slovakia',
        company_address_country: 'SK',
        company_address_line1: '123 Sesame St',
        company_address_postal_code: '00102',
        company_address_state: 'BC',
        company_name: 'Company',
        company_phone: '456-789-0123',
        company_tax_id: '8'
      })
      await TestHelper.createCompanyRepresentative(user, {
        relationship_representative_address_city: 'Slovakia',
        relationship_representative_address_country: 'SK',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: '00102',
        relationship_representative_address_state: 'BC',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }, {
        relationship_representative_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
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
        company_address_city: 'New York',
        company_address_country: 'US',
        company_address_line1: '285 Fulton St',
        company_address_postal_code: '10007',
        company_address_state: 'NY',
        company_name: 'Company',
        company_phone: '456-123-7890',
        company_tax_id: '8'
      })
      await TestHelper.createCompanyRepresentative(user, {
        relationship_representative_address_city: 'New York',
        relationship_representative_address_country: 'US',
        relationship_representative_address_line1: '285 Fulton St',
        relationship_representative_address_postal_code: '10007',
        relationship_representative_address_state: 'NY',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner',
        relationship_representative_ssn_last_4: '0000'
      }, {
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
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
        company_name: 'Company',
        company_tax_id: '8',
        company_phone: '456-123-7890',
        company_address_city: 'New York',
        company_address_line1: '285 Fulton St',
        company_address_postal_code: '10007',
        company_address_state: 'NY',
        company_address_country: 'US',
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1]
      }
      await req.post()
      const req2 = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
      req2.waitOnSubmit = true
      req2.account = user.account
      req2.session = user.session
      req2.uploads = {
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      req2.body = {
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_address_city: 'New York',
        relationship_representative_ssn_last_4: '0000',
        relationship_representative_address_state: 'NY',
        relationship_representative_address_country: 'US',
        relationship_representative_address_line1: '285 Fulton St',
        relationship_representative_address_postal_code: '10007'
      }
      await req2.post()
      const req3 = TestHelper.createRequest(`/account/connect/edit-payment-information?stripeid=${user.stripeAccount.id}`)
      req3.account = user.account
      req3.session = user.session
      req3.body = {
        currency: 'usd',
        country: 'US',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_holder_type: 'individual',
        account_number: '000123456789',
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
      await TestHelper.waitForVerificationFields(user, 'person_')
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
