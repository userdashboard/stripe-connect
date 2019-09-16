/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')

describe('/api/user/connect/company-directors-count', () => {
  describe('exceptions', () => {
    describe('invalid-stripeid', () => {
      it('missing querystring stripeid', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'individual',
          country: 'US'
        })
        const req = TestHelper.createRequest('/api/user/connect/company-directors-count')
        req.account = user.account
        req.session = user.session
        const owners = await req.get()
        assert.strictEqual(owners.message, 'invalid-stripe-account')
      })

      it('invalid querystring stripeid', async () => {
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/connect/company-directors-count?stripeid=invalid')
        req.account = user.account
        req.session = user.session
        const owners = await req.get()
        assert.strictEqual(owners.message, 'invalid-stripe-account')
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
          relationship_account_opener_ssn_last_4: '0000',
          relationship_account_opener_phone: '456-789-0123',
          relationship_account_opener_address_city: 'New York',
          relationship_account_opener_address_state: 'NY',
          relationship_account_opener_address_line1: '285 Fulton St',
          relationship_account_opener_address_postal_code: '10007'
        })
        const user2 = await TestHelper.createUser()
        const req = TestHelper.createRequest(`/api/user/connect/company-directors-count?stripeid=${user.stripeAccount.id}`)
        req.account = user2.account
        req.session = user2.session
        const owners = await req.get()
        assert.strictEqual(owners.message, 'invalid-account')
      })
    })

    describe('invalid-stripe-account', () => {
      it('should reject individual account', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'individual',
          country: 'US'
        })
        const req = TestHelper.createRequest(`/api/user/connect/company-directors-count?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const owners = await req.get()
        assert.strictEqual(owners.message, 'invalid-stripe-account')
      })
    })
  })

  describe('returns', () => {
    it('integer', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'FI'
      })
      const person1 = TestHelper.nextIdentity()
      await TestHelper.createCompanyDirector(user, {
        relationship_director_first_name: person1.firstName,
        relationship_director_last_name: person1.lastName
      })
      const person2 = TestHelper.nextIdentity()
      await TestHelper.createCompanyDirector(user, {
        relationship_director_first_name: person2.firstName,
        relationship_director_last_name: person2.lastName
      })
      const req = TestHelper.createRequest(`/api/user/connect/company-directors-count?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const total = await req.get()
      assert.strictEqual(total, 2)
    })
  })
})
