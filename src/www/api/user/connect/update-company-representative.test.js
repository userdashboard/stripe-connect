/* eslint-env mocha */
const assert = require('assert')
const connect = require('../../../../../index.js')
const TestHelper = require('../../../../../test-helper.js')

describe('/api/user/connect/update-company-representative', () => {
  describe('exceptions', () => {
    describe('invalid-stripeid', () => {
      it('missing querystring stripeid', async () => {
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/connect/update-company-representative')
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
        const req = TestHelper.createRequest('/api/user/connect/update-company-representative?stripeid=invalid')
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
      it('ineligible stripe account for individuals', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'individual',
          country: 'US'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
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
          type: 'company',
          country: 'US'
        })
        await TestHelper.createStripeRegistration(user, {
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
        })
        await TestHelper.createCompanyRepresentative(user, {
          relationship_representative_dob_day: '1',
          relationship_representative_dob_month: '1',
          relationship_representative_dob_year: '1950',
          relationship_representative_first_name: user.profile.firstName,
          relationship_representative_last_name: user.profile.lastName,
          relationship_representative_executive: 'true',
          relationship_representative_relationship_title: 'Owner',
          relationship_representative_email: user.profile.contactEmail,
          relationship_representative_phone: '456-789-0123',
          relationship_representative_address_city: 'New York',
          relationship_representative_ssn_last_4: '0000',
          relationship_representative_address_state: 'NY',
          relationship_representative_address_country: 'US',
          relationship_representative_address_line1: '285 Fulton St',
          relationship_representative_address_postal_code: '10007'
        }, {
          relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
          relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
        })
        await TestHelper.createExternalAccount(user, {
          currency: 'usd',
          country: 'US',
          account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
          account_holder_type: 'individual',
          account_number: '000123456789',
          routing_number: '110000000'
        })
        await TestHelper.submitStripeAccount(user)
        const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
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
          type: 'company',
          country: 'US'
        })
        const user2 = await TestHelper.createUser()
        const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
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

    describe('invalid-relationship_representative_percent_owned', () => {
      it('invalid posted relationship_representative_percent_owned', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'US'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
          relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
        }
        const body = {
          relationship_representative_percent_owned: 'invalid',
          relationship_representative_dob_day: '7',
          relationship_representative_dob_month: '1',
          relationship_representative_dob_year: '1951',
          relationship_representative_first_name: user.profile.firstName,
          relationship_representative_last_name: user.profile.lastName,
          relationship_representative_executive: 'true',
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
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_representative_percent_owned')
      })
    })

    describe('invalid-relationship_representative_dob_day', () => {
      it('missing posted relationship_representative_dob_day', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'AT'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
          relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
        }
        const body = {
          relationship_representative_dob_day: '',
          relationship_representative_dob_month: '1',
          relationship_representative_dob_year: '1950',
          relationship_representative_first_name: user.profile.firstName,
          relationship_representative_last_name: user.profile.lastName,
          relationship_representative_executive: 'true',
          relationship_representative_title: 'Owner',
          relationship_representative_email: user.profile.contactEmail,
          relationship_representative_phone: '456-789-0123',
          relationship_representative_address_city: 'Vienna',
          relationship_representative_address_line1: '123 Sesame St',
          relationship_representative_address_postal_code: '1020'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_representative_dob_day')
      })

      it('invalid posted relationship_representative_dob_day', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'AT'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
          relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
        }
        const body = {
          relationship_representative_dob_day: 'invalid',
          relationship_representative_dob_month: '1',
          relationship_representative_dob_year: '1950',
          relationship_representative_first_name: user.profile.firstName,
          relationship_representative_last_name: user.profile.lastName,
          relationship_representative_executive: 'true',
          relationship_representative_title: 'Owner',
          relationship_representative_email: user.profile.contactEmail,
          relationship_representative_phone: '456-789-0123',
          relationship_representative_address_city: 'Vienna',
          relationship_representative_address_line1: '123 Sesame St',
          relationship_representative_address_postal_code: '1020'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
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
          type: 'company',
          country: 'AT'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
          relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
        }
        const body = {
          relationship_representative_dob_day: '1',
          relationship_representative_dob_month: '',
          relationship_representative_dob_year: '1950',
          relationship_representative_first_name: user.profile.firstName,
          relationship_representative_last_name: user.profile.lastName,
          relationship_representative_executive: 'true',
          relationship_representative_title: 'Owner',
          relationship_representative_email: user.profile.contactEmail,
          relationship_representative_phone: '456-789-0123',
          relationship_representative_address_city: 'Vienna',
          relationship_representative_address_line1: '123 Sesame St',
          relationship_representative_address_postal_code: '1020'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_representative_dob_month')
      })

      it('invalid posted relationship_representative_dob_month', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'AT'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
          relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
        }
        const body = {
          relationship_representative_dob_day: '1',
          relationship_representative_dob_month: 'invalid',
          relationship_representative_dob_year: '1950',
          relationship_representative_first_name: user.profile.firstName,
          relationship_representative_last_name: user.profile.lastName,
          relationship_representative_executive: 'true',
          relationship_representative_title: 'Owner',
          relationship_representative_email: user.profile.contactEmail,
          relationship_representative_phone: '456-789-0123',
          relationship_representative_address_city: 'Vienna',
          relationship_representative_address_line1: '123 Sesame St',
          relationship_representative_address_postal_code: '1020'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
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
          type: 'company',
          country: 'AT'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
          relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
        }
        const body = {
          relationship_representative_dob_day: '1',
          relationship_representative_dob_month: '1',
          relationship_representative_dob_year: '',
          relationship_representative_first_name: user.profile.firstName,
          relationship_representative_last_name: user.profile.lastName,
          relationship_representative_executive: 'true',
          relationship_representative_title: 'Owner',
          relationship_representative_email: user.profile.contactEmail,
          relationship_representative_phone: '456-789-0123',
          relationship_representative_address_city: 'Vienna',
          relationship_representative_address_line1: '123 Sesame St',
          relationship_representative_address_postal_code: '1020'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_representative_dob_year')
      })

      it('invalid posted relationship_representative_dob_year', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'AT'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
          relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
        }
        const body = {
          relationship_representative_dob_day: '1',
          relationship_representative_dob_month: '1',
          relationship_representative_dob_year: 'invalid',
          relationship_representative_first_name: user.profile.firstName,
          relationship_representative_last_name: user.profile.lastName,
          relationship_representative_executive: 'true',
          relationship_representative_title: 'Owner',
          relationship_representative_email: user.profile.contactEmail,
          relationship_representative_phone: '456-789-0123',
          relationship_representative_address_city: 'Vienna',
          relationship_representative_address_line1: '123 Sesame St',
          relationship_representative_address_postal_code: '1020'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
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
          type: 'company',
          country: 'AT'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
          relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
        }
        const body = {
          relationship_representative_dob_day: '1',
          relationship_representative_dob_month: '1',
          relationship_representative_dob_year: '1950',
          relationship_representative_first_name: '',
          relationship_representative_last_name: user.profile.lastName,
          relationship_representative_executive: 'true',
          relationship_representative_title: 'Owner',
          relationship_representative_email: user.profile.contactEmail,
          relationship_representative_phone: '456-789-0123',
          relationship_representative_address_city: 'Vienna',
          relationship_representative_address_line1: '123 Sesame St',
          relationship_representative_address_postal_code: '1020'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
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
          type: 'company',
          country: 'AT'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
          relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
        }
        const body = {
          relationship_representative_dob_day: '1',
          relationship_representative_dob_month: '1',
          relationship_representative_dob_year: '1950',
          relationship_representative_first_name: user.profile.firstName,
          relationship_representative_last_name: '',
          relationship_representative_email: user.profile.contactEmail,
          relationship_representative_phone: '456-789-0123',
          relationship_representative_address_city: 'Vienna',
          relationship_representative_address_line1: '123 Sesame St',
          relationship_representative_address_postal_code: '1020'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
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
          type: 'company',
          country: 'AT'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
          relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
        }
        const body = {
          relationship_representative_dob_day: '1',
          relationship_representative_dob_month: '1',
          relationship_representative_dob_year: '1950',
          relationship_representative_first_name: user.profile.firstName,
          relationship_representative_last_name: user.profile.lastName,
          relationship_representative_executive: 'true',
          relationship_representative_title: 'Owner',
          relationship_representative_email: '',
          relationship_representative_phone: '456-789-0123',
          relationship_representative_address_city: 'Vienna',
          relationship_representative_address_line1: '123 Sesame St',
          relationship_representative_address_postal_code: '1020'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
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
          type: 'company',
          country: 'AT'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
          relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
        }
        const body = {
          relationship_representative_dob_day: '1',
          relationship_representative_dob_month: '1',
          relationship_representative_dob_year: '1950',
          relationship_representative_first_name: user.profile.firstName,
          relationship_representative_last_name: user.profile.lastName,
          relationship_representative_executive: 'true',
          relationship_representative_title: 'Owner',
          relationship_representative_email: user.profile.contactEmail,
          relationship_representative_phone: '',
          relationship_representative_address_city: 'Vienna',
          relationship_representative_address_line1: '123 Sesame St',
          relationship_representative_address_postal_code: '1020'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
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
          type: 'company',
          country: 'US'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
          relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
        }
        const body = {
          relationship_representative_dob_day: '1',
          relationship_representative_dob_month: '1',
          relationship_representative_dob_year: '1950',
          relationship_representative_first_name: user.profile.firstName,
          relationship_representative_last_name: user.profile.lastName,
          relationship_representative_executive: 'true',
          relationship_representative_title: 'Owner',
          relationship_representative_email: user.profile.contactEmail,
          relationship_representative_phone: '456-789-0123',
          relationship_representative_id_number: '000000000',
          relationship_representative_ssn_last_4: '',
          relationship_representative_address_city: 'New York',
          relationship_representative_address_state: 'NY',
          relationship_representative_address_country: 'US',
          relationship_representative_address_line1: '285 Fulton St',
          relationship_representative_address_postal_code: '10007'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
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
          type: 'company',
          country: 'US'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
          relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
        }
        const body = {
          relationship_representative_dob_day: '1',
          relationship_representative_dob_month: '1',
          relationship_representative_dob_year: '1950',
          relationship_representative_first_name: user.profile.firstName,
          relationship_representative_last_name: user.profile.lastName,
          relationship_representative_executive: 'true',
          relationship_representative_title: 'Owner',
          relationship_representative_email: user.profile.contactEmail,
          relationship_representative_phone: '456-789-0123',
          relationship_representative_id_number: '000000000',
          relationship_representative_ssn_last_4: '0000',
          relationship_representative_address_city: 'New York',
          relationship_representative_address_state: 'NY',
          relationship_representative_address_country: 'US',
          relationship_representative_address_line1: '',
          relationship_representative_address_postal_code: '10007'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
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
          type: 'company',
          country: 'US'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
          relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
        }
        const body = {
          relationship_representative_dob_day: '1',
          relationship_representative_dob_month: '1',
          relationship_representative_dob_year: '1950',
          relationship_representative_first_name: user.profile.firstName,
          relationship_representative_last_name: user.profile.lastName,
          relationship_representative_executive: 'true',
          relationship_representative_title: 'Owner',
          relationship_representative_email: user.profile.contactEmail,
          relationship_representative_phone: '456-789-0123',
          relationship_representative_id_number: '000000000',
          relationship_representative_ssn_last_4: '0000',
          relationship_representative_address_city: '',
          relationship_representative_address_state: 'NY',
          relationship_representative_address_country: 'US',
          relationship_representative_address_line1: '285 Fulton St',
          relationship_representative_address_postal_code: '10007'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
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
          type: 'company',
          country: 'US'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
          relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
        }
        const body = {
          relationship_representative_dob_day: '1',
          relationship_representative_dob_month: '1',
          relationship_representative_dob_year: '1950',
          relationship_representative_first_name: user.profile.firstName,
          relationship_representative_last_name: user.profile.lastName,
          relationship_representative_executive: 'true',
          relationship_representative_title: 'Owner',
          relationship_representative_email: user.profile.contactEmail,
          relationship_representative_phone: '456-789-0123',
          relationship_representative_id_number: '000000000',
          relationship_representative_ssn_last_4: '0000',
          relationship_representative_address_city: 'New York',
          relationship_representative_address_state: '',
          relationship_representative_address_country: 'US',
          relationship_representative_address_line1: '285 Fulton St',
          relationship_representative_address_postal_code: '10007'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
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
          type: 'company',
          country: 'US'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
          relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
        }
        const body = {
          relationship_representative_dob_day: '1',
          relationship_representative_dob_month: '1',
          relationship_representative_dob_year: '1950',
          relationship_representative_first_name: user.profile.firstName,
          relationship_representative_last_name: user.profile.lastName,
          relationship_representative_executive: 'true',
          relationship_representative_title: 'Owner',
          relationship_representative_email: user.profile.contactEmail,
          relationship_representative_phone: '456-789-0123',
          relationship_representative_id_number: '000000000',
          relationship_representative_ssn_last_4: '0000',
          relationship_representative_address_city: 'New York',
          relationship_representative_address_state: 'NY',
          relationship_representative_address_country: '',
          relationship_representative_address_line1: '285 Fulton St',
          relationship_representative_address_postal_code: '10007'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_representative_address_country')
      })

      it('invalid-relationship_representative_address_country', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'US'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
          relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
        }
        const body = {
          relationship_representative_dob_day: '1',
          relationship_representative_dob_month: '1',
          relationship_representative_dob_year: '1950',
          relationship_representative_first_name: user.profile.firstName,
          relationship_representative_last_name: user.profile.lastName,
          relationship_representative_executive: 'true',
          relationship_representative_title: 'Owner',
          relationship_representative_email: user.profile.contactEmail,
          relationship_representative_phone: '456-789-0123',
          relationship_representative_id_number: '000000000',
          relationship_representative_ssn_last_4: '0000',
          relationship_representative_address_city: 'New York',
          relationship_representative_address_state: 'NY',
          relationship_representative_address_country: 'invalid',
          relationship_representative_address_line1: '285 Fulton St',
          relationship_representative_address_postal_code: '10007'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
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
          type: 'company',
          country: 'US'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
          relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
        }
        const body = {
          relationship_representative_dob_day: '1',
          relationship_representative_dob_month: '1',
          relationship_representative_dob_year: '1950',
          relationship_representative_first_name: user.profile.firstName,
          relationship_representative_last_name: user.profile.lastName,
          relationship_representative_executive: 'true',
          relationship_representative_title: 'Owner',
          relationship_representative_email: user.profile.contactEmail,
          relationship_representative_phone: '456-789-0123',
          relationship_representative_id_number: '000000000',
          relationship_representative_ssn_last_4: '0000',
          relationship_representative_address_city: 'New York',
          relationship_representative_address_state: 'NY',
          relationship_representative_address_country: 'US',
          relationship_representative_address_line1: '285 Fulton St',
          relationship_representative_address_postal_code: ''
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
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
          type: 'company',
          country: 'JP'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
          relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
        }
        const body = {
          relationship_representative_gender: 'female',
          relationship_representative_dob_day: '1',
          relationship_representative_dob_month: '1',
          relationship_representative_dob_year: '1950',
          relationship_representative_first_name_kana: 'ﾄｳｷﾖｳﾄ',
          relationship_representative_last_name_kana: 'ﾄｳｷﾖｳﾄ',
          relationship_representative_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          relationship_representative_address_kana_city: 'ｼﾌﾞﾔ',
          relationship_representative_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          relationship_representative_address_kana_line1: '27-15',
          relationship_representative_address_kana_postal_code: '',
          relationship_representative_first_name_kanji: '東京都',
          relationship_representative_last_name_kanji: '東京都',
          relationship_representative_address_kanji_postal_code: '1500001',
          relationship_representative_address_kanji_state: '東京都',
          relationship_representative_address_kanji_city: '渋谷区',
          relationship_representative_address_kanji_town: '神宮前　３丁目',
          relationship_representative_address_kanji_line1: '２７－１５'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
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
          type: 'company',
          country: 'JP'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
          relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
        }
        const body = {
          relationship_representative_gender: 'female',
          relationship_representative_dob_day: '1',
          relationship_representative_dob_month: '1',
          relationship_representative_dob_year: '1950',
          relationship_representative_first_name_kana: 'ﾄｳｷﾖｳﾄ',
          relationship_representative_last_name_kana: 'ﾄｳｷﾖｳﾄ',
          relationship_representative_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          relationship_representative_address_kana_city: '',
          relationship_representative_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          relationship_representative_address_kana_line1: '27-15',
          relationship_representative_address_kana_postal_code: '1500001',
          relationship_representative_first_name_kanji: '東京都',
          relationship_representative_last_name_kanji: '東京都',
          relationship_representative_address_kanji_postal_code: '1500001',
          relationship_representative_address_kanji_state: '東京都',
          relationship_representative_address_kanji_city: '渋谷区',
          relationship_representative_address_kanji_town: '神宮前　３丁目',
          relationship_representative_address_kanji_line1: '２７－１５'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
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
          type: 'company',
          country: 'JP'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
          relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
        }
        const body = {
          relationship_representative_gender: 'female',
          relationship_representative_dob_day: '1',
          relationship_representative_dob_month: '1',
          relationship_representative_dob_year: '1950',
          relationship_representative_first_name_kana: 'ﾄｳｷﾖｳﾄ',
          relationship_representative_last_name_kana: 'ﾄｳｷﾖｳﾄ',
          relationship_representative_address_kana_state: '',
          relationship_representative_address_kana_city: 'ｼﾌﾞﾔ',
          relationship_representative_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          relationship_representative_address_kana_line1: '27-15',
          relationship_representative_address_kana_postal_code: '1500001',
          relationship_representative_first_name_kanji: '東京都',
          relationship_representative_last_name_kanji: '東京都',
          relationship_representative_address_kanji_postal_code: '1500001',
          relationship_representative_address_kanji_state: '東京都',
          relationship_representative_address_kanji_city: '渋谷区',
          relationship_representative_address_kanji_town: '神宮前　３丁目',
          relationship_representative_address_kanji_line1: '２７－１５'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
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
          type: 'company',
          country: 'JP'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
          relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
        }
        const body = {
          relationship_representative_gender: 'female',
          relationship_representative_dob_day: '1',
          relationship_representative_dob_month: '1',
          relationship_representative_dob_year: '1950',
          relationship_representative_first_name_kana: 'ﾄｳｷﾖｳﾄ',
          relationship_representative_last_name_kana: 'ﾄｳｷﾖｳﾄ',
          relationship_representative_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          relationship_representative_address_kana_city: 'ｼﾌﾞﾔ',
          relationship_representative_address_kana_town: '',
          relationship_representative_address_kana_line1: '27-15',
          relationship_representative_address_kana_postal_code: '1500001',
          relationship_representative_first_name_kanji: '東京都',
          relationship_representative_last_name_kanji: '東京都',
          relationship_representative_address_kanji_postal_code: '1500001',
          relationship_representative_address_kanji_state: '東京都',
          relationship_representative_address_kanji_city: '渋谷区',
          relationship_representative_address_kanji_town: '神宮前　３丁目',
          relationship_representative_address_kanji_line1: '２７－１５'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
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
          type: 'company',
          country: 'JP'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
          relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
        }
        const body = {
          relationship_representative_gender: 'female',
          relationship_representative_dob_day: '1',
          relationship_representative_dob_month: '1',
          relationship_representative_dob_year: '1950',
          relationship_representative_first_name_kana: 'ﾄｳｷﾖｳﾄ',
          relationship_representative_last_name_kana: 'ﾄｳｷﾖｳﾄ',
          relationship_representative_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          relationship_representative_address_kana_city: 'ｼﾌﾞﾔ',
          relationship_representative_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          relationship_representative_address_kana_line1: '',
          relationship_representative_address_kana_postal_code: '1500001',
          relationship_representative_first_name_kanji: '東京都',
          relationship_representative_last_name_kanji: '東京都',
          relationship_representative_address_kanji_postal_code: '1500001',
          relationship_representative_address_kanji_state: '東京都',
          relationship_representative_address_kanji_city: '渋谷区',
          relationship_representative_address_kanji_town: '神宮前　３丁目',
          relationship_representative_address_kanji_line1: '２７－１５'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
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
          type: 'company',
          country: 'JP'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
          relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
        }
        const body = {
          relationship_representative_gender: 'female',
          relationship_representative_dob_day: '1',
          relationship_representative_dob_month: '1',
          relationship_representative_dob_year: '1950',
          relationship_representative_first_name_kana: 'ﾄｳｷﾖｳﾄ',
          relationship_representative_last_name_kana: 'ﾄｳｷﾖｳﾄ',
          relationship_representative_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          relationship_representative_address_kana_city: 'ｼﾌﾞﾔ',
          relationship_representative_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          relationship_representative_address_kana_line1: '27-15',
          relationship_representative_address_kana_postal_code: '1500001',
          relationship_representative_first_name_kanji: '東京都',
          relationship_representative_last_name_kanji: '東京都',
          relationship_representative_address_kanji_postal_code: '',
          relationship_representative_address_kanji_state: '東京都',
          relationship_representative_address_kanji_city: '渋谷区',
          relationship_representative_address_kanji_town: '神宮前　３丁目',
          relationship_representative_address_kanji_line1: '２７－１５'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
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
          type: 'company',
          country: 'JP'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
          relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
        }
        const body = {
          relationship_representative_gender: 'female',
          relationship_representative_dob_day: '1',
          relationship_representative_dob_month: '1',
          relationship_representative_dob_year: '1950',
          relationship_representative_first_name_kana: 'ﾄｳｷﾖｳﾄ',
          relationship_representative_last_name_kana: 'ﾄｳｷﾖｳﾄ',
          relationship_representative_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          relationship_representative_address_kana_city: 'ｼﾌﾞﾔ',
          relationship_representative_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          relationship_representative_address_kana_line1: '27-15',
          relationship_representative_address_kana_postal_code: '1500001',
          relationship_representative_first_name_kanji: '東京都',
          relationship_representative_last_name_kanji: '東京都',
          relationship_representative_address_kanji_postal_code: '1500001',
          relationship_representative_address_kanji_state: '東京都',
          relationship_representative_address_kanji_city: '',
          relationship_representative_address_kanji_town: '神宮前　３丁目',
          relationship_representative_address_kanji_line1: '２７－１５'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
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
          type: 'company',
          country: 'JP'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
          relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
        }
        const body = {
          relationship_representative_gender: 'female',
          relationship_representative_dob_day: '1',
          relationship_representative_dob_month: '1',
          relationship_representative_dob_year: '1950',
          relationship_representative_first_name_kana: 'ﾄｳｷﾖｳﾄ',
          relationship_representative_last_name_kana: 'ﾄｳｷﾖｳﾄ',
          relationship_representative_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          relationship_representative_address_kana_city: 'ｼﾌﾞﾔ',
          relationship_representative_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          relationship_representative_address_kana_line1: '27-15',
          relationship_representative_address_kana_postal_code: '1500001',
          relationship_representative_first_name_kanji: '東京都',
          relationship_representative_last_name_kanji: '東京都',
          relationship_representative_address_kanji_postal_code: '1500001',
          relationship_representative_address_kanji_state: '',
          relationship_representative_address_kanji_city: '渋谷区',
          relationship_representative_address_kanji_town: '神宮前　３丁目',
          relationship_representative_address_kanji_line1: '２７－１５'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
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
          type: 'company',
          country: 'JP'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
          relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
        }
        const body = {
          relationship_representative_gender: 'female',
          relationship_representative_dob_day: '1',
          relationship_representative_dob_month: '1',
          relationship_representative_dob_year: '1950',
          relationship_representative_first_name_kana: 'ﾄｳｷﾖｳﾄ',
          relationship_representative_last_name_kana: 'ﾄｳｷﾖｳﾄ',
          relationship_representative_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          relationship_representative_address_kana_city: 'ｼﾌﾞﾔ',
          relationship_representative_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          relationship_representative_address_kana_line1: '27-15',
          relationship_representative_address_kana_postal_code: '1500001',
          relationship_representative_first_name_kanji: '東京都',
          relationship_representative_last_name_kanji: '東京都',
          relationship_representative_address_kanji_postal_code: '1500001',
          relationship_representative_address_kanji_state: '東京都',
          relationship_representative_address_kanji_city: '渋谷区',
          relationship_representative_address_kanji_town: '',
          relationship_representative_address_kanji_line1: '２７－１５'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
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
          type: 'company',
          country: 'JP'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
          relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
        }
        const body = {
          relationship_representative_gender: 'female',
          relationship_representative_dob_day: '1',
          relationship_representative_dob_month: '1',
          relationship_representative_dob_year: '1950',
          relationship_representative_first_name_kana: 'ﾄｳｷﾖｳﾄ',
          relationship_representative_last_name_kana: 'ﾄｳｷﾖｳﾄ',
          relationship_representative_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          relationship_representative_address_kana_city: 'ｼﾌﾞﾔ',
          relationship_representative_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          relationship_representative_address_kana_line1: '27-15',
          relationship_representative_address_kana_postal_code: '1500001',
          relationship_representative_first_name_kanji: '東京都',
          relationship_representative_last_name_kanji: '東京都',
          relationship_representative_address_kanji_postal_code: '1500001',
          relationship_representative_address_kanji_state: '東京都',
          relationship_representative_address_kanji_city: '渋谷区',
          relationship_representative_address_kanji_town: '神宮前　３丁目',
          relationship_representative_address_kanji_line1: ''
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
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
        type: 'company',
        country: 'US'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      const body = {
        token: 'token',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_executive: 'true',
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
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registration = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registration.representative_token, 'token')
    })

    it('required posted relationship_representative_dob_day', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'US'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      const body = {
        relationship_representative_dob_day: '7',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_executive: 'true',
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
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registration = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registration.relationship_representative_dob_day, '7')
    })

    it('required posted relationship_representative_dob_month', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'US'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      const body = {
        relationship_representative_dob_day: '7',
        relationship_representative_dob_month: '11',
        relationship_representative_dob_year: '1950',
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_executive: 'true',
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
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registration = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registration.relationship_representative_dob_month, '11')
    })

    it('required posted relationship_representative_dob_year', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'US'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      const body = {
        relationship_representative_dob_day: '7',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1951',
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_executive: 'true',
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
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registration = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registration.relationship_representative_dob_year, '1951')
    })

    it('optionally-required posted file relationship_representative_verification_document_front', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'US'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      const body = {
        relationship_representative_dob_day: '7',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1951',
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_executive: 'true',
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
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registration = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.notStrictEqual(registration.relationship_representative_verification_document_front, null)
      assert.notStrictEqual(registration.relationship_representative_verification_document_front, undefined)
    })

    it('optionally-required posted file relationship_representative_verification_document_back', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'US'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      const body = {
        relationship_representative_dob_day: '7',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1951',
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_executive: 'true',
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
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registration = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.notStrictEqual(registration.relationship_representative_verification_document_back, null)
      assert.notStrictEqual(registration.relationship_representative_verification_document_back, undefined)
    })

    it('optionally-required posted relationship_representative_first_name', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'US'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      const body = {
        relationship_representative_dob_day: '7',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1951',
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_executive: 'true',
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
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registration = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registration.relationship_representative_first_name, user.profile.firstName)
    })

    it('optionally-required posted relationship_representative_last_name', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'US'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      const body = {
        relationship_representative_dob_day: '7',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1951',
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_executive: 'true',
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
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registration = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registration.relationship_representative_last_name, user.profile.lastName)
    })

    it('optionally-required posted relationship_representative_email', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'US'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      const body = {
        relationship_representative_dob_day: '7',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1951',
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_executive: 'true',
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
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registration = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registration.relationship_representative_email, user.profile.contactEmail)
    })

    it('optionally-required posted relationship_representative_phone', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'US'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      const body = {
        relationship_representative_dob_day: '7',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1951',
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_executive: 'true',
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
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registration = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registration.relationship_representative_phone, '456-789-0123')
    })

    it('optionally-required posted relationship_representative_gender', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'JP'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      const body = {
        relationship_representative_executive: 'true',
        relationship_representative_title: 'Owner',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_gender: 'female',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_first_name_kana: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_last_name_kana: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_address_kana_city: 'ｼﾌﾞﾔ',
        relationship_representative_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        relationship_representative_address_kana_line1: '27-15',
        relationship_representative_address_kana_postal_code: '1500001',
        relationship_representative_first_name_kanji: '東京都',
        relationship_representative_last_name_kanji: '東京都',
        relationship_representative_address_kanji_postal_code: '1500001',
        relationship_representative_address_kanji_state: '東京都',
        relationship_representative_address_kanji_city: '渋谷区',
        relationship_representative_address_kanji_town: '神宮前　３丁目',
        relationship_representative_address_kanji_line1: '２７－１５'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registration = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registration.relationship_representative_gender, 'female')
    })

    it('optionally-required posted relationship_representative_ssn_last_4', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'US'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      const body = {
        relationship_representative_dob_day: '7',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1951',
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_executive: 'true',
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
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registration = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registration.relationship_representative_ssn_last_4, '0000')
    })

    it('optionally-required posted relationship_representative_id_number', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'CA'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      const body = {
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_executive: 'true',
        relationship_representative_title: 'Owner',
        relationship_representative_id_number: '000000000',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_address_city: 'Vancouver',
        relationship_representative_address_state: 'BC',
        relationship_representative_address_country: 'CA',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: 'V5K 0A1'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registration = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registration.relationship_representative_id_number, '000000000')
    })

    it('optionally-required posted relationship_representative_address_city', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'US'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      const body = {
        relationship_representative_dob_day: '7',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1951',
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_executive: 'true',
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
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registration = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registration.relationship_representative_address_city, 'New York')
    })

    it('optionally-required posted relationship_representative_address_state', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'US'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      const body = {
        relationship_representative_dob_day: '7',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1951',
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_executive: 'true',
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
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registration = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registration.relationship_representative_address_state, 'NY')
    })

    it('optionally-required posted relationship_representative_address_postal_code', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'US'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      const body = {
        relationship_representative_dob_day: '7',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1951',
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_executive: 'true',
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
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registration = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registration.relationship_representative_address_postal_code, '10007')
    })

    it('optionally-required posted relationship_representative_address_country', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'US'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      const body = {
        relationship_representative_dob_day: '7',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1951',
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_executive: 'true',
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
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registration = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registration.relationship_representative_address_country, 'US')
    })

    it('optionally-required posted relationship_representative_address_line1', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'US'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      const body = {
        relationship_representative_dob_day: '7',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1951',
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_executive: 'true',
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
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registration = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registration.relationship_representative_address_line1, '285 Fulton St')
    })

    it('optional posted relationship_representative_address_line2', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'US'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      const body = {
        relationship_representative_dob_day: '7',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1951',
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_executive: 'true',
        relationship_representative_relationship_title: 'Owner',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_address_city: 'New York',
        relationship_representative_ssn_last_4: '0000',
        relationship_representative_address_state: 'NY',
        relationship_representative_address_country: 'US',
        relationship_representative_address_line1: '285 Fulton St',
        relationship_representative_address_line2: 'Another detail',
        relationship_representative_address_postal_code: '10007'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registration = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registration.relationship_representative_address_line2, 'Another detail')
    })

    it('optional posted relationship_representative_percent_owned', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'CA'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      const body = {
        relationship_representative_percent_owned: 100,
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_executive: 'true',
        relationship_representative_title: 'Owner',
        relationship_representative_id_number: '000000000',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_address_city: 'Vancouver',
        relationship_representative_address_state: 'BC',
        relationship_representative_address_country: 'CA',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: 'V5K 0A1'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registration = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registration.relationship_representative_percent_owned, '100')
    })

    it('optional posted relationship_representative_title', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'CA'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      const body = {
        relationship_representative_percent_owned: 100,
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_executive: 'true',
        relationship_representative_title: 'Owner',
        relationship_representative_id_number: '000000000',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_address_city: 'Vancouver',
        relationship_representative_address_state: 'BC',
        relationship_representative_address_country: 'CA',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: 'V5K 0A1'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registration = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registration.relationship_representative_title, 'Owner')
    })

    it('optional posted relationship_representative_director', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'CA'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      const body = {
        relationship_representative_percent_owned: 100,
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_director: 'true',
        relationship_representative_title: 'Owner',
        relationship_representative_id_number: '000000000',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_address_city: 'Vancouver',
        relationship_representative_address_state: 'BC',
        relationship_representative_address_country: 'CA',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: 'V5K 0A1'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registration = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registration.relationship_representative_director, true)
    })

    it('optional posted relationship_representative_executive', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'CA'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      const body = {
        relationship_representative_percent_owned: 100,
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_executive: 'true',
        relationship_representative_title: 'Owner',
        relationship_representative_id_number: '000000000',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_address_city: 'Vancouver',
        relationship_representative_address_state: 'BC',
        relationship_representative_address_country: 'CA',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: 'V5K 0A1'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registration = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registration.relationship_representative_executive, true)
    })

    it('optionally-required posted relationship_representative_first_name_kana', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'JP'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      const body = {
        relationship_representative_executive: 'true',
        relationship_representative_title: 'Owner',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_gender: 'female',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_first_name_kana: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_last_name_kana: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_address_kana_city: 'ｼﾌﾞﾔ',
        relationship_representative_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        relationship_representative_address_kana_line1: '27-15',
        relationship_representative_address_kana_postal_code: '1500001',
        relationship_representative_first_name_kanji: '東京都',
        relationship_representative_last_name_kanji: '東京都',
        relationship_representative_address_kanji_postal_code: '1500001',
        relationship_representative_address_kanji_state: '東京都',
        relationship_representative_address_kanji_city: '渋谷区',
        relationship_representative_address_kanji_town: '神宮前　３丁目',
        relationship_representative_address_kanji_line1: '２７－１５'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registration = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registration.relationship_representative_address_kanji_line1, '２７－１５')
    })

    it('optionally-required posted relationship_representative_last_name_kana', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'JP'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      const body = {
        relationship_representative_executive: 'true',
        relationship_representative_title: 'Owner',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_gender: 'female',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_first_name_kana: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_last_name_kana: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_address_kana_city: 'ｼﾌﾞﾔ',
        relationship_representative_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        relationship_representative_address_kana_line1: '27-15',
        relationship_representative_address_kana_postal_code: '1500001',
        relationship_representative_first_name_kanji: '東京都',
        relationship_representative_last_name_kanji: '東京都',
        relationship_representative_address_kanji_postal_code: '1500001',
        relationship_representative_address_kanji_state: '東京都',
        relationship_representative_address_kanji_city: '渋谷区',
        relationship_representative_address_kanji_town: '神宮前　３丁目',
        relationship_representative_address_kanji_line1: '２７－１５'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registration = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registration.relationship_representative_last_name_kana, 'ﾄｳｷﾖｳﾄ')
    })

    it('optionally-required posted relationship_representative_address_kana_city', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'JP'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      const body = {
        relationship_representative_executive: 'true',
        relationship_representative_title: 'Owner',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_gender: 'female',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_first_name_kana: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_last_name_kana: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_address_kana_city: 'ｼﾌﾞﾔ',
        relationship_representative_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        relationship_representative_address_kana_line1: '27-15',
        relationship_representative_address_kana_postal_code: '1500001',
        relationship_representative_first_name_kanji: '東京都',
        relationship_representative_last_name_kanji: '東京都',
        relationship_representative_address_kanji_postal_code: '1500001',
        relationship_representative_address_kanji_state: '東京都',
        relationship_representative_address_kanji_city: '渋谷区',
        relationship_representative_address_kanji_town: '神宮前　３丁目',
        relationship_representative_address_kanji_line1: '２７－１５'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registration = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registration.relationship_representative_address_kana_city, 'ｼﾌﾞﾔ')
    })

    it('optionally-required posted relationship_representative_address_kana_state', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'JP'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      const body = {
        relationship_representative_executive: 'true',
        relationship_representative_title: 'Owner',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_gender: 'female',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_first_name_kana: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_last_name_kana: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_address_kana_city: 'ｼﾌﾞﾔ',
        relationship_representative_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        relationship_representative_address_kana_line1: '27-15',
        relationship_representative_address_kana_postal_code: '1500001',
        relationship_representative_first_name_kanji: '東京都',
        relationship_representative_last_name_kanji: '東京都',
        relationship_representative_address_kanji_postal_code: '1500001',
        relationship_representative_address_kanji_state: '東京都',
        relationship_representative_address_kanji_city: '渋谷区',
        relationship_representative_address_kanji_town: '神宮前　３丁目',
        relationship_representative_address_kanji_line1: '２７－１５'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registration = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registration.relationship_representative_address_kana_state, 'ﾄｳｷﾖｳﾄ')
    })

    it('optionally-required posted relationship_representative_address_kana_postal_code', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'JP'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      const body = {
        relationship_representative_executive: 'true',
        relationship_representative_title: 'Owner',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_gender: 'female',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_first_name_kana: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_last_name_kana: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_address_kana_city: 'ｼﾌﾞﾔ',
        relationship_representative_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        relationship_representative_address_kana_line1: '27-15',
        relationship_representative_address_kana_postal_code: '1500001',
        relationship_representative_first_name_kanji: '東京都',
        relationship_representative_last_name_kanji: '東京都',
        relationship_representative_address_kanji_postal_code: '1500001',
        relationship_representative_address_kanji_state: '東京都',
        relationship_representative_address_kanji_city: '渋谷区',
        relationship_representative_address_kanji_town: '神宮前　３丁目',
        relationship_representative_address_kanji_line1: '２７－１５'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registration = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registration.relationship_representative_address_kana_postal_code, '1500001')
    })

    it('optionally-required posted relationship_representative_address_kana_town', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'JP'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      const body = {
        relationship_representative_executive: 'true',
        relationship_representative_title: 'Owner',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_gender: 'female',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_first_name_kana: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_last_name_kana: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_address_kana_city: 'ｼﾌﾞﾔ',
        relationship_representative_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        relationship_representative_address_kana_line1: '27-15',
        relationship_representative_address_kana_postal_code: '1500001',
        relationship_representative_first_name_kanji: '東京都',
        relationship_representative_last_name_kanji: '東京都',
        relationship_representative_address_kanji_postal_code: '1500001',
        relationship_representative_address_kanji_state: '東京都',
        relationship_representative_address_kanji_city: '渋谷区',
        relationship_representative_address_kanji_town: '神宮前　３丁目',
        relationship_representative_address_kanji_line1: '２７－１５'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registration = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registration.relationship_representative_address_kana_town, 'ｼﾞﾝｸﾞｳﾏｴ 3-')
    })

    it('optionally-required posted relationship_representative_address_kana_line1', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'JP'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      const body = {
        relationship_representative_executive: 'true',
        relationship_representative_title: 'Owner',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_gender: 'female',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_first_name_kana: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_last_name_kana: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_address_kana_city: 'ｼﾌﾞﾔ',
        relationship_representative_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        relationship_representative_address_kana_line1: '27-15',
        relationship_representative_address_kana_postal_code: '1500001',
        relationship_representative_first_name_kanji: '東京都',
        relationship_representative_last_name_kanji: '東京都',
        relationship_representative_address_kanji_postal_code: '1500001',
        relationship_representative_address_kanji_state: '東京都',
        relationship_representative_address_kanji_city: '渋谷区',
        relationship_representative_address_kanji_town: '神宮前　３丁目',
        relationship_representative_address_kanji_line1: '２７－１５'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registration = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registration.relationship_representative_address_kana_line1, '27-15')
    })

    it('optionally-required posted relationship_representative_first_name_kanji', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'JP'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      const body = {
        relationship_representative_executive: 'true',
        relationship_representative_title: 'Owner',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_gender: 'female',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_first_name_kana: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_last_name_kana: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_address_kana_city: 'ｼﾌﾞﾔ',
        relationship_representative_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        relationship_representative_address_kana_line1: '27-15',
        relationship_representative_address_kana_postal_code: '1500001',
        relationship_representative_first_name_kanji: '東京都',
        relationship_representative_last_name_kanji: '東京都',
        relationship_representative_address_kanji_postal_code: '1500001',
        relationship_representative_address_kanji_state: '東京都',
        relationship_representative_address_kanji_city: '渋谷区',
        relationship_representative_address_kanji_town: '神宮前　３丁目',
        relationship_representative_address_kanji_line1: '２７－１５'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registration = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registration.relationship_representative_first_name_kanji, '東京都')
    })

    it('optionally-required posted relationship_representative_last_name_kanji', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'JP'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      const body = {
        relationship_representative_executive: 'true',
        relationship_representative_title: 'Owner',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_gender: 'female',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_first_name_kana: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_last_name_kana: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_address_kana_city: 'ｼﾌﾞﾔ',
        relationship_representative_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        relationship_representative_address_kana_line1: '27-15',
        relationship_representative_address_kana_postal_code: '1500001',
        relationship_representative_first_name_kanji: '東京都',
        relationship_representative_last_name_kanji: '東京都',
        relationship_representative_address_kanji_postal_code: '1500001',
        relationship_representative_address_kanji_state: '東京都',
        relationship_representative_address_kanji_city: '渋谷区',
        relationship_representative_address_kanji_town: '神宮前　３丁目',
        relationship_representative_address_kanji_line1: '２７－１５'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registration = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registration.relationship_representative_last_name_kanji, '東京都')
    })

    it('optionally-required posted relationship_representative_address_kanji_city', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'JP'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      const body = {
        relationship_representative_executive: 'true',
        relationship_representative_title: 'Owner',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_gender: 'female',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_first_name_kana: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_last_name_kana: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_address_kana_city: 'ｼﾌﾞﾔ',
        relationship_representative_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        relationship_representative_address_kana_line1: '27-15',
        relationship_representative_address_kana_postal_code: '1500001',
        relationship_representative_first_name_kanji: '東京都',
        relationship_representative_last_name_kanji: '東京都',
        relationship_representative_address_kanji_postal_code: '1500001',
        relationship_representative_address_kanji_state: '東京都',
        relationship_representative_address_kanji_city: '渋谷区',
        relationship_representative_address_kanji_town: '神宮前　３丁目',
        relationship_representative_address_kanji_line1: '２７－１５'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registration = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registration.relationship_representative_address_kanji_city, '渋谷区')
    })

    it('optionally-required posted relationship_representative_address_kanji_state', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'JP'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      const body = {
        relationship_representative_executive: 'true',
        relationship_representative_title: 'Owner',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_gender: 'female',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_first_name_kana: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_last_name_kana: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_address_kana_city: 'ｼﾌﾞﾔ',
        relationship_representative_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        relationship_representative_address_kana_line1: '27-15',
        relationship_representative_address_kana_postal_code: '1500001',
        relationship_representative_first_name_kanji: '東京都',
        relationship_representative_last_name_kanji: '東京都',
        relationship_representative_address_kanji_postal_code: '1500001',
        relationship_representative_address_kanji_state: '東京都',
        relationship_representative_address_kanji_city: '渋谷区',
        relationship_representative_address_kanji_town: '神宮前　３丁目',
        relationship_representative_address_kanji_line1: '２７－１５'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registration = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registration.relationship_representative_address_kanji_state, '東京都')
    })

    it('optionally-required posted relationship_representative_address_kanji_postal_code', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'JP'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      const body = {
        relationship_representative_executive: 'true',
        relationship_representative_title: 'Owner',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_gender: 'female',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_first_name_kana: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_last_name_kana: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_address_kana_city: 'ｼﾌﾞﾔ',
        relationship_representative_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        relationship_representative_address_kana_line1: '27-15',
        relationship_representative_address_kana_postal_code: '1500001',
        relationship_representative_first_name_kanji: '東京都',
        relationship_representative_last_name_kanji: '東京都',
        relationship_representative_address_kanji_postal_code: '1500001',
        relationship_representative_address_kanji_state: '東京都',
        relationship_representative_address_kanji_city: '渋谷区',
        relationship_representative_address_kanji_town: '神宮前　３丁目',
        relationship_representative_address_kanji_line1: '２７－１５'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registration = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registration.relationship_representative_address_kanji_postal_code, '1500001')
    })

    it('optionally-required posted relationship_representative_address_kanji_town', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'JP'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      const body = {
        relationship_representative_executive: 'true',
        relationship_representative_title: 'Owner',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_gender: 'female',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_first_name_kana: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_last_name_kana: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_address_kana_city: 'ｼﾌﾞﾔ',
        relationship_representative_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        relationship_representative_address_kana_line1: '27-15',
        relationship_representative_address_kana_postal_code: '1500001',
        relationship_representative_first_name_kanji: '東京都',
        relationship_representative_last_name_kanji: '東京都',
        relationship_representative_address_kanji_postal_code: '1500001',
        relationship_representative_address_kanji_state: '東京都',
        relationship_representative_address_kanji_city: '渋谷区',
        relationship_representative_address_kanji_town: '神宮前　３丁目',
        relationship_representative_address_kanji_line1: '２７－１５'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registration = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registration.relationship_representative_address_kanji_town, '神宮前　３丁目')
    })

    it('optionally-required posted relationship_representative_address_kanji_line1', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'JP'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      const body = {
        relationship_representative_executive: 'true',
        relationship_representative_title: 'Owner',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_gender: 'female',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_first_name_kana: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_last_name_kana: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_address_kana_city: 'ｼﾌﾞﾔ',
        relationship_representative_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        relationship_representative_address_kana_line1: '27-15',
        relationship_representative_address_kana_postal_code: '1500001',
        relationship_representative_first_name_kanji: '東京都',
        relationship_representative_last_name_kanji: '東京都',
        relationship_representative_address_kanji_postal_code: '1500001',
        relationship_representative_address_kanji_state: '東京都',
        relationship_representative_address_kanji_city: '渋谷区',
        relationship_representative_address_kanji_town: '神宮前　３丁目',
        relationship_representative_address_kanji_line1: '２７－１５'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registration = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registration.relationship_representative_address_kanji_line1, '２７－１５')
    })
  })

  describe('returns', () => {
    it('object for AT registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'AT'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      const body = {
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_executive: 'true',
        relationship_representative_relationship_title: 'Owner',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_address_country: 'AT',
        relationship_representative_address_city: 'Vienna',
        relationship_representative_address_state: '1',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: '1020'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      for (const field in body) {
        assert.strictEqual(registrationNow[field].toString(), body[field])
      }
    })

    it('object for AU registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'AU'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      const body = {
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_executive: 'true',
        relationship_representative_relationship_title: 'Owner',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_address_city: 'Brisbane',
        relationship_representative_address_state: 'QLD',
        relationship_representative_address_country: 'AU',
        relationship_representative_address_line1: '845 Oxford St',
        relationship_representative_address_postal_code: '4000'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], body[field])
      }
    })

    it('object for BE registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'BE'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      const body = {
        relationship_representative_address_city: 'Brussels',
        relationship_representative_address_state: 'BRU',
        relationship_representative_address_country: 'BE',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: '1020',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_phone: '456-789-0123',
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_executive: 'true',
        relationship_representative_relationship_title: 'Owner',
        relationship_representative_email: user.profile.contactEmail
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], body[field])
      }
    })

    it('object for CA registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'CA'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      const body = {
        relationship_representative_id_number: '7',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_executive: 'true',
        relationship_representative_relationship_title: 'Owner',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_address_city: 'Vancouver',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_state: 'BC',
        relationship_representative_address_country: 'CA',
        relationship_representative_address_postal_code: 'V5K 0A1',
        relationship_representative_percent_ownership: '0'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], body[field])
      }
    })

    it('object for CH registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'CH'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      const body = {
        relationship_representative_address_city: 'Bern',
        relationship_representative_address_state: 'BE',
        relationship_representative_address_country: 'CH',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: '1020',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_executive: 'true',
        relationship_representative_relationship_title: 'Owner',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_phone: '456-789-0123'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], body[field])
      }
    })

    it('object for DE registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'DE'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      const body = {
        relationship_representative_address_city: 'Berlin',
        relationship_representative_address_state: 'BE',
        relationship_representative_address_country: 'DE',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: '01067',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_executive: 'true',
        relationship_representative_relationship_title: 'Owner',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_phone: '456-789-0123'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], body[field])
      }
    })

    it('object for DK registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'DK'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      const body = {
        relationship_representative_address_city: 'Copenhagen',
        relationship_representative_address_state: '147',
        relationship_representative_address_country: 'DK',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: '1000',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_executive: 'true',
        relationship_representative_relationship_title: 'Owner',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_phone: '456-789-0123'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], body[field])
      }
    })

    it('object for EE registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'EE'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      const body = {
        relationship_representative_address_city: 'Talinn',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_state: '37',
        relationship_representative_address_country: 'EE',
        relationship_representative_address_postal_code: '10128',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_executive: 'true',
        relationship_representative_relationship_title: 'Owner',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_phone: '456-789-0123'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], body[field])
      }
    })

    it('object for ES registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'ES'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      const body = {
        relationship_representative_address_city: 'Madrid',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_state: 'AN',
        relationship_representative_address_country: 'ES',
        relationship_representative_address_postal_code: '03179',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_executive: 'true',
        relationship_representative_relationship_title: 'Owner',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_phone: '456-789-0123'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], body[field])
      }
    })

    it('object for FI registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'FI'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      const body = {
        relationship_representative_address_city: 'Helsinki',
        relationship_representative_address_state: 'AL',
        relationship_representative_address_country: 'FI',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: '00990',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_executive: 'true',
        relationship_representative_relationship_title: 'Owner',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_phone: '456-789-0123'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], body[field])
      }
    })
    it('object for FR registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'FR'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      const body = {
        relationship_representative_address_city: 'Paris',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_state: 'A',
        relationship_representative_address_country: 'FR',
        relationship_representative_address_postal_code: '75001',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_executive: 'true',
        relationship_representative_relationship_title: 'Owner',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_phone: '456-789-0123'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], body[field])
      }
    })

    it('object for GB registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'GB'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      const body = {
        relationship_representative_address_city: 'London',
        relationship_representative_address_state: 'LND',
        relationship_representative_address_country: 'GB',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: 'EC1A 1AA',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_executive: 'true',
        relationship_representative_relationship_title: 'Owner',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_phone: '456-789-0123'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], body[field])
      }
    })

    it('object for HK registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'HK'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      const body = {
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_executive: 'true',
        relationship_representative_id_number: '000000000',
        relationship_representative_relationship_title: 'Owner',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_address_city: 'Hong Kong',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_state: 'HK',
        relationship_representative_address_postal_code: '999077',
        relationship_representative_address_country: 'HK',
        relationship_representative_percent_ownership: '0'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], body[field])
      }
    })

    it('object for IE registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'IE'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      const body = {
        relationship_representative_address_city: 'Dublin',
        relationship_representative_address_state: 'D',
        relationship_representative_address_country: 'IE',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_executive: 'true',
        relationship_representative_relationship_title: 'Owner',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_address_postal_code: 'Dublin 1'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], body[field])
      }
    })

    it('object for IT registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'IT'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      const body = {
        relationship_representative_address_city: 'Rome',
        relationship_representative_address_state: '65',
        relationship_representative_address_country: 'IT',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: '00010',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_executive: 'true',
        relationship_representative_relationship_title: 'Owner',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_phone: '456-789-0123'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], body[field])
      }
    })

    it('object for JP registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'JP'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_additional_document_back: TestHelper['success_id_scan_back.png']
      }
      const body = {
        relationship_representative_gender: 'female',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_first_name_kana: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_last_name_kana: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_address_kana_city: 'ｼﾌﾞﾔ',
        relationship_representative_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        relationship_representative_address_kana_line1: '27-15',
        relationship_representative_address_kana_postal_code: '1500001',
        relationship_representative_first_name_kanji: '東京都',
        relationship_representative_last_name_kanji: '東京都',
        relationship_representative_address_kanji_postal_code: '1500001',
        relationship_representative_address_kanji_state: '東京都',
        relationship_representative_address_kanji_city: '渋谷区',
        relationship_representative_address_kanji_town: '神宮前 ３丁目',
        relationship_representative_address_kanji_line1: '２７－１５'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const stripeAccountNow = await req.patch()
      const registration = connect.MetaData.parse(stripeAccountNow.metadata, 'registration')
      for (const field in req.body) {
        assert.strictEqual(registration[field], body[field])
      }
    })

    it('object for LU registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'LU'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      const body = {
        relationship_representative_address_city: 'Luxemburg',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: '1623',
        relationship_representative_address_state: 'L',
        relationship_representative_address_country: 'LU',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_executive: 'true',
        relationship_representative_relationship_title: 'Owner',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_phone: '456-789-0123'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], body[field])
      }
    })

    it('object for NL registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'NL'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      const body = {
        relationship_representative_address_city: 'Amsterdam',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: '1071 JA',
        relationship_representative_address_state: 'DR',
        relationship_representative_address_country: 'NL',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_executive: 'true',
        relationship_representative_relationship_title: 'Owner',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_phone: '456-789-0123'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], body[field])
      }
    })
    it('object for NO registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'NO'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      const body = {
        relationship_representative_address_city: 'Oslo',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: '0001',
        relationship_representative_address_state: '02',
        relationship_representative_address_country: 'NO',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_executive: 'true',
        relationship_representative_relationship_title: 'Owner',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_phone: '456-789-0123'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], body[field])
      }
    })

    it('object for NZ registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'NZ'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_additional_document_back: TestHelper['success_id_scan_back.png']
      }
      const body = {
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_executive: 'true',
        relationship_representative_relationship_title: 'Owner',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_address_city: 'Auckland',
        relationship_representative_address_postal_code: '6011',
        relationship_representative_address_line1: '844 Fleet Street',
        relationship_representative_address_state: 'N',
        relationship_representative_address_country: 'NZ'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], body[field])
      }
    })

    it('object for PT registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'PT'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      const body = {
        relationship_representative_address_city: 'Lisbon',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: '4520',
        relationship_representative_address_state: '01',
        relationship_representative_address_country: 'PT',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_executive: 'true',
        relationship_representative_relationship_title: 'Owner',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_phone: '456-789-0123'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], body[field])
      }
    })

    it('object for SE registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'SE'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      const body = {
        relationship_representative_address_city: 'Stockholm',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: '00150',
        relationship_representative_address_state: 'K',
        relationship_representative_address_country: 'SE',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_executive: 'true',
        relationship_representative_relationship_title: 'Owner',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_phone: '456-789-0123'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], body[field])
      }
    })

    it('object for SG registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'SG'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      const body = {
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_executive: 'true',
        relationship_representative_relationship_title: 'Owner',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: '339696',
        relationship_representative_address_city: 'Singapore',
        relationship_representative_address_state: 'SG',
        relationship_representative_address_country: 'SG',
        relationship_representative_phone: '456-789-0123',
        relationship_representative_percent_ownership: '0',
        relationship_representative_id_number: '000000000'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], body[field])
      }
    })

    it('object for US registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'US'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      const body = {
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_executive: 'true',
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
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], body[field])
      }
    })
  })

  describe('configuration', () => {
    it('environment STRIPE_JS', async () => {
      global.stripeJS = 3
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'US'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      const body = {
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_executive: 'true',
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
      req.body = TestHelper.createMultiPart(req, body)
      let errorMessage
      try {
        await req.patch()
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-token')
    })
  })
})
