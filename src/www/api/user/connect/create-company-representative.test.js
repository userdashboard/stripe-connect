/* eslint-env mocha */
const assert = require('assert')
const connect = require('../../../../../index.js')
const TestHelper = require('../../../../../test-helper.js')

describe('/api/user/connect/create-company-representative', () => {
  describe('exceptions', () => {
    describe('invalid-stripeid', () => {
      it('missing querystring stripeid', async () => {
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/connect/create-company-representative')
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.post(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-stripeid')
      })

      it('invalid querystring stripeid', async () => {
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/connect/create-company-representative?stripeid=invalid')
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.post(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-stripeid')
      })
    })

    describe('invalid-stripe-account', () => {
      it('ineligible stripe account for individuals', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'US',
          type: 'individual'
        })
        const req = TestHelper.createRequest(`/api/user/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.post(req)
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
          address_line1: '285 Fulton St',
          address_postal_code: '10007',
          address_state: 'NY',
          name: 'Company',
          phone: '456-789-0123',
          tax_id: '00000000000'
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
        await TestHelper.submitStripeAccount(user)
        const req = TestHelper.createRequest(`/api/user/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.post(req)
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
          country: 'US',
          type: 'company'
        })
        const user2 = await TestHelper.createUser()
        const req = TestHelper.createRequest(`/api/user/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
        req.account = user2.account
        req.session = user2.session
        let errorMessage
        try {
          await req.post(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-account')
      })
    })

    describe('invalid-relationship_representative_percent_ownership', () => {
      it('invalid posted relationship_representative_percent_ownership', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'US',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
          relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
        }
        const body = {
          relationship_representative_address_city: 'New York',
          relationship_representative_address_country: 'US',
          relationship_representative_address_line1: '285 Fulton St',
          relationship_representative_address_postal_code: '10007',
          relationship_representative_address_state: 'NY',
          relationship_representative_dob_day: '7',
          relationship_representative_dob_month: '1',
          relationship_representative_dob_year: '1951',
          relationship_representative_email: user.profile.contactEmail,
          relationship_representative_first_name: user.profile.firstName,
          relationship_representative_last_name: user.profile.lastName,
          relationship_representative_percent_ownership: 'invalid',
          relationship_representative_phone: '456-789-0123',
          relationship_representative_relationship_executive: 'true',
          relationship_representative_relationship_title: 'Owner',
          relationship_representative_ssn_last_4: '0000'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.post(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_representative_percent_ownership')
      })
    })

    describe('invalid-relationship_representative_dob_day', () => {
      it('missing posted relationship_representative_dob_day', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'AT',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
          relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
        }
        const body = {
          relationship_representative_address_city: 'Vienna',
          relationship_representative_address_line1: '123 Sesame St',
          relationship_representative_address_postal_code: '1020',
          relationship_representative_address_state: '1',
          relationship_representative_dob_day: '',
          relationship_representative_dob_month: '1',
          relationship_representative_dob_year: '1950',
          relationship_representative_email: user.profile.contactEmail,
          relationship_representative_first_name: user.profile.firstName,
          relationship_representative_last_name: user.profile.lastName,
          relationship_representative_phone: '456-789-0123',
          relationship_representative_relationship_executive: 'true',
          relationship_representative_relationship_title: 'Owner'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_representative_dob_day')
      })

      it('invalid posted relationship_representative_dob_day', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'AT',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
          relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
        }
        const body = {
          relationship_representative_address_city: 'Vienna',
          relationship_representative_address_line1: '123 Sesame St',
          relationship_representative_address_postal_code: '1020',
          relationship_representative_address_state: '1',
          relationship_representative_dob_day: 'invalid',
          relationship_representative_dob_month: '1',
          relationship_representative_dob_year: '1950',
          relationship_representative_email: user.profile.contactEmail,
          relationship_representative_first_name: user.profile.firstName,
          relationship_representative_last_name: user.profile.lastName,
          relationship_representative_phone: '456-789-0123',
          relationship_representative_relationship_executive: 'true',
          relationship_representative_relationship_title: 'Owner'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_representative_dob_day')
      })
    })

    describe('invalid-relationship_representative_dob_month', () => {
      it('missing posted relationship_representative_dob_month', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'AT',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
          relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
        }
        const body = {
          relationship_representative_address_city: 'Vienna',
          relationship_representative_address_line1: '123 Sesame St',
          relationship_representative_address_postal_code: '1020',
          relationship_representative_address_state: '1',
          relationship_representative_dob_day: '1',
          relationship_representative_dob_month: '',
          relationship_representative_dob_year: '1950',
          relationship_representative_email: user.profile.contactEmail,
          relationship_representative_first_name: user.profile.firstName,
          relationship_representative_last_name: user.profile.lastName,
          relationship_representative_phone: '456-789-0123',
          relationship_representative_relationship_executive: 'true',
          relationship_representative_relationship_title: 'Owner'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_representative_dob_month')
      })

      it('invalid posted relationship_representative_dob_month', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'AT',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
          relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
        }
        const body = {
          relationship_representative_address_city: 'Vienna',
          relationship_representative_address_line1: '123 Sesame St',
          relationship_representative_address_postal_code: '1020',
          relationship_representative_address_state: '1',
          relationship_representative_dob_day: '1',
          relationship_representative_dob_month: 'invalid',
          relationship_representative_dob_year: '1950',
          relationship_representative_email: user.profile.contactEmail,
          relationship_representative_first_name: user.profile.firstName,
          relationship_representative_last_name: user.profile.lastName,
          relationship_representative_phone: '456-789-0123',
          relationship_representative_relationship_executive: 'true',
          relationship_representative_relationship_title: 'Owner'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_representative_dob_month')
      })
    })

    describe('invalid-relationship_representative_dob_year', () => {
      it('missing posted relationship_representative_dob_year', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'AT',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
          relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
        }
        const body = {
          relationship_representative_address_city: 'Vienna',
          relationship_representative_address_line1: '123 Sesame St',
          relationship_representative_address_postal_code: '1020',
          relationship_representative_address_state: '1',
          relationship_representative_dob_day: '1',
          relationship_representative_dob_month: '1',
          relationship_representative_dob_year: '',
          relationship_representative_email: user.profile.contactEmail,
          relationship_representative_first_name: user.profile.firstName,
          relationship_representative_last_name: user.profile.lastName,
          relationship_representative_phone: '456-789-0123',
          relationship_representative_relationship_executive: 'true',
          relationship_representative_relationship_title: 'Owner'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_representative_dob_year')
      })

      it('invalid posted relationship_representative_dob_year', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'AT',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
          relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
        }
        const body = {
          relationship_representative_address_city: 'Vienna',
          relationship_representative_address_line1: '123 Sesame St',
          relationship_representative_address_postal_code: '1020',
          relationship_representative_address_state: '1',
          relationship_representative_dob_day: '1',
          relationship_representative_dob_month: '1',
          relationship_representative_dob_year: 'invalid',
          relationship_representative_email: user.profile.contactEmail,
          relationship_representative_first_name: user.profile.firstName,
          relationship_representative_last_name: user.profile.lastName,
          relationship_representative_phone: '456-789-0123',
          relationship_representative_relationship_executive: 'true',
          relationship_representative_relationship_title: 'Owner'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_representative_dob_year')
      })
    })

    describe('invalid-relationship_representative_first_name', () => {
      it('missing posted relationship_representative_first_name', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'AT',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
          relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
        }
        const body = {
          relationship_representative_address_city: 'Vienna',
          relationship_representative_address_country: 'AT',
          relationship_representative_address_line1: '123 Sesame St',
          relationship_representative_address_postal_code: '1020',
          relationship_representative_address_state: '1',
          relationship_representative_dob_day: '1',
          relationship_representative_dob_month: '1',
          relationship_representative_dob_year: '1950',
          relationship_representative_email: user.profile.contactEmail,
          relationship_representative_first_name: '',
          relationship_representative_last_name: user.profile.lastName,
          relationship_representative_phone: '456-789-0123',
          relationship_representative_relationship_executive: 'true',
          relationship_representative_relationship_title: 'Owner'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_representative_first_name')
      })
    })

    describe('invalid-relationship_representative_last_name', () => {
      it('missing posted relationship_representative_last_name', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'AT',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
          relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
        }
        const body = {
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
          relationship_representative_last_name: '',
          relationship_representative_phone: '456-789-0123'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_representative_last_name')
      })
    })

    describe('invalid-relationship_representative_email', () => {
      it('missing posted relationship_representative_email', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'AT',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
          relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
        }
        const body = {
          relationship_representative_address_city: 'Vienna',
          relationship_representative_address_country: 'AT',
          relationship_representative_address_line1: '123 Sesame St',
          relationship_representative_address_postal_code: '1020',
          relationship_representative_address_state: '1',
          relationship_representative_dob_day: '1',
          relationship_representative_dob_month: '1',
          relationship_representative_dob_year: '1950',
          relationship_representative_email: '',
          relationship_representative_first_name: user.profile.firstName,
          relationship_representative_last_name: user.profile.lastName,
          relationship_representative_phone: '456-789-0123',
          relationship_representative_relationship_executive: 'true',
          relationship_representative_relationship_title: 'Owner'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_representative_email')
      })
    })

    describe('invalid-relationship_representative_phone', () => {
      it('missing posted relationship_representative_phone', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'AT',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
          relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
        }
        const body = {
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
          relationship_representative_phone: '',
          relationship_representative_relationship_executive: 'true',
          relationship_representative_relationship_title: 'Owner'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_representative_phone')
      })
    })

    describe('invalid-relationship_representative_ssn_last_4', () => {
      it('missing posted relationship_representative_ssn_last_4', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'US',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
          relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
        }
        const body = {
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
          relationship_representative_id_number: '000000000',
          relationship_representative_last_name: user.profile.lastName,
          relationship_representative_phone: '456-789-0123',
          relationship_representative_relationship_executive: 'true',
          relationship_representative_relationship_title: 'Owner',
          relationship_representative_ssn_last_4: ''
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_representative_ssn_last_4')
      })
    })

    describe('invalid-relationship_representative_address_line1', () => {
      it('missing posted relationship_representative_address_line1', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'US',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
          relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
        }
        const body = {
          relationship_representative_address_city: 'New York',
          relationship_representative_address_country: 'US',
          relationship_representative_address_line1: '',
          relationship_representative_address_postal_code: '10007',
          relationship_representative_address_state: 'NY',
          relationship_representative_dob_day: '1',
          relationship_representative_dob_month: '1',
          relationship_representative_dob_year: '1950',
          relationship_representative_email: user.profile.contactEmail,
          relationship_representative_first_name: user.profile.firstName,
          relationship_representative_id_number: '000000000',
          relationship_representative_last_name: user.profile.lastName,
          relationship_representative_phone: '456-789-0123',
          relationship_representative_relationship_executive: 'true',
          relationship_representative_relationship_title: 'Owner',
          relationship_representative_ssn_last_4: '0000'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_representative_address_line1')
      })
    })

    describe('invalid-relationship_representative_address_city', () => {
      it('missing posted relationship_representative_address_city', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'US',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
          relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
        }
        const body = {
          relationship_representative_address_city: '',
          relationship_representative_address_country: 'US',
          relationship_representative_address_line1: '285 Fulton St',
          relationship_representative_address_postal_code: '10007',
          relationship_representative_address_state: 'NY',
          relationship_representative_dob_day: '1',
          relationship_representative_dob_month: '1',
          relationship_representative_dob_year: '1950',
          relationship_representative_email: user.profile.contactEmail,
          relationship_representative_first_name: user.profile.firstName,
          relationship_representative_id_number: '000000000',
          relationship_representative_last_name: user.profile.lastName,
          relationship_representative_phone: '456-789-0123',
          relationship_representative_relationship_executive: 'true',
          relationship_representative_relationship_title: 'Owner',
          relationship_representative_ssn_last_4: '0000'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_representative_address_city')
      })
    })

    describe('invalid-relationship_representative_address_state', () => {
      it('missing posted relationship_representative_address_state', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'US',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
          relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
        }
        const body = {
          relationship_representative_address_city: 'New York',
          relationship_representative_address_country: 'US',
          relationship_representative_address_line1: '285 Fulton St',
          relationship_representative_address_postal_code: '10007',
          relationship_representative_address_state: '',
          relationship_representative_dob_day: '1',
          relationship_representative_dob_month: '1',
          relationship_representative_dob_year: '1950',
          relationship_representative_email: user.profile.contactEmail,
          relationship_representative_first_name: user.profile.firstName,
          relationship_representative_id_number: '000000000',
          relationship_representative_last_name: user.profile.lastName,
          relationship_representative_phone: '456-789-0123',
          relationship_representative_relationship_executive: 'true',
          relationship_representative_relationship_title: 'Owner',
          relationship_representative_ssn_last_4: '0000'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_representative_address_state')
      })
    })

    describe('invalid-relationship_representative_address_country', () => {
      it('missing posted relationship_representative_address_country', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'US',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
          relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
        }
        const body = {
          relationship_representative_address_city: 'New York',
          relationship_representative_address_country: '',
          relationship_representative_address_line1: '285 Fulton St',
          relationship_representative_address_postal_code: '10007',
          relationship_representative_address_state: 'NY',
          relationship_representative_dob_day: '1',
          relationship_representative_dob_month: '1',
          relationship_representative_dob_year: '1950',
          relationship_representative_email: user.profile.contactEmail,
          relationship_representative_first_name: user.profile.firstName,
          relationship_representative_id_number: '000000000',
          relationship_representative_last_name: user.profile.lastName,
          relationship_representative_phone: '456-789-0123',
          relationship_representative_relationship_executive: 'true',
          relationship_representative_relationship_title: 'Owner',
          relationship_representative_ssn_last_4: '0000'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_representative_address_country')
      })

      it('invalid-relationship_representative_address_country', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'US',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
          relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
        }
        const body = {
          relationship_representative_address_city: 'New York',
          relationship_representative_address_country: 'invalid',
          relationship_representative_address_line1: '285 Fulton St',
          relationship_representative_address_postal_code: '10007',
          relationship_representative_address_state: 'NY',
          relationship_representative_dob_day: '1',
          relationship_representative_dob_month: '1',
          relationship_representative_dob_year: '1950',
          relationship_representative_email: user.profile.contactEmail,
          relationship_representative_first_name: user.profile.firstName,
          relationship_representative_id_number: '000000000',
          relationship_representative_last_name: user.profile.lastName,
          relationship_representative_phone: '456-789-0123',
          relationship_representative_relationship_executive: 'true',
          relationship_representative_relationship_title: 'Owner',
          relationship_representative_ssn_last_4: '0000'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_representative_address_country')
      })
    })

    describe('invalid-relationship_representative_address_postal_code', () => {
      it('missing posted relationship_representative_address_postal_code', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'US',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
          relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
        }
        const body = {
          relationship_representative_address_city: 'New York',
          relationship_representative_address_country: 'US',
          relationship_representative_address_line1: '285 Fulton St',
          relationship_representative_address_postal_code: '',
          relationship_representative_address_state: 'NY',
          relationship_representative_dob_day: '1',
          relationship_representative_dob_month: '1',
          relationship_representative_dob_year: '1950',
          relationship_representative_email: user.profile.contactEmail,
          relationship_representative_first_name: user.profile.firstName,
          relationship_representative_id_number: '000000000',
          relationship_representative_last_name: user.profile.lastName,
          relationship_representative_phone: '456-789-0123',
          relationship_representative_relationship_executive: 'true',
          relationship_representative_relationship_title: 'Owner',
          relationship_representative_ssn_last_4: '0000'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_representative_address_postal_code')
      })
    })

    describe('invalid-relationship_representative_address_kana_postal_code', () => {
      it('missing posted relationship_representative_address_kana_postal_code', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'JP',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
          relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
        }
        const body = {
          relationship_representative_address_kana_city: 'ｼﾌﾞﾔ',
          relationship_representative_address_kana_line1: '27-15',
          relationship_representative_address_kana_postal_code: '',
          relationship_representative_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          relationship_representative_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          relationship_representative_address_kanji_city: '渋谷区',
          relationship_representative_address_kanji_line1: '２７－１５',
          relationship_representative_address_kanji_postal_code: '1500001',
          relationship_representative_address_kanji_state: '東京都',
          relationship_representative_address_kanji_town: '神宮前　３丁目',
          relationship_representative_dob_day: '1',
          relationship_representative_dob_month: '1',
          relationship_representative_dob_year: '1950',
          relationship_representative_first_name_kana: 'ﾄｳｷﾖｳﾄ',
          relationship_representative_first_name_kanji: '東京都',
          relationship_representative_gender: 'female',
          relationship_representative_last_name_kana: 'ﾄｳｷﾖｳﾄ',
          relationship_representative_last_name_kanji: '東京都'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_representative_address_kana_postal_code')
      })
    })

    describe('invalid-relationship_representative_address_kana_city', () => {
      it('missing posted relationship_representative_address_kana_city', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'JP',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
          relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
        }
        const body = {
          relationship_representative_address_kana_city: '',
          relationship_representative_address_kana_line1: '27-15',
          relationship_representative_address_kana_postal_code: '1500001',
          relationship_representative_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          relationship_representative_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          relationship_representative_address_kanji_city: '渋谷区',
          relationship_representative_address_kanji_line1: '２７－１５',
          relationship_representative_address_kanji_postal_code: '1500001',
          relationship_representative_address_kanji_state: '東京都',
          relationship_representative_address_kanji_town: '神宮前　３丁目',
          relationship_representative_dob_day: '1',
          relationship_representative_dob_month: '1',
          relationship_representative_dob_year: '1950',
          relationship_representative_first_name_kana: 'ﾄｳｷﾖｳﾄ',
          relationship_representative_first_name_kanji: '東京都',
          relationship_representative_gender: 'female',
          relationship_representative_last_name_kana: 'ﾄｳｷﾖｳﾄ',
          relationship_representative_last_name_kanji: '東京都'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_representative_address_kana_city')
      })
    })

    describe('invalid-relationship_representative_address_kana_state', () => {
      it('missing posted relationship_representative_address_kana_state', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'JP',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
          relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
        }
        const body = {
          relationship_representative_address_kana_city: 'ｼﾌﾞﾔ',
          relationship_representative_address_kana_line1: '27-15',
          relationship_representative_address_kana_postal_code: '1500001',
          relationship_representative_address_kana_state: '',
          relationship_representative_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          relationship_representative_address_kanji_city: '渋谷区',
          relationship_representative_address_kanji_line1: '２７－１５',
          relationship_representative_address_kanji_postal_code: '1500001',
          relationship_representative_address_kanji_state: '東京都',
          relationship_representative_address_kanji_town: '神宮前　３丁目',
          relationship_representative_dob_day: '1',
          relationship_representative_dob_month: '1',
          relationship_representative_dob_year: '1950',
          relationship_representative_first_name_kana: 'ﾄｳｷﾖｳﾄ',
          relationship_representative_first_name_kanji: '東京都',
          relationship_representative_gender: 'female',
          relationship_representative_last_name_kana: 'ﾄｳｷﾖｳﾄ',
          relationship_representative_last_name_kanji: '東京都'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_representative_address_kana_state')
      })
    })

    describe('invalid-relationship_representative_address_kana_town', () => {
      it('missing posted relationship_representative_address_kana_town', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'JP',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
          relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
        }
        const body = {
          relationship_representative_address_kana_city: 'ｼﾌﾞﾔ',
          relationship_representative_address_kana_line1: '27-15',
          relationship_representative_address_kana_postal_code: '1500001',
          relationship_representative_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          relationship_representative_address_kana_town: '',
          relationship_representative_address_kanji_city: '渋谷区',
          relationship_representative_address_kanji_line1: '２７－１５',
          relationship_representative_address_kanji_postal_code: '1500001',
          relationship_representative_address_kanji_state: '東京都',
          relationship_representative_address_kanji_town: '神宮前　３丁目',
          relationship_representative_dob_day: '1',
          relationship_representative_dob_month: '1',
          relationship_representative_dob_year: '1950',
          relationship_representative_first_name_kana: 'ﾄｳｷﾖｳﾄ',
          relationship_representative_first_name_kanji: '東京都',
          relationship_representative_gender: 'female',
          relationship_representative_last_name_kana: 'ﾄｳｷﾖｳﾄ',
          relationship_representative_last_name_kanji: '東京都'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_representative_address_kana_town')
      })
    })

    describe('invalid-relationship_representative_address_kana_line1', () => {
      it('missing posted relationship_representative_address_kana_line1', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'JP',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
          relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
        }
        const body = {
          relationship_representative_address_kana_city: 'ｼﾌﾞﾔ',
          relationship_representative_address_kana_line1: '',
          relationship_representative_address_kana_postal_code: '1500001',
          relationship_representative_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          relationship_representative_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          relationship_representative_address_kanji_city: '渋谷区',
          relationship_representative_address_kanji_line1: '２７－１５',
          relationship_representative_address_kanji_postal_code: '1500001',
          relationship_representative_address_kanji_state: '東京都',
          relationship_representative_address_kanji_town: '神宮前　３丁目',
          relationship_representative_dob_day: '1',
          relationship_representative_dob_month: '1',
          relationship_representative_dob_year: '1950',
          relationship_representative_first_name_kana: 'ﾄｳｷﾖｳﾄ',
          relationship_representative_first_name_kanji: '東京都',
          relationship_representative_gender: 'female',
          relationship_representative_last_name_kana: 'ﾄｳｷﾖｳﾄ',
          relationship_representative_last_name_kanji: '東京都'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_representative_address_kana_line1')
      })
    })

    describe('invalid-relationship_representative_address_kanji_postal_code', () => {
      it('missing posted relationship_representative_address_kanji_postal_code', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'JP',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
          relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
        }
        const body = {
          relationship_representative_address_kana_city: 'ｼﾌﾞﾔ',
          relationship_representative_address_kana_line1: '27-15',
          relationship_representative_address_kana_postal_code: '1500001',
          relationship_representative_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          relationship_representative_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          relationship_representative_address_kanji_city: '渋谷区',
          relationship_representative_address_kanji_line1: '２７－１５',
          relationship_representative_address_kanji_postal_code: '',
          relationship_representative_address_kanji_state: '東京都',
          relationship_representative_address_kanji_town: '神宮前　３丁目',
          relationship_representative_dob_day: '1',
          relationship_representative_dob_month: '1',
          relationship_representative_dob_year: '1950',
          relationship_representative_first_name_kana: 'ﾄｳｷﾖｳﾄ',
          relationship_representative_first_name_kanji: '東京都',
          relationship_representative_gender: 'female',
          relationship_representative_last_name_kana: 'ﾄｳｷﾖｳﾄ',
          relationship_representative_last_name_kanji: '東京都'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_representative_address_kanji_postal_code')
      })
    })

    describe('invalid-relationship_representative_address_kanji_city', () => {
      it('missing posted relationship_representative_address_kanji_city', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'JP',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
          relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
        }
        const body = {
          relationship_representative_address_kana_city: 'ｼﾌﾞﾔ',
          relationship_representative_address_kana_line1: '27-15',
          relationship_representative_address_kana_postal_code: '1500001',
          relationship_representative_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          relationship_representative_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          relationship_representative_address_kanji_city: '',
          relationship_representative_address_kanji_line1: '２７－１５',
          relationship_representative_address_kanji_postal_code: '1500001',
          relationship_representative_address_kanji_state: '東京都',
          relationship_representative_address_kanji_town: '神宮前　３丁目',
          relationship_representative_dob_day: '1',
          relationship_representative_dob_month: '1',
          relationship_representative_dob_year: '1950',
          relationship_representative_first_name_kana: 'ﾄｳｷﾖｳﾄ',
          relationship_representative_first_name_kanji: '東京都',
          relationship_representative_gender: 'female',
          relationship_representative_last_name_kana: 'ﾄｳｷﾖｳﾄ',
          relationship_representative_last_name_kanji: '東京都'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_representative_address_kanji_city')
      })
    })

    describe('invalid-relationship_representative_address_kanji_state', () => {
      it('missing posted relationship_representative_address_kanji_state', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'JP',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
          relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
        }
        const body = {
          relationship_representative_address_kana_city: 'ｼﾌﾞﾔ',
          relationship_representative_address_kana_line1: '27-15',
          relationship_representative_address_kana_postal_code: '1500001',
          relationship_representative_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          relationship_representative_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          relationship_representative_address_kanji_city: '渋谷区',
          relationship_representative_address_kanji_line1: '２７－１５',
          relationship_representative_address_kanji_postal_code: '1500001',
          relationship_representative_address_kanji_state: '',
          relationship_representative_address_kanji_town: '神宮前　３丁目',
          relationship_representative_dob_day: '1',
          relationship_representative_dob_month: '1',
          relationship_representative_dob_year: '1950',
          relationship_representative_first_name_kana: 'ﾄｳｷﾖｳﾄ',
          relationship_representative_first_name_kanji: '東京都',
          relationship_representative_gender: 'female',
          relationship_representative_last_name_kana: 'ﾄｳｷﾖｳﾄ',
          relationship_representative_last_name_kanji: '東京都'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_representative_address_kanji_state')
      })
    })

    describe('invalid-relationship_representative_address_kanji_town', () => {
      it('missing posted relationship_representative_address_kanji_town', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'JP',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
          relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
        }
        const body = {
          relationship_representative_address_kana_city: 'ｼﾌﾞﾔ',
          relationship_representative_address_kana_line1: '27-15',
          relationship_representative_address_kana_postal_code: '1500001',
          relationship_representative_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          relationship_representative_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          relationship_representative_address_kanji_city: '渋谷区',
          relationship_representative_address_kanji_line1: '２７－１５',
          relationship_representative_address_kanji_postal_code: '1500001',
          relationship_representative_address_kanji_state: '東京都',
          relationship_representative_address_kanji_town: '',
          relationship_representative_dob_day: '1',
          relationship_representative_dob_month: '1',
          relationship_representative_dob_year: '1950',
          relationship_representative_first_name_kana: 'ﾄｳｷﾖｳﾄ',
          relationship_representative_first_name_kanji: '東京都',
          relationship_representative_gender: 'female',
          relationship_representative_last_name_kana: 'ﾄｳｷﾖｳﾄ',
          relationship_representative_last_name_kanji: '東京都'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_representative_address_kanji_town')
      })
    })

    describe('invalid-relationship_representative_address_kanji_line1', () => {
      it('missing posted relationship_representative_address_kanji_line1', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'JP',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
          relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
        }
        const body = {
          relationship_representative_address_kana_city: 'ｼﾌﾞﾔ',
          relationship_representative_address_kana_line1: '27-15',
          relationship_representative_address_kana_postal_code: '1500001',
          relationship_representative_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          relationship_representative_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          relationship_representative_address_kanji_city: '渋谷区',
          relationship_representative_address_kanji_line1: '',
          relationship_representative_address_kanji_postal_code: '1500001',
          relationship_representative_address_kanji_state: '東京都',
          relationship_representative_address_kanji_town: '神宮前　３丁目',
          relationship_representative_dob_day: '1',
          relationship_representative_dob_month: '1',
          relationship_representative_dob_year: '1950',
          relationship_representative_first_name_kana: 'ﾄｳｷﾖｳﾄ',
          relationship_representative_first_name_kanji: '東京都',
          relationship_representative_gender: 'female',
          relationship_representative_last_name_kana: 'ﾄｳｷﾖｳﾄ',
          relationship_representative_last_name_kanji: '東京都'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_representative_address_kanji_line1')
      })
    })
  })

  describe('receives', () => {
    it('optionally-required posted token', async () => {
      global.stripeJS = 3
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const body = {
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
        relationship_representative_ssn_last_4: '0000',
        token: 'token'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const personNow = await req.post()
      assert.strictEqual(personNow.representativeToken, 'token')
    })

    it('required posted relationship_representative_dob_day', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const body = {
        relationship_representative_address_city: 'New York',
        relationship_representative_address_country: 'US',
        relationship_representative_address_line1: '285 Fulton St',
        relationship_representative_address_postal_code: '10007',
        relationship_representative_address_state: 'NY',
        relationship_representative_dob_day: '7',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner',
        relationship_representative_ssn_last_4: '0000'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const personNow = await req.post()
      assert.strictEqual(personNow.dob_day, '07')
    })

    it('required posted relationship_representative_dob_month', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const body = {
        relationship_representative_address_city: 'New York',
        relationship_representative_address_country: 'US',
        relationship_representative_address_line1: '285 Fulton St',
        relationship_representative_address_postal_code: '10007',
        relationship_representative_address_state: 'NY',
        relationship_representative_dob_day: '7',
        relationship_representative_dob_month: '11',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner',
        relationship_representative_ssn_last_4: '0000'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const personNow = await req.post()
      assert.strictEqual(personNow.dob_month, '11')
    })

    it('required posted relationship_representative_dob_year', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const body = {
        relationship_representative_address_city: 'New York',
        relationship_representative_address_country: 'US',
        relationship_representative_address_line1: '285 Fulton St',
        relationship_representative_address_postal_code: '10007',
        relationship_representative_address_state: 'NY',
        relationship_representative_dob_day: '7',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1951',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner',
        relationship_representative_ssn_last_4: '0000'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const personNow = await req.post()
      assert.strictEqual(personNow.dob_year, '1951')
    })

    it('optionally-required posted file relationship_representative_verification_document_front', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const body = {
        relationship_representative_address_city: 'New York',
        relationship_representative_address_country: 'US',
        relationship_representative_address_line1: '285 Fulton St',
        relationship_representative_address_postal_code: '10007',
        relationship_representative_address_state: 'NY',
        relationship_representative_dob_day: '7',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1951',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner',
        relationship_representative_ssn_last_4: '0000'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const personNow = await req.post()
      assert.notStrictEqual(personNow.verification_document_front, null)
      assert.notStrictEqual(personNow.verification_document_front, undefined)
    })

    it('optionally-required posted file relationship_representative_verification_document_back', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const body = {
        relationship_representative_address_city: 'New York',
        relationship_representative_address_country: 'US',
        relationship_representative_address_line1: '285 Fulton St',
        relationship_representative_address_postal_code: '10007',
        relationship_representative_address_state: 'NY',
        relationship_representative_dob_day: '7',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1951',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner',
        relationship_representative_ssn_last_4: '0000'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const personNow = await req.post()
      assert.notStrictEqual(personNow.verification_document_back, null)
      assert.notStrictEqual(personNow.verification_document_back, undefined)
    })

    it('optionally-required posted relationship_representative_first_name', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const body = {
        relationship_representative_address_city: 'New York',
        relationship_representative_address_country: 'US',
        relationship_representative_address_line1: '285 Fulton St',
        relationship_representative_address_postal_code: '10007',
        relationship_representative_address_state: 'NY',
        relationship_representative_dob_day: '7',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1951',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner',
        relationship_representative_ssn_last_4: '0000'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const personNow = await req.post()
      assert.strictEqual(personNow.first_name, user.profile.firstName)
    })

    it('optionally-required posted relationship_representative_last_name', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const body = {
        relationship_representative_address_city: 'New York',
        relationship_representative_address_country: 'US',
        relationship_representative_address_line1: '285 Fulton St',
        relationship_representative_address_postal_code: '10007',
        relationship_representative_address_state: 'NY',
        relationship_representative_dob_day: '7',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1951',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner',
        relationship_representative_ssn_last_4: '0000'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const personNow = await req.post()
      assert.strictEqual(personNow.last_name, user.profile.lastName)
    })

    it('optionally-required posted relationship_representative_email', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const body = {
        relationship_representative_address_city: 'New York',
        relationship_representative_address_country: 'US',
        relationship_representative_address_line1: '285 Fulton St',
        relationship_representative_address_postal_code: '10007',
        relationship_representative_address_state: 'NY',
        relationship_representative_dob_day: '7',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1951',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner',
        relationship_representative_ssn_last_4: '0000'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const personNow = await req.post()
      assert.strictEqual(personNow.email, user.profile.contactEmail)
    })

    it('optionally-required posted relationship_representative_phone', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const body = {
        relationship_representative_address_city: 'New York',
        relationship_representative_address_country: 'US',
        relationship_representative_address_line1: '285 Fulton St',
        relationship_representative_address_postal_code: '10007',
        relationship_representative_address_state: 'NY',
        relationship_representative_dob_day: '7',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1951',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner',
        relationship_representative_ssn_last_4: '0000'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const personNow = await req.post()
      assert.strictEqual(personNow.phone, '456-789-0123')
    })

    it('optionally-required posted relationship_representative_gender', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'JP',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const body = {
        relationship_representative_address_kana_city: 'ｼﾌﾞﾔ',
        relationship_representative_address_kana_line1: '27-15',
        relationship_representative_address_kana_postal_code: '1500001',
        relationship_representative_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        relationship_representative_address_kanji_city: '渋谷区',
        relationship_representative_address_kanji_line1: '２７－１５',
        relationship_representative_address_kanji_postal_code: '1500001',
        relationship_representative_address_kanji_state: '東京都',
        relationship_representative_address_kanji_town: '神宮前　３丁目',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name_kana: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_first_name_kanji: '東京都',
        relationship_representative_gender: 'female',
        relationship_representative_last_name_kana: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_last_name_kanji: '東京都',
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const personNow = await req.post()
      assert.strictEqual(personNow.gender, 'female')
    })

    it('optionally-required posted relationship_representative_ssn_last_4', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const body = {
        relationship_representative_address_city: 'New York',
        relationship_representative_address_country: 'US',
        relationship_representative_address_line1: '285 Fulton St',
        relationship_representative_address_postal_code: '10007',
        relationship_representative_address_state: 'NY',
        relationship_representative_dob_day: '7',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1951',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner',
        relationship_representative_ssn_last_4: '0000'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const personNow = await req.post()
      assert.strictEqual(personNow.ssn_last_4, '0000')
    })

    it('optionally-required posted relationship_representative_id_number', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'CA',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const body = {
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
        relationship_representative_id_number: '000000000',
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const personNow = await req.post()
      assert.strictEqual(personNow.id_number, '000000000')
    })

    it('optionally-required posted relationship_representative_address_city', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const body = {
        relationship_representative_address_city: 'New York',
        relationship_representative_address_country: 'US',
        relationship_representative_address_line1: '285 Fulton St',
        relationship_representative_address_postal_code: '10007',
        relationship_representative_address_state: 'NY',
        relationship_representative_dob_day: '7',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1951',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner',
        relationship_representative_ssn_last_4: '0000'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const personNow = await req.post()
      assert.strictEqual(personNow.address_city, 'New York')
    })

    it('optionally-required posted relationship_representative_address_state', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const body = {
        relationship_representative_address_city: 'New York',
        relationship_representative_address_country: 'US',
        relationship_representative_address_line1: '285 Fulton St',
        relationship_representative_address_postal_code: '10007',
        relationship_representative_address_state: 'NY',
        relationship_representative_dob_day: '7',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1951',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner',
        relationship_representative_ssn_last_4: '0000'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const personNow = await req.post()
      assert.strictEqual(personNow.address_state, 'NY')
    })

    it('optionally-required posted relationship_representative_address_postal_code', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const body = {
        relationship_representative_address_city: 'New York',
        relationship_representative_address_country: 'US',
        relationship_representative_address_line1: '285 Fulton St',
        relationship_representative_address_postal_code: '10007',
        relationship_representative_address_state: 'NY',
        relationship_representative_dob_day: '7',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1951',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner',
        relationship_representative_ssn_last_4: '0000'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const personNow = await req.post()
      assert.strictEqual(personNow.address_postal_code, '10007')
    })

    it('optionally-required posted relationship_representative_address_country', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const body = {
        relationship_representative_address_city: 'New York',
        relationship_representative_address_country: 'US',
        relationship_representative_address_line1: '285 Fulton St',
        relationship_representative_address_postal_code: '10007',
        relationship_representative_address_state: 'NY',
        relationship_representative_dob_day: '7',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1951',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner',
        relationship_representative_ssn_last_4: '0000'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const personNow = await req.post()
      assert.strictEqual(personNow.address_country, 'US')
    })

    it('optionally-required posted relationship_representative_address_line1', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const body = {
        relationship_representative_address_city: 'New York',
        relationship_representative_address_country: 'US',
        relationship_representative_address_line1: '285 Fulton St',
        relationship_representative_address_postal_code: '10007',
        relationship_representative_address_state: 'NY',
        relationship_representative_dob_day: '7',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1951',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner',
        relationship_representative_ssn_last_4: '0000'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const personNow = await req.post()
      assert.strictEqual(personNow.address_line1, '285 Fulton St')
    })

    it('optional posted relationship_representative_address_line2', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const body = {
        relationship_representative_address_city: 'New York',
        relationship_representative_address_country: 'US',
        relationship_representative_address_line1: '285 Fulton St',
        relationship_representative_address_line2: 'Another detail',
        relationship_representative_address_postal_code: '10007',
        relationship_representative_address_state: 'NY',
        relationship_representative_dob_day: '7',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1951',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner',
        relationship_representative_ssn_last_4: '0000'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const personNow = await req.post()
      assert.strictEqual(personNow.address_line2, 'Another detail')
    })

    it('optional posted relationship_representative_percent_ownership', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'CA',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const body = {
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
        relationship_representative_id_number: '000000000',
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_percent_ownership: 100,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const personNow = await req.post()
      assert.strictEqual(personNow.percent_ownership, '100')
    })

    it('optional posted relationship_representative_relationship_title', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'CA',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const body = {
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
        relationship_representative_id_number: '000000000',
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_percent_ownership: 100,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const personNow = await req.post()
      assert.strictEqual(personNow.relationship_title, 'Owner')
    })

    it('optional posted relationship_representative_relationship_director', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'CA',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const body = {
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
        relationship_representative_id_number: '000000000',
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_percent_ownership: 100,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_director: 'true',
        relationship_representative_relationship_title: 'Owner'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const personNow = await req.post()
      assert.strictEqual(personNow.relationship_director, true)
    })

    it('optional posted relationship_representative_relationship_executive', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'CA',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const body = {
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
        relationship_representative_id_number: '000000000',
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_percent_ownership: 100,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const personNow = await req.post()
      assert.strictEqual(personNow.relationship_executive, true)
    })

    it('optionally-required posted relationship_representative_first_name_kana', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'JP',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const body = {
        relationship_representative_address_kana_city: 'ｼﾌﾞﾔ',
        relationship_representative_address_kana_line1: '27-15',
        relationship_representative_address_kana_postal_code: '1500001',
        relationship_representative_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        relationship_representative_address_kanji_city: '渋谷区',
        relationship_representative_address_kanji_line1: '２７－１５',
        relationship_representative_address_kanji_postal_code: '1500001',
        relationship_representative_address_kanji_state: '東京都',
        relationship_representative_address_kanji_town: '神宮前　３丁目',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name_kana: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_first_name_kanji: '東京都',
        relationship_representative_gender: 'female',
        relationship_representative_last_name_kana: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_last_name_kanji: '東京都',
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const personNow = await req.post()
      assert.strictEqual(personNow.address_kanji_line1, '２７－１５')
    })

    it('optionally-required posted relationship_representative_last_name_kana', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'JP',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const body = {
        relationship_representative_address_kana_city: 'ｼﾌﾞﾔ',
        relationship_representative_address_kana_line1: '27-15',
        relationship_representative_address_kana_postal_code: '1500001',
        relationship_representative_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        relationship_representative_address_kanji_city: '渋谷区',
        relationship_representative_address_kanji_line1: '２７－１５',
        relationship_representative_address_kanji_postal_code: '1500001',
        relationship_representative_address_kanji_state: '東京都',
        relationship_representative_address_kanji_town: '神宮前　３丁目',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name_kana: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_first_name_kanji: '東京都',
        relationship_representative_gender: 'female',
        relationship_representative_last_name_kana: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_last_name_kanji: '東京都',
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const personNow = await req.post()
      assert.strictEqual(personNow.last_name_kana, 'ﾄｳｷﾖｳﾄ')
    })

    it('optionally-required posted relationship_representative_address_kana_city', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'JP',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const body = {
        relationship_representative_address_kana_city: 'ｼﾌﾞﾔ',
        relationship_representative_address_kana_line1: '27-15',
        relationship_representative_address_kana_postal_code: '1500001',
        relationship_representative_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        relationship_representative_address_kanji_city: '渋谷区',
        relationship_representative_address_kanji_line1: '２７－１５',
        relationship_representative_address_kanji_postal_code: '1500001',
        relationship_representative_address_kanji_state: '東京都',
        relationship_representative_address_kanji_town: '神宮前　３丁目',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name_kana: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_first_name_kanji: '東京都',
        relationship_representative_gender: 'female',
        relationship_representative_last_name_kana: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_last_name_kanji: '東京都',
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const personNow = await req.post()
      assert.strictEqual(personNow.address_kana_city, 'ｼﾌﾞﾔ')
    })

    it('optionally-required posted relationship_representative_address_kana_state', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'JP',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const body = {
        relationship_representative_address_kana_city: 'ｼﾌﾞﾔ',
        relationship_representative_address_kana_line1: '27-15',
        relationship_representative_address_kana_postal_code: '1500001',
        relationship_representative_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        relationship_representative_address_kanji_city: '渋谷区',
        relationship_representative_address_kanji_line1: '２７－１５',
        relationship_representative_address_kanji_postal_code: '1500001',
        relationship_representative_address_kanji_state: '東京都',
        relationship_representative_address_kanji_town: '神宮前　３丁目',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name_kana: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_first_name_kanji: '東京都',
        relationship_representative_gender: 'female',
        relationship_representative_last_name_kana: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_last_name_kanji: '東京都',
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const personNow = await req.post()
      assert.strictEqual(personNow.address_kana_state, 'ﾄｳｷﾖｳﾄ')
    })

    it('optionally-required posted relationship_representative_address_kana_postal_code', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'JP',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const body = {
        relationship_representative_address_kana_city: 'ｼﾌﾞﾔ',
        relationship_representative_address_kana_line1: '27-15',
        relationship_representative_address_kana_postal_code: '1500001',
        relationship_representative_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        relationship_representative_address_kanji_city: '渋谷区',
        relationship_representative_address_kanji_line1: '２７－１５',
        relationship_representative_address_kanji_postal_code: '1500001',
        relationship_representative_address_kanji_state: '東京都',
        relationship_representative_address_kanji_town: '神宮前　３丁目',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name_kana: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_first_name_kanji: '東京都',
        relationship_representative_gender: 'female',
        relationship_representative_last_name_kana: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_last_name_kanji: '東京都',
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const personNow = await req.post()
      assert.strictEqual(personNow.address_kana_postal_code, '1500001')
    })

    it('optionally-required posted relationship_representative_address_kana_town', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'JP',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const body = {
        relationship_representative_address_kana_city: 'ｼﾌﾞﾔ',
        relationship_representative_address_kana_line1: '27-15',
        relationship_representative_address_kana_postal_code: '1500001',
        relationship_representative_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        relationship_representative_address_kanji_city: '渋谷区',
        relationship_representative_address_kanji_line1: '２７－１５',
        relationship_representative_address_kanji_postal_code: '1500001',
        relationship_representative_address_kanji_state: '東京都',
        relationship_representative_address_kanji_town: '神宮前　３丁目',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name_kana: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_first_name_kanji: '東京都',
        relationship_representative_gender: 'female',
        relationship_representative_last_name_kana: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_last_name_kanji: '東京都',
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const personNow = await req.post()
      assert.strictEqual(personNow.address_kana_town, 'ｼﾞﾝｸﾞｳﾏｴ 3-')
    })

    it('optionally-required posted relationship_representative_address_kana_line1', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'JP',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const body = {
        relationship_representative_address_kana_city: 'ｼﾌﾞﾔ',
        relationship_representative_address_kana_line1: '27-15',
        relationship_representative_address_kana_postal_code: '1500001',
        relationship_representative_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        relationship_representative_address_kanji_city: '渋谷区',
        relationship_representative_address_kanji_line1: '２７－１５',
        relationship_representative_address_kanji_postal_code: '1500001',
        relationship_representative_address_kanji_state: '東京都',
        relationship_representative_address_kanji_town: '神宮前　３丁目',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name_kana: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_first_name_kanji: '東京都',
        relationship_representative_gender: 'female',
        relationship_representative_last_name_kana: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_last_name_kanji: '東京都',
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const personNow = await req.post()
      assert.strictEqual(personNow.address_kana_line1, '27-15')
    })

    it('optionally-required posted relationship_representative_first_name_kanji', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'JP',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const body = {
        relationship_representative_address_kana_city: 'ｼﾌﾞﾔ',
        relationship_representative_address_kana_line1: '27-15',
        relationship_representative_address_kana_postal_code: '1500001',
        relationship_representative_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        relationship_representative_address_kanji_city: '渋谷区',
        relationship_representative_address_kanji_line1: '２７－１５',
        relationship_representative_address_kanji_postal_code: '1500001',
        relationship_representative_address_kanji_state: '東京都',
        relationship_representative_address_kanji_town: '神宮前　３丁目',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name_kana: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_first_name_kanji: '東京都',
        relationship_representative_gender: 'female',
        relationship_representative_last_name_kana: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_last_name_kanji: '東京都',
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const personNow = await req.post()
      assert.strictEqual(personNow.first_name_kanji, '東京都')
    })

    it('optionally-required posted relationship_representative_last_name_kanji', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'JP',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const body = {
        relationship_representative_address_kana_city: 'ｼﾌﾞﾔ',
        relationship_representative_address_kana_line1: '27-15',
        relationship_representative_address_kana_postal_code: '1500001',
        relationship_representative_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        relationship_representative_address_kanji_city: '渋谷区',
        relationship_representative_address_kanji_line1: '２７－１５',
        relationship_representative_address_kanji_postal_code: '1500001',
        relationship_representative_address_kanji_state: '東京都',
        relationship_representative_address_kanji_town: '神宮前　３丁目',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name_kana: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_first_name_kanji: '東京都',
        relationship_representative_gender: 'female',
        relationship_representative_last_name_kana: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_last_name_kanji: '東京都',
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const personNow = await req.post()
      assert.strictEqual(personNow.last_name_kanji, '東京都')
    })

    it('optionally-required posted relationship_representative_address_kanji_city', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'JP',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const body = {
        relationship_representative_address_kana_city: 'ｼﾌﾞﾔ',
        relationship_representative_address_kana_line1: '27-15',
        relationship_representative_address_kana_postal_code: '1500001',
        relationship_representative_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        relationship_representative_address_kanji_city: '渋谷区',
        relationship_representative_address_kanji_line1: '２７－１５',
        relationship_representative_address_kanji_postal_code: '1500001',
        relationship_representative_address_kanji_state: '東京都',
        relationship_representative_address_kanji_town: '神宮前　３丁目',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name_kana: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_first_name_kanji: '東京都',
        relationship_representative_gender: 'female',
        relationship_representative_last_name_kana: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_last_name_kanji: '東京都',
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const personNow = await req.post()
      assert.strictEqual(personNow.address_kanji_city, '渋谷区')
    })

    it('optionally-required posted relationship_representative_address_kanji_state', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'JP',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const body = {
        relationship_representative_address_kana_city: 'ｼﾌﾞﾔ',
        relationship_representative_address_kana_line1: '27-15',
        relationship_representative_address_kana_postal_code: '1500001',
        relationship_representative_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        relationship_representative_address_kanji_city: '渋谷区',
        relationship_representative_address_kanji_line1: '２７－１５',
        relationship_representative_address_kanji_postal_code: '1500001',
        relationship_representative_address_kanji_state: '東京都',
        relationship_representative_address_kanji_town: '神宮前　３丁目',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name_kana: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_first_name_kanji: '東京都',
        relationship_representative_gender: 'female',
        relationship_representative_last_name_kana: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_last_name_kanji: '東京都',
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const personNow = await req.post()
      assert.strictEqual(personNow.address_kanji_state, '東京都')
    })

    it('optionally-required posted relationship_representative_address_kanji_postal_code', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'JP',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const body = {
        relationship_representative_address_kana_city: 'ｼﾌﾞﾔ',
        relationship_representative_address_kana_line1: '27-15',
        relationship_representative_address_kana_postal_code: '1500001',
        relationship_representative_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        relationship_representative_address_kanji_city: '渋谷区',
        relationship_representative_address_kanji_line1: '２７－１５',
        relationship_representative_address_kanji_postal_code: '1500001',
        relationship_representative_address_kanji_state: '東京都',
        relationship_representative_address_kanji_town: '神宮前　３丁目',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name_kana: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_first_name_kanji: '東京都',
        relationship_representative_gender: 'female',
        relationship_representative_last_name_kana: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_last_name_kanji: '東京都',
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const personNow = await req.post()
      assert.strictEqual(personNow.address_kanji_postal_code, '1500001')
    })

    it('optionally-required posted relationship_representative_address_kanji_town', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'JP',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const body = {
        relationship_representative_address_kana_city: 'ｼﾌﾞﾔ',
        relationship_representative_address_kana_line1: '27-15',
        relationship_representative_address_kana_postal_code: '1500001',
        relationship_representative_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        relationship_representative_address_kanji_city: '渋谷区',
        relationship_representative_address_kanji_line1: '２７－１５',
        relationship_representative_address_kanji_postal_code: '1500001',
        relationship_representative_address_kanji_state: '東京都',
        relationship_representative_address_kanji_town: '神宮前　３丁目',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name_kana: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_first_name_kanji: '東京都',
        relationship_representative_gender: 'female',
        relationship_representative_last_name_kana: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_last_name_kanji: '東京都',
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const personNow = await req.post()
      assert.strictEqual(personNow.address_kanji_town, '神宮前　３丁目')
    })

    it('optionally-required posted relationship_representative_address_kanji_line1', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'JP',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const body = {
        relationship_representative_address_kana_city: 'ｼﾌﾞﾔ',
        relationship_representative_address_kana_line1: '27-15',
        relationship_representative_address_kana_postal_code: '1500001',
        relationship_representative_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        relationship_representative_address_kanji_city: '渋谷区',
        relationship_representative_address_kanji_line1: '２７－１５',
        relationship_representative_address_kanji_postal_code: '1500001',
        relationship_representative_address_kanji_state: '東京都',
        relationship_representative_address_kanji_town: '神宮前　３丁目',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name_kana: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_first_name_kanji: '東京都',
        relationship_representative_gender: 'female',
        relationship_representative_last_name_kana: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_last_name_kanji: '東京都',
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const personNow = await req.post()
      assert.strictEqual(personNow.address_kanji_line1, '２７－１５')
    })
  })

  describe('returns', () => {
    for (const country of connect.countrySpecs) {
      it('object (' + country.id + ')', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: country.id,
          type: 'individual'
        })
        const req = TestHelper.createRequest(`/api/user/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = postData[country.id]
        if (country.id !== 'JP') {
          req.body.relationship_representative_email = user.profile.contactEmail
          req.body.relationship_representative_first_name = user.profile.firstName
          req.body.relationship_representative_last_name = user.profile.lastName
        }
        if (connect.kycRequirements[country.id].individual.indexOf('individual.verification.document.front') > -1) {
          req.uploads = {
            relationship_representative_verification_document_front: TestHelper['success_id_scan_back.png'],
            relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
          }
          if (connect.kycRequirements[country.id].individual.indexOf('individual.verification.additional_document.front') > -1) {
            req.uploads.relationship_representative_verification_additional_document_front = TestHelper['success_id_scan_back.png']
            req.uploads.relationship_representative_verification_additional_document_back = TestHelper['success_id_scan_back.png']
          }
        }
        req.body = TestHelper.createMultiPart(req, req.body)
        const page = await req.post()
        const doc = TestHelper.extractDoc(page)
        const redirectURL = TestHelper.extractRedirectURL(doc)
        assert.strictEqual(redirectURL, `/account/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
      })
    }
  })

  describe('configuration', () => {
    it('environment STRIPE_JS', async () => {
      global.stripeJS = 3
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
      req.waitOnSubmit = true
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      req.body = {
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
      }
      await req.post()
      const req2 = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
      req2.waitOnSubmit = true
      req2.account = user.account
      req2.session = user.session
      req2.uploads = {
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      req2.body = {
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
      }
      await req2.post()
      const personNow = await global.api.user.connect.StripeAccount.get(req2)
      assert.notStrictEqual(personNow.representativeToken, null)
      assert.notStrictEqual(personNow.representativeToken, undefined)
    })
  })
})

const postData = {
  AT: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    relationship_representative_address_city: 'Vienna',
    relationship_representative_address_line1: '123 Sesame St',
    relationship_representative_address_postal_code: '1020',
    relationship_representative_address_state: '1',
    relationship_representative_dob_day: '1',
    relationship_representative_dob_month: '1',
    relationship_representative_dob_year: '1950',
    relationship_representative_phone: '456-789-0123'
  },
  AU: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    relationship_representative_address_city: 'Brisbane',
    relationship_representative_address_line1: '845 Oxford St',
    relationship_representative_address_postal_code: '4000',
    relationship_representative_address_state: 'QLD',
    relationship_representative_dob_day: '1',
    relationship_representative_dob_month: '1',
    relationship_representative_dob_year: '1950',
    relationship_representative_phone: '456-789-0123'
  },
  BE: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    relationship_representative_address_city: 'Brussels',
    relationship_representative_address_line1: '123 Sesame St',
    relationship_representative_address_postal_code: '1020',
    relationship_representative_address_state: 'BRU',
    relationship_representative_dob_day: '1',
    relationship_representative_dob_month: '1',
    relationship_representative_dob_year: '1950',
    relationship_representative_phone: '456-789-0123'
  },
  CA: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    relationship_representative_address_city: 'Vancouver',
    relationship_representative_address_line1: '123 Sesame St',
    relationship_representative_address_postal_code: 'V5K 0A1',
    relationship_representative_address_state: 'BC',
    relationship_representative_dob_day: '1',
    relationship_representative_dob_month: '1',
    relationship_representative_dob_year: '1950',
    relationship_representative_id_number: '000000000',
    relationship_representative_phone: '456-789-0123'
  },
  CH: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    relationship_representative_address_city: 'Bern',
    relationship_representative_address_line1: '123 Sesame St',
    relationship_representative_address_postal_code: '1020',
    relationship_representative_address_state: 'BE',
    relationship_representative_dob_day: '1',
    relationship_representative_dob_month: '1',
    relationship_representative_dob_year: '1950',
    relationship_representative_phone: '456-789-0123'
  },
  DE: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    relationship_representative_address_city: 'Berlin',
    relationship_representative_address_line1: '123 Sesame St',
    relationship_representative_address_postal_code: '01067',
    relationship_representative_address_state: 'BE',
    relationship_representative_dob_day: '1',
    relationship_representative_dob_month: '1',
    relationship_representative_dob_year: '1950',
    relationship_representative_phone: '456-789-0123'
  },
  DK: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    relationship_representative_address_city: 'Copenhagen',
    relationship_representative_address_line1: '123 Sesame St',
    relationship_representative_address_postal_code: '1000',
    relationship_representative_address_state: '147',
    relationship_representative_dob_day: '1',
    relationship_representative_dob_month: '1',
    relationship_representative_dob_year: '1950',
    relationship_representative_phone: '456-789-0123'
  },
  EE: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    relationship_representative_address_city: 'Tallinn',
    relationship_representative_address_line1: '123 Sesame St',
    relationship_representative_address_postal_code: '10128',
    relationship_representative_address_state: '37',
    relationship_representative_dob_day: '1',
    relationship_representative_dob_month: '1',
    relationship_representative_dob_year: '1950',
    relationship_representative_phone: '456-789-0123'
  },
  ES: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    relationship_representative_address_city: 'Madrid',
    relationship_representative_address_line1: '123 Park Lane',
    relationship_representative_address_postal_code: '03179',
    relationship_representative_address_state: 'AN',
    relationship_representative_name: 'Individual',
    relationship_representative_phone: '456-789-0123',
    relationship_representative_tax_id: '00000000000'
  },
  FI: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    relationship_representative_address_city: 'Helsinki',
    relationship_representative_address_line1: '123 Sesame St',
    relationship_representative_address_postal_code: '00990',
    relationship_representative_address_state: 'AL',
    relationship_representative_dob_day: '1',
    relationship_representative_dob_month: '1',
    relationship_representative_dob_year: '1950',
    relationship_representative_phone: '456-789-0123'
  },
  FR: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    relationship_representative_address_city: 'Paris',
    relationship_representative_address_line1: '123 Sesame St',
    relationship_representative_address_postal_code: '75001',
    relationship_representative_address_state: 'A',
    relationship_representative_dob_day: '1',
    relationship_representative_dob_month: '1',
    relationship_representative_dob_year: '1950',
    relationship_representative_phone: '456-789-0123'
  },
  GB: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    relationship_representative_address_city: 'London',
    relationship_representative_address_line1: '123 Sesame St',
    relationship_representative_address_postal_code: 'EC1A 1AA',
    relationship_representative_address_state: 'LND',
    relationship_representative_dob_day: '1',
    relationship_representative_dob_month: '1',
    relationship_representative_dob_year: '1950',
    relationship_representative_phone: '456-789-0123'
  },
  GR: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    relationship_representative_address_city: 'Athens',
    relationship_representative_address_line1: '123 Park Lane',
    relationship_representative_address_postal_code: '104',
    relationship_representative_address_state: 'I',
    relationship_representative_phone: '456-789-0123',
    relationship_representative_tax_id: '00000000000'
  },
  HK: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    relationship_representative_address_city: 'Hong Kong',
    relationship_representative_address_line1: '123 Sesame St',
    relationship_representative_address_postal_code: '999077',
    relationship_representative_address_state: 'HK',
    relationship_representative_dob_day: '1',
    relationship_representative_dob_month: '1',
    relationship_representative_dob_year: '1950',
    relationship_representative_id_number: '000000000',
    relationship_representative_phone: '456-789-0123'
  },
  IE: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    relationship_representative_address_city: 'Dublin',
    relationship_representative_address_line1: '123 Sesame St',
    relationship_representative_address_postal_code: 'Dublin 1',
    relationship_representative_address_state: 'D',
    relationship_representative_dob_day: '1',
    relationship_representative_dob_month: '1',
    relationship_representative_dob_year: '1950',
    relationship_representative_phone: '456-789-0123'
  },
  IT: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    relationship_representative_address_city: 'Rome',
    relationship_representative_address_line1: '123 Sesame St',
    relationship_representative_address_postal_code: '00010',
    relationship_representative_address_state: '65',
    relationship_representative_dob_day: '1',
    relationship_representative_dob_month: '1',
    relationship_representative_dob_year: '1950',
    relationship_representative_phone: '456-789-0123'
  },
  JP: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    relationship_representative_address_kana_city: 'ｼﾌﾞﾔ',
    relationship_representative_address_kana_line1: '27-15',
    relationship_representative_address_kana_postal_code: '1500001',
    relationship_representative_address_kana_state: 'ﾄｳｷﾖｳﾄ',
    relationship_representative_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
    relationship_representative_address_kanji_city: '渋谷区',
    relationship_representative_address_kanji_line1: '２７－１５',
    relationship_representative_address_kanji_postal_code: '1500001',
    relationship_representative_address_kanji_state: '東京都',
    relationship_representative_address_kanji_town: '神宮前 ３丁目',
    relationship_representative_dob_day: '1',
    relationship_representative_dob_month: '1',
    relationship_representative_dob_year: '1950',
    relationship_representative_first_name_kana: 'ﾄｳｷﾖｳﾄ',
    relationship_representative_first_name_kanji: '東京都',
    relationship_representative_gender: 'female',
    relationship_representative_last_name_kana: 'ﾄｳｷﾖｳﾄ',
    relationship_representative_last_name_kanji: '東京都',
    relationship_representative_phone: '+81112345678'
  },
  LT: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    relationship_representative_address_city: 'Vilnius',
    relationship_representative_address_line1: '123 Sesame St',
    relationship_representative_address_postal_code: 'LT-00000',
    relationship_representative_address_state: 'AL',
    relationship_representative_dob_day: '1',
    relationship_representative_dob_month: '1',
    relationship_representative_dob_year: '1950',
    relationship_representative_phone: '456-789-0123'
  },
  LU: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    relationship_representative_address_city: 'Luxemburg',
    relationship_representative_address_line1: '123 Sesame St',
    relationship_representative_address_postal_code: '1623',
    relationship_representative_address_state: 'L',
    relationship_representative_dob_day: '1',
    relationship_representative_dob_month: '1',
    relationship_representative_dob_year: '1950',
    relationship_representative_phone: '456-789-0123'
  },
  LV: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    relationship_representative_address_city: 'Riga',
    relationship_representative_address_line1: '123 Sesame St',
    relationship_representative_address_postal_code: 'LV–1073',
    relationship_representative_address_state: 'AI',
    relationship_representative_dob_day: '1',
    relationship_representative_dob_month: '1',
    relationship_representative_dob_year: '1950',
    relationship_representative_phone: '456-789-0123'
  },
  MY: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    relationship_representative_address_city: 'Kuala Lumpur',
    relationship_representative_address_line1: '123 Sesame St',
    relationship_representative_address_postal_code: '50450',
    relationship_representative_address_state: 'C',
    relationship_representative_dob_day: '1',
    relationship_representative_dob_month: '1',
    relationship_representative_dob_year: '1950',
    relationship_representative_phone: '456-789-0123'
  },
  NL: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    relationship_representative_address_city: 'Amsterdam',
    relationship_representative_address_line1: '123 Sesame St',
    relationship_representative_address_postal_code: '1071 JA',
    relationship_representative_address_state: 'DR',
    relationship_representative_dob_day: '1',
    relationship_representative_dob_month: '1',
    relationship_representative_dob_year: '1950',
    relationship_representative_phone: '456-789-0123'
  },
  NO: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    relationship_representative_address_city: 'Oslo',
    relationship_representative_address_line1: '123 Sesame St',
    relationship_representative_address_postal_code: '0001',
    relationship_representative_address_state: '02',
    relationship_representative_dob_day: '1',
    relationship_representative_dob_month: '1',
    relationship_representative_dob_year: '1950',
    relationship_representative_phone: '456-789-0123'
  },
  NZ: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    relationship_representative_address_city: 'Auckland',
    relationship_representative_address_line1: '844 Fleet Street',
    relationship_representative_address_postal_code: '6011',
    relationship_representative_address_state: 'N',
    relationship_representative_dob_day: '1',
    relationship_representative_dob_month: '1',
    relationship_representative_dob_year: '1950',
    relationship_representative_phone: '456-789-0123'
  },
  PL: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    relationship_representative_address_city: 'Krakow',
    relationship_representative_address_line1: '123 Park Lane',
    relationship_representative_address_postal_code: '32-400',
    relationship_representative_address_state: 'KR',
    relationship_representative_dob_day: '1',
    relationship_representative_dob_month: '1',
    relationship_representative_dob_year: '1950',
    relationship_representative_phone: '456-789-0123'
  },
  PT: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    relationship_representative_address_city: 'Lisbon',
    relationship_representative_address_line1: '123 Sesame St',
    relationship_representative_address_postal_code: '4520',
    relationship_representative_address_state: '01',
    relationship_representative_dob_day: '1',
    relationship_representative_dob_month: '1',
    relationship_representative_dob_year: '1950',
    relationship_representative_phone: '456-789-0123'
  },
  SE: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    relationship_representative_address_city: 'Stockholm',
    relationship_representative_address_line1: '123 Sesame St',
    relationship_representative_address_postal_code: '00150',
    relationship_representative_address_state: 'K',
    relationship_representative_dob_day: '1',
    relationship_representative_dob_month: '1',
    relationship_representative_dob_year: '1950',
    relationship_representative_phone: '456-789-0123'
  },
  SG: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    relationship_representative_address_city: 'Singapore',
    relationship_representative_address_line1: '123 Sesame St',
    relationship_representative_address_postal_code: '339696',
    relationship_representative_address_state: 'SG',
    relationship_representative_dob_day: '1',
    relationship_representative_dob_month: '1',
    relationship_representative_dob_year: '1950',
    relationship_representative_id_number: '000000000',
    relationship_representative_phone: '456-789-0123'
  },
  SI: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    relationship_representative_address_city: 'Ljubljana',
    relationship_representative_address_line1: '123 Sesame St',
    relationship_representative_address_postal_code: '1210',
    relationship_representative_dob_day: '1',
    relationship_representative_dob_month: '1',
    relationship_representative_dob_year: '1950',
    relationship_representative_phone: '456-789-0123'
  },
  SK: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    relationship_representative_address_city: 'Slovakia',
    relationship_representative_address_line1: '123 Sesame St',
    relationship_representative_address_postal_code: '00102',
    relationship_representative_dob_day: '1',
    relationship_representative_dob_month: '1',
    relationship_representative_dob_year: '1950',
    relationship_representative_phone: '456-789-0123'
  },
  US: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    relationship_representative_address_city: 'New York',
    relationship_representative_address_line1: '285 Fulton St',
    relationship_representative_address_postal_code: '10007',
    relationship_representative_address_state: 'NY',
    relationship_representative_dob_day: '1',
    relationship_representative_dob_month: '1',
    relationship_representative_dob_year: '1950',
    relationship_representative_phone: '456-789-0123',
    relationship_representative_ssn_last_4: '0000'
  }
}
