/* eslint-env mocha */
const assert = require('assert')
const connect = require('../../../../../index.js')
const TestHelper = require('../../../../../test-helper.js')

describe('/api/user/connect/update-company-registration', () => {
  describe('exceptions', () => {
    describe('invalid-stripeid', () => {
      it('missing querystring stripeid', async () => {
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/connect/update-company-registration')
        req.account = user.account
        req.session = user.session
        req.body = {}
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
        const req = TestHelper.createRequest('/api/user/connect/update-company-registration?stripeid=invalid')
        req.account = user.account
        req.session = user.session
        req.body = {}
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
        const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          fileid: 'invalid'
        }
        req.body = {}
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
          company_address_line1: '123 Park Lane',
          company_address_postal_code: '10001',
          company_address_state: 'NY',
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          relationship_account_opener_dob_day: '1',
          relationship_account_opener_dob_month: '1',
          relationship_account_opener_dob_year: '1950',
          relationship_account_opener_first_name: user.profile.firstName,
          relationship_account_opener_last_name: user.profile.lastName,
          relationship_account_opener_executive: 'true',
          relationship_account_opener_title: 'Owner',
          relationship_account_opener_email: user.profile.contactEmail,
          relationship_account_opener_phone: '456-789-0123',
          // relationship_account_opener_id_number: '000000000',
          relationship_account_opener_ssn_last_4: '0000',
          relationship_account_opener_address_city: 'New York',
          relationship_account_opener_address_line1: '285 Fulton St',
          relationship_account_opener_address_postal_code: '10007'
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
        const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          fileid: 'invalid'
        }
        req.body = {}
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
        const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user2.account
        req.session = user2.session
        req.body = {}
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-account')
      })
    })

    describe('invalid-company_address_line1', () => {
      it('missing posted company_address_line1', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'AT'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          company_address_line1: '',
          company_address_postal_code: '1020',
          company_name: 'Company',
          company_tax_id: '8',
          company_address_city: 'Vienna',
          relationship_account_opener_dob_day: '1',
          relationship_account_opener_dob_month: '1',
          relationship_account_opener_dob_year: '1950',
          relationship_account_opener_first_name: user.profile.firstName,
          relationship_account_opener_last_name: user.profile.lastName,
          relationship_account_opener_executive: 'true',
          relationship_account_opener_title: 'Owner',
          relationship_account_opener_email: user.profile.contactEmail,
          relationship_account_opener_phone: '456-789-0123',
          relationship_account_opener_address_city: 'Vienna',
          relationship_account_opener_address_line1: '123 Sesame St',
          relationship_account_opener_address_postal_code: '1020'
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-company_address_line1')
      })
    })

    describe('invalid-company_address_postal_code', () => {
      it('missing posted company_address_postal_code', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'AT'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          company_address_line1: '123 Park Lane',
          company_address_postal_code: '',
          company_name: 'Company',
          company_tax_id: '8',
          company_address_city: 'Vienna',
          relationship_account_opener_dob_day: '1',
          relationship_account_opener_dob_month: '1',
          relationship_account_opener_dob_year: '1950',
          relationship_account_opener_first_name: user.profile.firstName,
          relationship_account_opener_last_name: user.profile.lastName,
          relationship_account_opener_executive: 'true',
          relationship_account_opener_title: 'Owner',
          relationship_account_opener_email: user.profile.contactEmail,
          relationship_account_opener_phone: '456-789-0123',
          relationship_account_opener_address_city: 'Vienna',
          relationship_account_opener_address_line1: '123 Sesame St',
          relationship_account_opener_address_postal_code: '1020'
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-company_address_postal_code')
      })
    })

    describe('invalid-company_name', () => {
      it('missing posted company_name', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'AT'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          company_address_line1: '123 Park Lane',
          company_address_postal_code: '1020',
          company_name: '',
          company_tax_id: '8',
          company_address_city: 'Vienna',
          relationship_account_opener_dob_day: '1',
          relationship_account_opener_dob_month: '1',
          relationship_account_opener_dob_year: '1950',
          relationship_account_opener_first_name: user.profile.firstName,
          relationship_account_opener_last_name: user.profile.lastName,
          relationship_account_opener_executive: 'true',
          relationship_account_opener_title: 'Owner',
          relationship_account_opener_email: user.profile.contactEmail,
          relationship_account_opener_phone: '456-789-0123',
          relationship_account_opener_address_city: 'Vienna',
          relationship_account_opener_address_line1: '123 Sesame St',
          relationship_account_opener_address_postal_code: '1020'
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-company_name')
      })
    })

    describe('invalid-company_tax_id', () => {
      it('missing posted company_tax_id', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'AT'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          company_address_line1: '123 Park Lane',
          company_address_postal_code: '1020',
          company_name: 'Company',
          company_tax_id: '',
          company_address_city: 'Vienna',
          relationship_account_opener_dob_day: '1',
          relationship_account_opener_dob_month: '1',
          relationship_account_opener_dob_year: '1950',
          relationship_account_opener_first_name: user.profile.firstName,
          relationship_account_opener_last_name: user.profile.lastName,
          relationship_account_opener_executive: 'true',
          relationship_account_opener_title: 'Owner',
          relationship_account_opener_email: user.profile.contactEmail,
          relationship_account_opener_phone: '456-789-0123',
          relationship_account_opener_address_city: 'Vienna',
          relationship_account_opener_address_line1: '123 Sesame St',
          relationship_account_opener_address_postal_code: '1020'
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-company_tax_id')
      })
    })

    describe('invalid-company_address_city', () => {
      it('missing posted company_address_line1', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'AT'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          company_address_line1: '123 Park Lane',
          company_address_postal_code: '1020',
          company_name: 'Company',
          company_tax_id: '8',
          company_address_city: '',
          relationship_account_opener_dob_day: '1',
          relationship_account_opener_dob_month: '1',
          relationship_account_opener_dob_year: '1950',
          relationship_account_opener_first_name: user.profile.firstName,
          relationship_account_opener_last_name: user.profile.lastName,
          relationship_account_opener_executive: 'true',
          relationship_account_opener_title: 'Owner',
          relationship_account_opener_email: user.profile.contactEmail,
          relationship_account_opener_phone: '456-789-0123',
          relationship_account_opener_address_city: 'Vienna',
          relationship_account_opener_address_line1: '123 Sesame St',
          relationship_account_opener_address_postal_code: '1020'
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-company_address_city')
      })
    })

    describe('invalid-company_address_state', () => {
      it('missing posted company_address_state', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'US'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          company_name: 'Company',
          company_tax_id: '8',
          company_phone: '456-123-7890',
          company_address_city: 'New York',
          company_address_line1: '285 Fulton St',
          company_address_postal_code: '10007',
          company_address_state: '',
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          relationship_account_opener_dob_day: '1',
          relationship_account_opener_dob_month: '1',
          relationship_account_opener_dob_year: '1950',
          relationship_account_opener_first_name: user.profile.firstName,
          relationship_account_opener_last_name: user.profile.lastName,
          relationship_account_opener_executive: 'true',
          relationship_account_opener_title: 'Owner',
          relationship_account_opener_email: user.profile.contactEmail,
          relationship_account_opener_phone: '456-789-0123',
          // relationship_account_opener_id_number: '000000000',
          relationship_account_opener_ssn_last_4: '0000',
          relationship_account_opener_address_city: 'New York',
          relationship_account_opener_address_line1: '285 Fulton St',
          relationship_account_opener_address_postal_code: '10007'
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-company_address_state')
      })
    })

    describe('invalid-business_profile_mcc', () => {
      it('missing posted business_profile_mcc', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'US'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
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
          business_profile_mcc: '',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          relationship_account_opener_dob_day: '1',
          relationship_account_opener_dob_month: '1',
          relationship_account_opener_dob_year: '1950',
          relationship_account_opener_first_name: user.profile.firstName,
          relationship_account_opener_last_name: user.profile.lastName,
          relationship_account_opener_executive: 'true',
          relationship_account_opener_title: 'Owner',
          relationship_account_opener_email: user.profile.contactEmail,
          relationship_account_opener_phone: '456-789-0123',
          // relationship_account_opener_id_number: '000000000',
          relationship_account_opener_ssn_last_4: '0000',
          relationship_account_opener_address_city: 'New York',
          relationship_account_opener_address_line1: '285 Fulton St',
          relationship_account_opener_address_postal_code: '10007'
        }
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
          type: 'company',
          country: 'US'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
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
          business_profile_mcc: '8931',
          business_profile_url: '',
          relationship_account_opener_dob_day: '1',
          relationship_account_opener_dob_month: '1',
          relationship_account_opener_dob_year: '1950',
          relationship_account_opener_first_name: user.profile.firstName,
          relationship_account_opener_last_name: user.profile.lastName,
          relationship_account_opener_executive: 'true',
          relationship_account_opener_title: 'Owner',
          relationship_account_opener_email: user.profile.contactEmail,
          relationship_account_opener_phone: '456-789-0123',
          // relationship_account_opener_id_number: '000000000',
          relationship_account_opener_ssn_last_4: '0000',
          relationship_account_opener_address_city: 'New York',
          relationship_account_opener_address_line1: '285 Fulton St',
          relationship_account_opener_address_postal_code: '10007'
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-business_profile_url')
      })
    })

    describe('invalid-relationship_account_opener_dob_day', () => {
      it('missing posted relationship_account_opener_dob_day', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'AT'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          company_address_line1: '123 Park Lane',
          company_address_postal_code: '1020',
          company_name: 'Company',
          company_tax_id: '8',
          company_address_city: 'Vienna',
          relationship_account_opener_dob_day: '',
          relationship_account_opener_dob_month: '1',
          relationship_account_opener_dob_year: '1950',
          relationship_account_opener_first_name: user.profile.firstName,
          relationship_account_opener_last_name: user.profile.lastName,
          relationship_account_opener_executive: 'true',
          relationship_account_opener_title: 'Owner',
          relationship_account_opener_email: user.profile.contactEmail,
          relationship_account_opener_phone: '456-789-0123',
          relationship_account_opener_address_city: 'Vienna',
          relationship_account_opener_address_line1: '123 Sesame St',
          relationship_account_opener_address_postal_code: '1020'
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_account_opener_dob_day')
      })
    })

    describe('invalid-relationship_account_opener_dob_month', () => {
      it('missing posted relationship_account_opener_dob_month', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'AT'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          company_address_line1: '123 Park Lane',
          company_address_postal_code: '1020',
          company_name: 'Company',
          company_tax_id: '8',
          company_address_city: 'Vienna',
          relationship_account_opener_dob_day: '1',
          relationship_account_opener_dob_month: '',
          relationship_account_opener_dob_year: '1950',
          relationship_account_opener_first_name: user.profile.firstName,
          relationship_account_opener_last_name: user.profile.lastName,
          relationship_account_opener_executive: 'true',
          relationship_account_opener_title: 'Owner',
          relationship_account_opener_email: user.profile.contactEmail,
          relationship_account_opener_phone: '456-789-0123',
          relationship_account_opener_address_city: 'Vienna',
          relationship_account_opener_address_line1: '123 Sesame St',
          relationship_account_opener_address_postal_code: '1020'
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_account_opener_dob_month')
      })
    })

    describe('invalid-relationship_account_opener_dob_year', () => {
      it('missing posted relationship_account_opener_dob_year', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'AT'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          company_address_line1: '123 Park Lane',
          company_address_postal_code: '1020',
          company_name: 'Company',
          company_tax_id: '8',
          company_address_city: 'Vienna',
          relationship_account_opener_dob_day: '1',
          relationship_account_opener_dob_month: '1',
          relationship_account_opener_dob_year: '',
          relationship_account_opener_first_name: user.profile.firstName,
          relationship_account_opener_last_name: user.profile.lastName,
          relationship_account_opener_executive: 'true',
          relationship_account_opener_title: 'Owner',
          relationship_account_opener_email: user.profile.contactEmail,
          relationship_account_opener_phone: '456-789-0123',
          relationship_account_opener_address_city: 'Vienna',
          relationship_account_opener_address_line1: '123 Sesame St',
          relationship_account_opener_address_postal_code: '1020'
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_account_opener_dob_year')
      })
    })

    describe('invalid-relationship_account_opener_first_name', () => {
      it('missing posted relationship_account_opener_first_name', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'AT'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          company_address_line1: '123 Park Lane',
          company_address_postal_code: '1020',
          company_name: 'Company',
          company_tax_id: '8',
          company_address_city: 'Vienna',
          relationship_account_opener_dob_day: '1',
          relationship_account_opener_dob_month: '1',
          relationship_account_opener_dob_year: '1950',
          relationship_account_opener_first_name: '',
          relationship_account_opener_last_name: user.profile.lastName,
          relationship_account_opener_executive: 'true',
          relationship_account_opener_title: 'Owner',
          relationship_account_opener_email: user.profile.contactEmail,
          relationship_account_opener_phone: '456-789-0123',
          relationship_account_opener_address_city: 'Vienna',
          relationship_account_opener_address_line1: '123 Sesame St',
          relationship_account_opener_address_postal_code: '1020'
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_account_opener_first_name')
      })
    })

    describe('invalid-relationship_account_opener_last_name', () => {
      it('missing posted relationship_account_opener_last_name', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'AT'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          company_address_line1: '123 Park Lane',
          company_address_postal_code: '1020',
          company_name: 'Company',
          company_tax_id: '8',
          company_address_city: 'Vienna',
          relationship_account_opener_dob_day: '1',
          relationship_account_opener_dob_month: '1',
          relationship_account_opener_dob_year: '1950',
          relationship_account_opener_first_name: user.profile.firstName,
          relationship_account_opener_last_name: '',
          relationship_account_opener_email: user.profile.contactEmail,
          relationship_account_opener_phone: '456-789-0123',
          relationship_account_opener_address_city: 'Vienna',
          relationship_account_opener_address_line1: '123 Sesame St',
          relationship_account_opener_address_postal_code: '1020'
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_account_opener_last_name')
      })
    })

    describe('invalid-relationship_account_opener_email', () => {
      it('missing posted relationship_account_opener_email', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'AT'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          company_address_line1: '123 Park Lane',
          company_address_postal_code: '1020',
          company_name: 'Company',
          company_tax_id: '8',
          company_address_city: 'Vienna',
          relationship_account_opener_dob_day: '1',
          relationship_account_opener_dob_month: '1',
          relationship_account_opener_dob_year: '1950',
          relationship_account_opener_first_name: user.profile.firstName,
          relationship_account_opener_last_name: user.profile.lastName,
          relationship_account_opener_executive: 'true',
          relationship_account_opener_title: 'Owner',
          relationship_account_opener_email: '',
          relationship_account_opener_phone: '456-789-0123',
          relationship_account_opener_address_city: 'Vienna',
          relationship_account_opener_address_line1: '123 Sesame St',
          relationship_account_opener_address_postal_code: '1020'
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_account_opener_email')
      })
    })

    describe('invalid-relationship_account_opener_phone', () => {
      it('missing posted relationship_account_opener_phone', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'AT'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          company_address_line1: '123 Park Lane',
          company_address_postal_code: '1020',
          company_name: 'Company',
          company_tax_id: '8',
          company_address_city: 'Vienna',
          relationship_account_opener_dob_day: '1',
          relationship_account_opener_dob_month: '1',
          relationship_account_opener_dob_year: '1950',
          relationship_account_opener_first_name: user.profile.firstName,
          relationship_account_opener_last_name: user.profile.lastName,
          relationship_account_opener_executive: 'true',
          relationship_account_opener_title: 'Owner',
          relationship_account_opener_email: user.profile.contactEmail,
          relationship_account_opener_phone: '',
          relationship_account_opener_address_city: 'Vienna',
          relationship_account_opener_address_line1: '123 Sesame St',
          relationship_account_opener_address_postal_code: '1020'
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_account_opener_phone')
      })
    })

    describe('invalid-relationship_account_opener_ssn_last_4', () => {
      it('missing posted relationship_account_opener_ssn_last_4', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'US'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
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
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          relationship_account_opener_dob_day: '1',
          relationship_account_opener_dob_month: '1',
          relationship_account_opener_dob_year: '1950',
          relationship_account_opener_first_name: user.profile.firstName,
          relationship_account_opener_last_name: user.profile.lastName,
          relationship_account_opener_executive: 'true',
          relationship_account_opener_title: 'Owner',
          relationship_account_opener_email: user.profile.contactEmail,
          relationship_account_opener_phone: '456-789-0123',
          relationship_account_opener_id_number: '000000000',
          relationship_account_opener_ssn_last_4: '',
          relationship_account_opener_address_city: 'New York',
          relationship_account_opener_address_line1: '285 Fulton St',
          relationship_account_opener_address_postal_code: '10007'
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_account_opener_ssn_last_4')
      })
    })

    describe('invalid-company_name_kana', () => {
      it('missing posted company_name_kana', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'JP'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          company_tax_id: '8',
          company_name: 'Company',
          company_phone: '011-271-6677',
          company_name_kana: '',
          company_name_kanji: '東京都',
          company_address_kana_postal_code: '1500001',
          company_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          company_address_kana_city: 'ｼﾌﾞﾔ',
          company_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          company_address_kana_line1: '27-15',
          company_address_kanji_postal_code: '1500001',
          company_address_kanji_state: '東京都',
          company_address_kanji_city: '渋谷区',
          company_address_kanji_town: '神宮前　３丁目',
          company_address_kanji_line1: '２７－１５',
          relationship_account_opener_first_name: user.profile.firstName,
          relationship_account_opener_last_name: user.profile.lastName,
          relationship_account_opener_executive: 'true',
          relationship_account_opener_title: 'Owner',
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
          relationship_account_opener_address_kana_postal_code: '1500001',
          relationship_account_opener_first_name_kanji: '東京都',
          relationship_account_opener_last_name_kanji: '東京都',
          relationship_account_opener_address_kanji_postal_code: '1500001',
          relationship_account_opener_address_kanji_state: '東京都',
          relationship_account_opener_address_kanji_city: '渋谷区',
          relationship_account_opener_address_kanji_town: '神宮前　３丁目',
          relationship_account_opener_address_kanji_line1: '２７－１５'
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-company_name_kana')
      })
    })

    describe('invalid-company_name_kanji', () => {
      it('missing posted company_name_kanji', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'JP'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          company_tax_id: '8',
          company_name: 'Company',
          company_phone: '011-271-6677',
          company_name_kana: 'ﾄｳｷﾖｳﾄ',
          company_name_kanji: '',
          company_address_kana_postal_code: '1500001',
          company_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          company_address_kana_city: 'ｼﾌﾞﾔ',
          company_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          company_address_kana_line1: '27-15',
          company_address_kanji_postal_code: '1500001',
          company_address_kanji_state: '東京都',
          company_address_kanji_city: '渋谷区',
          company_address_kanji_town: '神宮前　３丁目',
          company_address_kanji_line1: '２７－１５',
          relationship_account_opener_first_name: user.profile.firstName,
          relationship_account_opener_last_name: user.profile.lastName,
          relationship_account_opener_executive: 'true',
          relationship_account_opener_title: 'Owner',
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
          relationship_account_opener_address_kana_postal_code: '1500001',
          relationship_account_opener_first_name_kanji: '東京都',
          relationship_account_opener_last_name_kanji: '東京都',
          relationship_account_opener_address_kanji_postal_code: '1500001',
          relationship_account_opener_address_kanji_state: '東京都',
          relationship_account_opener_address_kanji_city: '渋谷区',
          relationship_account_opener_address_kanji_town: '神宮前　３丁目',
          relationship_account_opener_address_kanji_line1: '２７－１５'
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-company_name_kanji')
      })
    })

    describe('invalid-company_address_kana_postal_code', () => {
      it('missing posted company_address_kana_postal_code', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'JP'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          company_tax_id: '8',
          company_name: 'Company',
          company_phone: '011-271-6677',
          company_name_kana: 'ﾄｳｷﾖｳﾄ',
          company_name_kanji: '東京都',
          company_address_kana_postal_code: '',
          company_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          company_address_kana_city: 'ｼﾌﾞﾔ',
          company_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          company_address_kana_line1: '27-15',
          company_address_kanji_postal_code: '1500001',
          company_address_kanji_state: '東京都',
          company_address_kanji_city: '渋谷区',
          company_address_kanji_town: '神宮前　３丁目',
          company_address_kanji_line1: '２７－１５',
          relationship_account_opener_first_name: user.profile.firstName,
          relationship_account_opener_last_name: user.profile.lastName,
          relationship_account_opener_executive: 'true',
          relationship_account_opener_title: 'Owner',
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
          relationship_account_opener_address_kana_postal_code: '1500001',
          relationship_account_opener_first_name_kanji: '東京都',
          relationship_account_opener_last_name_kanji: '東京都',
          relationship_account_opener_address_kanji_postal_code: '1500001',
          relationship_account_opener_address_kanji_state: '東京都',
          relationship_account_opener_address_kanji_city: '渋谷区',
          relationship_account_opener_address_kanji_town: '神宮前　３丁目',
          relationship_account_opener_address_kanji_line1: '２７－１５'
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-company_address_kana_postal_code')
      })
    })

    describe('invalid-company_address_kana_city', () => {
      it('missing posted company_address_kana_city', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'JP'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          company_tax_id: '8',
          company_name: 'Company',
          company_phone: '011-271-6677',
          company_name_kana: 'ﾄｳｷﾖｳﾄ',
          company_name_kanji: '東京都',
          company_address_kana_postal_code: '1500001',
          company_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          company_address_kana_city: '',
          company_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          company_address_kana_line1: '27-15',
          company_address_kanji_postal_code: '1500001',
          company_address_kanji_state: '東京都',
          company_address_kanji_city: '渋谷区',
          company_address_kanji_town: '神宮前　３丁目',
          company_address_kanji_line1: '２７－１５',
          relationship_account_opener_first_name: user.profile.firstName,
          relationship_account_opener_last_name: user.profile.lastName,
          relationship_account_opener_executive: 'true',
          relationship_account_opener_title: 'Owner',
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
          relationship_account_opener_address_kana_postal_code: '1500001',
          relationship_account_opener_first_name_kanji: '東京都',
          relationship_account_opener_last_name_kanji: '東京都',
          relationship_account_opener_address_kanji_postal_code: '1500001',
          relationship_account_opener_address_kanji_state: '東京都',
          relationship_account_opener_address_kanji_city: '渋谷区',
          relationship_account_opener_address_kanji_town: '神宮前　３丁目',
          relationship_account_opener_address_kanji_line1: '２７－１５'
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-company_address_kana_city')
      })
    })

    describe('invalid-company_address_kana_state', () => {
      it('missing posted company_address_kana_state', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'JP'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          company_tax_id: '8',
          company_name: 'Company',
          company_phone: '011-271-6677',
          company_name_kana: 'ﾄｳｷﾖｳﾄ',
          company_name_kanji: '東京都',
          company_address_kana_postal_code: '1500001',
          company_address_kana_state: '',
          company_address_kana_city: 'ｼﾌﾞﾔ',
          company_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          company_address_kana_line1: '27-15',
          company_address_kanji_postal_code: '1500001',
          company_address_kanji_state: '東京都',
          company_address_kanji_city: '渋谷区',
          company_address_kanji_town: '神宮前　３丁目',
          company_address_kanji_line1: '２７－１５',
          relationship_account_opener_first_name: user.profile.firstName,
          relationship_account_opener_last_name: user.profile.lastName,
          relationship_account_opener_executive: 'true',
          relationship_account_opener_title: 'Owner',
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
          relationship_account_opener_address_kana_postal_code: '1500001',
          relationship_account_opener_first_name_kanji: '東京都',
          relationship_account_opener_last_name_kanji: '東京都',
          relationship_account_opener_address_kanji_postal_code: '1500001',
          relationship_account_opener_address_kanji_state: '東京都',
          relationship_account_opener_address_kanji_city: '渋谷区',
          relationship_account_opener_address_kanji_town: '神宮前　３丁目',
          relationship_account_opener_address_kanji_line1: '２７－１５'
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-company_address_kana_state')
      })
    })

    describe('invalid-company_address_kana_town', () => {
      it('missing posted company_address_kana_town', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'JP'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          company_tax_id: '8',
          company_name: 'Company',
          company_phone: '011-271-6677',
          company_name_kana: 'ﾄｳｷﾖｳﾄ',
          company_name_kanji: '東京都',
          company_address_kana_postal_code: '1500001',
          company_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          company_address_kana_city: 'ｼﾌﾞﾔ',
          company_address_kana_town: '',
          company_address_kana_line1: '27-15',
          company_address_kanji_postal_code: '1500001',
          company_address_kanji_state: '東京都',
          company_address_kanji_city: '渋谷区',
          company_address_kanji_town: '神宮前　３丁目',
          company_address_kanji_line1: '２７－１５',
          relationship_account_opener_first_name: user.profile.firstName,
          relationship_account_opener_last_name: user.profile.lastName,
          relationship_account_opener_executive: 'true',
          relationship_account_opener_title: 'Owner',
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
          relationship_account_opener_address_kana_postal_code: '1500001',
          relationship_account_opener_first_name_kanji: '東京都',
          relationship_account_opener_last_name_kanji: '東京都',
          relationship_account_opener_address_kanji_postal_code: '1500001',
          relationship_account_opener_address_kanji_state: '東京都',
          relationship_account_opener_address_kanji_city: '渋谷区',
          relationship_account_opener_address_kanji_town: '神宮前　３丁目',
          relationship_account_opener_address_kanji_line1: '２７－１５'
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-company_address_kana_town')
      })
    })

    describe('invalid-company_address_kana_line1', () => {
      it('missing posted company_address_kana_line1', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'JP'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          company_tax_id: '8',
          company_name: 'Company',
          company_phone: '011-271-6677',
          company_name_kana: 'ﾄｳｷﾖｳﾄ',
          company_name_kanji: '東京都',
          company_address_kana_postal_code: '1500001',
          company_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          company_address_kana_city: 'ｼﾌﾞﾔ',
          company_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          company_address_kana_line1: '',
          company_address_kanji_postal_code: '1500001',
          company_address_kanji_state: '東京都',
          company_address_kanji_city: '渋谷区',
          company_address_kanji_town: '神宮前　３丁目',
          company_address_kanji_line1: '２７－１５',
          relationship_account_opener_first_name: user.profile.firstName,
          relationship_account_opener_last_name: user.profile.lastName,
          relationship_account_opener_executive: 'true',
          relationship_account_opener_title: 'Owner',
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
          relationship_account_opener_address_kana_postal_code: '1500001',
          relationship_account_opener_first_name_kanji: '東京都',
          relationship_account_opener_last_name_kanji: '東京都',
          relationship_account_opener_address_kanji_postal_code: '1500001',
          relationship_account_opener_address_kanji_state: '東京都',
          relationship_account_opener_address_kanji_city: '渋谷区',
          relationship_account_opener_address_kanji_town: '神宮前　３丁目',
          relationship_account_opener_address_kanji_line1: '２７－１５'
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-company_address_kana_line1')
      })
    })

    describe('invalid-company_address_kanji_postal_code', () => {
      it('missing posted company_address_kanji_postal_code', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'JP'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          company_tax_id: '8',
          company_name: 'Company',
          company_phone: '011-271-6677',
          company_name_kana: 'ﾄｳｷﾖｳﾄ',
          company_name_kanji: '東京都',
          company_address_kana_postal_code: '1500001',
          company_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          company_address_kana_city: 'ｼﾌﾞﾔ',
          company_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          company_address_kana_line1: '27-15',
          company_address_kanji_postal_code: '',
          company_address_kanji_state: '東京都',
          company_address_kanji_city: '渋谷区',
          company_address_kanji_town: '神宮前　３丁目',
          company_address_kanji_line1: '２７－１５',
          relationship_account_opener_first_name: user.profile.firstName,
          relationship_account_opener_last_name: user.profile.lastName,
          relationship_account_opener_executive: 'true',
          relationship_account_opener_title: 'Owner',
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
          relationship_account_opener_address_kana_postal_code: '1500001',
          relationship_account_opener_first_name_kanji: '東京都',
          relationship_account_opener_last_name_kanji: '東京都',
          relationship_account_opener_address_kanji_postal_code: '1500001',
          relationship_account_opener_address_kanji_state: '東京都',
          relationship_account_opener_address_kanji_city: '渋谷区',
          relationship_account_opener_address_kanji_town: '神宮前　３丁目',
          relationship_account_opener_address_kanji_line1: '２７－１５'
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-company_address_kanji_postal_code')
      })
    })

    describe('invalid-company_address_kanji_city', () => {
      it('missing posted company_address_kanji_city', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'JP'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          company_tax_id: '8',
          company_name: 'Company',
          company_phone: '011-271-6677',
          company_name_kana: 'ﾄｳｷﾖｳﾄ',
          company_name_kanji: '東京都',
          company_address_kana_postal_code: '1500001',
          company_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          company_address_kana_city: 'ｼﾌﾞﾔ',
          company_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          company_address_kana_line1: '27-15',
          company_address_kanji_postal_code: '1500001',
          company_address_kanji_state: '東京都',
          company_address_kanji_city: '',
          company_address_kanji_town: '神宮前　３丁目',
          company_address_kanji_line1: '２７－１５',
          relationship_account_opener_first_name: user.profile.firstName,
          relationship_account_opener_last_name: user.profile.lastName,
          relationship_account_opener_executive: 'true',
          relationship_account_opener_title: 'Owner',
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
          relationship_account_opener_address_kana_postal_code: '1500001',
          relationship_account_opener_first_name_kanji: '東京都',
          relationship_account_opener_last_name_kanji: '東京都',
          relationship_account_opener_address_kanji_postal_code: '1500001',
          relationship_account_opener_address_kanji_state: '東京都',
          relationship_account_opener_address_kanji_city: '渋谷区',
          relationship_account_opener_address_kanji_town: '神宮前　３丁目',
          relationship_account_opener_address_kanji_line1: '２７－１５'
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-company_address_kanji_city')
      })
    })

    describe('invalid-company_address_kanji_state', () => {
      it('missing posted company_address_kanji_state', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'JP'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          company_tax_id: '8',
          company_name: 'Company',
          company_phone: '011-271-6677',
          company_name_kana: 'ﾄｳｷﾖｳﾄ',
          company_name_kanji: '東京都',
          company_address_kana_postal_code: '1500001',
          company_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          company_address_kana_city: 'ｼﾌﾞﾔ',
          company_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          company_address_kana_line1: '27-15',
          company_address_kanji_postal_code: '1500001',
          company_address_kanji_state: '',
          company_address_kanji_city: '渋谷区',
          company_address_kanji_town: '神宮前　３丁目',
          company_address_kanji_line1: '２７－１５',
          relationship_account_opener_first_name: user.profile.firstName,
          relationship_account_opener_last_name: user.profile.lastName,
          relationship_account_opener_executive: 'true',
          relationship_account_opener_title: 'Owner',
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
          relationship_account_opener_address_kana_postal_code: '1500001',
          relationship_account_opener_first_name_kanji: '東京都',
          relationship_account_opener_last_name_kanji: '東京都',
          relationship_account_opener_address_kanji_postal_code: '1500001',
          relationship_account_opener_address_kanji_state: '東京都',
          relationship_account_opener_address_kanji_city: '渋谷区',
          relationship_account_opener_address_kanji_town: '神宮前　３丁目',
          relationship_account_opener_address_kanji_line1: '２７－１５'
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-company_address_kanji_state')
      })
    })

    describe('invalid-company_address_kanji_town', () => {
      it('missing posted company_address_kanji_town', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'JP'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          company_tax_id: '8',
          company_name: 'Company',
          company_phone: '011-271-6677',
          company_name_kana: 'ﾄｳｷﾖｳﾄ',
          company_name_kanji: '東京都',
          company_address_kana_postal_code: '1500001',
          company_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          company_address_kana_city: 'ｼﾌﾞﾔ',
          company_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          company_address_kana_line1: '27-15',
          company_address_kanji_postal_code: '1500001',
          company_address_kanji_state: '東京都',
          company_address_kanji_city: '渋谷区',
          company_address_kanji_town: '',
          company_address_kanji_line1: '２７－１５',
          relationship_account_opener_first_name: user.profile.firstName,
          relationship_account_opener_last_name: user.profile.lastName,
          relationship_account_opener_executive: 'true',
          relationship_account_opener_title: 'Owner',
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
          relationship_account_opener_address_kana_postal_code: '1500001',
          relationship_account_opener_first_name_kanji: '東京都',
          relationship_account_opener_last_name_kanji: '東京都',
          relationship_account_opener_address_kanji_postal_code: '1500001',
          relationship_account_opener_address_kanji_state: '東京都',
          relationship_account_opener_address_kanji_city: '渋谷区',
          relationship_account_opener_address_kanji_town: '神宮前　３丁目',
          relationship_account_opener_address_kanji_line1: '２７－１５'
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-company_address_kanji_town')
      })
    })

    describe('invalid-company_address_kanji_line1', () => {
      it('missing posted company_address_kanji_line1', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'JP'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          company_tax_id: '8',
          company_name: 'Company',
          company_phone: '011-271-6677',
          company_name_kana: 'ﾄｳｷﾖｳﾄ',
          company_name_kanji: '東京都',
          company_address_kana_postal_code: '1500001',
          company_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          company_address_kana_city: 'ｼﾌﾞﾔ',
          company_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          company_address_kana_line1: '27-15',
          company_address_kanji_postal_code: '1500001',
          company_address_kanji_state: '東京都',
          company_address_kanji_city: '渋谷区',
          company_address_kanji_town: '神宮前　３丁目',
          company_address_kanji_line1: '',
          relationship_account_opener_first_name: user.profile.firstName,
          relationship_account_opener_last_name: user.profile.lastName,
          relationship_account_opener_executive: 'true',
          relationship_account_opener_title: 'Owner',
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
          relationship_account_opener_address_kana_postal_code: '1500001',
          relationship_account_opener_first_name_kanji: '東京都',
          relationship_account_opener_last_name_kanji: '東京都',
          relationship_account_opener_address_kanji_postal_code: '1500001',
          relationship_account_opener_address_kanji_state: '東京都',
          relationship_account_opener_address_kanji_city: '渋谷区',
          relationship_account_opener_address_kanji_town: '神宮前　３丁目',
          relationship_account_opener_address_kanji_line1: '２７－１５'
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-company_address_kanji_line1')
      })
    })

    describe('invalid-relationship_account_opener_address_kana_postal_code', () => {
      it('missing posted relationship_account_opener_address_kana_postal_code', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'JP'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          company_tax_id: '8',
          company_name: 'Company',
          company_phone: '011-271-6677',
          company_name_kana: 'ﾄｳｷﾖｳﾄ',
          company_name_kanji: '東京都',
          company_address_kana_postal_code: '1500001',
          company_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          company_address_kana_city: 'ｼﾌﾞﾔ',
          company_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          company_address_kana_line1: '27-15',
          company_address_kanji_postal_code: '1500001',
          company_address_kanji_state: '東京都',
          company_address_kanji_city: '渋谷区',
          company_address_kanji_town: '神宮前　３丁目',
          company_address_kanji_line1: '２７－１５',
          relationship_account_opener_first_name: user.profile.firstName,
          relationship_account_opener_last_name: user.profile.lastName,
          relationship_account_opener_executive: 'true',
          relationship_account_opener_title: 'Owner',
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
          relationship_account_opener_address_kana_postal_code: '',
          relationship_account_opener_first_name_kanji: '東京都',
          relationship_account_opener_last_name_kanji: '東京都',
          relationship_account_opener_address_kanji_postal_code: '1500001',
          relationship_account_opener_address_kanji_state: '東京都',
          relationship_account_opener_address_kanji_city: '渋谷区',
          relationship_account_opener_address_kanji_town: '神宮前　３丁目',
          relationship_account_opener_address_kanji_line1: '２７－１５'
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_account_opener_address_kana_postal_code')
      })
    })

    describe('invalid-relationship_account_opener_address_kana_city', () => {
      it('missing posted relationship_account_opener_address_kana_city', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'JP'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          company_tax_id: '8',
          company_name: 'Company',
          company_phone: '011-271-6677',
          company_name_kana: 'ﾄｳｷﾖｳﾄ',
          company_name_kanji: '東京都',
          company_address_kana_postal_code: '1500001',
          company_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          company_address_kana_city: 'ｼﾌﾞﾔ',
          company_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          company_address_kana_line1: '27-15',
          company_address_kanji_postal_code: '1500001',
          company_address_kanji_state: '東京都',
          company_address_kanji_city: '渋谷区',
          company_address_kanji_town: '神宮前　３丁目',
          company_address_kanji_line1: '２７－１５',
          relationship_account_opener_first_name: user.profile.firstName,
          relationship_account_opener_last_name: user.profile.lastName,
          relationship_account_opener_executive: 'true',
          relationship_account_opener_title: 'Owner',
          relationship_account_opener_email: user.profile.contactEmail,
          relationship_account_opener_phone: '456-789-0123',
          relationship_account_opener_gender: 'female',
          relationship_account_opener_dob_day: '1',
          relationship_account_opener_dob_month: '1',
          relationship_account_opener_dob_year: '1950',
          relationship_account_opener_first_name_kana: 'ﾄｳｷﾖｳﾄ',
          relationship_account_opener_last_name_kana: 'ﾄｳｷﾖｳﾄ',
          relationship_account_opener_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          relationship_account_opener_address_kana_city: '',
          relationship_account_opener_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          relationship_account_opener_address_kana_line1: '27-15',
          relationship_account_opener_address_kana_postal_code: '1500001',
          relationship_account_opener_first_name_kanji: '東京都',
          relationship_account_opener_last_name_kanji: '東京都',
          relationship_account_opener_address_kanji_postal_code: '1500001',
          relationship_account_opener_address_kanji_state: '東京都',
          relationship_account_opener_address_kanji_city: '渋谷区',
          relationship_account_opener_address_kanji_town: '神宮前　３丁目',
          relationship_account_opener_address_kanji_line1: '２７－１５'
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_account_opener_address_kana_city')
      })
    })

    describe('invalid-relationship_account_opener_address_kana_state', () => {
      it('missing posted relationship_account_opener_address_kana_state', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'JP'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          company_tax_id: '8',
          company_name: 'Company',
          company_phone: '011-271-6677',
          company_name_kana: 'ﾄｳｷﾖｳﾄ',
          company_name_kanji: '東京都',
          company_address_kana_postal_code: '1500001',
          company_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          company_address_kana_city: 'ｼﾌﾞﾔ',
          company_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          company_address_kana_line1: '27-15',
          company_address_kanji_postal_code: '1500001',
          company_address_kanji_state: '東京都',
          company_address_kanji_city: '渋谷区',
          company_address_kanji_town: '神宮前　３丁目',
          company_address_kanji_line1: '２７－１５',
          relationship_account_opener_first_name: user.profile.firstName,
          relationship_account_opener_last_name: user.profile.lastName,
          relationship_account_opener_executive: 'true',
          relationship_account_opener_title: 'Owner',
          relationship_account_opener_email: user.profile.contactEmail,
          relationship_account_opener_phone: '456-789-0123',
          relationship_account_opener_gender: 'female',
          relationship_account_opener_dob_day: '1',
          relationship_account_opener_dob_month: '1',
          relationship_account_opener_dob_year: '1950',
          relationship_account_opener_first_name_kana: 'ﾄｳｷﾖｳﾄ',
          relationship_account_opener_last_name_kana: 'ﾄｳｷﾖｳﾄ',
          relationship_account_opener_address_kana_state: '',
          relationship_account_opener_address_kana_city: 'ｼﾌﾞﾔ',
          relationship_account_opener_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          relationship_account_opener_address_kana_line1: '27-15',
          relationship_account_opener_address_kana_postal_code: '1500001',
          relationship_account_opener_first_name_kanji: '東京都',
          relationship_account_opener_last_name_kanji: '東京都',
          relationship_account_opener_address_kanji_postal_code: '1500001',
          relationship_account_opener_address_kanji_state: '東京都',
          relationship_account_opener_address_kanji_city: '渋谷区',
          relationship_account_opener_address_kanji_town: '神宮前　３丁目',
          relationship_account_opener_address_kanji_line1: '２７－１５'
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_account_opener_address_kana_state')
      })
    })

    describe('invalid-relationship_account_opener_address_kana_town', () => {
      it('missing posted relationship_account_opener_address_kana_town', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'JP'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          company_tax_id: '8',
          company_name: 'Company',
          company_phone: '011-271-6677',
          company_name_kana: 'ﾄｳｷﾖｳﾄ',
          company_name_kanji: '東京都',
          company_address_kana_postal_code: '1500001',
          company_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          company_address_kana_city: 'ｼﾌﾞﾔ',
          company_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          company_address_kana_line1: '27-15',
          company_address_kanji_postal_code: '1500001',
          company_address_kanji_state: '東京都',
          company_address_kanji_city: '渋谷区',
          company_address_kanji_town: '神宮前　３丁目',
          company_address_kanji_line1: '２７－１５',
          relationship_account_opener_first_name: user.profile.firstName,
          relationship_account_opener_last_name: user.profile.lastName,
          relationship_account_opener_executive: 'true',
          relationship_account_opener_title: 'Owner',
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
          relationship_account_opener_address_kana_town: '',
          relationship_account_opener_address_kana_line1: '27-15',
          relationship_account_opener_address_kana_postal_code: '1500001',
          relationship_account_opener_first_name_kanji: '東京都',
          relationship_account_opener_last_name_kanji: '東京都',
          relationship_account_opener_address_kanji_postal_code: '1500001',
          relationship_account_opener_address_kanji_state: '東京都',
          relationship_account_opener_address_kanji_city: '渋谷区',
          relationship_account_opener_address_kanji_town: '神宮前　３丁目',
          relationship_account_opener_address_kanji_line1: '２７－１５'
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_account_opener_address_kana_town')
      })
    })

    describe('invalid-relationship_account_opener_address_kana_line1', () => {
      it('missing posted relationship_account_opener_address_kana_line1', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'JP'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          company_tax_id: '8',
          company_name: 'Company',
          company_phone: '011-271-6677',
          company_name_kana: 'ﾄｳｷﾖｳﾄ',
          company_name_kanji: '東京都',
          company_address_kana_postal_code: '1500001',
          company_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          company_address_kana_city: 'ｼﾌﾞﾔ',
          company_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          company_address_kana_line1: '27-15',
          company_address_kanji_postal_code: '1500001',
          company_address_kanji_state: '東京都',
          company_address_kanji_city: '渋谷区',
          company_address_kanji_town: '神宮前　３丁目',
          company_address_kanji_line1: '２７－１５',
          relationship_account_opener_first_name: user.profile.firstName,
          relationship_account_opener_last_name: user.profile.lastName,
          relationship_account_opener_executive: 'true',
          relationship_account_opener_title: 'Owner',
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
          relationship_account_opener_address_kana_line1: '',
          relationship_account_opener_address_kana_postal_code: '1500001',
          relationship_account_opener_first_name_kanji: '東京都',
          relationship_account_opener_last_name_kanji: '東京都',
          relationship_account_opener_address_kanji_postal_code: '1500001',
          relationship_account_opener_address_kanji_state: '東京都',
          relationship_account_opener_address_kanji_city: '渋谷区',
          relationship_account_opener_address_kanji_town: '神宮前　３丁目',
          relationship_account_opener_address_kanji_line1: '２７－１５'
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_account_opener_address_kana_line1')
      })
    })

    describe('invalid-relationship_account_opener_address_kanji_postal_code', () => {
      it('missing posted relationship_account_opener_address_kanji_postal_code', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'JP'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          company_tax_id: '8',
          company_name: 'Company',
          company_phone: '011-271-6677',
          company_name_kana: 'ﾄｳｷﾖｳﾄ',
          company_name_kanji: '東京都',
          company_address_kana_postal_code: '1500001',
          company_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          company_address_kana_city: 'ｼﾌﾞﾔ',
          company_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          company_address_kana_line1: '27-15',
          company_address_kanji_postal_code: '1500001',
          company_address_kanji_state: '東京都',
          company_address_kanji_city: '渋谷区',
          company_address_kanji_town: '神宮前　３丁目',
          company_address_kanji_line1: '２７－１５',
          relationship_account_opener_first_name: user.profile.firstName,
          relationship_account_opener_last_name: user.profile.lastName,
          relationship_account_opener_executive: 'true',
          relationship_account_opener_title: 'Owner',
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
          relationship_account_opener_address_kana_postal_code: '1500001',
          relationship_account_opener_first_name_kanji: '東京都',
          relationship_account_opener_last_name_kanji: '東京都',
          relationship_account_opener_address_kanji_postal_code: '',
          relationship_account_opener_address_kanji_state: '東京都',
          relationship_account_opener_address_kanji_city: '渋谷区',
          relationship_account_opener_address_kanji_town: '神宮前　３丁目',
          relationship_account_opener_address_kanji_line1: '２７－１５'
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_account_opener_address_kanji_postal_code')
      })
    })

    describe('invalid-relationship_account_opener_address_kanji_city', () => {
      it('missing posted relationship_account_opener_address_kanji_city', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'JP'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          company_tax_id: '8',
          company_name: 'Company',
          company_phone: '011-271-6677',
          company_name_kana: 'ﾄｳｷﾖｳﾄ',
          company_name_kanji: '東京都',
          company_address_kana_postal_code: '1500001',
          company_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          company_address_kana_city: 'ｼﾌﾞﾔ',
          company_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          company_address_kana_line1: '27-15',
          company_address_kanji_postal_code: '1500001',
          company_address_kanji_state: '東京都',
          company_address_kanji_city: '渋谷区',
          company_address_kanji_town: '神宮前　３丁目',
          company_address_kanji_line1: '２７－１５',
          relationship_account_opener_first_name: user.profile.firstName,
          relationship_account_opener_last_name: user.profile.lastName,
          relationship_account_opener_executive: 'true',
          relationship_account_opener_title: 'Owner',
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
          relationship_account_opener_address_kana_postal_code: '1500001',
          relationship_account_opener_first_name_kanji: '東京都',
          relationship_account_opener_last_name_kanji: '東京都',
          relationship_account_opener_address_kanji_postal_code: '1500001',
          relationship_account_opener_address_kanji_state: '東京都',
          relationship_account_opener_address_kanji_city: '',
          relationship_account_opener_address_kanji_town: '神宮前　３丁目',
          relationship_account_opener_address_kanji_line1: '２７－１５'
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_account_opener_address_kanji_city')
      })
    })

    describe('invalid-relationship_account_opener_address_kanji_state', () => {
      it('missing posted relationship_account_opener_address_kanji_state', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'JP'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          company_tax_id: '8',
          company_name: 'Company',
          company_phone: '011-271-6677',
          company_name_kana: 'ﾄｳｷﾖｳﾄ',
          company_name_kanji: '東京都',
          company_address_kana_postal_code: '1500001',
          company_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          company_address_kana_city: 'ｼﾌﾞﾔ',
          company_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          company_address_kana_line1: '27-15',
          company_address_kanji_postal_code: '1500001',
          company_address_kanji_state: '東京都',
          company_address_kanji_city: '渋谷区',
          company_address_kanji_town: '神宮前　３丁目',
          company_address_kanji_line1: '２７－１５',
          relationship_account_opener_first_name: user.profile.firstName,
          relationship_account_opener_last_name: user.profile.lastName,
          relationship_account_opener_executive: 'true',
          relationship_account_opener_title: 'Owner',
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
          relationship_account_opener_address_kana_postal_code: '1500001',
          relationship_account_opener_first_name_kanji: '東京都',
          relationship_account_opener_last_name_kanji: '東京都',
          relationship_account_opener_address_kanji_postal_code: '1500001',
          relationship_account_opener_address_kanji_state: '',
          relationship_account_opener_address_kanji_city: '渋谷区',
          relationship_account_opener_address_kanji_town: '神宮前　３丁目',
          relationship_account_opener_address_kanji_line1: '２７－１５'
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_account_opener_address_kanji_state')
      })
    })

    describe('invalid-relationship_account_opener_address_kanji_town', () => {
      it('missing posted relationship_account_opener_address_kanji_town', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'JP'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          company_tax_id: '8',
          company_name: 'Company',
          company_phone: '011-271-6677',
          company_name_kana: 'ﾄｳｷﾖｳﾄ',
          company_name_kanji: '東京都',
          company_address_kana_postal_code: '1500001',
          company_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          company_address_kana_city: 'ｼﾌﾞﾔ',
          company_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          company_address_kana_line1: '27-15',
          company_address_kanji_postal_code: '1500001',
          company_address_kanji_state: '東京都',
          company_address_kanji_city: '渋谷区',
          company_address_kanji_town: '神宮前　３丁目',
          company_address_kanji_line1: '２７－１５',
          relationship_account_opener_first_name: user.profile.firstName,
          relationship_account_opener_last_name: user.profile.lastName,
          relationship_account_opener_executive: 'true',
          relationship_account_opener_title: 'Owner',
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
          relationship_account_opener_address_kana_postal_code: '1500001',
          relationship_account_opener_first_name_kanji: '東京都',
          relationship_account_opener_last_name_kanji: '東京都',
          relationship_account_opener_address_kanji_postal_code: '1500001',
          relationship_account_opener_address_kanji_state: '東京都',
          relationship_account_opener_address_kanji_city: '渋谷区',
          relationship_account_opener_address_kanji_town: '',
          relationship_account_opener_address_kanji_line1: '２７－１５'
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_account_opener_address_kanji_town')
      })
    })

    describe('invalid-relationship_account_opener_address_kanji_line1', () => {
      it('missing posted relationship_account_opener_address_kanji_line1', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'JP'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          company_tax_id: '8',
          company_name: 'Company',
          company_phone: '011-271-6677',
          company_name_kana: 'ﾄｳｷﾖｳﾄ',
          company_name_kanji: '東京都',
          company_address_kana_postal_code: '1500001',
          company_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          company_address_kana_city: 'ｼﾌﾞﾔ',
          company_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          company_address_kana_line1: '27-15',
          company_address_kanji_postal_code: '1500001',
          company_address_kanji_state: '東京都',
          company_address_kanji_city: '渋谷区',
          company_address_kanji_town: '神宮前　３丁目',
          company_address_kanji_line1: '２７－１５',
          relationship_account_opener_first_name: user.profile.firstName,
          relationship_account_opener_last_name: user.profile.lastName,
          relationship_account_opener_executive: 'true',
          relationship_account_opener_title: 'Owner',
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
          relationship_account_opener_address_kana_postal_code: '1500001',
          relationship_account_opener_first_name_kanji: '東京都',
          relationship_account_opener_last_name_kanji: '東京都',
          relationship_account_opener_address_kanji_postal_code: '1500001',
          relationship_account_opener_address_kanji_state: '東京都',
          relationship_account_opener_address_kanji_city: '渋谷区',
          relationship_account_opener_address_kanji_town: '神宮前　３丁目',
          relationship_account_opener_address_kanji_line1: ''
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_account_opener_address_kanji_line1')
      })
    })
  })

  describe('returns', () => {
    it('object for AT registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'AT'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '1020',
        company_name: 'Company',
        company_tax_id: '8',
        company_address_city: 'Vienna',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_executive: 'true',
        relationship_account_opener_title: 'Owner',
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123',
        relationship_account_opener_address_city: 'Vienna',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_code: '1020'
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration + (accountNow.metadata.registration2 || ''))
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })

    it('object for AU registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'AU'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Brisbane',
        company_address_state: 'QLD',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '4000',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_executive: 'true',
        relationship_account_opener_title: 'Owner',
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123',
        relationship_account_opener_address_city: 'Brisbane',
        relationship_account_opener_address_line1: '845 Oxford St',
        relationship_account_opener_address_postal_code: '4000'
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration + (accountNow.metadata.registration2 || ''))
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })

    it('object for BE registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'BE'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Brussels',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '1020',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Brussels',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_code: '1020',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_executive: 'true',
        relationship_account_opener_title: 'Owner',
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration + (accountNow.metadata.registration2 || ''))
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })

    it('object for CA registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'CA'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Vancouver',
        company_address_state: 'BC',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: 'V5K 0A1',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_executive: 'true',
        relationship_account_opener_title: 'Owner',
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123',
        relationship_account_opener_address_city: 'Vancouver',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_code: 'V5K 0A1'
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration + (accountNow.metadata.registration2 || ''))
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })

    it('object for CH registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'CH'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Bern',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '1020',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Bern',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_code: '1020',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_executive: 'true',
        relationship_account_opener_title: 'Owner',
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration + (accountNow.metadata.registration2 || ''))
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })

    it('object for DE registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'DE'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Berlin',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '01067',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Berlin',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_code: '01067',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_executive: 'true',
        relationship_account_opener_title: 'Owner',
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration + (accountNow.metadata.registration2 || ''))
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })

    it('object for DK registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'DK'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Copenhagen',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '1000',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Copenhagen',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_code: '1000',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_executive: 'true',
        relationship_account_opener_title: 'Owner',
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration + (accountNow.metadata.registration2 || ''))
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })

    it('object for ES registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'ES'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Madrid',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '03179',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Madrid',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_code: '03179',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_executive: 'true',
        relationship_account_opener_title: 'Owner',
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration + (accountNow.metadata.registration2 || ''))
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })

    it('object for FI registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'FI'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Helsinki',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '00990',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Helsinki',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_code: '00990',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_executive: 'true',
        relationship_account_opener_title: 'Owner',
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration + (accountNow.metadata.registration2 || ''))
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })
    it('object for FR registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'FR'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Paris',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '75001',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Paris',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_code: '75001',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_executive: 'true',
        relationship_account_opener_title: 'Owner',
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration + (accountNow.metadata.registration2 || ''))
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })

    it('object for GB registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'GB'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'London',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: 'EC1A 1AA',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'London',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_code: 'EC1A 1AA',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_executive: 'true',
        relationship_account_opener_title: 'Owner',
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration + (accountNow.metadata.registration2 || ''))
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })

    it('object for HK registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'HK'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Hong Kong',
        company_address_line1: '123 Park Lane',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_executive: 'true',
        relationship_account_opener_title: 'Owner',
        relationship_account_opener_address_city: 'Hong Kong',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_code: '999077',
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration + (accountNow.metadata.registration2 || ''))
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })

    it('object for IE registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'IE'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
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
        relationship_account_opener_executive: 'true',
        relationship_account_opener_title: 'Owner',
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123',
        relationship_account_opener_address_postal_code: 'Dublin 1'
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration + (accountNow.metadata.registration2 || ''))
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })

    it('object for IT registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'IT'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Rome',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '00010',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Rome',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_code: '00010',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_executive: 'true',
        relationship_account_opener_title: 'Owner',
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration + (accountNow.metadata.registration2 || ''))
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })

    it('object for JP registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'JP'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_tax_id: '8',
        company_name: 'Company',
        company_phone: '011-271-6677',
        company_name_kana: 'ﾄｳｷﾖｳﾄ',
        company_name_kanji: '東京都',
        company_address_kana_postal_code: '1500001',
        company_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        company_address_kana_city: 'ｼﾌﾞﾔ',
        company_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        company_address_kana_line1: '27-15',
        company_address_kanji_postal_code: '1500001',
        company_address_kanji_state: '東京都',
        company_address_kanji_city: '渋谷区',
        company_address_kanji_town: '神宮前　３丁目',
        company_address_kanji_line1: '２７－１５',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_executive: 'true',
        relationship_account_opener_title: 'Owner',
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
        relationship_account_opener_address_kana_postal_code: '1500001',
        relationship_account_opener_first_name_kanji: '東京都',
        relationship_account_opener_last_name_kanji: '東京都',
        relationship_account_opener_address_kanji_postal_code: '1500001',
        relationship_account_opener_address_kanji_state: '東京都',
        relationship_account_opener_address_kanji_city: '渋谷区',
        relationship_account_opener_address_kanji_town: '神宮前　３丁目',
        relationship_account_opener_address_kanji_line1: '２７－１５'
      }
      const stripeAccountNow = await req.patch()
      const registration = connect.MetaData.parse(stripeAccountNow.metadata, 'registration')
      for (const field in req.body) {
        assert.strictEqual(registration[field], req.body[field])
      }
    })

    it('object for LU registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'LU'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Luxemburg',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '1623',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Luxemburg',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_code: '1623',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_executive: 'true',
        relationship_account_opener_title: 'Owner',
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration + (accountNow.metadata.registration2 || ''))
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })

    it('object for NL registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'NL'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Amsterdam',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '1071 JA',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Amsterdam',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_code: '1071 JA',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_executive: 'true',
        relationship_account_opener_title: 'Owner',
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration + (accountNow.metadata.registration2 || ''))
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })
    it('object for NO registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'NO'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Oslo',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '0001',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Oslo',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_code: '0001',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_executive: 'true',
        relationship_account_opener_title: 'Owner',
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration + (accountNow.metadata.registration2 || ''))
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })

    it('object for NZ registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'NZ'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Auckland',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '6011',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_executive: 'true',
        relationship_account_opener_title: 'Owner',
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123',
        relationship_account_opener_address_city: 'Auckland',
        relationship_account_opener_address_postal_code: '6011',
        relationship_account_opener_address_line1: '844 Fleet Street'
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration + (accountNow.metadata.registration2 || ''))
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })

    it('object for PT registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'PT'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Lisbon',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '4520',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Lisbon',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_code: '4520',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_executive: 'true',
        relationship_account_opener_title: 'Owner',
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration + (accountNow.metadata.registration2 || ''))
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })

    it('object for SE registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'SE'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Stockholm',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '00150',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Stockholm',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_code: '00150',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_executive: 'true',
        relationship_account_opener_title: 'Owner',
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration + (accountNow.metadata.registration2 || ''))
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })

    it('object for SG registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'SG'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '339696',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_executive: 'true',
        relationship_account_opener_title: 'Owner',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_code: '339696',
        relationship_account_opener_address_city: 'Singapore',
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration + (accountNow.metadata.registration2 || ''))
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })

    it('object for US registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'US'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
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
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_executive: 'true',
        relationship_account_opener_title: 'Owner',
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123',
        // relationship_account_opener_id_number: '000000000',
        relationship_account_opener_ssn_last_4: '0000',
        relationship_account_opener_address_city: 'New York',
        relationship_account_opener_address_line1: '285 Fulton St',
        relationship_account_opener_address_postal_code: '10007'
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration + (accountNow.metadata.registration2 || ''))
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })
  })
})
