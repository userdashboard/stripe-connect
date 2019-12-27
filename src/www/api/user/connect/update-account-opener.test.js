/* eslint-env mocha */
const assert = require('assert')
const connect = require('../../../../../index.js')
const TestHelper = require('../../../../../test-helper.js')

describe('/api/user/connect/update-account-opener', () => {
  describe('exceptions', () => {
    describe('invalid-stripeid', () => {
      it('missing querystring stripeid', async () => {
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/connect/update-account-opener')
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
        const req = TestHelper.createRequest('/api/user/connect/update-account-opener?stripeid=invalid')
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
          country: 'US',
          type: 'individual'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-account-opener?stripeid=${user.stripeAccount.id}`)
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
          company_address_line1: '285 Fulton St',
          company_address_postal_code: '10007',
          company_address_state: 'NY',
          company_name: 'Company',
          company_phone: '456-789-0123',
          company_tax_id: '00000000000'
        })
        await TestHelper.createCompanyRepresentative(user, {
          account_opener_address_city: 'New York',
          account_opener_address_country: 'US',
          account_opener_address_line1: '285 Fulton St',
          account_opener_address_postal_code: '10007',
          account_opener_address_state: 'NY',
          account_opener_dob_day: '1',
          account_opener_dob_month: '1',
          account_opener_dob_year: '1950',
          account_opener_email: user.profile.contactEmail,
          account_opener_first_name: user.profile.firstName,
          account_opener_last_name: user.profile.lastName,
          account_opener_phone: '456-789-0123',
          account_opener_relationship_executive: 'true',
          account_opener_relationship_title: 'Owner',
          account_opener_ssn_last_4: '0000'
        }, {
          account_opener_verification_document_back: TestHelper['success_id_scan_back.png'],
          account_opener_verification_document_front: TestHelper['success_id_scan_front.png']
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
        const req = TestHelper.createRequest(`/api/user/connect/update-account-opener?stripeid=${user.stripeAccount.id}`)
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
          country: 'US',
          type: 'company'
        })
        const user2 = await TestHelper.createUser()
        const req = TestHelper.createRequest(`/api/user/connect/update-account-opener?stripeid=${user.stripeAccount.id}`)
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

    describe('invalid-account_opener_percent_ownership', () => {
      it('invalid posted account_opener_percent_ownership', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'US',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-account-opener?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          account_opener_verification_document_back: TestHelper['success_id_scan_back.png'],
          account_opener_verification_document_front: TestHelper['success_id_scan_front.png']
        }
        const body = {
          account_opener_address_city: 'New York',
          account_opener_address_country: 'US',
          account_opener_address_line1: '285 Fulton St',
          account_opener_address_postal_code: '10007',
          account_opener_address_state: 'NY',
          account_opener_dob_day: '7',
          account_opener_dob_month: '1',
          account_opener_dob_year: '1951',
          account_opener_email: user.profile.contactEmail,
          account_opener_first_name: user.profile.firstName,
          account_opener_last_name: user.profile.lastName,
          account_opener_percent_ownership: 'invalid',
          account_opener_phone: '456-789-0123',
          account_opener_relationship_executive: 'true',
          account_opener_relationship_title: 'Owner',
          account_opener_ssn_last_4: '0000'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-account_opener_percent_ownership')
      })
    })

    describe('invalid-account_opener_dob_day', () => {
      it('missing posted account_opener_dob_day', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'AT',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-account-opener?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          account_opener_verification_document_back: TestHelper['success_id_scan_back.png'],
          account_opener_verification_document_front: TestHelper['success_id_scan_front.png']
        }
        const body = {
          account_opener_address_city: 'Vienna',
          account_opener_address_line1: '123 Sesame St',
          account_opener_address_postal_code: '1020',
          account_opener_address_state: '1',
          account_opener_dob_day: '',
          account_opener_dob_month: '1',
          account_opener_dob_year: '1950',
          account_opener_email: user.profile.contactEmail,
          account_opener_first_name: user.profile.firstName,
          account_opener_last_name: user.profile.lastName,
          account_opener_phone: '456-789-0123',
          account_opener_relationship_executive: 'true',
          account_opener_relationship_title: 'Owner'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-account_opener_dob_day')
      })

      it('invalid posted account_opener_dob_day', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'AT',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-account-opener?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          account_opener_verification_document_back: TestHelper['success_id_scan_back.png'],
          account_opener_verification_document_front: TestHelper['success_id_scan_front.png']
        }
        const body = {
          account_opener_address_city: 'Vienna',
          account_opener_address_line1: '123 Sesame St',
          account_opener_address_postal_code: '1020',
          account_opener_address_state: '1',
          account_opener_dob_day: 'invalid',
          account_opener_dob_month: '1',
          account_opener_dob_year: '1950',
          account_opener_email: user.profile.contactEmail,
          account_opener_first_name: user.profile.firstName,
          account_opener_last_name: user.profile.lastName,
          account_opener_phone: '456-789-0123',
          account_opener_relationship_executive: 'true',
          account_opener_relationship_title: 'Owner'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-account_opener_dob_day')
      })
    })

    describe('invalid-account_opener_dob_month', () => {
      it('missing posted account_opener_dob_month', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'AT',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-account-opener?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          account_opener_verification_document_back: TestHelper['success_id_scan_back.png'],
          account_opener_verification_document_front: TestHelper['success_id_scan_front.png']
        }
        const body = {
          account_opener_address_city: 'Vienna',
          account_opener_address_line1: '123 Sesame St',
          account_opener_address_postal_code: '1020',
          account_opener_address_state: '1',
          account_opener_dob_day: '1',
          account_opener_dob_month: '',
          account_opener_dob_year: '1950',
          account_opener_email: user.profile.contactEmail,
          account_opener_first_name: user.profile.firstName,
          account_opener_last_name: user.profile.lastName,
          account_opener_phone: '456-789-0123',
          account_opener_relationship_executive: 'true',
          account_opener_relationship_title: 'Owner'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-account_opener_dob_month')
      })

      it('invalid posted account_opener_dob_month', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'AT',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-account-opener?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          account_opener_verification_document_back: TestHelper['success_id_scan_back.png'],
          account_opener_verification_document_front: TestHelper['success_id_scan_front.png']
        }
        const body = {
          account_opener_address_city: 'Vienna',
          account_opener_address_line1: '123 Sesame St',
          account_opener_address_postal_code: '1020',
          account_opener_address_state: '1',
          account_opener_dob_day: '1',
          account_opener_dob_month: 'invalid',
          account_opener_dob_year: '1950',
          account_opener_email: user.profile.contactEmail,
          account_opener_first_name: user.profile.firstName,
          account_opener_last_name: user.profile.lastName,
          account_opener_phone: '456-789-0123',
          account_opener_relationship_executive: 'true',
          account_opener_relationship_title: 'Owner'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-account_opener_dob_month')
      })
    })

    describe('invalid-account_opener_dob_year', () => {
      it('missing posted account_opener_dob_year', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'AT',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-account-opener?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          account_opener_verification_document_back: TestHelper['success_id_scan_back.png'],
          account_opener_verification_document_front: TestHelper['success_id_scan_front.png']
        }
        const body = {
          account_opener_address_city: 'Vienna',
          account_opener_address_line1: '123 Sesame St',
          account_opener_address_postal_code: '1020',
          account_opener_address_state: '1',
          account_opener_dob_day: '1',
          account_opener_dob_month: '1',
          account_opener_dob_year: '',
          account_opener_email: user.profile.contactEmail,
          account_opener_first_name: user.profile.firstName,
          account_opener_last_name: user.profile.lastName,
          account_opener_phone: '456-789-0123',
          account_opener_relationship_executive: 'true',
          account_opener_relationship_title: 'Owner'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-account_opener_dob_year')
      })

      it('invalid posted account_opener_dob_year', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'AT',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-account-opener?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          account_opener_verification_document_back: TestHelper['success_id_scan_back.png'],
          account_opener_verification_document_front: TestHelper['success_id_scan_front.png']
        }
        const body = {
          account_opener_address_city: 'Vienna',
          account_opener_address_line1: '123 Sesame St',
          account_opener_address_postal_code: '1020',
          account_opener_address_state: '1',
          account_opener_dob_day: '1',
          account_opener_dob_month: '1',
          account_opener_dob_year: 'invalid',
          account_opener_email: user.profile.contactEmail,
          account_opener_first_name: user.profile.firstName,
          account_opener_last_name: user.profile.lastName,
          account_opener_phone: '456-789-0123',
          account_opener_relationship_executive: 'true',
          account_opener_relationship_title: 'Owner'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-account_opener_dob_year')
      })
    })

    describe('invalid-account_opener_first_name', () => {
      it('missing posted account_opener_first_name', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'AT',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-account-opener?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          account_opener_verification_document_back: TestHelper['success_id_scan_back.png'],
          account_opener_verification_document_front: TestHelper['success_id_scan_front.png']
        }
        const body = {
          account_opener_address_city: 'Vienna',
          account_opener_address_country: 'AT',
          account_opener_address_line1: '123 Sesame St',
          account_opener_address_postal_code: '1020',
          account_opener_address_state: '1',
          account_opener_dob_day: '1',
          account_opener_dob_month: '1',
          account_opener_dob_year: '1950',
          account_opener_email: user.profile.contactEmail,
          account_opener_first_name: '',
          account_opener_last_name: user.profile.lastName,
          account_opener_phone: '456-789-0123',
          account_opener_relationship_executive: 'true',
          account_opener_relationship_title: 'Owner'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-account_opener_first_name')
      })
    })

    describe('invalid-account_opener_last_name', () => {
      it('missing posted account_opener_last_name', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'AT',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-account-opener?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          account_opener_verification_document_back: TestHelper['success_id_scan_back.png'],
          account_opener_verification_document_front: TestHelper['success_id_scan_front.png']
        }
        const body = {
          account_opener_address_city: 'Vienna',
          account_opener_address_country: 'AT',
          account_opener_address_line1: '123 Sesame St',
          account_opener_address_postal_code: '1020',
          account_opener_address_state: '1',
          account_opener_dob_day: '1',
          account_opener_dob_month: '1',
          account_opener_dob_year: '1950',
          account_opener_email: user.profile.contactEmail,
          account_opener_first_name: user.profile.firstName,
          account_opener_last_name: '',
          account_opener_phone: '456-789-0123'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-account_opener_last_name')
      })
    })

    describe('invalid-account_opener_email', () => {
      it('missing posted account_opener_email', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'AT',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-account-opener?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          account_opener_verification_document_back: TestHelper['success_id_scan_back.png'],
          account_opener_verification_document_front: TestHelper['success_id_scan_front.png']
        }
        const body = {
          account_opener_address_city: 'Vienna',
          account_opener_address_country: 'AT',
          account_opener_address_line1: '123 Sesame St',
          account_opener_address_postal_code: '1020',
          account_opener_address_state: '1',
          account_opener_dob_day: '1',
          account_opener_dob_month: '1',
          account_opener_dob_year: '1950',
          account_opener_email: '',
          account_opener_first_name: user.profile.firstName,
          account_opener_last_name: user.profile.lastName,
          account_opener_phone: '456-789-0123',
          account_opener_relationship_executive: 'true',
          account_opener_relationship_title: 'Owner'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-account_opener_email')
      })
    })

    describe('invalid-account_opener_phone', () => {
      it('missing posted account_opener_phone', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'AT',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-account-opener?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          account_opener_verification_document_back: TestHelper['success_id_scan_back.png'],
          account_opener_verification_document_front: TestHelper['success_id_scan_front.png']
        }
        const body = {
          account_opener_address_city: 'Vienna',
          account_opener_address_country: 'AT',
          account_opener_address_line1: '123 Sesame St',
          account_opener_address_postal_code: '1020',
          account_opener_address_state: '1',
          account_opener_dob_day: '1',
          account_opener_dob_month: '1',
          account_opener_dob_year: '1950',
          account_opener_email: user.profile.contactEmail,
          account_opener_first_name: user.profile.firstName,
          account_opener_last_name: user.profile.lastName,
          account_opener_phone: '',
          account_opener_relationship_executive: 'true',
          account_opener_relationship_title: 'Owner'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-account_opener_phone')
      })
    })

    describe('invalid-account_opener_ssn_last_4', () => {
      it('missing posted account_opener_ssn_last_4', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'US',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-account-opener?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          account_opener_verification_document_back: TestHelper['success_id_scan_back.png'],
          account_opener_verification_document_front: TestHelper['success_id_scan_front.png']
        }
        const body = {
          account_opener_address_city: 'New York',
          account_opener_address_country: 'US',
          account_opener_address_line1: '285 Fulton St',
          account_opener_address_postal_code: '10007',
          account_opener_address_state: 'NY',
          account_opener_dob_day: '1',
          account_opener_dob_month: '1',
          account_opener_dob_year: '1950',
          account_opener_email: user.profile.contactEmail,
          account_opener_first_name: user.profile.firstName,
          account_opener_id_number: '000000000',
          account_opener_last_name: user.profile.lastName,
          account_opener_phone: '456-789-0123',
          account_opener_relationship_executive: 'true',
          account_opener_relationship_title: 'Owner',
          account_opener_ssn_last_4: ''
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-account_opener_ssn_last_4')
      })
    })

    describe('invalid-account_opener_address_line1', () => {
      it('missing posted account_opener_address_line1', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'US',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-account-opener?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          account_opener_verification_document_back: TestHelper['success_id_scan_back.png'],
          account_opener_verification_document_front: TestHelper['success_id_scan_front.png']
        }
        const body = {
          account_opener_address_city: 'New York',
          account_opener_address_country: 'US',
          account_opener_address_line1: '',
          account_opener_address_postal_code: '10007',
          account_opener_address_state: 'NY',
          account_opener_dob_day: '1',
          account_opener_dob_month: '1',
          account_opener_dob_year: '1950',
          account_opener_email: user.profile.contactEmail,
          account_opener_first_name: user.profile.firstName,
          account_opener_id_number: '000000000',
          account_opener_last_name: user.profile.lastName,
          account_opener_phone: '456-789-0123',
          account_opener_relationship_executive: 'true',
          account_opener_relationship_title: 'Owner',
          account_opener_ssn_last_4: '0000'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-account_opener_address_line1')
      })
    })

    describe('invalid-account_opener_address_city', () => {
      it('missing posted account_opener_address_city', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'US',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-account-opener?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          account_opener_verification_document_back: TestHelper['success_id_scan_back.png'],
          account_opener_verification_document_front: TestHelper['success_id_scan_front.png']
        }
        const body = {
          account_opener_address_city: '',
          account_opener_address_country: 'US',
          account_opener_address_line1: '285 Fulton St',
          account_opener_address_postal_code: '10007',
          account_opener_address_state: 'NY',
          account_opener_dob_day: '1',
          account_opener_dob_month: '1',
          account_opener_dob_year: '1950',
          account_opener_email: user.profile.contactEmail,
          account_opener_first_name: user.profile.firstName,
          account_opener_id_number: '000000000',
          account_opener_last_name: user.profile.lastName,
          account_opener_phone: '456-789-0123',
          account_opener_relationship_executive: 'true',
          account_opener_relationship_title: 'Owner',
          account_opener_ssn_last_4: '0000'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-account_opener_address_city')
      })
    })

    describe('invalid-account_opener_address_state', () => {
      it('missing posted account_opener_address_state', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'US',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-account-opener?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          account_opener_verification_document_back: TestHelper['success_id_scan_back.png'],
          account_opener_verification_document_front: TestHelper['success_id_scan_front.png']
        }
        const body = {
          account_opener_address_city: 'New York',
          account_opener_address_country: 'US',
          account_opener_address_line1: '285 Fulton St',
          account_opener_address_postal_code: '10007',
          account_opener_address_state: '',
          account_opener_dob_day: '1',
          account_opener_dob_month: '1',
          account_opener_dob_year: '1950',
          account_opener_email: user.profile.contactEmail,
          account_opener_first_name: user.profile.firstName,
          account_opener_id_number: '000000000',
          account_opener_last_name: user.profile.lastName,
          account_opener_phone: '456-789-0123',
          account_opener_relationship_executive: 'true',
          account_opener_relationship_title: 'Owner',
          account_opener_ssn_last_4: '0000'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-account_opener_address_state')
      })
    })

    describe('invalid-account_opener_address_country', () => {
      it('missing posted account_opener_address_country', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'US',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-account-opener?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          account_opener_verification_document_back: TestHelper['success_id_scan_back.png'],
          account_opener_verification_document_front: TestHelper['success_id_scan_front.png']
        }
        const body = {
          account_opener_address_city: 'New York',
          account_opener_address_country: '',
          account_opener_address_line1: '285 Fulton St',
          account_opener_address_postal_code: '10007',
          account_opener_address_state: 'NY',
          account_opener_dob_day: '1',
          account_opener_dob_month: '1',
          account_opener_dob_year: '1950',
          account_opener_email: user.profile.contactEmail,
          account_opener_first_name: user.profile.firstName,
          account_opener_id_number: '000000000',
          account_opener_last_name: user.profile.lastName,
          account_opener_phone: '456-789-0123',
          account_opener_relationship_executive: 'true',
          account_opener_relationship_title: 'Owner',
          account_opener_ssn_last_4: '0000'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-account_opener_address_country')
      })

      it('invalid-account_opener_address_country', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'US',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-account-opener?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          account_opener_verification_document_back: TestHelper['success_id_scan_back.png'],
          account_opener_verification_document_front: TestHelper['success_id_scan_front.png']
        }
        const body = {
          account_opener_address_city: 'New York',
          account_opener_address_country: 'invalid',
          account_opener_address_line1: '285 Fulton St',
          account_opener_address_postal_code: '10007',
          account_opener_address_state: 'NY',
          account_opener_dob_day: '1',
          account_opener_dob_month: '1',
          account_opener_dob_year: '1950',
          account_opener_email: user.profile.contactEmail,
          account_opener_first_name: user.profile.firstName,
          account_opener_id_number: '000000000',
          account_opener_last_name: user.profile.lastName,
          account_opener_phone: '456-789-0123',
          account_opener_relationship_executive: 'true',
          account_opener_relationship_title: 'Owner',
          account_opener_ssn_last_4: '0000'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-account_opener_address_country')
      })
    })

    describe('invalid-account_opener_address_postal_code', () => {
      it('missing posted account_opener_address_postal_code', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'US',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-account-opener?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          account_opener_verification_document_back: TestHelper['success_id_scan_back.png'],
          account_opener_verification_document_front: TestHelper['success_id_scan_front.png']
        }
        const body = {
          account_opener_address_city: 'New York',
          account_opener_address_country: 'US',
          account_opener_address_line1: '285 Fulton St',
          account_opener_address_postal_code: '',
          account_opener_address_state: 'NY',
          account_opener_dob_day: '1',
          account_opener_dob_month: '1',
          account_opener_dob_year: '1950',
          account_opener_email: user.profile.contactEmail,
          account_opener_first_name: user.profile.firstName,
          account_opener_id_number: '000000000',
          account_opener_last_name: user.profile.lastName,
          account_opener_phone: '456-789-0123',
          account_opener_relationship_executive: 'true',
          account_opener_relationship_title: 'Owner',
          account_opener_ssn_last_4: '0000'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-account_opener_address_postal_code')
      })
    })

    describe('invalid-account_opener_address_kana_postal_code', () => {
      it('missing posted account_opener_address_kana_postal_code', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'JP',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-account-opener?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          account_opener_verification_document_back: TestHelper['success_id_scan_back.png'],
          account_opener_verification_document_front: TestHelper['success_id_scan_front.png']
        }
        const body = {
          account_opener_address_kana_city: 'ｼﾌﾞﾔ',
          account_opener_address_kana_line1: '27-15',
          account_opener_address_kana_postal_code: '',
          account_opener_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          account_opener_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          account_opener_address_kanji_city: '渋谷区',
          account_opener_address_kanji_line1: '２７－１５',
          account_opener_address_kanji_postal_code: '1500001',
          account_opener_address_kanji_state: '東京都',
          account_opener_address_kanji_town: '神宮前　３丁目',
          account_opener_dob_day: '1',
          account_opener_dob_month: '1',
          account_opener_dob_year: '1950',
          account_opener_first_name_kana: 'ﾄｳｷﾖｳﾄ',
          account_opener_first_name_kanji: '東京都',
          account_opener_gender: 'female',
          account_opener_last_name_kana: 'ﾄｳｷﾖｳﾄ',
          account_opener_last_name_kanji: '東京都'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-account_opener_address_kana_postal_code')
      })
    })

    describe('invalid-account_opener_address_kana_city', () => {
      it('missing posted account_opener_address_kana_city', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'JP',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-account-opener?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          account_opener_verification_document_back: TestHelper['success_id_scan_back.png'],
          account_opener_verification_document_front: TestHelper['success_id_scan_front.png']
        }
        const body = {
          account_opener_address_kana_city: '',
          account_opener_address_kana_line1: '27-15',
          account_opener_address_kana_postal_code: '1500001',
          account_opener_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          account_opener_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          account_opener_address_kanji_city: '渋谷区',
          account_opener_address_kanji_line1: '２７－１５',
          account_opener_address_kanji_postal_code: '1500001',
          account_opener_address_kanji_state: '東京都',
          account_opener_address_kanji_town: '神宮前　３丁目',
          account_opener_dob_day: '1',
          account_opener_dob_month: '1',
          account_opener_dob_year: '1950',
          account_opener_first_name_kana: 'ﾄｳｷﾖｳﾄ',
          account_opener_first_name_kanji: '東京都',
          account_opener_gender: 'female',
          account_opener_last_name_kana: 'ﾄｳｷﾖｳﾄ',
          account_opener_last_name_kanji: '東京都'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-account_opener_address_kana_city')
      })
    })

    describe('invalid-account_opener_address_kana_state', () => {
      it('missing posted account_opener_address_kana_state', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'JP',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-account-opener?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          account_opener_verification_document_back: TestHelper['success_id_scan_back.png'],
          account_opener_verification_document_front: TestHelper['success_id_scan_front.png']
        }
        const body = {
          account_opener_address_kana_city: 'ｼﾌﾞﾔ',
          account_opener_address_kana_line1: '27-15',
          account_opener_address_kana_postal_code: '1500001',
          account_opener_address_kana_state: '',
          account_opener_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          account_opener_address_kanji_city: '渋谷区',
          account_opener_address_kanji_line1: '２７－１５',
          account_opener_address_kanji_postal_code: '1500001',
          account_opener_address_kanji_state: '東京都',
          account_opener_address_kanji_town: '神宮前　３丁目',
          account_opener_dob_day: '1',
          account_opener_dob_month: '1',
          account_opener_dob_year: '1950',
          account_opener_first_name_kana: 'ﾄｳｷﾖｳﾄ',
          account_opener_first_name_kanji: '東京都',
          account_opener_gender: 'female',
          account_opener_last_name_kana: 'ﾄｳｷﾖｳﾄ',
          account_opener_last_name_kanji: '東京都'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-account_opener_address_kana_state')
      })
    })

    describe('invalid-account_opener_address_kana_town', () => {
      it('missing posted account_opener_address_kana_town', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'JP',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-account-opener?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          account_opener_verification_document_back: TestHelper['success_id_scan_back.png'],
          account_opener_verification_document_front: TestHelper['success_id_scan_front.png']
        }
        const body = {
          account_opener_address_kana_city: 'ｼﾌﾞﾔ',
          account_opener_address_kana_line1: '27-15',
          account_opener_address_kana_postal_code: '1500001',
          account_opener_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          account_opener_address_kana_town: '',
          account_opener_address_kanji_city: '渋谷区',
          account_opener_address_kanji_line1: '２７－１５',
          account_opener_address_kanji_postal_code: '1500001',
          account_opener_address_kanji_state: '東京都',
          account_opener_address_kanji_town: '神宮前　３丁目',
          account_opener_dob_day: '1',
          account_opener_dob_month: '1',
          account_opener_dob_year: '1950',
          account_opener_first_name_kana: 'ﾄｳｷﾖｳﾄ',
          account_opener_first_name_kanji: '東京都',
          account_opener_gender: 'female',
          account_opener_last_name_kana: 'ﾄｳｷﾖｳﾄ',
          account_opener_last_name_kanji: '東京都'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-account_opener_address_kana_town')
      })
    })

    describe('invalid-account_opener_address_kana_line1', () => {
      it('missing posted account_opener_address_kana_line1', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'JP',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-account-opener?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          account_opener_verification_document_back: TestHelper['success_id_scan_back.png'],
          account_opener_verification_document_front: TestHelper['success_id_scan_front.png']
        }
        const body = {
          account_opener_address_kana_city: 'ｼﾌﾞﾔ',
          account_opener_address_kana_line1: '',
          account_opener_address_kana_postal_code: '1500001',
          account_opener_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          account_opener_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          account_opener_address_kanji_city: '渋谷区',
          account_opener_address_kanji_line1: '２７－１５',
          account_opener_address_kanji_postal_code: '1500001',
          account_opener_address_kanji_state: '東京都',
          account_opener_address_kanji_town: '神宮前　３丁目',
          account_opener_dob_day: '1',
          account_opener_dob_month: '1',
          account_opener_dob_year: '1950',
          account_opener_first_name_kana: 'ﾄｳｷﾖｳﾄ',
          account_opener_first_name_kanji: '東京都',
          account_opener_gender: 'female',
          account_opener_last_name_kana: 'ﾄｳｷﾖｳﾄ',
          account_opener_last_name_kanji: '東京都'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-account_opener_address_kana_line1')
      })
    })

    describe('invalid-account_opener_address_kanji_postal_code', () => {
      it('missing posted account_opener_address_kanji_postal_code', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'JP',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-account-opener?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          account_opener_verification_document_back: TestHelper['success_id_scan_back.png'],
          account_opener_verification_document_front: TestHelper['success_id_scan_front.png']
        }
        const body = {
          account_opener_address_kana_city: 'ｼﾌﾞﾔ',
          account_opener_address_kana_line1: '27-15',
          account_opener_address_kana_postal_code: '1500001',
          account_opener_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          account_opener_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          account_opener_address_kanji_city: '渋谷区',
          account_opener_address_kanji_line1: '２７－１５',
          account_opener_address_kanji_postal_code: '',
          account_opener_address_kanji_state: '東京都',
          account_opener_address_kanji_town: '神宮前　３丁目',
          account_opener_dob_day: '1',
          account_opener_dob_month: '1',
          account_opener_dob_year: '1950',
          account_opener_first_name_kana: 'ﾄｳｷﾖｳﾄ',
          account_opener_first_name_kanji: '東京都',
          account_opener_gender: 'female',
          account_opener_last_name_kana: 'ﾄｳｷﾖｳﾄ',
          account_opener_last_name_kanji: '東京都'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-account_opener_address_kanji_postal_code')
      })
    })

    describe('invalid-account_opener_address_kanji_city', () => {
      it('missing posted account_opener_address_kanji_city', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'JP',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-account-opener?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          account_opener_verification_document_back: TestHelper['success_id_scan_back.png'],
          account_opener_verification_document_front: TestHelper['success_id_scan_front.png']
        }
        const body = {
          account_opener_address_kana_city: 'ｼﾌﾞﾔ',
          account_opener_address_kana_line1: '27-15',
          account_opener_address_kana_postal_code: '1500001',
          account_opener_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          account_opener_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          account_opener_address_kanji_city: '',
          account_opener_address_kanji_line1: '２７－１５',
          account_opener_address_kanji_postal_code: '1500001',
          account_opener_address_kanji_state: '東京都',
          account_opener_address_kanji_town: '神宮前　３丁目',
          account_opener_dob_day: '1',
          account_opener_dob_month: '1',
          account_opener_dob_year: '1950',
          account_opener_first_name_kana: 'ﾄｳｷﾖｳﾄ',
          account_opener_first_name_kanji: '東京都',
          account_opener_gender: 'female',
          account_opener_last_name_kana: 'ﾄｳｷﾖｳﾄ',
          account_opener_last_name_kanji: '東京都'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-account_opener_address_kanji_city')
      })
    })

    describe('invalid-account_opener_address_kanji_state', () => {
      it('missing posted account_opener_address_kanji_state', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'JP',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-account-opener?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          account_opener_verification_document_back: TestHelper['success_id_scan_back.png'],
          account_opener_verification_document_front: TestHelper['success_id_scan_front.png']
        }
        const body = {
          account_opener_address_kana_city: 'ｼﾌﾞﾔ',
          account_opener_address_kana_line1: '27-15',
          account_opener_address_kana_postal_code: '1500001',
          account_opener_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          account_opener_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          account_opener_address_kanji_city: '渋谷区',
          account_opener_address_kanji_line1: '２７－１５',
          account_opener_address_kanji_postal_code: '1500001',
          account_opener_address_kanji_state: '',
          account_opener_address_kanji_town: '神宮前　３丁目',
          account_opener_dob_day: '1',
          account_opener_dob_month: '1',
          account_opener_dob_year: '1950',
          account_opener_first_name_kana: 'ﾄｳｷﾖｳﾄ',
          account_opener_first_name_kanji: '東京都',
          account_opener_gender: 'female',
          account_opener_last_name_kana: 'ﾄｳｷﾖｳﾄ',
          account_opener_last_name_kanji: '東京都'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-account_opener_address_kanji_state')
      })
    })

    describe('invalid-account_opener_address_kanji_town', () => {
      it('missing posted account_opener_address_kanji_town', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'JP',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-account-opener?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          account_opener_verification_document_back: TestHelper['success_id_scan_back.png'],
          account_opener_verification_document_front: TestHelper['success_id_scan_front.png']
        }
        const body = {
          account_opener_address_kana_city: 'ｼﾌﾞﾔ',
          account_opener_address_kana_line1: '27-15',
          account_opener_address_kana_postal_code: '1500001',
          account_opener_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          account_opener_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          account_opener_address_kanji_city: '渋谷区',
          account_opener_address_kanji_line1: '２７－１５',
          account_opener_address_kanji_postal_code: '1500001',
          account_opener_address_kanji_state: '東京都',
          account_opener_address_kanji_town: '',
          account_opener_dob_day: '1',
          account_opener_dob_month: '1',
          account_opener_dob_year: '1950',
          account_opener_first_name_kana: 'ﾄｳｷﾖｳﾄ',
          account_opener_first_name_kanji: '東京都',
          account_opener_gender: 'female',
          account_opener_last_name_kana: 'ﾄｳｷﾖｳﾄ',
          account_opener_last_name_kanji: '東京都'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-account_opener_address_kanji_town')
      })
    })

    describe('invalid-account_opener_address_kanji_line1', () => {
      it('missing posted account_opener_address_kanji_line1', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'JP',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-account-opener?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          account_opener_verification_document_back: TestHelper['success_id_scan_back.png'],
          account_opener_verification_document_front: TestHelper['success_id_scan_front.png']
        }
        const body = {
          account_opener_address_kana_city: 'ｼﾌﾞﾔ',
          account_opener_address_kana_line1: '27-15',
          account_opener_address_kana_postal_code: '1500001',
          account_opener_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          account_opener_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          account_opener_address_kanji_city: '渋谷区',
          account_opener_address_kanji_line1: '',
          account_opener_address_kanji_postal_code: '1500001',
          account_opener_address_kanji_state: '東京都',
          account_opener_address_kanji_town: '神宮前　３丁目',
          account_opener_dob_day: '1',
          account_opener_dob_month: '1',
          account_opener_dob_year: '1950',
          account_opener_first_name_kana: 'ﾄｳｷﾖｳﾄ',
          account_opener_first_name_kanji: '東京都',
          account_opener_gender: 'female',
          account_opener_last_name_kana: 'ﾄｳｷﾖｳﾄ',
          account_opener_last_name_kanji: '東京都'
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-account_opener_address_kanji_line1')
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
      const req = TestHelper.createRequest(`/api/user/connect/update-account-opener?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        account_opener_verification_document_back: TestHelper['success_id_scan_back.png'],
        account_opener_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const body = {
        account_opener_address_city: 'New York',
        account_opener_address_country: 'US',
        account_opener_address_line1: '285 Fulton St',
        account_opener_address_postal_code: '10007',
        account_opener_address_state: 'NY',
        account_opener_dob_day: '1',
        account_opener_dob_month: '1',
        account_opener_dob_year: '1950',
        account_opener_email: user.profile.contactEmail,
        account_opener_first_name: user.profile.firstName,
        account_opener_last_name: user.profile.lastName,
        account_opener_phone: '456-789-0123',
        account_opener_relationship_executive: 'true',
        account_opener_relationship_title: 'Owner',
        account_opener_ssn_last_4: '0000',
        token: 'token'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registration = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registration.representativeToken, 'token')
    })

    it('required posted account_opener_dob_day', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-account-opener?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        account_opener_verification_document_back: TestHelper['success_id_scan_back.png'],
        account_opener_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const body = {
        account_opener_address_city: 'New York',
        account_opener_address_country: 'US',
        account_opener_address_line1: '285 Fulton St',
        account_opener_address_postal_code: '10007',
        account_opener_address_state: 'NY',
        account_opener_dob_day: '7',
        account_opener_dob_month: '1',
        account_opener_dob_year: '1950',
        account_opener_email: user.profile.contactEmail,
        account_opener_first_name: user.profile.firstName,
        account_opener_last_name: user.profile.lastName,
        account_opener_phone: '456-789-0123',
        account_opener_relationship_executive: 'true',
        account_opener_relationship_title: 'Owner',
        account_opener_ssn_last_4: '0000'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registration = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registration.account_opener_dob_day, '07')
    })

    it('required posted account_opener_dob_month', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-account-opener?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        account_opener_verification_document_back: TestHelper['success_id_scan_back.png'],
        account_opener_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const body = {
        account_opener_address_city: 'New York',
        account_opener_address_country: 'US',
        account_opener_address_line1: '285 Fulton St',
        account_opener_address_postal_code: '10007',
        account_opener_address_state: 'NY',
        account_opener_dob_day: '7',
        account_opener_dob_month: '11',
        account_opener_dob_year: '1950',
        account_opener_email: user.profile.contactEmail,
        account_opener_first_name: user.profile.firstName,
        account_opener_last_name: user.profile.lastName,
        account_opener_phone: '456-789-0123',
        account_opener_relationship_executive: 'true',
        account_opener_relationship_title: 'Owner',
        account_opener_ssn_last_4: '0000'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registration = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registration.account_opener_dob_month, '11')
    })

    it('required posted account_opener_dob_year', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-account-opener?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        account_opener_verification_document_back: TestHelper['success_id_scan_back.png'],
        account_opener_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const body = {
        account_opener_address_city: 'New York',
        account_opener_address_country: 'US',
        account_opener_address_line1: '285 Fulton St',
        account_opener_address_postal_code: '10007',
        account_opener_address_state: 'NY',
        account_opener_dob_day: '7',
        account_opener_dob_month: '1',
        account_opener_dob_year: '1951',
        account_opener_email: user.profile.contactEmail,
        account_opener_first_name: user.profile.firstName,
        account_opener_last_name: user.profile.lastName,
        account_opener_phone: '456-789-0123',
        account_opener_relationship_executive: 'true',
        account_opener_relationship_title: 'Owner',
        account_opener_ssn_last_4: '0000'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registration = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registration.account_opener_dob_year, '1951')
    })

    it('optionally-required posted file account_opener_verification_document_front', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-account-opener?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        account_opener_verification_document_back: TestHelper['success_id_scan_back.png'],
        account_opener_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const body = {
        account_opener_address_city: 'New York',
        account_opener_address_country: 'US',
        account_opener_address_line1: '285 Fulton St',
        account_opener_address_postal_code: '10007',
        account_opener_address_state: 'NY',
        account_opener_dob_day: '7',
        account_opener_dob_month: '1',
        account_opener_dob_year: '1951',
        account_opener_email: user.profile.contactEmail,
        account_opener_first_name: user.profile.firstName,
        account_opener_last_name: user.profile.lastName,
        account_opener_phone: '456-789-0123',
        account_opener_relationship_executive: 'true',
        account_opener_relationship_title: 'Owner',
        account_opener_ssn_last_4: '0000'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registration = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.notStrictEqual(registration.account_opener_verification_document_front, null)
      assert.notStrictEqual(registration.account_opener_verification_document_front, undefined)
    })

    it('optionally-required posted file account_opener_verification_document_back', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-account-opener?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        account_opener_verification_document_back: TestHelper['success_id_scan_back.png'],
        account_opener_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const body = {
        account_opener_address_city: 'New York',
        account_opener_address_country: 'US',
        account_opener_address_line1: '285 Fulton St',
        account_opener_address_postal_code: '10007',
        account_opener_address_state: 'NY',
        account_opener_dob_day: '7',
        account_opener_dob_month: '1',
        account_opener_dob_year: '1951',
        account_opener_email: user.profile.contactEmail,
        account_opener_first_name: user.profile.firstName,
        account_opener_last_name: user.profile.lastName,
        account_opener_phone: '456-789-0123',
        account_opener_relationship_executive: 'true',
        account_opener_relationship_title: 'Owner',
        account_opener_ssn_last_4: '0000'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registration = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.notStrictEqual(registration.account_opener_verification_document_back, null)
      assert.notStrictEqual(registration.account_opener_verification_document_back, undefined)
    })

    it('optionally-required posted account_opener_first_name', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-account-opener?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        account_opener_verification_document_back: TestHelper['success_id_scan_back.png'],
        account_opener_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const body = {
        account_opener_address_city: 'New York',
        account_opener_address_country: 'US',
        account_opener_address_line1: '285 Fulton St',
        account_opener_address_postal_code: '10007',
        account_opener_address_state: 'NY',
        account_opener_dob_day: '7',
        account_opener_dob_month: '1',
        account_opener_dob_year: '1951',
        account_opener_email: user.profile.contactEmail,
        account_opener_first_name: user.profile.firstName,
        account_opener_last_name: user.profile.lastName,
        account_opener_phone: '456-789-0123',
        account_opener_relationship_executive: 'true',
        account_opener_relationship_title: 'Owner',
        account_opener_ssn_last_4: '0000'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registration = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registration.account_opener_first_name, user.profile.firstName)
    })

    it('optionally-required posted account_opener_last_name', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-account-opener?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        account_opener_verification_document_back: TestHelper['success_id_scan_back.png'],
        account_opener_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const body = {
        account_opener_address_city: 'New York',
        account_opener_address_country: 'US',
        account_opener_address_line1: '285 Fulton St',
        account_opener_address_postal_code: '10007',
        account_opener_address_state: 'NY',
        account_opener_dob_day: '7',
        account_opener_dob_month: '1',
        account_opener_dob_year: '1951',
        account_opener_email: user.profile.contactEmail,
        account_opener_first_name: user.profile.firstName,
        account_opener_last_name: user.profile.lastName,
        account_opener_phone: '456-789-0123',
        account_opener_relationship_executive: 'true',
        account_opener_relationship_title: 'Owner',
        account_opener_ssn_last_4: '0000'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registration = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registration.account_opener_last_name, user.profile.lastName)
    })

    it('optionally-required posted account_opener_email', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-account-opener?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        account_opener_verification_document_back: TestHelper['success_id_scan_back.png'],
        account_opener_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const body = {
        account_opener_address_city: 'New York',
        account_opener_address_country: 'US',
        account_opener_address_line1: '285 Fulton St',
        account_opener_address_postal_code: '10007',
        account_opener_address_state: 'NY',
        account_opener_dob_day: '7',
        account_opener_dob_month: '1',
        account_opener_dob_year: '1951',
        account_opener_email: user.profile.contactEmail,
        account_opener_first_name: user.profile.firstName,
        account_opener_last_name: user.profile.lastName,
        account_opener_phone: '456-789-0123',
        account_opener_relationship_executive: 'true',
        account_opener_relationship_title: 'Owner',
        account_opener_ssn_last_4: '0000'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registration = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registration.account_opener_email, user.profile.contactEmail)
    })

    it('optionally-required posted account_opener_phone', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-account-opener?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        account_opener_verification_document_back: TestHelper['success_id_scan_back.png'],
        account_opener_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const body = {
        account_opener_address_city: 'New York',
        account_opener_address_country: 'US',
        account_opener_address_line1: '285 Fulton St',
        account_opener_address_postal_code: '10007',
        account_opener_address_state: 'NY',
        account_opener_dob_day: '7',
        account_opener_dob_month: '1',
        account_opener_dob_year: '1951',
        account_opener_email: user.profile.contactEmail,
        account_opener_first_name: user.profile.firstName,
        account_opener_last_name: user.profile.lastName,
        account_opener_phone: '456-789-0123',
        account_opener_relationship_executive: 'true',
        account_opener_relationship_title: 'Owner',
        account_opener_ssn_last_4: '0000'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registration = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registration.account_opener_phone, '456-789-0123')
    })

    it('optionally-required posted account_opener_gender', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'JP',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-account-opener?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        account_opener_verification_document_back: TestHelper['success_id_scan_back.png'],
        account_opener_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const body = {
        account_opener_address_kana_city: 'ｼﾌﾞﾔ',
        account_opener_address_kana_line1: '27-15',
        account_opener_address_kana_postal_code: '1500001',
        account_opener_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        account_opener_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        account_opener_address_kanji_city: '渋谷区',
        account_opener_address_kanji_line1: '２７－１５',
        account_opener_address_kanji_postal_code: '1500001',
        account_opener_address_kanji_state: '東京都',
        account_opener_address_kanji_town: '神宮前　３丁目',
        account_opener_dob_day: '1',
        account_opener_dob_month: '1',
        account_opener_dob_year: '1950',
        account_opener_email: user.profile.contactEmail,
        account_opener_first_name_kana: 'ﾄｳｷﾖｳﾄ',
        account_opener_first_name_kanji: '東京都',
        account_opener_gender: 'female',
        account_opener_last_name_kana: 'ﾄｳｷﾖｳﾄ',
        account_opener_last_name_kanji: '東京都',
        account_opener_phone: '456-789-0123',
        account_opener_relationship_executive: 'true',
        account_opener_relationship_title: 'Owner'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registration = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registration.account_opener_gender, 'female')
    })

    it('optionally-required posted account_opener_ssn_last_4', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-account-opener?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        account_opener_verification_document_back: TestHelper['success_id_scan_back.png'],
        account_opener_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const body = {
        account_opener_address_city: 'New York',
        account_opener_address_country: 'US',
        account_opener_address_line1: '285 Fulton St',
        account_opener_address_postal_code: '10007',
        account_opener_address_state: 'NY',
        account_opener_dob_day: '7',
        account_opener_dob_month: '1',
        account_opener_dob_year: '1951',
        account_opener_email: user.profile.contactEmail,
        account_opener_first_name: user.profile.firstName,
        account_opener_last_name: user.profile.lastName,
        account_opener_phone: '456-789-0123',
        account_opener_relationship_executive: 'true',
        account_opener_relationship_title: 'Owner',
        account_opener_ssn_last_4: '0000'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registration = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registration.account_opener_ssn_last_4, '0000')
    })

    it('optionally-required posted account_opener_id_number', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'CA',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-account-opener?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        account_opener_verification_document_back: TestHelper['success_id_scan_back.png'],
        account_opener_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const body = {
        account_opener_address_city: 'Vancouver',
        account_opener_address_country: 'CA',
        account_opener_address_line1: '123 Sesame St',
        account_opener_address_postal_code: 'V5K 0A1',
        account_opener_address_state: 'BC',
        account_opener_dob_day: '1',
        account_opener_dob_month: '1',
        account_opener_dob_year: '1950',
        account_opener_email: user.profile.contactEmail,
        account_opener_first_name: user.profile.firstName,
        account_opener_id_number: '000000000',
        account_opener_last_name: user.profile.lastName,
        account_opener_phone: '456-789-0123',
        account_opener_relationship_executive: 'true',
        account_opener_relationship_title: 'Owner'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registration = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registration.account_opener_id_number, '000000000')
    })

    it('optionally-required posted account_opener_address_city', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-account-opener?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        account_opener_verification_document_back: TestHelper['success_id_scan_back.png'],
        account_opener_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const body = {
        account_opener_address_city: 'New York',
        account_opener_address_country: 'US',
        account_opener_address_line1: '285 Fulton St',
        account_opener_address_postal_code: '10007',
        account_opener_address_state: 'NY',
        account_opener_dob_day: '7',
        account_opener_dob_month: '1',
        account_opener_dob_year: '1951',
        account_opener_email: user.profile.contactEmail,
        account_opener_first_name: user.profile.firstName,
        account_opener_last_name: user.profile.lastName,
        account_opener_phone: '456-789-0123',
        account_opener_relationship_executive: 'true',
        account_opener_relationship_title: 'Owner',
        account_opener_ssn_last_4: '0000'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registration = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registration.account_opener_address_city, 'New York')
    })

    it('optionally-required posted account_opener_address_state', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-account-opener?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        account_opener_verification_document_back: TestHelper['success_id_scan_back.png'],
        account_opener_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const body = {
        account_opener_address_city: 'New York',
        account_opener_address_country: 'US',
        account_opener_address_line1: '285 Fulton St',
        account_opener_address_postal_code: '10007',
        account_opener_address_state: 'NY',
        account_opener_dob_day: '7',
        account_opener_dob_month: '1',
        account_opener_dob_year: '1951',
        account_opener_email: user.profile.contactEmail,
        account_opener_first_name: user.profile.firstName,
        account_opener_last_name: user.profile.lastName,
        account_opener_phone: '456-789-0123',
        account_opener_relationship_executive: 'true',
        account_opener_relationship_title: 'Owner',
        account_opener_ssn_last_4: '0000'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registration = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registration.account_opener_address_state, 'NY')
    })

    it('optionally-required posted account_opener_address_postal_code', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-account-opener?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        account_opener_verification_document_back: TestHelper['success_id_scan_back.png'],
        account_opener_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const body = {
        account_opener_address_city: 'New York',
        account_opener_address_country: 'US',
        account_opener_address_line1: '285 Fulton St',
        account_opener_address_postal_code: '10007',
        account_opener_address_state: 'NY',
        account_opener_dob_day: '7',
        account_opener_dob_month: '1',
        account_opener_dob_year: '1951',
        account_opener_email: user.profile.contactEmail,
        account_opener_first_name: user.profile.firstName,
        account_opener_last_name: user.profile.lastName,
        account_opener_phone: '456-789-0123',
        account_opener_relationship_executive: 'true',
        account_opener_relationship_title: 'Owner',
        account_opener_ssn_last_4: '0000'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registration = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registration.account_opener_address_postal_code, '10007')
    })

    it('optionally-required posted account_opener_address_country', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-account-opener?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        account_opener_verification_document_back: TestHelper['success_id_scan_back.png'],
        account_opener_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const body = {
        account_opener_address_city: 'New York',
        account_opener_address_country: 'US',
        account_opener_address_line1: '285 Fulton St',
        account_opener_address_postal_code: '10007',
        account_opener_address_state: 'NY',
        account_opener_dob_day: '7',
        account_opener_dob_month: '1',
        account_opener_dob_year: '1951',
        account_opener_email: user.profile.contactEmail,
        account_opener_first_name: user.profile.firstName,
        account_opener_last_name: user.profile.lastName,
        account_opener_phone: '456-789-0123',
        account_opener_relationship_executive: 'true',
        account_opener_relationship_title: 'Owner',
        account_opener_ssn_last_4: '0000'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registration = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registration.account_opener_address_country, 'US')
    })

    it('optionally-required posted account_opener_address_line1', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-account-opener?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        account_opener_verification_document_back: TestHelper['success_id_scan_back.png'],
        account_opener_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const body = {
        account_opener_address_city: 'New York',
        account_opener_address_country: 'US',
        account_opener_address_line1: '285 Fulton St',
        account_opener_address_postal_code: '10007',
        account_opener_address_state: 'NY',
        account_opener_dob_day: '7',
        account_opener_dob_month: '1',
        account_opener_dob_year: '1951',
        account_opener_email: user.profile.contactEmail,
        account_opener_first_name: user.profile.firstName,
        account_opener_last_name: user.profile.lastName,
        account_opener_phone: '456-789-0123',
        account_opener_relationship_executive: 'true',
        account_opener_relationship_title: 'Owner',
        account_opener_ssn_last_4: '0000'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registration = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registration.account_opener_address_line1, '285 Fulton St')
    })

    it('optional posted account_opener_address_line2', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-account-opener?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        account_opener_verification_document_back: TestHelper['success_id_scan_back.png'],
        account_opener_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const body = {
        account_opener_address_city: 'New York',
        account_opener_address_country: 'US',
        account_opener_address_line1: '285 Fulton St',
        account_opener_address_line2: 'Another detail',
        account_opener_address_postal_code: '10007',
        account_opener_address_state: 'NY',
        account_opener_dob_day: '7',
        account_opener_dob_month: '1',
        account_opener_dob_year: '1951',
        account_opener_email: user.profile.contactEmail,
        account_opener_first_name: user.profile.firstName,
        account_opener_last_name: user.profile.lastName,
        account_opener_phone: '456-789-0123',
        account_opener_relationship_executive: 'true',
        account_opener_relationship_title: 'Owner',
        account_opener_ssn_last_4: '0000'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registration = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registration.account_opener_address_line2, 'Another detail')
    })

    it('optional posted account_opener_percent_ownership', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'CA',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-account-opener?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        account_opener_verification_document_back: TestHelper['success_id_scan_back.png'],
        account_opener_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const body = {
        account_opener_address_city: 'Vancouver',
        account_opener_address_country: 'CA',
        account_opener_address_line1: '123 Sesame St',
        account_opener_address_postal_code: 'V5K 0A1',
        account_opener_address_state: 'BC',
        account_opener_dob_day: '1',
        account_opener_dob_month: '1',
        account_opener_dob_year: '1950',
        account_opener_email: user.profile.contactEmail,
        account_opener_first_name: user.profile.firstName,
        account_opener_id_number: '000000000',
        account_opener_last_name: user.profile.lastName,
        account_opener_percent_ownership: 100,
        account_opener_phone: '456-789-0123',
        account_opener_relationship_executive: 'true',
        account_opener_relationship_title: 'Owner'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registration = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registration.account_opener_percent_ownership, '100')
    })

    it('optional posted account_opener_relationship_title', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'CA',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-account-opener?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        account_opener_verification_document_back: TestHelper['success_id_scan_back.png'],
        account_opener_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const body = {
        account_opener_address_city: 'Vancouver',
        account_opener_address_country: 'CA',
        account_opener_address_line1: '123 Sesame St',
        account_opener_address_postal_code: 'V5K 0A1',
        account_opener_address_state: 'BC',
        account_opener_dob_day: '1',
        account_opener_dob_month: '1',
        account_opener_dob_year: '1950',
        account_opener_email: user.profile.contactEmail,
        account_opener_first_name: user.profile.firstName,
        account_opener_id_number: '000000000',
        account_opener_last_name: user.profile.lastName,
        account_opener_percent_ownership: 100,
        account_opener_phone: '456-789-0123',
        account_opener_relationship_executive: 'true',
        account_opener_relationship_title: 'Owner'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registration = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registration.account_opener_relationship_title, 'Owner')
    })

    it('optional posted account_opener_relationship_director', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'CA',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-account-opener?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        account_opener_verification_document_back: TestHelper['success_id_scan_back.png'],
        account_opener_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const body = {
        account_opener_address_city: 'Vancouver',
        account_opener_address_country: 'CA',
        account_opener_address_line1: '123 Sesame St',
        account_opener_address_postal_code: 'V5K 0A1',
        account_opener_address_state: 'BC',
        account_opener_dob_day: '1',
        account_opener_dob_month: '1',
        account_opener_dob_year: '1950',
        account_opener_email: user.profile.contactEmail,
        account_opener_first_name: user.profile.firstName,
        account_opener_id_number: '000000000',
        account_opener_last_name: user.profile.lastName,
        account_opener_percent_ownership: 100,
        account_opener_phone: '456-789-0123',
        account_opener_relationship_director: 'true',
        account_opener_relationship_title: 'Owner'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registration = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registration.account_opener_relationship_director, true)
    })

    it('optional posted account_opener_relationship_executive', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'CA',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-account-opener?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        account_opener_verification_document_back: TestHelper['success_id_scan_back.png'],
        account_opener_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const body = {
        account_opener_address_city: 'Vancouver',
        account_opener_address_country: 'CA',
        account_opener_address_line1: '123 Sesame St',
        account_opener_address_postal_code: 'V5K 0A1',
        account_opener_address_state: 'BC',
        account_opener_dob_day: '1',
        account_opener_dob_month: '1',
        account_opener_dob_year: '1950',
        account_opener_email: user.profile.contactEmail,
        account_opener_first_name: user.profile.firstName,
        account_opener_id_number: '000000000',
        account_opener_last_name: user.profile.lastName,
        account_opener_percent_ownership: 100,
        account_opener_phone: '456-789-0123',
        account_opener_relationship_executive: 'true',
        account_opener_relationship_title: 'Owner'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registration = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registration.account_opener_relationship_executive, true)
    })

    it('optionally-required posted account_opener_first_name_kana', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'JP',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-account-opener?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        account_opener_verification_document_back: TestHelper['success_id_scan_back.png'],
        account_opener_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const body = {
        account_opener_address_kana_city: 'ｼﾌﾞﾔ',
        account_opener_address_kana_line1: '27-15',
        account_opener_address_kana_postal_code: '1500001',
        account_opener_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        account_opener_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        account_opener_address_kanji_city: '渋谷区',
        account_opener_address_kanji_line1: '２７－１５',
        account_opener_address_kanji_postal_code: '1500001',
        account_opener_address_kanji_state: '東京都',
        account_opener_address_kanji_town: '神宮前　３丁目',
        account_opener_dob_day: '1',
        account_opener_dob_month: '1',
        account_opener_dob_year: '1950',
        account_opener_email: user.profile.contactEmail,
        account_opener_first_name_kana: 'ﾄｳｷﾖｳﾄ',
        account_opener_first_name_kanji: '東京都',
        account_opener_gender: 'female',
        account_opener_last_name_kana: 'ﾄｳｷﾖｳﾄ',
        account_opener_last_name_kanji: '東京都',
        account_opener_phone: '456-789-0123',
        account_opener_relationship_executive: 'true',
        account_opener_relationship_title: 'Owner'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registration = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registration.account_opener_address_kanji_line1, '２７－１５')
    })

    it('optionally-required posted account_opener_last_name_kana', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'JP',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-account-opener?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        account_opener_verification_document_back: TestHelper['success_id_scan_back.png'],
        account_opener_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const body = {
        account_opener_address_kana_city: 'ｼﾌﾞﾔ',
        account_opener_address_kana_line1: '27-15',
        account_opener_address_kana_postal_code: '1500001',
        account_opener_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        account_opener_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        account_opener_address_kanji_city: '渋谷区',
        account_opener_address_kanji_line1: '２７－１５',
        account_opener_address_kanji_postal_code: '1500001',
        account_opener_address_kanji_state: '東京都',
        account_opener_address_kanji_town: '神宮前　３丁目',
        account_opener_dob_day: '1',
        account_opener_dob_month: '1',
        account_opener_dob_year: '1950',
        account_opener_email: user.profile.contactEmail,
        account_opener_first_name_kana: 'ﾄｳｷﾖｳﾄ',
        account_opener_first_name_kanji: '東京都',
        account_opener_gender: 'female',
        account_opener_last_name_kana: 'ﾄｳｷﾖｳﾄ',
        account_opener_last_name_kanji: '東京都',
        account_opener_phone: '456-789-0123',
        account_opener_relationship_executive: 'true',
        account_opener_relationship_title: 'Owner'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registration = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registration.account_opener_last_name_kana, 'ﾄｳｷﾖｳﾄ')
    })

    it('optionally-required posted account_opener_address_kana_city', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'JP',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-account-opener?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        account_opener_verification_document_back: TestHelper['success_id_scan_back.png'],
        account_opener_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const body = {
        account_opener_address_kana_city: 'ｼﾌﾞﾔ',
        account_opener_address_kana_line1: '27-15',
        account_opener_address_kana_postal_code: '1500001',
        account_opener_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        account_opener_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        account_opener_address_kanji_city: '渋谷区',
        account_opener_address_kanji_line1: '２７－１５',
        account_opener_address_kanji_postal_code: '1500001',
        account_opener_address_kanji_state: '東京都',
        account_opener_address_kanji_town: '神宮前　３丁目',
        account_opener_dob_day: '1',
        account_opener_dob_month: '1',
        account_opener_dob_year: '1950',
        account_opener_email: user.profile.contactEmail,
        account_opener_first_name_kana: 'ﾄｳｷﾖｳﾄ',
        account_opener_first_name_kanji: '東京都',
        account_opener_gender: 'female',
        account_opener_last_name_kana: 'ﾄｳｷﾖｳﾄ',
        account_opener_last_name_kanji: '東京都',
        account_opener_phone: '456-789-0123',
        account_opener_relationship_executive: 'true',
        account_opener_relationship_title: 'Owner'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registration = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registration.account_opener_address_kana_city, 'ｼﾌﾞﾔ')
    })

    it('optionally-required posted account_opener_address_kana_state', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'JP',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-account-opener?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        account_opener_verification_document_back: TestHelper['success_id_scan_back.png'],
        account_opener_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const body = {
        account_opener_address_kana_city: 'ｼﾌﾞﾔ',
        account_opener_address_kana_line1: '27-15',
        account_opener_address_kana_postal_code: '1500001',
        account_opener_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        account_opener_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        account_opener_address_kanji_city: '渋谷区',
        account_opener_address_kanji_line1: '２７－１５',
        account_opener_address_kanji_postal_code: '1500001',
        account_opener_address_kanji_state: '東京都',
        account_opener_address_kanji_town: '神宮前　３丁目',
        account_opener_dob_day: '1',
        account_opener_dob_month: '1',
        account_opener_dob_year: '1950',
        account_opener_email: user.profile.contactEmail,
        account_opener_first_name_kana: 'ﾄｳｷﾖｳﾄ',
        account_opener_first_name_kanji: '東京都',
        account_opener_gender: 'female',
        account_opener_last_name_kana: 'ﾄｳｷﾖｳﾄ',
        account_opener_last_name_kanji: '東京都',
        account_opener_phone: '456-789-0123',
        account_opener_relationship_executive: 'true',
        account_opener_relationship_title: 'Owner'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registration = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registration.account_opener_address_kana_state, 'ﾄｳｷﾖｳﾄ')
    })

    it('optionally-required posted account_opener_address_kana_postal_code', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'JP',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-account-opener?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        account_opener_verification_document_back: TestHelper['success_id_scan_back.png'],
        account_opener_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const body = {
        account_opener_address_kana_city: 'ｼﾌﾞﾔ',
        account_opener_address_kana_line1: '27-15',
        account_opener_address_kana_postal_code: '1500001',
        account_opener_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        account_opener_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        account_opener_address_kanji_city: '渋谷区',
        account_opener_address_kanji_line1: '２７－１５',
        account_opener_address_kanji_postal_code: '1500001',
        account_opener_address_kanji_state: '東京都',
        account_opener_address_kanji_town: '神宮前　３丁目',
        account_opener_dob_day: '1',
        account_opener_dob_month: '1',
        account_opener_dob_year: '1950',
        account_opener_email: user.profile.contactEmail,
        account_opener_first_name_kana: 'ﾄｳｷﾖｳﾄ',
        account_opener_first_name_kanji: '東京都',
        account_opener_gender: 'female',
        account_opener_last_name_kana: 'ﾄｳｷﾖｳﾄ',
        account_opener_last_name_kanji: '東京都',
        account_opener_phone: '456-789-0123',
        account_opener_relationship_executive: 'true',
        account_opener_relationship_title: 'Owner'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registration = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registration.account_opener_address_kana_postal_code, '1500001')
    })

    it('optionally-required posted account_opener_address_kana_town', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'JP',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-account-opener?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        account_opener_verification_document_back: TestHelper['success_id_scan_back.png'],
        account_opener_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const body = {
        account_opener_address_kana_city: 'ｼﾌﾞﾔ',
        account_opener_address_kana_line1: '27-15',
        account_opener_address_kana_postal_code: '1500001',
        account_opener_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        account_opener_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        account_opener_address_kanji_city: '渋谷区',
        account_opener_address_kanji_line1: '２７－１５',
        account_opener_address_kanji_postal_code: '1500001',
        account_opener_address_kanji_state: '東京都',
        account_opener_address_kanji_town: '神宮前　３丁目',
        account_opener_dob_day: '1',
        account_opener_dob_month: '1',
        account_opener_dob_year: '1950',
        account_opener_email: user.profile.contactEmail,
        account_opener_first_name_kana: 'ﾄｳｷﾖｳﾄ',
        account_opener_first_name_kanji: '東京都',
        account_opener_gender: 'female',
        account_opener_last_name_kana: 'ﾄｳｷﾖｳﾄ',
        account_opener_last_name_kanji: '東京都',
        account_opener_phone: '456-789-0123',
        account_opener_relationship_executive: 'true',
        account_opener_relationship_title: 'Owner'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registration = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registration.account_opener_address_kana_town, 'ｼﾞﾝｸﾞｳﾏｴ 3-')
    })

    it('optionally-required posted account_opener_address_kana_line1', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'JP',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-account-opener?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        account_opener_verification_document_back: TestHelper['success_id_scan_back.png'],
        account_opener_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const body = {
        account_opener_address_kana_city: 'ｼﾌﾞﾔ',
        account_opener_address_kana_line1: '27-15',
        account_opener_address_kana_postal_code: '1500001',
        account_opener_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        account_opener_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        account_opener_address_kanji_city: '渋谷区',
        account_opener_address_kanji_line1: '２７－１５',
        account_opener_address_kanji_postal_code: '1500001',
        account_opener_address_kanji_state: '東京都',
        account_opener_address_kanji_town: '神宮前　３丁目',
        account_opener_dob_day: '1',
        account_opener_dob_month: '1',
        account_opener_dob_year: '1950',
        account_opener_email: user.profile.contactEmail,
        account_opener_first_name_kana: 'ﾄｳｷﾖｳﾄ',
        account_opener_first_name_kanji: '東京都',
        account_opener_gender: 'female',
        account_opener_last_name_kana: 'ﾄｳｷﾖｳﾄ',
        account_opener_last_name_kanji: '東京都',
        account_opener_phone: '456-789-0123',
        account_opener_relationship_executive: 'true',
        account_opener_relationship_title: 'Owner'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registration = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registration.account_opener_address_kana_line1, '27-15')
    })

    it('optionally-required posted account_opener_first_name_kanji', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'JP',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-account-opener?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        account_opener_verification_document_back: TestHelper['success_id_scan_back.png'],
        account_opener_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const body = {
        account_opener_address_kana_city: 'ｼﾌﾞﾔ',
        account_opener_address_kana_line1: '27-15',
        account_opener_address_kana_postal_code: '1500001',
        account_opener_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        account_opener_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        account_opener_address_kanji_city: '渋谷区',
        account_opener_address_kanji_line1: '２７－１５',
        account_opener_address_kanji_postal_code: '1500001',
        account_opener_address_kanji_state: '東京都',
        account_opener_address_kanji_town: '神宮前　３丁目',
        account_opener_dob_day: '1',
        account_opener_dob_month: '1',
        account_opener_dob_year: '1950',
        account_opener_email: user.profile.contactEmail,
        account_opener_first_name_kana: 'ﾄｳｷﾖｳﾄ',
        account_opener_first_name_kanji: '東京都',
        account_opener_gender: 'female',
        account_opener_last_name_kana: 'ﾄｳｷﾖｳﾄ',
        account_opener_last_name_kanji: '東京都',
        account_opener_phone: '456-789-0123',
        account_opener_relationship_executive: 'true',
        account_opener_relationship_title: 'Owner'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registration = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registration.account_opener_first_name_kanji, '東京都')
    })

    it('optionally-required posted account_opener_last_name_kanji', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'JP',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-account-opener?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        account_opener_verification_document_back: TestHelper['success_id_scan_back.png'],
        account_opener_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const body = {
        account_opener_address_kana_city: 'ｼﾌﾞﾔ',
        account_opener_address_kana_line1: '27-15',
        account_opener_address_kana_postal_code: '1500001',
        account_opener_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        account_opener_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        account_opener_address_kanji_city: '渋谷区',
        account_opener_address_kanji_line1: '２７－１５',
        account_opener_address_kanji_postal_code: '1500001',
        account_opener_address_kanji_state: '東京都',
        account_opener_address_kanji_town: '神宮前　３丁目',
        account_opener_dob_day: '1',
        account_opener_dob_month: '1',
        account_opener_dob_year: '1950',
        account_opener_email: user.profile.contactEmail,
        account_opener_first_name_kana: 'ﾄｳｷﾖｳﾄ',
        account_opener_first_name_kanji: '東京都',
        account_opener_gender: 'female',
        account_opener_last_name_kana: 'ﾄｳｷﾖｳﾄ',
        account_opener_last_name_kanji: '東京都',
        account_opener_phone: '456-789-0123',
        account_opener_relationship_executive: 'true',
        account_opener_relationship_title: 'Owner'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registration = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registration.account_opener_last_name_kanji, '東京都')
    })

    it('optionally-required posted account_opener_address_kanji_city', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'JP',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-account-opener?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        account_opener_verification_document_back: TestHelper['success_id_scan_back.png'],
        account_opener_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const body = {
        account_opener_address_kana_city: 'ｼﾌﾞﾔ',
        account_opener_address_kana_line1: '27-15',
        account_opener_address_kana_postal_code: '1500001',
        account_opener_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        account_opener_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        account_opener_address_kanji_city: '渋谷区',
        account_opener_address_kanji_line1: '２７－１５',
        account_opener_address_kanji_postal_code: '1500001',
        account_opener_address_kanji_state: '東京都',
        account_opener_address_kanji_town: '神宮前　３丁目',
        account_opener_dob_day: '1',
        account_opener_dob_month: '1',
        account_opener_dob_year: '1950',
        account_opener_email: user.profile.contactEmail,
        account_opener_first_name_kana: 'ﾄｳｷﾖｳﾄ',
        account_opener_first_name_kanji: '東京都',
        account_opener_gender: 'female',
        account_opener_last_name_kana: 'ﾄｳｷﾖｳﾄ',
        account_opener_last_name_kanji: '東京都',
        account_opener_phone: '456-789-0123',
        account_opener_relationship_executive: 'true',
        account_opener_relationship_title: 'Owner'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registration = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registration.account_opener_address_kanji_city, '渋谷区')
    })

    it('optionally-required posted account_opener_address_kanji_state', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'JP',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-account-opener?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        account_opener_verification_document_back: TestHelper['success_id_scan_back.png'],
        account_opener_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const body = {
        account_opener_address_kana_city: 'ｼﾌﾞﾔ',
        account_opener_address_kana_line1: '27-15',
        account_opener_address_kana_postal_code: '1500001',
        account_opener_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        account_opener_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        account_opener_address_kanji_city: '渋谷区',
        account_opener_address_kanji_line1: '２７－１５',
        account_opener_address_kanji_postal_code: '1500001',
        account_opener_address_kanji_state: '東京都',
        account_opener_address_kanji_town: '神宮前　３丁目',
        account_opener_dob_day: '1',
        account_opener_dob_month: '1',
        account_opener_dob_year: '1950',
        account_opener_email: user.profile.contactEmail,
        account_opener_first_name_kana: 'ﾄｳｷﾖｳﾄ',
        account_opener_first_name_kanji: '東京都',
        account_opener_gender: 'female',
        account_opener_last_name_kana: 'ﾄｳｷﾖｳﾄ',
        account_opener_last_name_kanji: '東京都',
        account_opener_phone: '456-789-0123',
        account_opener_relationship_executive: 'true',
        account_opener_relationship_title: 'Owner'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registration = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registration.account_opener_address_kanji_state, '東京都')
    })

    it('optionally-required posted account_opener_address_kanji_postal_code', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'JP',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-account-opener?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        account_opener_verification_document_back: TestHelper['success_id_scan_back.png'],
        account_opener_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const body = {
        account_opener_address_kana_city: 'ｼﾌﾞﾔ',
        account_opener_address_kana_line1: '27-15',
        account_opener_address_kana_postal_code: '1500001',
        account_opener_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        account_opener_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        account_opener_address_kanji_city: '渋谷区',
        account_opener_address_kanji_line1: '２７－１５',
        account_opener_address_kanji_postal_code: '1500001',
        account_opener_address_kanji_state: '東京都',
        account_opener_address_kanji_town: '神宮前　３丁目',
        account_opener_dob_day: '1',
        account_opener_dob_month: '1',
        account_opener_dob_year: '1950',
        account_opener_email: user.profile.contactEmail,
        account_opener_first_name_kana: 'ﾄｳｷﾖｳﾄ',
        account_opener_first_name_kanji: '東京都',
        account_opener_gender: 'female',
        account_opener_last_name_kana: 'ﾄｳｷﾖｳﾄ',
        account_opener_last_name_kanji: '東京都',
        account_opener_phone: '456-789-0123',
        account_opener_relationship_executive: 'true',
        account_opener_relationship_title: 'Owner'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registration = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registration.account_opener_address_kanji_postal_code, '1500001')
    })

    it('optionally-required posted account_opener_address_kanji_town', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'JP',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-account-opener?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        account_opener_verification_document_back: TestHelper['success_id_scan_back.png'],
        account_opener_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const body = {
        account_opener_address_kana_city: 'ｼﾌﾞﾔ',
        account_opener_address_kana_line1: '27-15',
        account_opener_address_kana_postal_code: '1500001',
        account_opener_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        account_opener_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        account_opener_address_kanji_city: '渋谷区',
        account_opener_address_kanji_line1: '２７－１５',
        account_opener_address_kanji_postal_code: '1500001',
        account_opener_address_kanji_state: '東京都',
        account_opener_address_kanji_town: '神宮前　３丁目',
        account_opener_dob_day: '1',
        account_opener_dob_month: '1',
        account_opener_dob_year: '1950',
        account_opener_email: user.profile.contactEmail,
        account_opener_first_name_kana: 'ﾄｳｷﾖｳﾄ',
        account_opener_first_name_kanji: '東京都',
        account_opener_gender: 'female',
        account_opener_last_name_kana: 'ﾄｳｷﾖｳﾄ',
        account_opener_last_name_kanji: '東京都',
        account_opener_phone: '456-789-0123',
        account_opener_relationship_executive: 'true',
        account_opener_relationship_title: 'Owner'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registration = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registration.account_opener_address_kanji_town, '神宮前　３丁目')
    })

    it('optionally-required posted account_opener_address_kanji_line1', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'JP',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-account-opener?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        account_opener_verification_document_back: TestHelper['success_id_scan_back.png'],
        account_opener_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const body = {
        account_opener_address_kana_city: 'ｼﾌﾞﾔ',
        account_opener_address_kana_line1: '27-15',
        account_opener_address_kana_postal_code: '1500001',
        account_opener_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        account_opener_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        account_opener_address_kanji_city: '渋谷区',
        account_opener_address_kanji_line1: '２７－１５',
        account_opener_address_kanji_postal_code: '1500001',
        account_opener_address_kanji_state: '東京都',
        account_opener_address_kanji_town: '神宮前　３丁目',
        account_opener_dob_day: '1',
        account_opener_dob_month: '1',
        account_opener_dob_year: '1950',
        account_opener_email: user.profile.contactEmail,
        account_opener_first_name_kana: 'ﾄｳｷﾖｳﾄ',
        account_opener_first_name_kanji: '東京都',
        account_opener_gender: 'female',
        account_opener_last_name_kana: 'ﾄｳｷﾖｳﾄ',
        account_opener_last_name_kanji: '東京都',
        account_opener_phone: '456-789-0123',
        account_opener_relationship_executive: 'true',
        account_opener_relationship_title: 'Owner'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registration = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registration.account_opener_address_kanji_line1, '２７－１５')
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
        const req = TestHelper.createRequest(`/api/user/connect/update-account-opener?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = postData[country.id]
        if (country.id !== 'JP') {
          req.body.account_opener_email = user.profile.contactEmail
          req.body.account_opener_first_name = user.profile.firstName
          req.body.account_opener_last_name = user.profile.lastName
        }
        if (connect.kycRequirements[country.id].individual.indexOf('individual.verification.document.front') > -1) {
          req.uploads = {
            account_opener_verification_document_front: TestHelper['success_id_scan_back.png'],
            account_opener_verification_document_back: TestHelper['success_id_scan_back.png']
          }
          if (connect.kycRequirements[country.id].individual.indexOf('individual.verification.additional_document.front') > -1) {
            req.uploads.account_opener_verification_additional_document_front = TestHelper['success_id_scan_back.png']
            req.uploads.account_opener_verification_additional_document_back = TestHelper['success_id_scan_back.png']
          }
        }
        req.body = TestHelper.createMultiPart(req, req.body)
        const page = await req.patch()
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
      const req = TestHelper.createRequest(`/account/connect/edit-account-opener?stripeid=${user.stripeAccount.id}`)
      req.waitOnSubmit = true
      req.account = user.account
      req.session = user.session
      req.uploads = {
        account_opener_verification_document_back: TestHelper['success_id_scan_back.png'],
        account_opener_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      req.body = {
        account_opener_address_city: 'New York',
        account_opener_address_country: 'US',
        account_opener_address_line1: '285 Fulton St',
        account_opener_address_postal_code: '10007',
        account_opener_address_state: 'NY',
        account_opener_dob_day: '1',
        account_opener_dob_month: '1',
        account_opener_dob_year: '1950',
        account_opener_email: user.profile.contactEmail,
        account_opener_first_name: user.profile.firstName,
        account_opener_last_name: user.profile.lastName,
        account_opener_phone: '456-789-0123',
        account_opener_relationship_executive: 'true',
        account_opener_relationship_title: 'Owner',
        account_opener_ssn_last_4: '0000'
      }
      await req.post()
      const account = await global.api.user.connect.StripeAccount.get(req)
      const registration = connect.MetaData.parse(account.metadata, 'registration')
      const req2 = TestHelper.createRequest(`/account/connect/edit-account-opener?stripeid=${user.stripeAccount.id}`)
      req2.waitOnSubmit = true
      req2.account = user.account
      req2.session = user.session
      req2.uploads = {
        account_opener_verification_document_back: TestHelper['success_id_scan_back.png'],
        account_opener_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      req2.body = {
        account_opener_address_city: 'New York',
        account_opener_address_country: 'US',
        account_opener_address_line1: '285 Fulton St',
        account_opener_address_postal_code: '10007',
        account_opener_address_state: 'NY',
        account_opener_dob_day: '1',
        account_opener_dob_month: '1',
        account_opener_dob_year: '1950',
        account_opener_email: user.profile.contactEmail,
        account_opener_first_name: user.profile.firstName,
        account_opener_last_name: user.profile.lastName,
        account_opener_phone: '456-789-0123',
        account_opener_relationship_executive: 'true',
        account_opener_relationship_title: 'Owner',
        account_opener_ssn_last_4: '0000'
      }
      await req2.post()
      const accountNow = await global.api.user.connect.StripeAccount.get(req2)
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.notStrictEqual(registrationNow.representativeToken, registration.representativeToken)
      assert.notStrictEqual(registrationNow.representativeToken, null)
      assert.notStrictEqual(registrationNow.representativeToken, undefined)
    })
  })
})

const postData = {
  AT: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    account_opener_address_city: 'Vienna',
    account_opener_address_line1: '123 Sesame St',
    account_opener_address_postal_code: '1020',
    account_opener_address_state: '1',
    account_opener_dob_day: '1',
    account_opener_dob_month: '1',
    account_opener_dob_year: '1950',
    account_opener_phone: '456-789-0123'
  },
  AU: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    account_opener_address_city: 'Brisbane',
    account_opener_address_line1: '845 Oxford St',
    account_opener_address_postal_code: '4000',
    account_opener_address_state: 'QLD',
    account_opener_dob_day: '1',
    account_opener_dob_month: '1',
    account_opener_dob_year: '1950',
    account_opener_phone: '456-789-0123'
  },
  BE: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    account_opener_address_city: 'Brussels',
    account_opener_address_line1: '123 Sesame St',
    account_opener_address_postal_code: '1020',
    account_opener_address_state: 'BRU',
    account_opener_dob_day: '1',
    account_opener_dob_month: '1',
    account_opener_dob_year: '1950',
    account_opener_phone: '456-789-0123'
  },
  CA: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    account_opener_address_city: 'Vancouver',
    account_opener_address_line1: '123 Sesame St',
    account_opener_address_postal_code: 'V5K 0A1',
    account_opener_address_state: 'BC',
    account_opener_dob_day: '1',
    account_opener_dob_month: '1',
    account_opener_dob_year: '1950',
    account_opener_id_number: '000000000',
    account_opener_phone: '456-789-0123'
  },
  CH: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    account_opener_address_city: 'Bern',
    account_opener_address_line1: '123 Sesame St',
    account_opener_address_postal_code: '1020',
    account_opener_address_state: 'BE',
    account_opener_dob_day: '1',
    account_opener_dob_month: '1',
    account_opener_dob_year: '1950',
    account_opener_phone: '456-789-0123'
  },
  DE: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    account_opener_address_city: 'Berlin',
    account_opener_address_line1: '123 Sesame St',
    account_opener_address_postal_code: '01067',
    account_opener_address_state: 'BE',
    account_opener_dob_day: '1',
    account_opener_dob_month: '1',
    account_opener_dob_year: '1950',
    account_opener_phone: '456-789-0123'
  },
  DK: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    account_opener_address_city: 'Copenhagen',
    account_opener_address_line1: '123 Sesame St',
    account_opener_address_postal_code: '1000',
    account_opener_address_state: '147',
    account_opener_dob_day: '1',
    account_opener_dob_month: '1',
    account_opener_dob_year: '1950',
    account_opener_phone: '456-789-0123'
  },
  EE: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    account_opener_address_city: 'Tallinn',
    account_opener_address_line1: '123 Sesame St',
    account_opener_address_postal_code: '10128',
    account_opener_address_state: '37',
    account_opener_dob_day: '1',
    account_opener_dob_month: '1',
    account_opener_dob_year: '1950',
    account_opener_phone: '456-789-0123'
  },
  ES: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    account_opener_address_city: 'Madrid',
    account_opener_address_line1: '123 Park Lane',
    account_opener_address_postal_code: '03179',
    account_opener_address_state: 'AN',
    account_opener_name: 'Individual',
    account_opener_phone: '456-789-0123',
    account_opener_tax_id: '00000000000'
  },
  FI: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    account_opener_address_city: 'Helsinki',
    account_opener_address_line1: '123 Sesame St',
    account_opener_address_postal_code: '00990',
    account_opener_address_state: 'AL',
    account_opener_dob_day: '1',
    account_opener_dob_month: '1',
    account_opener_dob_year: '1950',
    account_opener_phone: '456-789-0123'
  },
  FR: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    account_opener_address_city: 'Paris',
    account_opener_address_line1: '123 Sesame St',
    account_opener_address_postal_code: '75001',
    account_opener_address_state: 'A',
    account_opener_dob_day: '1',
    account_opener_dob_month: '1',
    account_opener_dob_year: '1950',
    account_opener_phone: '456-789-0123'
  },
  GB: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    account_opener_address_city: 'London',
    account_opener_address_line1: '123 Sesame St',
    account_opener_address_postal_code: 'EC1A 1AA',
    account_opener_address_state: 'LND',
    account_opener_dob_day: '1',
    account_opener_dob_month: '1',
    account_opener_dob_year: '1950',
    account_opener_phone: '456-789-0123'
  },
  GR: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    account_opener_address_city: 'Athens',
    account_opener_address_line1: '123 Park Lane',
    account_opener_address_postal_code: '104',
    account_opener_address_state: 'I',
    account_opener_phone: '456-789-0123',
    account_opener_tax_id: '00000000000'
  },
  HK: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    account_opener_address_city: 'Hong Kong',
    account_opener_address_line1: '123 Sesame St',
    account_opener_address_postal_code: '999077',
    account_opener_address_state: 'HK',
    account_opener_dob_day: '1',
    account_opener_dob_month: '1',
    account_opener_dob_year: '1950',
    account_opener_id_number: '000000000',
    account_opener_phone: '456-789-0123'
  },
  IE: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    account_opener_address_city: 'Dublin',
    account_opener_address_line1: '123 Sesame St',
    account_opener_address_postal_code: 'Dublin 1',
    account_opener_address_state: 'D',
    account_opener_dob_day: '1',
    account_opener_dob_month: '1',
    account_opener_dob_year: '1950',
    account_opener_phone: '456-789-0123'
  },
  IT: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    account_opener_address_city: 'Rome',
    account_opener_address_line1: '123 Sesame St',
    account_opener_address_postal_code: '00010',
    account_opener_address_state: '65',
    account_opener_dob_day: '1',
    account_opener_dob_month: '1',
    account_opener_dob_year: '1950',
    account_opener_phone: '456-789-0123'
  },
  JP: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    account_opener_address_kana_city: 'ｼﾌﾞﾔ',
    account_opener_address_kana_line1: '27-15',
    account_opener_address_kana_postal_code: '1500001',
    account_opener_address_kana_state: 'ﾄｳｷﾖｳﾄ',
    account_opener_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
    account_opener_address_kanji_city: '渋谷区',
    account_opener_address_kanji_line1: '２７－１５',
    account_opener_address_kanji_postal_code: '1500001',
    account_opener_address_kanji_state: '東京都',
    account_opener_address_kanji_town: '神宮前 ３丁目',
    account_opener_dob_day: '1',
    account_opener_dob_month: '1',
    account_opener_dob_year: '1950',
    account_opener_first_name_kana: 'ﾄｳｷﾖｳﾄ',
    account_opener_first_name_kanji: '東京都',
    account_opener_gender: 'female',
    account_opener_last_name_kana: 'ﾄｳｷﾖｳﾄ',
    account_opener_last_name_kanji: '東京都',
    account_opener_phone: '+81112345678'
  },
  LT: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    account_opener_address_city: 'Vilnius',
    account_opener_address_line1: '123 Sesame St',
    account_opener_address_postal_code: 'LT-00000',
    account_opener_address_state: 'AL',
    account_opener_dob_day: '1',
    account_opener_dob_month: '1',
    account_opener_dob_year: '1950',
    account_opener_phone: '456-789-0123'
  },
  LU: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    account_opener_address_city: 'Luxemburg',
    account_opener_address_line1: '123 Sesame St',
    account_opener_address_postal_code: '1623',
    account_opener_address_state: 'L',
    account_opener_dob_day: '1',
    account_opener_dob_month: '1',
    account_opener_dob_year: '1950',
    account_opener_phone: '456-789-0123'
  },
  LV: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    account_opener_address_city: 'Riga',
    account_opener_address_line1: '123 Sesame St',
    account_opener_address_postal_code: 'LV–1073',
    account_opener_address_state: 'AI',
    account_opener_dob_day: '1',
    account_opener_dob_month: '1',
    account_opener_dob_year: '1950',
    account_opener_phone: '456-789-0123'
  },
  MY: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    account_opener_address_city: 'Kuala Lumpur',
    account_opener_address_line1: '123 Sesame St',
    account_opener_address_postal_code: '50450',
    account_opener_address_state: 'C',
    account_opener_dob_day: '1',
    account_opener_dob_month: '1',
    account_opener_dob_year: '1950',
    account_opener_phone: '456-789-0123'
  },
  NL: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    account_opener_address_city: 'Amsterdam',
    account_opener_address_line1: '123 Sesame St',
    account_opener_address_postal_code: '1071 JA',
    account_opener_address_state: 'DR',
    account_opener_dob_day: '1',
    account_opener_dob_month: '1',
    account_opener_dob_year: '1950',
    account_opener_phone: '456-789-0123'
  },
  NO: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    account_opener_address_city: 'Oslo',
    account_opener_address_line1: '123 Sesame St',
    account_opener_address_postal_code: '0001',
    account_opener_address_state: '02',
    account_opener_dob_day: '1',
    account_opener_dob_month: '1',
    account_opener_dob_year: '1950',
    account_opener_phone: '456-789-0123'
  },
  NZ: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    account_opener_address_city: 'Auckland',
    account_opener_address_line1: '844 Fleet Street',
    account_opener_address_postal_code: '6011',
    account_opener_address_state: 'N',
    account_opener_dob_day: '1',
    account_opener_dob_month: '1',
    account_opener_dob_year: '1950',
    account_opener_phone: '456-789-0123'
  },
  PL: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    account_opener_address_city: 'Krakow',
    account_opener_address_line1: '123 Park Lane',
    account_opener_address_postal_code: '32-400',
    account_opener_address_state: 'KR',
    account_opener_dob_day: '1',
    account_opener_dob_month: '1',
    account_opener_dob_year: '1950',
    account_opener_phone: '456-789-0123'
  },
  PT: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    account_opener_address_city: 'Lisbon',
    account_opener_address_line1: '123 Sesame St',
    account_opener_address_postal_code: '4520',
    account_opener_address_state: '01',
    account_opener_dob_day: '1',
    account_opener_dob_month: '1',
    account_opener_dob_year: '1950',
    account_opener_phone: '456-789-0123'
  },
  SE: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    account_opener_address_city: 'Stockholm',
    account_opener_address_line1: '123 Sesame St',
    account_opener_address_postal_code: '00150',
    account_opener_address_state: 'K',
    account_opener_dob_day: '1',
    account_opener_dob_month: '1',
    account_opener_dob_year: '1950',
    account_opener_phone: '456-789-0123'
  },
  SG: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    account_opener_address_city: 'Singapore',
    account_opener_address_line1: '123 Sesame St',
    account_opener_address_postal_code: '339696',
    account_opener_address_state: 'SG',
    account_opener_dob_day: '1',
    account_opener_dob_month: '1',
    account_opener_dob_year: '1950',
    account_opener_id_number: '000000000',
    account_opener_phone: '456-789-0123'
  },
  SI: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    account_opener_address_city: 'Ljubljana',
    account_opener_address_line1: '123 Sesame St',
    account_opener_address_postal_code: '1210',
    account_opener_dob_day: '1',
    account_opener_dob_month: '1',
    account_opener_dob_year: '1950',
    account_opener_phone: '456-789-0123'
  },
  SK: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    account_opener_address_city: 'Slovakia',
    account_opener_address_line1: '123 Sesame St',
    account_opener_address_postal_code: '00102',
    account_opener_dob_day: '1',
    account_opener_dob_month: '1',
    account_opener_dob_year: '1950',
    account_opener_phone: '456-789-0123'
  },
  US: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    account_opener_address_city: 'New York',
    account_opener_address_line1: '285 Fulton St',
    account_opener_address_postal_code: '10007',
    account_opener_address_state: 'NY',
    account_opener_dob_day: '1',
    account_opener_dob_month: '1',
    account_opener_dob_year: '1950',
    account_opener_phone: '456-789-0123',
    account_opener_ssn_last_4: '0000'
  }
}
