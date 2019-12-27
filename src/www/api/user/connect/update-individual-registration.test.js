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
          country: 'US',
          type: 'company'
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
          country: 'US',
          type: 'individual'
        })
        await TestHelper.createStripeRegistration(user, {
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          individual_address_city: 'New York',
          individual_address_line1: '285 Fulton St',
          individual_address_postal_code: '10007',
          individual_address_state: 'NY',
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_email: user.profile.contactEmail,
          individual_first_name: user.profile.firstName,
          individual_last_name: user.profile.lastName,
          individual_phone: '456-789-0123',
          individual_ssn_last_4: '0000'
        }, {
          individual_verification_document_back: TestHelper['success_id_scan_back.png'],
          individual_verification_document_front: TestHelper['success_id_scan_front.png']
        })
        await TestHelper.createExternalAccount(user, {
          account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
          account_holder_type: 'individual',
          account_number: '000123456789',
          country: 'US',
          currency: 'usd',
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
          country: 'US',
          type: 'individual'
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
          country: 'AT',
          type: 'individual'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const body = {
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          individual_address_city: 'Vienna',
          individual_address_line1: '123 Sesame St',
          individual_address_postal_code: '1020',
          individual_address_state: '1',
          individual_dob_day: '',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_email: user.profile.contactEmail,
          individual_first_name: user.profile.firstName,
          individual_last_name: user.profile.lastName,
          individual_phone: '456-789-0123'
        }
        req.uploads = {
          individual_verification_document_back: TestHelper['success_id_scan_back.png'],
          individual_verification_document_front: TestHelper['success_id_scan_front.png']
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
          country: 'AT',
          type: 'individual'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const body = {
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          individual_address_city: 'Vienna',
          individual_address_line1: '123 Sesame St',
          individual_address_postal_code: '1020',
          individual_address_state: '1',
          individual_dob_day: 'invalid',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_email: user.profile.contactEmail,
          individual_first_name: user.profile.firstName,
          individual_last_name: user.profile.lastName,
          individual_phone: '456-789-0123'
        }
        req.uploads = {
          individual_verification_document_back: TestHelper['success_id_scan_back.png'],
          individual_verification_document_front: TestHelper['success_id_scan_front.png']
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
          country: 'AT',
          type: 'individual'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const body = {
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          individual_address_city: 'Vienna',
          individual_address_line1: '123 Sesame St',
          individual_address_postal_code: '1020',
          individual_address_state: '1',
          individual_dob_day: '1',
          individual_dob_month: '',
          individual_dob_year: '1950',
          individual_email: user.profile.contactEmail,
          individual_first_name: user.profile.firstName,
          individual_last_name: user.profile.lastName,
          individual_phone: '456-789-0123'
        }
        req.uploads = {
          individual_verification_document_back: TestHelper['success_id_scan_back.png'],
          individual_verification_document_front: TestHelper['success_id_scan_front.png']
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
          country: 'AT',
          type: 'individual'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const body = {
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          individual_address_city: 'Vienna',
          individual_address_line1: '123 Sesame St',
          individual_address_postal_code: '1020',
          individual_address_state: '1',
          individual_dob_day: '1',
          individual_dob_month: 'invalid',
          individual_dob_year: '1950',
          individual_email: user.profile.contactEmail,
          individual_first_name: user.profile.firstName,
          individual_last_name: user.profile.lastName,
          individual_phone: '456-789-0123'
        }
        req.uploads = {
          individual_verification_document_back: TestHelper['success_id_scan_back.png'],
          individual_verification_document_front: TestHelper['success_id_scan_front.png']
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
          country: 'AT',
          type: 'individual'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const body = {
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          individual_address_city: 'Vienna',
          individual_address_line1: '123 Sesame St',
          individual_address_postal_code: '1020',
          individual_address_state: '1',
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '',
          individual_email: user.profile.contactEmail,
          individual_first_name: user.profile.firstName,
          individual_last_name: user.profile.lastName,
          individual_phone: '456-789-0123'
        }
        req.uploads = {
          individual_verification_document_back: TestHelper['success_id_scan_back.png'],
          individual_verification_document_front: TestHelper['success_id_scan_front.png']
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
          country: 'AT',
          type: 'individual'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const body = {
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          individual_address_city: 'Vienna',
          individual_address_line1: '123 Sesame St',
          individual_address_postal_code: '1020',
          individual_address_state: '1',
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: 'invalid',
          individual_email: user.profile.contactEmail,
          individual_first_name: user.profile.firstName,
          individual_last_name: user.profile.lastName,
          individual_phone: '456-789-0123'
        }
        req.uploads = {
          individual_verification_document_back: TestHelper['success_id_scan_back.png'],
          individual_verification_document_front: TestHelper['success_id_scan_front.png']
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
          country: 'AT',
          type: 'individual'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const body = {
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          individual_address_city: 'Vienna',
          individual_address_line1: '123 Sesame St',
          individual_address_postal_code: '1020',
          individual_address_state: '1',
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_email: user.profile.contactEmail,
          individual_first_name: '',
          individual_last_name: user.profile.lastName,
          individual_phone: '456-789-0123'
        }
        req.uploads = {
          individual_verification_document_back: TestHelper['success_id_scan_back.png'],
          individual_verification_document_front: TestHelper['success_id_scan_front.png']
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
          country: 'AT',
          type: 'individual'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const body = {
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          individual_address_city: 'Vienna',
          individual_address_line1: '123 Sesame St',
          individual_address_postal_code: '1020',
          individual_address_state: '1',
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_email: user.profile.contactEmail,
          individual_first_name: user.profile.firstName,
          individual_last_name: '',
          individual_phone: '456-789-0123'
        }
        req.uploads = {
          individual_verification_document_back: TestHelper['success_id_scan_back.png'],
          individual_verification_document_front: TestHelper['success_id_scan_front.png']
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
          country: 'AU',
          type: 'individual'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const body = {
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          individual_address_city: '',
          individual_address_line1: '845 Oxford St',
          individual_address_postal_code: '4000',
          individual_address_state: 'QLD',
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_email: user.profile.contactEmail,
          individual_first_name: user.profile.firstName,
          individual_last_name: user.profile.lastName,
          individual_phone: '456-789-0123'
        }
        req.uploads = {
          individual_verification_document_back: TestHelper['success_id_scan_back.png'],
          individual_verification_document_front: TestHelper['success_id_scan_front.png']
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
          country: 'AU',
          type: 'individual'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const body = {
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          individual_address_city: 'Brisbane',
          individual_address_line1: '845 Oxford St',
          individual_address_postal_code: '4000',
          individual_address_state: '',
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_email: user.profile.contactEmail,
          individual_first_name: user.profile.firstName,
          individual_last_name: user.profile.lastName,
          individual_phone: '456-789-0123'
        }
        req.uploads = {
          individual_verification_document_back: TestHelper['success_id_scan_back.png'],
          individual_verification_document_front: TestHelper['success_id_scan_front.png']
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
          country: 'AU',
          type: 'individual'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const body = {
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          individual_address_city: 'Brisbane',
          individual_address_line1: '845 Oxford St',
          individual_address_postal_code: '',
          individual_address_state: 'QLD',
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_email: user.profile.contactEmail,
          individual_first_name: user.profile.firstName,
          individual_last_name: user.profile.lastName,
          individual_phone: '456-789-0123'
        }
        req.uploads = {
          individual_verification_document_back: TestHelper['success_id_scan_back.png'],
          individual_verification_document_front: TestHelper['success_id_scan_front.png']
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
          country: 'HK',
          type: 'individual'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const body = {
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          individual_address_city: 'Hong Kong',
          individual_address_line1: '123 Sesame St',
          individual_address_postal_code: '999077',
          individual_address_state: 'HK',
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_email: user.profile.contactEmail,
          individual_first_name: user.profile.firstName,
          individual_id_number: '',
          individual_last_name: user.profile.lastName,
          individual_phone: '456-789-0123'
        }
        req.uploads = {
          individual_verification_document_back: TestHelper['success_id_scan_back.png'],
          individual_verification_document_front: TestHelper['success_id_scan_front.png']
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
          country: 'US',
          type: 'individual'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const body = {
          business_profile_mcc: '',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          individual_address_city: 'New York',
          individual_address_line1: '285 Fulton St',
          individual_address_postal_code: '10007',
          individual_address_state: 'NY',
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_email: user.profile.contactEmail,
          individual_first_name: user.profile.firstName,
          individual_last_name: user.profile.lastName,
          individual_phone: '456-789-0123',
          individual_ssn_last_4: '0000'
        }
        req.uploads = {
          individual_verification_document_back: TestHelper['success_id_scan_back.png'],
          individual_verification_document_front: TestHelper['success_id_scan_front.png']
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
          country: 'US',
          type: 'individual'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const body = {
          business_profile_mcc: 'invalid',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          individual_address_city: 'New York',
          individual_address_line1: '285 Fulton St',
          individual_address_postal_code: '10007',
          individual_address_state: 'NY',
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_email: user.profile.contactEmail,
          individual_first_name: user.profile.firstName,
          individual_last_name: user.profile.lastName,
          individual_phone: '456-789-0123',
          individual_ssn_last_4: '0000'
        }
        req.uploads = {
          individual_verification_document_back: TestHelper['success_id_scan_back.png'],
          individual_verification_document_front: TestHelper['success_id_scan_front.png']
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
          country: 'US',
          type: 'individual'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const body = {
          business_profile_mcc: '8931',
          business_profile_url: '',
          individual_address_city: 'New York',
          individual_address_line1: '285 Fulton St',
          individual_address_postal_code: '10007',
          individual_address_state: 'NY',
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_email: user.profile.contactEmail,
          individual_first_name: user.profile.firstName,
          individual_last_name: user.profile.lastName,
          individual_phone: '456-789-0123',
          individual_ssn_last_4: '0000'
        }
        req.uploads = {
          individual_verification_document_back: TestHelper['success_id_scan_back.png'],
          individual_verification_document_front: TestHelper['success_id_scan_front.png']
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
          country: 'US',
          type: 'individual'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const body = {
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          individual_address_city: 'New York',
          individual_address_line1: '285 Fulton St',
          individual_address_postal_code: '10007',
          individual_address_state: 'NY',
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_email: user.profile.contactEmail,
          individual_first_name: user.profile.firstName,
          individual_last_name: user.profile.lastName,
          individual_phone: '456-789-0123',
          individual_ssn_last_4: ''
        }
        req.uploads = {
          individual_verification_document_back: TestHelper['success_id_scan_back.png'],
          individual_verification_document_front: TestHelper['success_id_scan_front.png']
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
          country: 'US',
          type: 'individual'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const body = {
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          individual_address_city: 'New York',
          individual_address_line1: '285 Fulton St',
          individual_address_postal_code: '10007',
          individual_address_state: 'NY',
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_email: user.profile.contactEmail,
          individual_first_name: user.profile.firstName,
          individual_last_name: user.profile.lastName,
          individual_phone: '',
          individual_ssn_last_4: '0000'
        }
        req.uploads = {
          individual_verification_document_back: TestHelper['success_id_scan_back.png'],
          individual_verification_document_front: TestHelper['success_id_scan_front.png']
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
          country: 'US',
          type: 'individual'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const body = {
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          individual_address_city: 'New York',
          individual_address_line1: '285 Fulton St',
          individual_address_postal_code: '10007',
          individual_address_state: 'NY',
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_email: '',
          individual_first_name: user.profile.firstName,
          individual_last_name: user.profile.lastName,
          individual_phone: '456-789-0123',
          individual_ssn_last_4: '0000'
        }
        req.uploads = {
          individual_verification_document_back: TestHelper['success_id_scan_back.png'],
          individual_verification_document_front: TestHelper['success_id_scan_front.png']
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
          country: 'JP',
          type: 'individual'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const body = {
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          individual_address_kana_city: 'ｼﾌﾞﾔ',
          individual_address_kana_line1: '27-15',
          individual_address_kana_postal_code: '1500001',
          individual_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          individual_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          individual_address_kanji_city: '渋谷区',
          individual_address_kanji_line1: '２７－１５',
          individual_address_kanji_postal_code: '1500001',
          individual_address_kanji_state: '東京都',
          individual_address_kanji_town: '神宮前 ３丁目',
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_email: user.profile.contactEmail,
          individual_first_name: user.profile.firstName,
          individual_first_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_first_name_kanji: '東京都',
          individual_gender: '',
          individual_last_name: user.profile.lastName,
          individual_last_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_last_name_kanji: '東京都',
          individual_phone: '+81112345678'
        }
        req.uploads = {
          individual_verification_document_back: TestHelper['success_id_scan_back.png'],
          individual_verification_document_front: TestHelper['success_id_scan_front.png']
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
          country: 'JP',
          type: 'individual'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const body = {
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          individual_address_kana_city: 'ｼﾌﾞﾔ',
          individual_address_kana_line1: '27-15',
          individual_address_kana_postal_code: '1500001',
          individual_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          individual_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          individual_address_kanji_city: '渋谷区',
          individual_address_kanji_line1: '２７－１５',
          individual_address_kanji_postal_code: '1500001',
          individual_address_kanji_state: '東京都',
          individual_address_kanji_town: '神宮前 ３丁目',
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_email: user.profile.contactEmail,
          individual_first_name: user.profile.firstName,
          individual_first_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_first_name_kanji: '東京都',
          individual_gender: 'invalid',
          individual_last_name: user.profile.lastName,
          individual_last_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_last_name_kanji: '東京都',
          individual_phone: '+81112345678'
        }
        req.uploads = {
          individual_verification_document_back: TestHelper['success_id_scan_back.png'],
          individual_verification_document_front: TestHelper['success_id_scan_front.png']
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
          country: 'JP',
          type: 'individual'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const body = {
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          individual_address_kana_city: 'ｼﾌﾞﾔ',
          individual_address_kana_line1: '27-15',
          individual_address_kana_postal_code: '1500001',
          individual_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          individual_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          individual_address_kanji_city: '渋谷区',
          individual_address_kanji_line1: '２７－１５',
          individual_address_kanji_postal_code: '1500001',
          individual_address_kanji_state: '東京都',
          individual_address_kanji_town: '神宮前 ３丁目',
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_email: user.profile.contactEmail,
          individual_first_name: user.profile.firstName,
          individual_first_name_kana: '',
          individual_first_name_kanji: '東京都',
          individual_gender: 'female',
          individual_last_name: user.profile.lastName,
          individual_last_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_last_name_kanji: '東京都',
          individual_phone: '+81112345678'
        }
        req.uploads = {
          individual_verification_document_back: TestHelper['success_id_scan_back.png'],
          individual_verification_document_front: TestHelper['success_id_scan_front.png']
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
          country: 'JP',
          type: 'individual'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const body = {
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          individual_address_kana_city: 'ｼﾌﾞﾔ',
          individual_address_kana_line1: '27-15',
          individual_address_kana_postal_code: '1500001',
          individual_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          individual_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          individual_address_kanji_city: '渋谷区',
          individual_address_kanji_line1: '２７－１５',
          individual_address_kanji_postal_code: '1500001',
          individual_address_kanji_state: '東京都',
          individual_address_kanji_town: '神宮前 ３丁目',
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_email: user.profile.contactEmail,
          individual_first_name: user.profile.firstName,
          individual_first_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_first_name_kanji: '東京都',
          individual_gender: 'female',
          individual_last_name: user.profile.lastName,
          individual_last_name_kana: '',
          individual_last_name_kanji: '東京都',
          individual_phone: '+81112345678'
        }
        req.uploads = {
          individual_verification_document_back: TestHelper['success_id_scan_back.png'],
          individual_verification_document_front: TestHelper['success_id_scan_front.png']
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
          country: 'JP',
          type: 'individual'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const body = {
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          individual_address_kana_city: 'ｼﾌﾞﾔ',
          individual_address_kana_line1: '27-15',
          individual_address_kana_postal_code: '1500001',
          individual_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          individual_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          individual_address_kanji_city: '渋谷区',
          individual_address_kanji_line1: '２７－１５',
          individual_address_kanji_postal_code: '1500001',
          individual_address_kanji_state: '東京都',
          individual_address_kanji_town: '神宮前 ３丁目',
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_email: user.profile.contactEmail,
          individual_first_name: user.profile.firstName,
          individual_first_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_first_name_kanji: '',
          individual_gender: 'female',
          individual_last_name: user.profile.lastName,
          individual_last_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_last_name_kanji: '東京都',
          individual_phone: '+81112345678'
        }
        req.uploads = {
          individual_verification_document_back: TestHelper['success_id_scan_back.png'],
          individual_verification_document_front: TestHelper['success_id_scan_front.png']
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
          country: 'JP',
          type: 'individual'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const body = {
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          individual_address_kana_city: 'ｼﾌﾞﾔ',
          individual_address_kana_line1: '27-15',
          individual_address_kana_postal_code: '1500001',
          individual_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          individual_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          individual_address_kanji_city: '渋谷区',
          individual_address_kanji_line1: '２７－１５',
          individual_address_kanji_postal_code: '1500001',
          individual_address_kanji_state: '東京都',
          individual_address_kanji_town: '神宮前 ３丁目',
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_email: user.profile.contactEmail,
          individual_first_name: user.profile.firstName,
          individual_first_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_first_name_kanji: '東京都',
          individual_gender: 'female',
          individual_last_name: user.profile.lastName,
          individual_last_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_last_name_kanji: '',
          individual_phone: '+81112345678'
        }
        req.uploads = {
          individual_verification_document_back: TestHelper['success_id_scan_back.png'],
          individual_verification_document_front: TestHelper['success_id_scan_front.png']
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
          country: 'JP',
          type: 'individual'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const body = {
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          individual_address_kana_city: 'ｼﾌﾞﾔ',
          individual_address_kana_line1: '27-15',
          individual_address_kana_postal_code: '',
          individual_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          individual_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          individual_address_kanji_city: '渋谷区',
          individual_address_kanji_line1: '２７－１５',
          individual_address_kanji_postal_code: '1500001',
          individual_address_kanji_state: '東京都',
          individual_address_kanji_town: '神宮前 ３丁目',
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_email: user.profile.contactEmail,
          individual_first_name: user.profile.firstName,
          individual_first_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_first_name_kanji: '東京都',
          individual_gender: 'female',
          individual_last_name: user.profile.lastName,
          individual_last_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_last_name_kanji: '東京都',
          individual_phone: '+81112345678'
        }
        req.uploads = {
          individual_verification_document_back: TestHelper['success_id_scan_back.png'],
          individual_verification_document_front: TestHelper['success_id_scan_front.png']
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
          country: 'JP',
          type: 'individual'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const body = {
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          individual_address_kana_city: 'ｼﾌﾞﾔ',
          individual_address_kana_line1: '27-15',
          individual_address_kana_postal_code: '1500001',
          individual_address_kana_state: '',
          individual_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          individual_address_kanji_city: '渋谷区',
          individual_address_kanji_line1: '２７－１５',
          individual_address_kanji_postal_code: '1500001',
          individual_address_kanji_state: '東京都',
          individual_address_kanji_town: '神宮前 ３丁目',
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_email: user.profile.contactEmail,
          individual_first_name: user.profile.firstName,
          individual_first_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_first_name_kanji: '東京都',
          individual_gender: 'female',
          individual_last_name: user.profile.lastName,
          individual_last_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_last_name_kanji: '東京都',
          individual_phone: '+81112345678'
        }
        req.uploads = {
          individual_verification_document_back: TestHelper['success_id_scan_back.png'],
          individual_verification_document_front: TestHelper['success_id_scan_front.png']
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
          country: 'JP',
          type: 'individual'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const body = {
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          individual_address_kana_city: '',
          individual_address_kana_line1: '27-15',
          individual_address_kana_postal_code: '1500001',
          individual_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          individual_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          individual_address_kanji_city: '渋谷区',
          individual_address_kanji_line1: '２７－１５',
          individual_address_kanji_postal_code: '1500001',
          individual_address_kanji_state: '東京都',
          individual_address_kanji_town: '神宮前 ３丁目',
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_email: user.profile.contactEmail,
          individual_first_name: user.profile.firstName,
          individual_first_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_first_name_kanji: '東京都',
          individual_gender: 'female',
          individual_last_name: user.profile.lastName,
          individual_last_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_last_name_kanji: '東京都',
          individual_phone: '+81112345678'
        }
        req.uploads = {
          individual_verification_document_back: TestHelper['success_id_scan_back.png'],
          individual_verification_document_front: TestHelper['success_id_scan_front.png']
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
          country: 'JP',
          type: 'individual'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const body = {
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          individual_address_kana_city: 'ｼﾌﾞﾔ',
          individual_address_kana_line1: '27-15',
          individual_address_kana_postal_code: '1500001',
          individual_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          individual_address_kana_town: '',
          individual_address_kanji_city: '渋谷区',
          individual_address_kanji_line1: '２７－１５',
          individual_address_kanji_postal_code: '1500001',
          individual_address_kanji_state: '東京都',
          individual_address_kanji_town: '神宮前 ３丁目',
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_email: user.profile.contactEmail,
          individual_first_name: user.profile.firstName,
          individual_first_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_first_name_kanji: '東京都',
          individual_gender: 'female',
          individual_last_name: user.profile.lastName,
          individual_last_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_last_name_kanji: '東京都',
          individual_phone: '+81112345678'
        }
        req.uploads = {
          individual_verification_document_back: TestHelper['success_id_scan_back.png'],
          individual_verification_document_front: TestHelper['success_id_scan_front.png']
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
          country: 'JP',
          type: 'individual'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const body = {
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          individual_address_kana_city: 'ｼﾌﾞﾔ',
          individual_address_kana_line1: '',
          individual_address_kana_postal_code: '1500001',
          individual_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          individual_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          individual_address_kanji_city: '渋谷区',
          individual_address_kanji_line1: '２７－１５',
          individual_address_kanji_postal_code: '1500001',
          individual_address_kanji_state: '東京都',
          individual_address_kanji_town: '神宮前 ３丁目',
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_email: user.profile.contactEmail,
          individual_first_name: user.profile.firstName,
          individual_first_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_first_name_kanji: '東京都',
          individual_gender: 'female',
          individual_last_name: user.profile.lastName,
          individual_last_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_last_name_kanji: '東京都',
          individual_phone: '+81112345678'
        }
        req.uploads = {
          individual_verification_document_back: TestHelper['success_id_scan_back.png'],
          individual_verification_document_front: TestHelper['success_id_scan_front.png']
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
          country: 'JP',
          type: 'individual'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const body = {
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          individual_address_kana_city: 'ｼﾌﾞﾔ',
          individual_address_kana_line1: '27-15',
          individual_address_kana_postal_code: '1500001',
          individual_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          individual_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          individual_address_kanji_city: '渋谷区',
          individual_address_kanji_line1: '２７－１５',
          individual_address_kanji_postal_code: '',
          individual_address_kanji_state: '東京都',
          individual_address_kanji_town: '神宮前　３丁目',
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_email: user.profile.contactEmail,
          individual_first_name: user.profile.firstName,
          individual_first_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_first_name_kanji: '東京都',
          individual_gender: 'female',
          individual_last_name: user.profile.lastName,
          individual_last_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_last_name_kanji: '東京都',
          individual_phone: '011-6789-0123'
        }
        req.uploads = {
          individual_verification_document_back: TestHelper['success_id_scan_back.png'],
          individual_verification_document_front: TestHelper['success_id_scan_front.png']
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
          country: 'JP',
          type: 'individual'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const body = {
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          individual_address_kana_city: 'ｼﾌﾞﾔ',
          individual_address_kana_line1: '27-15',
          individual_address_kana_postal_code: '1500001',
          individual_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          individual_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          individual_address_kanji_city: '渋谷区',
          individual_address_kanji_line1: '２７－１５',
          individual_address_kanji_postal_code: '1500001',
          individual_address_kanji_state: '',
          individual_address_kanji_town: '神宮前 ３丁目',
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_email: user.profile.contactEmail,
          individual_first_name: user.profile.firstName,
          individual_first_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_first_name_kanji: '東京都',
          individual_gender: 'female',
          individual_last_name: user.profile.lastName,
          individual_last_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_last_name_kanji: '東京都',
          individual_phone: '+81112345678'
        }
        req.uploads = {
          individual_verification_document_back: TestHelper['success_id_scan_back.png'],
          individual_verification_document_front: TestHelper['success_id_scan_front.png']
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
          country: 'JP',
          type: 'individual'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const body = {
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          individual_address_kana_city: 'ｼﾌﾞﾔ',
          individual_address_kana_line1: '27-15',
          individual_address_kana_postal_code: '1500001',
          individual_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          individual_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          individual_address_kanji_city: '',
          individual_address_kanji_line1: '２７－１５',
          individual_address_kanji_postal_code: '1500001',
          individual_address_kanji_state: '東京都',
          individual_address_kanji_town: '神宮前 ３丁目',
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_email: user.profile.contactEmail,
          individual_first_name: user.profile.firstName,
          individual_first_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_first_name_kanji: '東京都',
          individual_gender: 'female',
          individual_last_name: user.profile.lastName,
          individual_last_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_last_name_kanji: '東京都',
          individual_phone: '+81112345678'
        }
        req.uploads = {
          individual_verification_document_back: TestHelper['success_id_scan_back.png'],
          individual_verification_document_front: TestHelper['success_id_scan_front.png']
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
          country: 'JP',
          type: 'individual'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const body = {
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          individual_address_kana_city: 'ｼﾌﾞﾔ',
          individual_address_kana_line1: '27-15',
          individual_address_kana_postal_code: '1500001',
          individual_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          individual_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          individual_address_kanji_city: '渋谷区',
          individual_address_kanji_line1: '２７－１５',
          individual_address_kanji_postal_code: '1500001',
          individual_address_kanji_state: '東京都',
          individual_address_kanji_town: '',
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_email: user.profile.contactEmail,
          individual_first_name: user.profile.firstName,
          individual_first_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_first_name_kanji: '東京都',
          individual_gender: 'female',
          individual_last_name: user.profile.lastName,
          individual_last_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_last_name_kanji: '東京都',
          individual_phone: '+81112345678'
        }
        req.uploads = {
          individual_verification_document_back: TestHelper['success_id_scan_back.png'],
          individual_verification_document_front: TestHelper['success_id_scan_front.png']
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
          country: 'JP',
          type: 'individual'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const body = {
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          individual_address_kana_city: 'ｼﾌﾞﾔ',
          individual_address_kana_line1: '27-15',
          individual_address_kana_postal_code: '1500001',
          individual_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          individual_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          individual_address_kanji_city: '渋谷区',
          individual_address_kanji_line1: '',
          individual_address_kanji_postal_code: '1500001',
          individual_address_kanji_state: '東京都',
          individual_address_kanji_town: '神宮前 ３丁目',
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_email: user.profile.contactEmail,
          individual_first_name: user.profile.firstName,
          individual_first_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_first_name_kanji: '東京都',
          individual_gender: 'female',
          individual_last_name: user.profile.lastName,
          individual_last_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_last_name_kanji: '東京都',
          individual_phone: '+81112345678'
        }
        req.uploads = {
          individual_verification_document_back: TestHelper['success_id_scan_back.png'],
          individual_verification_document_front: TestHelper['success_id_scan_front.png']
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

  describe('receives', () => {
    it('required posted business_profile_mcc', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'NZ',
        type: 'individual'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        individual_address_city: 'Auckland',
        individual_address_line1: '844 Fleet Street',
        individual_address_postal_code: '6011',
        individual_address_state: 'N',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_email: user.profile.contactEmail,
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName,
        individual_phone: '456-789-0123'
      }
      req.uploads = {
        individual_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        individual_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        individual_verification_document_back: TestHelper['success_id_scan_back.png'],
        individual_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registrationNow.business_profile_mcc, '8931')
    })

    it('optionally-required posted business_profile_url', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'NZ',
        type: 'individual'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        individual_address_city: 'Auckland',
        individual_address_line1: '844 Fleet Street',
        individual_address_postal_code: '6011',
        individual_address_state: 'N',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_email: user.profile.contactEmail,
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName,
        individual_phone: '456-789-0123'
      }
      req.uploads = {
        individual_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        individual_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        individual_verification_document_back: TestHelper['success_id_scan_back.png'],
        individual_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registrationNow.business_profile_url, 'https://' + user.profile.contactEmail.split('@')[1])
    })

    it('optionally-required posted business_profile_product_description', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'NZ',
        type: 'individual'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const body = {
        business_profile_mcc: '8931',
        business_profile_product_description: 'Things',
        individual_address_city: 'Auckland',
        individual_address_line1: '844 Fleet Street',
        individual_address_postal_code: '6011',
        individual_address_state: 'N',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_email: user.profile.contactEmail,
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName,
        individual_phone: '456-789-0123'
      }
      req.uploads = {
        individual_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        individual_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        individual_verification_document_back: TestHelper['success_id_scan_back.png'],
        individual_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registrationNow.business_profile_product_description, 'Things')
    })

    it('required posted individual_dob_day', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'NZ',
        type: 'individual'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        individual_address_city: 'Auckland',
        individual_address_line1: '844 Fleet Street',
        individual_address_postal_code: '6011',
        individual_address_state: 'N',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_email: user.profile.contactEmail,
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName,
        individual_phone: '456-789-0123'
      }
      req.uploads = {
        individual_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        individual_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        individual_verification_document_back: TestHelper['success_id_scan_back.png'],
        individual_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registrationNow.individual_dob_day, '01')
    })

    it('required posted individual_dob_month', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'NZ',
        type: 'individual'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        individual_address_city: 'Auckland',
        individual_address_line1: '844 Fleet Street',
        individual_address_postal_code: '6011',
        individual_address_state: 'N',
        individual_dob_day: '1',
        individual_dob_month: '2',
        individual_dob_year: '1950',
        individual_email: user.profile.contactEmail,
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName,
        individual_phone: '456-789-0123'
      }
      req.uploads = {
        individual_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        individual_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        individual_verification_document_back: TestHelper['success_id_scan_back.png'],
        individual_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registrationNow.individual_dob_month, '02')
    })

    it('required posted individual_dob_year', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'NZ',
        type: 'individual'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        individual_address_city: 'Auckland',
        individual_address_line1: '844 Fleet Street',
        individual_address_postal_code: '6011',
        individual_address_state: 'N',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_email: user.profile.contactEmail,
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName,
        individual_phone: '456-789-0123'
      }
      req.uploads = {
        individual_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        individual_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        individual_verification_document_back: TestHelper['success_id_scan_back.png'],
        individual_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registrationNow.individual_dob_year, '1950')
    })

    it('required posted individual_first_name', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'NZ',
        type: 'individual'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        individual_address_city: 'Auckland',
        individual_address_line1: '844 Fleet Street',
        individual_address_postal_code: '6011',
        individual_address_state: 'N',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_email: user.profile.contactEmail,
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName,
        individual_phone: '456-789-0123'
      }
      req.uploads = {
        individual_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        individual_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        individual_verification_document_back: TestHelper['success_id_scan_back.png'],
        individual_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registrationNow.individual_first_name, user.profile.firstName)
    })

    it('required posted individual_last_name', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'NZ',
        type: 'individual'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        individual_address_city: 'Auckland',
        individual_address_line1: '844 Fleet Street',
        individual_address_postal_code: '6011',
        individual_address_state: 'N',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_email: user.profile.contactEmail,
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName,
        individual_phone: '456-789-0123'
      }
      req.uploads = {
        individual_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        individual_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        individual_verification_document_back: TestHelper['success_id_scan_back.png'],
        individual_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registrationNow.individual_last_name, user.profile.lastName)
    })

    it('optionally-required posted individual_email', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'NZ',
        type: 'individual'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        individual_address_city: 'Auckland',
        individual_address_line1: '844 Fleet Street',
        individual_address_postal_code: '6011',
        individual_address_state: 'N',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_email: user.profile.contactEmail,
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName,
        individual_phone: '456-789-0123'
      }
      req.uploads = {
        individual_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        individual_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        individual_verification_document_back: TestHelper['success_id_scan_back.png'],
        individual_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registrationNow.individual_email, user.profile.contactEmail)
    })

    it('optionally-required posted individual_phone', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'NZ',
        type: 'individual'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        individual_address_city: 'Auckland',
        individual_address_line1: '844 Fleet Street',
        individual_address_postal_code: '6011',
        individual_address_state: 'N',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_email: user.profile.contactEmail,
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName,
        individual_phone: '456-789-0123'
      }
      req.uploads = {
        individual_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        individual_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        individual_verification_document_back: TestHelper['success_id_scan_back.png'],
        individual_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registrationNow.individual_phone, '456-789-0123')
    })

    it('optionally-required posted individual_gender', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'JP',
        type: 'individual'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        individual_address_kana_city: 'ｼﾌﾞﾔ',
        individual_address_kana_line1: '27-15',
        individual_address_kana_postal_code: '1500001',
        individual_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        individual_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        individual_address_kanji_city: '渋谷区',
        individual_address_kanji_line1: '２７－１５',
        individual_address_kanji_postal_code: '1500001',
        individual_address_kanji_state: '東京都',
        individual_address_kanji_town: '神宮前　３丁目',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_email: user.profile.contactEmail,
        individual_first_name: user.profile.firstName,
        individual_first_name_kana: 'ﾄｳｷﾖｳﾄ',
        individual_first_name_kanji: '東京都',
        individual_gender: 'female',
        individual_last_name: user.profile.lastName,
        individual_last_name_kana: 'ﾄｳｷﾖｳﾄ',
        individual_last_name_kanji: '東京都',
        individual_phone: '011-6789-0123'
      }
      req.uploads = {
        individual_verification_document_back: TestHelper['success_id_scan_back.png'],
        individual_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registrationNow.individual_gender, 'female')
    })

    it('optionally-required posted individual_ssn_last_4', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'individual'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        individual_address_city: 'New York',
        individual_address_line1: '285 Fulton St',
        individual_address_postal_code: '10007',
        individual_address_state: 'NY',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_email: user.profile.contactEmail,
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName,
        individual_phone: '456-789-0123',
        individual_ssn_last_4: '0000'
      }
      req.uploads = {
        individual_verification_document_back: TestHelper['success_id_scan_back.png'],
        individual_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registrationNow.individual_ssn_last_4, '0000')
    })

    it('optionally-required posted individual_id_number', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'CA',
        type: 'individual'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        individual_address_city: 'Vancouver',
        individual_address_line1: '123 Sesame St',
        individual_address_postal_code: 'V5K 0A1',
        individual_address_state: 'BC',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_email: user.profile.contactEmail,
        individual_first_name: user.profile.firstName,
        individual_id_number: '000000000',
        individual_last_name: user.profile.lastName,
        individual_phone: '456-789-0123'
      }
      req.uploads = {
        individual_verification_document_back: TestHelper['success_id_scan_back.png'],
        individual_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registrationNow.individual_id_number, '000000000')
    })

    it('optionally-required posted individual_address_state', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'NZ',
        type: 'individual'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        individual_address_city: 'Auckland',
        individual_address_line1: '844 Fleet Street',
        individual_address_postal_code: '6011',
        individual_address_state: 'N',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_email: user.profile.contactEmail,
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName,
        individual_phone: '456-789-0123'
      }
      req.uploads = {
        individual_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        individual_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        individual_verification_document_back: TestHelper['success_id_scan_back.png'],
        individual_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registrationNow.individual_address_state, 'N')
    })

    it('optionally-required posted individual_address_postal_code', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'NZ',
        type: 'individual'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        individual_address_city: 'Auckland',
        individual_address_line1: '844 Fleet Street',
        individual_address_postal_code: '6011',
        individual_address_state: 'N',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_email: user.profile.contactEmail,
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName,
        individual_phone: '456-789-0123'
      }
      req.uploads = {
        individual_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        individual_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        individual_verification_document_back: TestHelper['success_id_scan_back.png'],
        individual_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registrationNow.individual_address_postal_code, '6011')
    })

    it('optionally-required posted individual_address_line1', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'NZ',
        type: 'individual'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        individual_address_city: 'Auckland',
        individual_address_line1: '844 Fleet Street',
        individual_address_postal_code: '6011',
        individual_address_state: 'N',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_email: user.profile.contactEmail,
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName,
        individual_phone: '456-789-0123'
      }
      req.uploads = {
        individual_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        individual_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        individual_verification_document_back: TestHelper['success_id_scan_back.png'],
        individual_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registrationNow.individual_address_line1, '844 Fleet Street')
    })

    it('optional posted individual_address_line2', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'NZ',
        type: 'individual'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        individual_address_city: 'Auckland',
        individual_address_line1: '844 Fleet Street',
        individual_address_line2: 'More details',
        individual_address_postal_code: '6011',
        individual_address_state: 'N',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_email: user.profile.contactEmail,
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName,
        individual_phone: '456-789-0123'
      }
      req.uploads = {
        individual_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        individual_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        individual_verification_document_back: TestHelper['success_id_scan_back.png'],
        individual_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registrationNow.individual_address_line2, 'More details')
    })

    it('optionally-required posted individual_first_name_kana', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'JP',
        type: 'individual'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        individual_address_kana_city: 'ｼﾌﾞﾔ',
        individual_address_kana_line1: '27-15',
        individual_address_kana_postal_code: '1500001',
        individual_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        individual_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        individual_address_kanji_city: '渋谷区',
        individual_address_kanji_line1: '２７－１５',
        individual_address_kanji_postal_code: '1500001',
        individual_address_kanji_state: '東京都',
        individual_address_kanji_town: '神宮前　３丁目',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_email: user.profile.contactEmail,
        individual_first_name: user.profile.firstName,
        individual_first_name_kana: 'ﾄｳｷﾖｳﾄ',
        individual_first_name_kanji: '東京都',
        individual_gender: 'female',
        individual_last_name: user.profile.lastName,
        individual_last_name_kana: 'ﾄｳｷﾖｳﾄ',
        individual_last_name_kanji: '東京都',
        individual_phone: '011-6789-0123'
      }
      req.uploads = {
        individual_verification_document_back: TestHelper['success_id_scan_back.png'],
        individual_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registrationNow.individual_first_name_kana, 'ﾄｳｷﾖｳﾄ')
    })

    it('optionally-required posted individual_last_name_kana', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'JP',
        type: 'individual'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        individual_address_kana_city: 'ｼﾌﾞﾔ',
        individual_address_kana_line1: '27-15',
        individual_address_kana_postal_code: '1500001',
        individual_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        individual_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        individual_address_kanji_city: '渋谷区',
        individual_address_kanji_line1: '２７－１５',
        individual_address_kanji_postal_code: '1500001',
        individual_address_kanji_state: '東京都',
        individual_address_kanji_town: '神宮前　３丁目',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_email: user.profile.contactEmail,
        individual_first_name: user.profile.firstName,
        individual_first_name_kana: 'ﾄｳｷﾖｳﾄ',
        individual_first_name_kanji: '東京都',
        individual_gender: 'female',
        individual_last_name: user.profile.lastName,
        individual_last_name_kana: 'ﾄｳｷﾖｳﾄ',
        individual_last_name_kanji: '東京都',
        individual_phone: '011-6789-0123'
      }
      req.uploads = {
        individual_verification_document_back: TestHelper['success_id_scan_back.png'],
        individual_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registrationNow.individual_last_name_kana, 'ﾄｳｷﾖｳﾄ')
    })

    it('optionally-required posted individual_address_kana_town', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'JP',
        type: 'individual'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        individual_address_kana_city: 'ｼﾌﾞﾔ',
        individual_address_kana_line1: '27-15',
        individual_address_kana_postal_code: '1500001',
        individual_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        individual_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        individual_address_kanji_city: '渋谷区',
        individual_address_kanji_line1: '２７－１５',
        individual_address_kanji_postal_code: '1500001',
        individual_address_kanji_state: '東京都',
        individual_address_kanji_town: '神宮前　３丁目',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_email: user.profile.contactEmail,
        individual_first_name: user.profile.firstName,
        individual_first_name_kana: 'ﾄｳｷﾖｳﾄ',
        individual_first_name_kanji: '東京都',
        individual_gender: 'female',
        individual_last_name: user.profile.lastName,
        individual_last_name_kana: 'ﾄｳｷﾖｳﾄ',
        individual_last_name_kanji: '東京都',
        individual_phone: '011-6789-0123'
      }
      req.uploads = {
        individual_verification_document_back: TestHelper['success_id_scan_back.png'],
        individual_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registrationNow.individual_address_kana_town, 'ｼﾞﾝｸﾞｳﾏｴ 3-')
    })

    it('optionally-required posted individual_address_kana_state', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'JP',
        type: 'individual'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        individual_address_kana_city: 'ｼﾌﾞﾔ',
        individual_address_kana_line1: '27-15',
        individual_address_kana_postal_code: '1500001',
        individual_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        individual_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        individual_address_kanji_city: '渋谷区',
        individual_address_kanji_line1: '２７－１５',
        individual_address_kanji_postal_code: '1500001',
        individual_address_kanji_state: '東京都',
        individual_address_kanji_town: '神宮前　３丁目',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_email: user.profile.contactEmail,
        individual_first_name: user.profile.firstName,
        individual_first_name_kana: 'ﾄｳｷﾖｳﾄ',
        individual_first_name_kanji: '東京都',
        individual_gender: 'female',
        individual_last_name: user.profile.lastName,
        individual_last_name_kana: 'ﾄｳｷﾖｳﾄ',
        individual_last_name_kanji: '東京都',
        individual_phone: '011-6789-0123'
      }
      req.uploads = {
        individual_verification_document_back: TestHelper['success_id_scan_back.png'],
        individual_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registrationNow.individual_address_kana_state, 'ﾄｳｷﾖｳﾄ')
    })

    it('optionally-required posted individual_address_kana_postal_code', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'JP',
        type: 'individual'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        individual_address_kana_city: 'ｼﾌﾞﾔ',
        individual_address_kana_line1: '27-15',
        individual_address_kana_postal_code: '1500001',
        individual_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        individual_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        individual_address_kanji_city: '渋谷区',
        individual_address_kanji_line1: '２７－１５',
        individual_address_kanji_postal_code: '1500001',
        individual_address_kanji_state: '東京都',
        individual_address_kanji_town: '神宮前　３丁目',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_email: user.profile.contactEmail,
        individual_first_name: user.profile.firstName,
        individual_first_name_kana: 'ﾄｳｷﾖｳﾄ',
        individual_first_name_kanji: '東京都',
        individual_gender: 'female',
        individual_last_name: user.profile.lastName,
        individual_last_name_kana: 'ﾄｳｷﾖｳﾄ',
        individual_last_name_kanji: '東京都',
        individual_phone: '011-6789-0123'
      }
      req.uploads = {
        individual_verification_document_back: TestHelper['success_id_scan_back.png'],
        individual_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registrationNow.individual_address_kana_postal_code, '1500001')
    })

    it('optionally-required posted individual_address_kana_line1', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'JP',
        type: 'individual'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        individual_address_kana_city: 'ｼﾌﾞﾔ',
        individual_address_kana_line1: '27-15',
        individual_address_kana_postal_code: '1500001',
        individual_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        individual_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        individual_address_kanji_city: '渋谷区',
        individual_address_kanji_line1: '２７－１５',
        individual_address_kanji_postal_code: '1500001',
        individual_address_kanji_state: '東京都',
        individual_address_kanji_town: '神宮前　３丁目',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_email: user.profile.contactEmail,
        individual_first_name: user.profile.firstName,
        individual_first_name_kana: 'ﾄｳｷﾖｳﾄ',
        individual_first_name_kanji: '東京都',
        individual_gender: 'female',
        individual_last_name: user.profile.lastName,
        individual_last_name_kana: 'ﾄｳｷﾖｳﾄ',
        individual_last_name_kanji: '東京都',
        individual_phone: '011-6789-0123'
      }
      req.uploads = {
        individual_verification_document_back: TestHelper['success_id_scan_back.png'],
        individual_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registrationNow.individual_address_kana_line1, '27-15')
    })

    it('optionally-required posted individual_first_name_kanji', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'JP',
        type: 'individual'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        individual_address_kana_city: 'ｼﾌﾞﾔ',
        individual_address_kana_line1: '27-15',
        individual_address_kana_postal_code: '1500001',
        individual_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        individual_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        individual_address_kanji_city: '渋谷区',
        individual_address_kanji_line1: '２７－１５',
        individual_address_kanji_postal_code: '1500001',
        individual_address_kanji_state: '東京都',
        individual_address_kanji_town: '神宮前　３丁目',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_email: user.profile.contactEmail,
        individual_first_name: user.profile.firstName,
        individual_first_name_kana: 'ﾄｳｷﾖｳﾄ',
        individual_first_name_kanji: '東京都',
        individual_gender: 'female',
        individual_last_name: user.profile.lastName,
        individual_last_name_kana: 'ﾄｳｷﾖｳﾄ',
        individual_last_name_kanji: '東京都',
        individual_phone: '011-6789-0123'
      }
      req.uploads = {
        individual_verification_document_back: TestHelper['success_id_scan_back.png'],
        individual_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registrationNow.individual_first_name_kanji, '東京都')
    })

    it('optionally-required posted individual_last_name_kanji', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'JP',
        type: 'individual'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        individual_address_kana_city: 'ｼﾌﾞﾔ',
        individual_address_kana_line1: '27-15',
        individual_address_kana_postal_code: '1500001',
        individual_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        individual_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        individual_address_kanji_city: '渋谷区',
        individual_address_kanji_line1: '２７－１５',
        individual_address_kanji_postal_code: '1500001',
        individual_address_kanji_state: '東京都',
        individual_address_kanji_town: '神宮前　３丁目',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_email: user.profile.contactEmail,
        individual_first_name: user.profile.firstName,
        individual_first_name_kana: 'ﾄｳｷﾖｳﾄ',
        individual_first_name_kanji: '東京都',
        individual_gender: 'female',
        individual_last_name: user.profile.lastName,
        individual_last_name_kana: 'ﾄｳｷﾖｳﾄ',
        individual_last_name_kanji: '東京都',
        individual_phone: '011-6789-0123'
      }
      req.uploads = {
        individual_verification_document_back: TestHelper['success_id_scan_back.png'],
        individual_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registrationNow.individual_last_name_kanji, '東京都')
    })

    it('optionally-required posted individual_address_kanji_state', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'JP',
        type: 'individual'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        individual_address_kana_city: 'ｼﾌﾞﾔ',
        individual_address_kana_line1: '27-15',
        individual_address_kana_postal_code: '1500001',
        individual_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        individual_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        individual_address_kanji_city: '渋谷区',
        individual_address_kanji_line1: '２７－１５',
        individual_address_kanji_postal_code: '1500001',
        individual_address_kanji_state: '東京都',
        individual_address_kanji_town: '神宮前　３丁目',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_email: user.profile.contactEmail,
        individual_first_name: user.profile.firstName,
        individual_first_name_kana: 'ﾄｳｷﾖｳﾄ',
        individual_first_name_kanji: '東京都',
        individual_gender: 'female',
        individual_last_name: user.profile.lastName,
        individual_last_name_kana: 'ﾄｳｷﾖｳﾄ',
        individual_last_name_kanji: '東京都',
        individual_phone: '011-6789-0123'
      }
      req.uploads = {
        individual_verification_document_back: TestHelper['success_id_scan_back.png'],
        individual_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registrationNow.individual_address_kanji_state, '東京都')
    })

    it('optionally-required posted individual_address_kanji_postal_code', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'JP',
        type: 'individual'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        individual_address_kana_city: 'ｼﾌﾞﾔ',
        individual_address_kana_line1: '27-15',
        individual_address_kana_postal_code: '1500001',
        individual_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        individual_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        individual_address_kanji_city: '渋谷区',
        individual_address_kanji_line1: '２７－１５',
        individual_address_kanji_postal_code: '1500001',
        individual_address_kanji_state: '東京都',
        individual_address_kanji_town: '神宮前　３丁目',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_email: user.profile.contactEmail,
        individual_first_name: user.profile.firstName,
        individual_first_name_kana: 'ﾄｳｷﾖｳﾄ',
        individual_first_name_kanji: '東京都',
        individual_gender: 'female',
        individual_last_name: user.profile.lastName,
        individual_last_name_kana: 'ﾄｳｷﾖｳﾄ',
        individual_last_name_kanji: '東京都',
        individual_phone: '011-6789-0123'
      }
      req.uploads = {
        individual_verification_document_back: TestHelper['success_id_scan_back.png'],
        individual_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registrationNow.individual_address_kanji_postal_code, '1500001')
    })

    it('optionally-required posted individual_address_kanji_line1', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'JP',
        type: 'individual'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        individual_address_kana_city: 'ｼﾌﾞﾔ',
        individual_address_kana_line1: '27-15',
        individual_address_kana_postal_code: '1500001',
        individual_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        individual_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        individual_address_kanji_city: '渋谷区',
        individual_address_kanji_line1: '２７－１５',
        individual_address_kanji_postal_code: '1500001',
        individual_address_kanji_state: '東京都',
        individual_address_kanji_town: '神宮前　３丁目',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_email: user.profile.contactEmail,
        individual_first_name: user.profile.firstName,
        individual_first_name_kana: 'ﾄｳｷﾖｳﾄ',
        individual_first_name_kanji: '東京都',
        individual_gender: 'female',
        individual_last_name: user.profile.lastName,
        individual_last_name_kana: 'ﾄｳｷﾖｳﾄ',
        individual_last_name_kanji: '東京都',
        individual_phone: '011-6789-0123'
      }
      req.uploads = {
        individual_verification_document_back: TestHelper['success_id_scan_back.png'],
        individual_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registrationNow.individual_address_kanji_line1, '２７－１５')
    })

    it('optionally-required posted individual_address_kanji_town', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'JP',
        type: 'individual'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        individual_address_kana_city: 'ｼﾌﾞﾔ',
        individual_address_kana_line1: '27-15',
        individual_address_kana_postal_code: '1500001',
        individual_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        individual_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        individual_address_kanji_city: '渋谷区',
        individual_address_kanji_line1: '２７－１５',
        individual_address_kanji_postal_code: '1500001',
        individual_address_kanji_state: '東京都',
        individual_address_kanji_town: '神宮前　３丁目',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_email: user.profile.contactEmail,
        individual_first_name: user.profile.firstName,
        individual_first_name_kana: 'ﾄｳｷﾖｳﾄ',
        individual_first_name_kanji: '東京都',
        individual_gender: 'female',
        individual_last_name: user.profile.lastName,
        individual_last_name_kana: 'ﾄｳｷﾖｳﾄ',
        individual_last_name_kanji: '東京都',
        individual_phone: '011-6789-0123'
      }
      req.uploads = {
        individual_verification_document_back: TestHelper['success_id_scan_back.png'],
        individual_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.strictEqual(registrationNow.individual_address_kanji_town, '神宮前　３丁目')
    })

    it('optionally-required posted file individual_verification_document_front', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'NZ',
        type: 'individual'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        individual_address_city: 'Auckland',
        individual_address_line1: '844 Fleet Street',
        individual_address_postal_code: '6011',
        individual_address_state: 'N',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_email: user.profile.contactEmail,
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName,
        individual_phone: '456-789-0123'
      }
      req.uploads = {
        individual_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        individual_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        individual_verification_document_back: TestHelper['success_id_scan_back.png'],
        individual_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.notStrictEqual(registrationNow.individual_verification_document_front, null)
      assert.notStrictEqual(registrationNow.individual_verification_document_front, undefined)
    })

    it('optionally-required posted file individual_verification_document_back', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'NZ',
        type: 'individual'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        individual_address_city: 'Auckland',
        individual_address_line1: '844 Fleet Street',
        individual_address_postal_code: '6011',
        individual_address_state: 'N',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_email: user.profile.contactEmail,
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName,
        individual_phone: '456-789-0123'
      }
      req.uploads = {
        individual_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        individual_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        individual_verification_document_back: TestHelper['success_id_scan_back.png'],
        individual_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.notStrictEqual(registrationNow.individual_verification_document_back, null)
      assert.notStrictEqual(registrationNow.individual_verification_document_back, undefined)
    })

    it('optionally-required posted file individual_verification_additional_document_front', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'NZ',
        type: 'individual'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        individual_address_city: 'Auckland',
        individual_address_line1: '844 Fleet Street',
        individual_address_postal_code: '6011',
        individual_address_state: 'N',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_email: user.profile.contactEmail,
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName,
        individual_phone: '456-789-0123'
      }
      req.uploads = {
        individual_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        individual_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        individual_verification_document_back: TestHelper['success_id_scan_back.png'],
        individual_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.notStrictEqual(registrationNow.individual_verification_additional_document_front, null)
      assert.notStrictEqual(registrationNow.individual_verification_additional_document_front, undefined)
    })

    it('optionally-required posted file individual_verification_additional_document_back', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'NZ',
        type: 'individual'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        individual_address_city: 'Auckland',
        individual_address_line1: '844 Fleet Street',
        individual_address_postal_code: '6011',
        individual_address_state: 'N',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_email: user.profile.contactEmail,
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName,
        individual_phone: '456-789-0123'
      }
      req.uploads = {
        individual_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        individual_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        individual_verification_document_back: TestHelper['success_id_scan_back.png'],
        individual_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      req.body = TestHelper.createMultiPart(req, body)
      const accountNow = await req.patch()
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.notStrictEqual(registrationNow.individual_verification_additional_document_back, null)
      assert.notStrictEqual(registrationNow.individual_verification_additional_document_back, undefined)
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
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = postData[country.id] 
        if (country.id !== 'JP') {
          req.body.individual_email = user.profile.contactEmail
          req.body.individual_first_name = user.profile.firstName
          req.body.individual_last_name = user.profile.lastName
        }
        if (connect.kycRequirements[country.id].individual.indexOf('individual.verification.document.front') > -1) {
          req.uploads = {
            individual_verification_document_front: TestHelper['success_id_scan_back.png'],
            individual_verification_document_back: TestHelper['success_id_scan_back.png']
          }
          if (connect.kycRequirements[country.id].individual.indexOf('individual.verification.additional_document.front') > -1) {
            req.uploads.individual_verification_additional_document_front = TestHelper['success_id_scan_back.png']
            req.uploads.individual_verification_additional_document_back = TestHelper['success_id_scan_back.png']
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
        type: 'individual'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.waitOnSubmit = true
      req.account = user.account
      req.session = user.session
      req.body = postData['US']
      req.uploads = {
        individual_verification_document_back: TestHelper['success_id_scan_back.png'],
        individual_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      req.body = TestHelper.createMultiPart(req, req.body)
      await req.post()
      const accountNow = await global.api.user.connect.StripeAccount.get(req)
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.notStrictEqual(registrationNow.individualToken, null)
      assert.notStrictEqual(registrationNow.individualToken, undefined)
    })
  })
})

const postData = {
  AT: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    individual_address_city: 'Vienna',
    individual_address_line1: '123 Sesame St',
    individual_address_postal_code: '1020',
    individual_address_state: '1',
    individual_dob_day: '1',
    individual_dob_month: '1',
    individual_dob_year: '1950',
    individual_phone: '456-789-0123'
  },
  AU: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    individual_address_city: 'Brisbane',
    individual_address_line1: '845 Oxford St',
    individual_address_postal_code: '4000',
    individual_address_state: 'QLD',
    individual_dob_day: '1',
    individual_dob_month: '1',
    individual_dob_year: '1950',
    individual_phone: '456-789-0123'
  },
  BE: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    individual_address_city: 'Brussels',
    individual_address_line1: '123 Sesame St',
    individual_address_postal_code: '1020',
    individual_address_state: 'BRU',
    individual_dob_day: '1',
    individual_dob_month: '1',
    individual_dob_year: '1950',
    individual_phone: '456-789-0123'
  },
  CA: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    individual_address_city: 'Vancouver',
    individual_address_line1: '123 Sesame St',
    individual_address_postal_code: 'V5K 0A1',
    individual_address_state: 'BC',
    individual_dob_day: '1',
    individual_dob_month: '1',
    individual_dob_year: '1950',
    individual_id_number: '000000000',
    individual_phone: '456-789-0123'
  },
  CH: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    individual_address_city: 'Bern',
    individual_address_line1: '123 Sesame St',
    individual_address_postal_code: '1020',
    individual_address_state: 'BE',
    individual_dob_day: '1',
    individual_dob_month: '1',
    individual_dob_year: '1950',
    individual_phone: '456-789-0123'
  },
  DE: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    individual_address_city: 'Berlin',
    individual_address_line1: '123 Sesame St',
    individual_address_postal_code: '01067',
    individual_address_state: 'BE',
    individual_dob_day: '1',
    individual_dob_month: '1',
    individual_dob_year: '1950',
    individual_phone: '456-789-0123'
  },
  DK: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    individual_address_city: 'Copenhagen',
    individual_address_line1: '123 Sesame St',
    individual_address_postal_code: '1000',
    individual_address_state: '147',
    individual_dob_day: '1',
    individual_dob_month: '1',
    individual_dob_year: '1950',
    individual_phone: '456-789-0123'
  },
  EE: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    individual_address_city: 'Tallinn',
    individual_address_line1: '123 Sesame St',
    individual_address_postal_code: '10128',
    individual_address_state: '37',
    individual_dob_day: '1',
    individual_dob_month: '1',
    individual_dob_year: '1950',
    individual_phone: '456-789-0123'
  },
  ES: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    individual_address_city: 'Madrid',
    individual_address_line1: '123 Park Lane',
    individual_address_postal_code: '03179',
    individual_address_state: 'AN',
    individual_name: 'Individual',
    individual_phone: '456-789-0123',
    individual_tax_id: '00000000000'
  },
  FI: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    individual_address_city: 'Helsinki',
    individual_address_line1: '123 Sesame St',
    individual_address_postal_code: '00990',
    individual_address_state: 'AL',
    individual_dob_day: '1',
    individual_dob_month: '1',
    individual_dob_year: '1950',
    individual_phone: '456-789-0123'
  },
  FR: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    individual_address_city: 'Paris',
    individual_address_line1: '123 Sesame St',
    individual_address_postal_code: '75001',
    individual_address_state: 'A',
    individual_dob_day: '1',
    individual_dob_month: '1',
    individual_dob_year: '1950',
    individual_phone: '456-789-0123'
  },
  GB:{
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    individual_address_city: 'London',
    individual_address_line1: '123 Sesame St',
    individual_address_postal_code: 'EC1A 1AA',
    individual_address_state: 'LND',
    individual_dob_day: '1',
    individual_dob_month: '1',
    individual_dob_year: '1950',
    individual_phone: '456-789-0123'
  },
  GR: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    individual_address_city: 'Athens',
    individual_address_line1: '123 Park Lane',
    individual_address_postal_code: '104',
    individual_address_state: 'I',
    individual_phone: '456-789-0123',
    individual_tax_id: '00000000000'
  },
  HK: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    individual_address_city: 'Hong Kong',
    individual_address_line1: '123 Sesame St',
    individual_address_postal_code: '999077',
    individual_address_state: 'HK',
    individual_dob_day: '1',
    individual_dob_month: '1',
    individual_dob_year: '1950',
    individual_id_number: '000000000',
    individual_phone: '456-789-0123'
  },
  IE: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    individual_address_city: 'Dublin',
    individual_address_line1: '123 Sesame St',
    individual_address_postal_code: 'Dublin 1',
    individual_address_state: 'D',
    individual_dob_day: '1',
    individual_dob_month: '1',
    individual_dob_year: '1950',
    individual_phone: '456-789-0123'
  },
  IT: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    individual_address_city: 'Rome',
    individual_address_line1: '123 Sesame St',
    individual_address_postal_code: '00010',
    individual_address_state: '65',
    individual_dob_day: '1',
    individual_dob_month: '1',
    individual_dob_year: '1950',
    individual_phone: '456-789-0123'
  },
  JP: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    individual_address_kana_city: 'ｼﾌﾞﾔ',
    individual_address_kana_line1: '27-15',
    individual_address_kana_postal_code: '1500001',
    individual_address_kana_state: 'ﾄｳｷﾖｳﾄ',
    individual_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
    individual_address_kanji_city: '渋谷区',
    individual_address_kanji_line1: '２７－１５',
    individual_address_kanji_postal_code: '1500001',
    individual_address_kanji_state: '東京都',
    individual_address_kanji_town: '神宮前 ３丁目',
    individual_dob_day: '1',
    individual_dob_month: '1',
    individual_dob_year: '1950',
    individual_first_name_kana: 'ﾄｳｷﾖｳﾄ',
    individual_first_name_kanji: '東京都',
    individual_gender: 'female',
    individual_last_name_kana: 'ﾄｳｷﾖｳﾄ',
    individual_last_name_kanji: '東京都',
    individual_phone: '+81112345678'
  },
  LT: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    individual_address_city: 'Vilnius',
    individual_address_line1: '123 Sesame St',
    individual_address_postal_code: 'LT-00000',
    individual_address_state: 'AL',
    individual_dob_day: '1',
    individual_dob_month: '1',
    individual_dob_year: '1950',
    individual_phone: '456-789-0123'
  },
  LU: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    individual_address_city: 'Luxemburg',
    individual_address_line1: '123 Sesame St',
    individual_address_postal_code: '1623',
    individual_address_state: 'L',
    individual_dob_day: '1',
    individual_dob_month: '1',
    individual_dob_year: '1950',
    individual_phone: '456-789-0123'
  },
  LV: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    individual_address_city: 'Riga',
    individual_address_line1: '123 Sesame St',
    individual_address_postal_code: 'LV–1073',
    individual_address_state: 'AI',
    individual_dob_day: '1',
    individual_dob_month: '1',
    individual_dob_year: '1950',
    individual_phone: '456-789-0123'
  },
  MY: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    individual_address_city: 'Kuala Lumpur',
    individual_address_line1: '123 Sesame St',
    individual_address_postal_code: '50450',
    individual_address_state: 'C',
    individual_dob_day: '1',
    individual_dob_month: '1',
    individual_dob_year: '1950',
    individual_phone: '456-789-0123'
  },
  NL: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    individual_address_city: 'Amsterdam',
    individual_address_line1: '123 Sesame St',
    individual_address_postal_code: '1071 JA',
    individual_address_state: 'DR',
    individual_dob_day: '1',
    individual_dob_month: '1',
    individual_dob_year: '1950',
    individual_phone: '456-789-0123'
  },
  NO: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    individual_address_city: 'Oslo',
    individual_address_line1: '123 Sesame St',
    individual_address_postal_code: '0001',
    individual_address_state: '02',
    individual_dob_day: '1',
    individual_dob_month: '1',
    individual_dob_year: '1950',
    individual_phone: '456-789-0123'
  },
  NZ: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    individual_address_city: 'Auckland',
    individual_address_line1: '844 Fleet Street',
    individual_address_postal_code: '6011',
    individual_address_state: 'N',
    individual_dob_day: '1',
    individual_dob_month: '1',
    individual_dob_year: '1950',
    individual_phone: '456-789-0123'
  },
  PL: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    individual_address_city: 'Krakow',
    individual_address_line1: '123 Park Lane',
    individual_address_postal_code: '32-400',
    individual_address_state: 'KR',
    individual_dob_day: '1',
    individual_dob_month: '1',
    individual_dob_year: '1950',
    individual_phone: '456-789-0123'
  },
  PT: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    individual_address_city: 'Lisbon',
    individual_address_line1: '123 Sesame St',
    individual_address_postal_code: '4520',
    individual_address_state: '01',
    individual_dob_day: '1',
    individual_dob_month: '1',
    individual_dob_year: '1950',
    individual_phone: '456-789-0123'
  },
  SE: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    individual_address_city: 'Stockholm',
    individual_address_line1: '123 Sesame St',
    individual_address_postal_code: '00150',
    individual_address_state: 'K',
    individual_dob_day: '1',
    individual_dob_month: '1',
    individual_dob_year: '1950',
    individual_phone: '456-789-0123'
  }, 
  SG: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    individual_address_city: 'Singapore',
    individual_address_line1: '123 Sesame St',
    individual_address_postal_code: '339696',
    individual_address_state: 'SG',
    individual_dob_day: '1',
    individual_dob_month: '1',
    individual_dob_year: '1950',
    individual_id_number: '000000000',
    individual_phone: '456-789-0123'
  },
  SI: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    individual_address_city: 'Ljubljana',
    individual_address_line1: '123 Sesame St',
    individual_address_postal_code: '1210',
    individual_dob_day: '1',
    individual_dob_month: '1',
    individual_dob_year: '1950',
    individual_phone: '456-789-0123'
  },
  SK: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    individual_address_city: 'Slovakia',
    individual_address_line1: '123 Sesame St',
    individual_address_postal_code: '00102',
    individual_dob_day: '1',
    individual_dob_month: '1',
    individual_dob_year: '1950',
    individual_phone: '456-789-0123'
  },
  US: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    individual_address_city: 'New York',
    individual_address_line1: '285 Fulton St',
    individual_address_postal_code: '10007',
    individual_address_state: 'NY',
    individual_dob_day: '1',
    individual_dob_month: '1',
    individual_dob_year: '1950',
    individual_phone: '456-789-0123',
    individual_ssn_last_4: '0000'
  }
}