/* eslint-env mocha */
const assert = require('assert')
const connect = require('../../../../../index.js')
const TestHelper = require('../../../../../test-helper.js')

describe('/api/user/connect/create-company-director', async () => {
  describe('exceptions', () => {
    describe('invalid-stripeid', () => {
      it('missing querystring stripeid', async () => {
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/connect/create-company-director')
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-stripeid')
      })

      it('invalid querystring stripeid', async () => {
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/connect/create-company-director?stripeid=invalid')
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-stripeid')
      })
    })

    describe('invalid-account', () => {
      it('ineligible accessing account', async () => {
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
          relationship_account_opener_email: user.profile.contactEmail,
          relationship_account_opener_id_number: '000000000',
          relationship_account_opener_ssn_last_4: '0000',
          relationship_account_opener_phone: '456-789-0123',
          relationship_account_opener_address_city: 'New York',
          relationship_account_opener_address_state: 'NY',
          relationship_account_opener_address_line1: '285 Fulton St',
          relationship_account_opener_address_postal_code: '10007'
        })
        const user2 = await TestHelper.createUser()
        const req = TestHelper.createRequest(`/api/user/connect/create-company-director?stripeid=${user.stripeAccount.id}`)
        req.account = user2.account
        req.session = user2.session
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-account')
      })
    })

    describe('invalid-stripe-account', () => {
      it('ineligible stripe account for individual', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'individual',
          country: 'US'
        })
        const req = TestHelper.createRequest(`/api/user/connect/create-company-director?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-stripe-account')
      })
    })

    describe('invalid-relationship_director_first_name', () => {
      it('missing posted relationship_director_first_name', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'DE'
        })
        const person = TestHelper.nextIdentity()
        const req = TestHelper.createRequest(`/api/user/connect/create-company-director?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          relationship_director_verification_document_front: TestHelper['success_id_scan_front.png'],
          relationship_director_verification_document_back: TestHelper['success_id_scan_back.png']
        }
        req.body = TestHelper.createMultiPart(req, {
          relationship_director_first_name: '',
          relationship_director_last_name: person.lastName
        })
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_director_first_name')
      })
    })

    describe('invalid-relationship_director_last_name', () => {
      it('missing posted relationship_director_last_name', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'DE'
        })
        const person = TestHelper.nextIdentity()
        const req = TestHelper.createRequest(`/api/user/connect/create-company-director?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          relationship_director_verification_document_front: TestHelper['success_id_scan_front.png'],
          relationship_director_verification_document_back: TestHelper['success_id_scan_back.png']
        }
        req.body = TestHelper.createMultiPart(req, {
          relationship_director_first_name: person.firstName,
          relationship_director_last_name: ''
        })
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_director_last_name')
      })
    })
  })

  describe('returns', () => {
    it('object', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'DE'
      })
      const person = TestHelper.nextIdentity()
      const req = TestHelper.createRequest(`/api/user/connect/create-company-director?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_director_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_director_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      req.body = TestHelper.createMultiPart(req, {
        relationship_director_first_name: person.firstName,
        relationship_director_last_name: person.lastName
      })
      await req.post()
      const stripeAccountNow = await global.api.user.connect.StripeAccount.post(req)
      const ownersNow = connect.MetaData.parse(stripeAccountNow.metadata, 'owners')
      assert.strictEqual(ownersNow.length, 1)
      assert.strictEqual(ownersNow[0].relationship_director_first_name, person.firstName)
    })
  })
})
