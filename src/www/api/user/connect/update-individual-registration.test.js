/* eslint-env mocha */
const assert = require('assert')
const connect = require('../../../../../index.js')
const TestHelper = require('../../../../../test-helper.js')

describe('/api/user/connect/update-individual-registration', () => {
  describe('exceptions', () => {
    describe('invalid-stripeid', () => {
      it('missing querystring stripeid', async () => {
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/connect/update-individual-registration')
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
        const req = TestHelper.createRequest('/api/user/connect/update-individual-registration?stripeid=invalid')
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
      it('ineligible stripe account for company', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'US'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
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
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
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
          country: 'US'
        })
        const user2 = await TestHelper.createUser()
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
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

    describe('invalid-individual_dob_day', () => {
      it('missing posted individual_dob_day', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'individual',
          country: 'AT'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const body = {
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          individual_dob_day: '',
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
        }
        req.uploads = {
          individual_verification_document_front: TestHelper['success_id_scan_front.png'],
          individual_verification_document_back: TestHelper['success_id_scan_back.png']
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-individual_dob_day')
      })

      it('invalid posted individual_dob_day', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'individual',
          country: 'AT'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const body = {
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          individual_dob_day: 'invalid',
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
        }
        req.uploads = {
          individual_verification_document_front: TestHelper['success_id_scan_front.png'],
          individual_verification_document_back: TestHelper['success_id_scan_back.png']
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-individual_dob_day')
      })
    })

    describe('invalid-individual_dob_month', () => {
      it('missing posted individual_dob_month', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'individual',
          country: 'AT'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const body = {
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          individual_dob_day: '1',
          individual_dob_month: '',
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
        }
        req.uploads = {
          individual_verification_document_front: TestHelper['success_id_scan_front.png'],
          individual_verification_document_back: TestHelper['success_id_scan_back.png']
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-individual_dob_month')
      })

      it('invalid posted individual_dob_month', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'individual',
          country: 'AT'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const body = {
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          individual_dob_day: '1',
          individual_dob_month: 'invalid',
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
        }
        req.uploads = {
          individual_verification_document_front: TestHelper['success_id_scan_front.png'],
          individual_verification_document_back: TestHelper['success_id_scan_back.png']
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-individual_dob_month')
      })
    })

    describe('invalid-individual_dob_year', () => {
      it('missing posted individual_dob_year', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'individual',
          country: 'AT'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const body = {
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '',
          individual_first_name: user.profile.firstName,
          individual_last_name: user.profile.lastName,
          individual_email: user.profile.contactEmail,
          individual_phone: '456-789-0123',
          individual_address_country: 'AT',
          individual_address_city: 'Vienna',
          individual_address_state: '1',
          individual_address_line1: '123 Sesame St',
          individual_address_postal_code: '1020'
        }
        req.uploads = {
          individual_verification_document_front: TestHelper['success_id_scan_front.png'],
          individual_verification_document_back: TestHelper['success_id_scan_back.png']
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-individual_dob_year')
      })

      it('invalid posted individual_dob_year', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'individual',
          country: 'AT'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const body = {
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: 'invalid',
          individual_first_name: user.profile.firstName,
          individual_last_name: user.profile.lastName,
          individual_email: user.profile.contactEmail,
          individual_phone: '456-789-0123',
          individual_address_country: 'AT',
          individual_address_city: 'Vienna',
          individual_address_state: '1',
          individual_address_line1: '123 Sesame St',
          individual_address_postal_code: '1020'
        }
        req.uploads = {
          individual_verification_document_front: TestHelper['success_id_scan_front.png'],
          individual_verification_document_back: TestHelper['success_id_scan_back.png']
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-individual_dob_year')
      })
    })

    describe('invalid-individual_first_name', () => {
      it('missing posted individual_first_name', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'individual',
          country: 'AT'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const body = {
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_first_name: '',
          individual_last_name: user.profile.lastName,
          individual_email: user.profile.contactEmail,
          individual_phone: '456-789-0123',
          individual_address_country: 'AT',
          individual_address_city: 'Vienna',
          individual_address_state: '1',
          individual_address_line1: '123 Sesame St',
          individual_address_postal_code: '1020'
        }
        req.uploads = {
          individual_verification_document_front: TestHelper['success_id_scan_front.png'],
          individual_verification_document_back: TestHelper['success_id_scan_back.png']
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-individual_first_name')
      })
    })

    describe('invalid-individual_last_name', () => {
      it('missing posted individual_last_name', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'individual',
          country: 'AT'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const body = {
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_first_name: user.profile.firstName,
          individual_last_name: '',
          individual_email: user.profile.contactEmail,
          individual_phone: '456-789-0123',
          individual_address_country: 'AT',
          individual_address_city: 'Vienna',
          individual_address_state: '1',
          individual_address_line1: '123 Sesame St',
          individual_address_postal_code: '1020'
        }
        req.uploads = {
          individual_verification_document_front: TestHelper['success_id_scan_front.png'],
          individual_verification_document_back: TestHelper['success_id_scan_back.png']
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-individual_last_name')
      })
    })

    describe('invalid-individual_address_city', () => {
      it('missing posted individual_address_city', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'individual',
          country: 'AU'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const body = {
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_first_name: user.profile.firstName,
          individual_last_name: user.profile.lastName,
          individual_email: user.profile.contactEmail,
          individual_phone: '456-789-0123',
          individual_address_city: '',
          individual_address_state: 'QLD',
          individual_address_country: 'AU',
          individual_address_line1: '845 Oxford St',
          individual_address_postal_code: '4000'
        }
        req.uploads = {
          individual_verification_document_front: TestHelper['success_id_scan_front.png'],
          individual_verification_document_back: TestHelper['success_id_scan_back.png']
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-individual_address_city')
      })
    })

    describe('invalid-individual_address_state', () => {
      it('missing posted individual_address_state', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'individual',
          country: 'AU'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const body = {
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
          individual_address_state: '',
          individual_address_country: 'AU',
          individual_address_line1: '845 Oxford St',
          individual_address_postal_code: '4000'
        }
        req.uploads = {
          individual_verification_document_front: TestHelper['success_id_scan_front.png'],
          individual_verification_document_back: TestHelper['success_id_scan_back.png']
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-individual_address_state')
      })
    })

    describe('invalid-individual_address_postal_code', () => {
      it('missing posted individual_address_postal_code', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'individual',
          country: 'AU'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const body = {
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
          individual_address_postal_code: ''
        }
        req.uploads = {
          individual_verification_document_front: TestHelper['success_id_scan_front.png'],
          individual_verification_document_back: TestHelper['success_id_scan_back.png']
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-individual_address_postal_code')
      })
    })

    describe('invalid-individual_id_number', () => {
      it('missing posted individual_id_number', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'individual',
          country: 'HK'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const body = {
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_first_name: user.profile.firstName,
          individual_last_name: user.profile.lastName,
          individual_id_number: '',
          individual_email: user.profile.contactEmail,
          individual_phone: '456-789-0123',
          individual_address_city: 'Hong Kong',
          individual_address_line1: '123 Sesame St',
          individual_address_state: 'HK',
          individual_address_postal_code: '999077',
          individual_address_country: 'HK'
        }
        req.uploads = {
          individual_verification_document_front: TestHelper['success_id_scan_front.png'],
          individual_verification_document_back: TestHelper['success_id_scan_back.png']
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-individual_id_number')
      })
    })

    describe('invalid-business_profile_mcc', () => {
      it('missing posted business_profile_mcc', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'individual',
          country: 'US'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const body = {
          business_profile_mcc: '',
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
        }
        req.uploads = {
          individual_verification_document_front: TestHelper['success_id_scan_front.png'],
          individual_verification_document_back: TestHelper['success_id_scan_back.png']
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-business_profile_mcc')
      })

      it('invalid posted business_profile_mcc', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'individual',
          country: 'US'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const body = {
          business_profile_mcc: 'invalid',
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
        }
        req.uploads = {
          individual_verification_document_front: TestHelper['success_id_scan_front.png'],
          individual_verification_document_back: TestHelper['success_id_scan_back.png']
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-business_profile_mcc')
      })
    })

    describe('invalid-business_profile_url', () => {
      it('missing posted business_profile_url', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'individual',
          country: 'US'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const body = {
          business_profile_mcc: '8931',
          business_profile_url: '',
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
        }
        req.uploads = {
          individual_verification_document_front: TestHelper['success_id_scan_front.png'],
          individual_verification_document_back: TestHelper['success_id_scan_back.png']
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-business_profile_url')
      })
    })

    describe('invalid-individual_ssn_last_4', () => {
      it('missing posted individual_ssn_last_4', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'individual',
          country: 'US'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const body = {
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
          individual_ssn_last_4: '',
          individual_address_state: 'NY',
          individual_address_country: 'US',
          individual_address_line1: '285 Fulton St',
          individual_address_postal_code: '10007'
        }
        req.uploads = {
          individual_verification_document_front: TestHelper['success_id_scan_front.png'],
          individual_verification_document_back: TestHelper['success_id_scan_back.png']
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-individual_ssn_last_4')
      })
    })

    describe('invalid-individual_phone', () => {
      it('missing posted individual_phone', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'individual',
          country: 'US'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const body = {
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_first_name: user.profile.firstName,
          individual_last_name: user.profile.lastName,
          individual_email: user.profile.contactEmail,
          individual_phone: '',
          individual_address_city: 'New York',
          individual_ssn_last_4: '0000',
          individual_address_state: 'NY',
          individual_address_country: 'US',
          individual_address_line1: '285 Fulton St',
          individual_address_postal_code: '10007'
        }
        req.uploads = {
          individual_verification_document_front: TestHelper['success_id_scan_front.png'],
          individual_verification_document_back: TestHelper['success_id_scan_back.png']
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-individual_phone')
      })
    })

    describe('invalid-individual_email', () => {
      it('missing posted ', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'individual',
          country: 'US'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const body = {
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_first_name: user.profile.firstName,
          individual_last_name: user.profile.lastName,
          individual_email: '',
          individual_phone: '456-789-0123',
          individual_address_city: 'New York',
          individual_ssn_last_4: '0000',
          individual_address_state: 'NY',
          individual_address_country: 'US',
          individual_address_line1: '285 Fulton St',
          individual_address_postal_code: '10007'
        }
        req.uploads = {
          individual_verification_document_front: TestHelper['success_id_scan_front.png'],
          individual_verification_document_back: TestHelper['success_id_scan_back.png']
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-individual_email')
      })
    })

    describe('invalid-individual_gender', () => {
      it('missing posted individual_gender', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'individual',
          country: 'JP'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const body = {
          individual_first_name: user.profile.firstName,
          individual_last_name: user.profile.lastName,
          individual_email: user.profile.contactEmail, 
          business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_gender: '',
          individual_phone: '+81112345678',
          individual_first_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_last_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_first_name_kanji: '東京都',
          individual_last_name_kanji: '東京都',
          individual_address_kana_postal_code: '1500001',
          individual_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          individual_address_kana_city: 'ｼﾌﾞﾔ',
          individual_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          individual_address_kana_line1: '27-15',
          individual_address_kanji_postal_code: '1500001',
          individual_address_kanji_state: '東京都',
          individual_address_kanji_city: '渋谷区',
          individual_address_kanji_town: '神宮前 ３丁目',
          individual_address_kanji_line1: '２７－１５'
        }
        req.uploads = {
          individual_verification_document_front: TestHelper['success_id_scan_front.png'],
          individual_verification_document_back: TestHelper['success_id_scan_back.png']
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-individual_gender')
      })

      it('invalid posted individual_gender', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'individual',
          country: 'JP'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const body = {
          individual_first_name: user.profile.firstName,
          individual_last_name: user.profile.lastName,
          individual_email: user.profile.contactEmail,
          business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_gender: 'invalid',
          individual_phone: '+81112345678',
          individual_first_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_last_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_first_name_kanji: '東京都',
          individual_last_name_kanji: '東京都',
          individual_address_kana_postal_code: '1500001',
          individual_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          individual_address_kana_city: 'ｼﾌﾞﾔ',
          individual_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          individual_address_kana_line1: '27-15',
          individual_address_kanji_postal_code: '1500001',
          individual_address_kanji_state: '東京都',
          individual_address_kanji_city: '渋谷区',
          individual_address_kanji_town: '神宮前 ３丁目',
          individual_address_kanji_line1: '２７－１５'
        }
        req.uploads = {
          individual_verification_document_front: TestHelper['success_id_scan_front.png'],
          individual_verification_document_back: TestHelper['success_id_scan_back.png']
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-individual_gender')
      })
    })

    describe('invalid-individual_first_name_kana', () => {
      it('missing posted individual_first_name_kana', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'individual',
          country: 'JP'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const body = {
          individual_first_name: user.profile.firstName,
          individual_last_name: user.profile.lastName,
          individual_email: user.profile.contactEmail,
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_gender: 'female',
          individual_phone: '+81112345678',
          individual_first_name_kana: '',
          individual_last_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_first_name_kanji: '東京都',
          individual_last_name_kanji: '東京都',
          individual_address_kana_postal_code: '1500001',
          individual_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          individual_address_kana_city: 'ｼﾌﾞﾔ',
          individual_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          individual_address_kana_line1: '27-15',
          individual_address_kanji_postal_code: '1500001',
          individual_address_kanji_state: '東京都',
          individual_address_kanji_city: '渋谷区',
          individual_address_kanji_town: '神宮前 ３丁目',
          individual_address_kanji_line1: '２７－１５'
        }
        req.uploads = {
          individual_verification_document_front: TestHelper['success_id_scan_front.png'],
          individual_verification_document_back: TestHelper['success_id_scan_back.png']
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-individual_first_name_kana')
      })
    })

    describe('invalid-individual_last_name_kana', () => {
      it('missing posted individual_last_name_kana', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'individual',
          country: 'JP'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const body = {
          individual_first_name: user.profile.firstName,
          individual_last_name: user.profile.lastName,
          individual_email: user.profile.contactEmail,
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_gender: 'female',
          individual_phone: '+81112345678',
          individual_first_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_last_name_kana: '',
          individual_first_name_kanji: '東京都',
          individual_last_name_kanji: '東京都',
          individual_address_kana_postal_code: '1500001',
          individual_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          individual_address_kana_city: 'ｼﾌﾞﾔ',
          individual_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          individual_address_kana_line1: '27-15',
          individual_address_kanji_postal_code: '1500001',
          individual_address_kanji_state: '東京都',
          individual_address_kanji_city: '渋谷区',
          individual_address_kanji_town: '神宮前 ３丁目',
          individual_address_kanji_line1: '２７－１５'
        }
        req.uploads = {
          individual_verification_document_front: TestHelper['success_id_scan_front.png'],
          individual_verification_document_back: TestHelper['success_id_scan_back.png']
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-individual_last_name_kana')
      })
    })

    describe('invalid-individual_first_name_kanji', () => {
      it('missing posted individual_first_name_kanji', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'individual',
          country: 'JP'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const body = {
          individual_first_name: user.profile.firstName,
          individual_last_name: user.profile.lastName,
          individual_email: user.profile.contactEmail,
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_gender: 'female',
          individual_phone: '+81112345678',
          individual_first_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_last_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_first_name_kanji: '',
          individual_last_name_kanji: '東京都',
          individual_address_kana_postal_code: '1500001',
          individual_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          individual_address_kana_city: 'ｼﾌﾞﾔ',
          individual_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          individual_address_kana_line1: '27-15',
          individual_address_kanji_postal_code: '1500001',
          individual_address_kanji_state: '東京都',
          individual_address_kanji_city: '渋谷区',
          individual_address_kanji_town: '神宮前 ３丁目',
          individual_address_kanji_line1: '２７－１５'
        }
        req.uploads = {
          individual_verification_document_front: TestHelper['success_id_scan_front.png'],
          individual_verification_document_back: TestHelper['success_id_scan_back.png']
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-individual_first_name_kanji')
      })
    })

    describe('invalid-individual_last_name_kanji', () => {
      it('missing posted individual_last_name_kanji', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'individual',
          country: 'JP'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const body = {
          individual_first_name: user.profile.firstName,
          individual_last_name: user.profile.lastName,
          individual_email: user.profile.contactEmail,
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_gender: 'female',
          individual_phone: '+81112345678',
          individual_first_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_last_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_first_name_kanji: '東京都',
          individual_last_name_kanji: '',
          individual_address_kana_postal_code: '1500001',
          individual_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          individual_address_kana_city: 'ｼﾌﾞﾔ',
          individual_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          individual_address_kana_line1: '27-15',
          individual_address_kanji_postal_code: '1500001',
          individual_address_kanji_state: '東京都',
          individual_address_kanji_city: '渋谷区',
          individual_address_kanji_town: '神宮前 ３丁目',
          individual_address_kanji_line1: '２７－１５'
        }
        req.uploads = {
          individual_verification_document_front: TestHelper['success_id_scan_front.png'],
          individual_verification_document_back: TestHelper['success_id_scan_back.png']
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-individual_last_name_kanji')
      })
    })

    describe('invalid-individual_address_kana_postal_code', () => {
      it('missing posted individual_address_kana_postal_code', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'individual',
          country: 'JP'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const body = {
          individual_first_name: user.profile.firstName,
          individual_last_name: user.profile.lastName,
          individual_email: user.profile.contactEmail,
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_gender: 'female',
          individual_phone: '+81112345678',
          individual_first_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_last_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_first_name_kanji: '東京都',
          individual_last_name_kanji: '東京都',
          individual_address_kana_postal_code: '',
          individual_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          individual_address_kana_city: 'ｼﾌﾞﾔ',
          individual_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          individual_address_kana_line1: '27-15',
          individual_address_kanji_postal_code: '1500001',
          individual_address_kanji_state: '東京都',
          individual_address_kanji_city: '渋谷区',
          individual_address_kanji_town: '神宮前 ３丁目',
          individual_address_kanji_line1: '２７－１５'
        }
        req.uploads = {
          individual_verification_document_front: TestHelper['success_id_scan_front.png'],
          individual_verification_document_back: TestHelper['success_id_scan_back.png']
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-individual_address_kana_postal_code')
      })
    })

    describe('invalid-individual_address_kana_state', () => {
      it('missing posted individual_address_kana_state', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'individual',
          country: 'JP'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const body = {
          individual_first_name: user.profile.firstName,
          individual_last_name: user.profile.lastName,
          individual_email: user.profile.contactEmail,
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_gender: 'female',
          individual_phone: '+81112345678',
          individual_first_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_last_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_first_name_kanji: '東京都',
          individual_last_name_kanji: '東京都',
          individual_address_kana_postal_code: '1500001',
          individual_address_kana_state: '',
          individual_address_kana_city: 'ｼﾌﾞﾔ',
          individual_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          individual_address_kana_line1: '27-15',
          individual_address_kanji_postal_code: '1500001',
          individual_address_kanji_state: '東京都',
          individual_address_kanji_city: '渋谷区',
          individual_address_kanji_town: '神宮前 ３丁目',
          individual_address_kanji_line1: '２７－１５'
        }
        req.uploads = {
          individual_verification_document_front: TestHelper['success_id_scan_front.png'],
          individual_verification_document_back: TestHelper['success_id_scan_back.png']
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-individual_address_kana_state')
      })
    })

    describe('invalid-individual_address_kana_city', () => {
      it('missing posted individual_address_kana_city', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'individual',
          country: 'JP'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const body = {
          individual_first_name: user.profile.firstName,
          individual_last_name: user.profile.lastName,
          individual_email: user.profile.contactEmail,
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_gender: 'female',
          individual_phone: '+81112345678',
          individual_first_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_last_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_first_name_kanji: '東京都',
          individual_last_name_kanji: '東京都',
          individual_address_kana_postal_code: '1500001',
          individual_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          individual_address_kana_city: '',
          individual_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          individual_address_kana_line1: '27-15',
          individual_address_kanji_postal_code: '1500001',
          individual_address_kanji_state: '東京都',
          individual_address_kanji_city: '渋谷区',
          individual_address_kanji_town: '神宮前 ３丁目',
          individual_address_kanji_line1: '２７－１５'
        }
        req.uploads = {
          individual_verification_document_front: TestHelper['success_id_scan_front.png'],
          individual_verification_document_back: TestHelper['success_id_scan_back.png']
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-individual_address_kana_city')
      })
    })

    describe('invalid-individual_address_kana_town', () => {
      it('missing posted individual_address_kana_town', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'individual',
          country: 'JP'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const body = {
          individual_first_name: user.profile.firstName,
          individual_last_name: user.profile.lastName,
          individual_email: user.profile.contactEmail,
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_gender: 'female',
          individual_phone: '+81112345678',
          individual_first_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_last_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_first_name_kanji: '東京都',
          individual_last_name_kanji: '東京都',
          individual_address_kana_postal_code: '1500001',
          individual_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          individual_address_kana_city: 'ｼﾌﾞﾔ',
          individual_address_kana_town: '',
          individual_address_kana_line1: '27-15',
          individual_address_kanji_postal_code: '1500001',
          individual_address_kanji_state: '東京都',
          individual_address_kanji_city: '渋谷区',
          individual_address_kanji_town: '神宮前 ３丁目',
          individual_address_kanji_line1: '２７－１５'
        }
        req.uploads = {
          individual_verification_document_front: TestHelper['success_id_scan_front.png'],
          individual_verification_document_back: TestHelper['success_id_scan_back.png']
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-individual_address_kana_town')
      })
    })

    describe('invalid-individual_address_kana_line1', () => {
      it('missing posted individual_address_kana_line1', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'individual',
          country: 'JP'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const body = {
          individual_first_name: user.profile.firstName,
          individual_last_name: user.profile.lastName,
          individual_email: user.profile.contactEmail,
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_gender: 'female',
          individual_phone: '+81112345678',
          individual_first_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_last_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_first_name_kanji: '東京都',
          individual_last_name_kanji: '東京都',
          individual_address_kana_postal_code: '1500001',
          individual_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          individual_address_kana_city: 'ｼﾌﾞﾔ',
          individual_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          individual_address_kana_line1: '',
          individual_address_kanji_postal_code: '1500001',
          individual_address_kanji_state: '東京都',
          individual_address_kanji_city: '渋谷区',
          individual_address_kanji_town: '神宮前 ３丁目',
          individual_address_kanji_line1: '２７－１５'
        }
        req.uploads = {
          individual_verification_document_front: TestHelper['success_id_scan_front.png'],
          individual_verification_document_back: TestHelper['success_id_scan_back.png']
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-individual_address_kana_line1')
      })
    })

    describe('invalid-individual_address_kanji_postal_code', () => {
      it('missing posted individual_address_kanji_postal_code', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'individual',
          country: 'JP'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const body = {
          individual_first_name: user.profile.firstName,
          individual_last_name: user.profile.lastName,
          individual_email: user.profile.contactEmail,
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_gender: 'female',
          individual_first_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_last_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_first_name_kanji: '東京都',
          individual_last_name_kanji: '東京都',
          individual_phone: '011-6789-0123',
          individual_address_kana_postal_code: '1500001',
          individual_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          individual_address_kana_city: 'ｼﾌﾞﾔ',
          individual_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          individual_address_kana_line1: '27-15',
          individual_address_kanji_postal_code: '',
          individual_address_kanji_state: '東京都',
          individual_address_kanji_city: '渋谷区',
          individual_address_kanji_town: '神宮前　３丁目',
          individual_address_kanji_line1: '２７－１５'
        }
        req.uploads = {
          individual_verification_document_front: TestHelper['success_id_scan_front.png'],
          individual_verification_document_back: TestHelper['success_id_scan_back.png']
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-individual_address_kanji_postal_code')
      })
    })

    describe('invalid-individual_address_kanji_state', () => {
      it('missing posted individual_address_kanji_state', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'individual',
          country: 'JP'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const body = {
          individual_first_name: user.profile.firstName,
          individual_last_name: user.profile.lastName,
          individual_email: user.profile.contactEmail,
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_gender: 'female',
          individual_phone: '+81112345678',
          individual_first_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_last_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_first_name_kanji: '東京都',
          individual_last_name_kanji: '東京都',
          individual_address_kana_postal_code: '1500001',
          individual_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          individual_address_kana_city: 'ｼﾌﾞﾔ',
          individual_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          individual_address_kana_line1: '27-15',
          individual_address_kanji_postal_code: '1500001',
          individual_address_kanji_state: '',
          individual_address_kanji_city: '渋谷区',
          individual_address_kanji_town: '神宮前 ３丁目',
          individual_address_kanji_line1: '２７－１５'
        }
        req.uploads = {
          individual_verification_document_front: TestHelper['success_id_scan_front.png'],
          individual_verification_document_back: TestHelper['success_id_scan_back.png']
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-individual_address_kanji_state')
      })
    })

    describe('invalid-individual_address_kanji_city', () => {
      it('missing posted individual_address_kanji_city', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'individual',
          country: 'JP'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const body = {
          individual_first_name: user.profile.firstName,
          individual_last_name: user.profile.lastName,
          individual_email: user.profile.contactEmail,
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_gender: 'female',
          individual_phone: '+81112345678',
          individual_first_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_last_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_first_name_kanji: '東京都',
          individual_last_name_kanji: '東京都',
          individual_address_kana_postal_code: '1500001',
          individual_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          individual_address_kana_city: 'ｼﾌﾞﾔ',
          individual_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          individual_address_kana_line1: '27-15',
          individual_address_kanji_postal_code: '1500001',
          individual_address_kanji_state: '東京都',
          individual_address_kanji_city: '',
          individual_address_kanji_town: '神宮前 ３丁目',
          individual_address_kanji_line1: '２７－１５'
        }
        req.uploads = {
          individual_verification_document_front: TestHelper['success_id_scan_front.png'],
          individual_verification_document_back: TestHelper['success_id_scan_back.png']
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-individual_address_kanji_city')
      })
    })

    describe('invalid-individual_address_kanji_town', () => {
      it('missing posted individual_address_kanji_town', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'individual',
          country: 'JP'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const body = {
          individual_first_name: user.profile.firstName,
          individual_last_name: user.profile.lastName,
          individual_email: user.profile.contactEmail,
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_gender: 'female',
          individual_phone: '+81112345678',
          individual_first_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_last_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_first_name_kanji: '東京都',
          individual_last_name_kanji: '東京都',
          individual_address_kana_postal_code: '1500001',
          individual_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          individual_address_kana_city: 'ｼﾌﾞﾔ',
          individual_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          individual_address_kana_line1: '27-15',
          individual_address_kanji_postal_code: '1500001',
          individual_address_kanji_state: '東京都',
          individual_address_kanji_city: '渋谷区',
          individual_address_kanji_town: '',
          individual_address_kanji_line1: '２７－１５'
        }
        req.uploads = {
          individual_verification_document_front: TestHelper['success_id_scan_front.png'],
          individual_verification_document_back: TestHelper['success_id_scan_back.png']
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-individual_address_kanji_town')
      })
    })

    describe('invalid-individual_address_kanji_line1', () => {
      it('missing posted individual_address_kanji_line1', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'individual',
          country: 'JP'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const body = {
          individual_first_name: user.profile.firstName,
          individual_last_name: user.profile.lastName,
          individual_email: user.profile.contactEmail,
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_gender: 'female',
          individual_phone: '+81112345678',
          individual_first_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_last_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_first_name_kanji: '東京都',
          individual_last_name_kanji: '東京都',
          individual_address_kana_postal_code: '1500001',
          individual_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          individual_address_kana_city: 'ｼﾌﾞﾔ',
          individual_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          individual_address_kana_line1: '27-15',
          individual_address_kanji_postal_code: '1500001',
          individual_address_kanji_state: '東京都',
          individual_address_kanji_city: '渋谷区',
          individual_address_kanji_town: '神宮前 ３丁目',
          individual_address_kanji_line1: ''
        }
        req.uploads = {
          individual_verification_document_front: TestHelper['success_id_scan_front.png'],
          individual_verification_document_back: TestHelper['success_id_scan_back.png']
        }
        req.body = TestHelper.createMultiPart(req, body)
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-individual_address_kanji_line1')
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
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const body = {
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
      }
        req.uploads = {
        individual_verification_document_front: TestHelper['success_id_scan_front.png'],
        individual_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], body[field])
      }
    })

    it('returns object for AU registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'AU'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const body = {
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
      }
      req.uploads = {
        individual_verification_document_front: TestHelper['success_id_scan_front.png'],
        individual_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], body[field])
      }
    })

    it('returns object for BE registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'BE'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const body = {
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
      }
      req.uploads = {
        individual_verification_document_front: TestHelper['success_id_scan_front.png'],
        individual_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], body[field])
      }
    })

    it('returns object for CA registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'CA'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const body = {
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
      }
      req.uploads = {
        individual_verification_document_front: TestHelper['success_id_scan_front.png'],
        individual_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], body[field])
      }
    })

    it('returns object for CH registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'CH'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const body = {
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
      }
      req.uploads = {
        individual_verification_document_front: TestHelper['success_id_scan_front.png'],
        individual_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], body[field])
      }
    })

    it('returns object for DE registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'DE'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const body = {
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
      }
      req.uploads = {
        individual_verification_document_front: TestHelper['success_id_scan_front.png'],
        individual_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], body[field])
      }
    })

    it('returns object for DK registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'DK'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const body = {
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
      }
      req.uploads = {
        individual_verification_document_front: TestHelper['success_id_scan_front.png'],
        individual_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], body[field])
      }
    })

    it('returns object for ES registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'ES'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const body = {
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
      }
      req.uploads = {
        individual_verification_document_front: TestHelper['success_id_scan_front.png'],
        individual_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], body[field])
      }
    })

    it('returns object for FI registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'FI'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const body = {
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
      }
      req.uploads = {
        individual_verification_document_front: TestHelper['success_id_scan_front.png'],
        individual_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], body[field])
      }
    })

    it('returns object for FR registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'FR'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const body = {
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
      }
      req.uploads = {
        individual_verification_document_front: TestHelper['success_id_scan_front.png'],
        individual_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], body[field])
      }
    })

    it('returns object for GB registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'GB'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const body = {
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
      }
      req.uploads = {
        individual_verification_document_front: TestHelper['success_id_scan_front.png'],
        individual_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], body[field])
      }
    })

    it('returns object for HK registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'HK'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const body = {
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
      }
      req.uploads = {
        individual_verification_document_front: TestHelper['success_id_scan_front.png'],
        individual_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], body[field])
      }
    })

    it('returns object for IE registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'IE'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const body = {
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
      }
      req.uploads = {
        individual_verification_document_front: TestHelper['success_id_scan_front.png'],
        individual_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], body[field])
      }
    })

    it('returns object for IT registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'IT'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const body = {
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
      }
      req.uploads = {
        individual_verification_document_front: TestHelper['success_id_scan_front.png'],
        individual_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], body[field])
      }
    })

    it('returns object for JP registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'JP'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName,
        individual_email: user.profile.contactEmail,
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_gender: 'female',
        individual_first_name_kana: 'ﾄｳｷﾖｳﾄ',
        individual_last_name_kana: 'ﾄｳｷﾖｳﾄ',
        individual_first_name_kanji: '東京都',
        individual_last_name_kanji: '東京都',
        individual_phone: '011-6789-0123',
        individual_address_kana_postal_code: '1500001',
        individual_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        individual_address_kana_city: 'ｼﾌﾞﾔ',
        individual_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        individual_address_kana_line1: '27-15',
        individual_address_kanji_postal_code: '1500001',
        individual_address_kanji_state: '東京都',
        individual_address_kanji_city: '渋谷区',
        individual_address_kanji_town: '神宮前　３丁目',
        individual_address_kanji_line1: '２７－１５'
      }
      req.uploads = {
        individual_verification_document_front: TestHelper['success_id_scan_front.png'],
        individual_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], body[field])
      }
    })

    it('returns object for LU registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'LU'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const body = {
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
      }
      req.uploads = {
        individual_verification_document_front: TestHelper['success_id_scan_front.png'],
        individual_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], body[field])
      }
    })

    it('returns object for NL registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'NL'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const body = {
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
      }
      req.uploads = {
        individual_verification_document_front: TestHelper['success_id_scan_front.png'],
        individual_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], body[field])
      }
    })

    it('returns object for NO registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'NO'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const body = {
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
      }
      req.uploads = {
        individual_verification_document_front: TestHelper['success_id_scan_front.png'],
        individual_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], body[field])
      }
    })

    it('returns object for NZ registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'NZ'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const body = {
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
      }
      req.uploads = {
        individual_verification_document_front: TestHelper['success_id_scan_front.png'],
        individual_verification_document_back: TestHelper['success_id_scan_back.png'],
        individual_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        individual_verification_additional_document_back: TestHelper['success_id_scan_back.png']
      }
      req.body = TestHelper.createMultiPart(req, body) 
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], body[field])
      }
    })

    it('returns object for PT registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'PT'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const body = {
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
      }
      req.uploads = {
        individual_verification_document_front: TestHelper['success_id_scan_front.png'],
        individual_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], body[field])
      }
    })

    it('returns object for SE registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'SE'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const body = {
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
      }
      req.uploads = {
        individual_verification_document_front: TestHelper['success_id_scan_front.png'],
        individual_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], body[field])
      }
    })

    it('returns object for SG registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'SG'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const body = {
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
      }
      req.uploads = {
        individual_verification_document_front: TestHelper['success_id_scan_front.png'],
        individual_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], body[field])
      }
    })

    it('returns object for US registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'US'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const body = {
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
      }
      req.uploads = {
        individual_verification_document_front: TestHelper['success_id_scan_front.png'],
        individual_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], body[field])
      }
    })
  })
})
