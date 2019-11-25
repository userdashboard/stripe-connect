/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')

describe('/api/user/connect/beneficial-owners', () => {
  describe('exceptions', () => {
    describe('invalid-stripeid', () => {
      it('missing querystring stripeid', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'individual',
          country: 'US'
        })
        const req = TestHelper.createRequest('/api/user/connect/beneficial-owners')
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.get()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-stripeid')
      })

      it('invalid querystring stripeid', async () => {
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/connect/beneficial-owners?stripeid=invalid')
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.get()
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
          relationship_representative_dob_day: '1',
          relationship_representative_dob_month: '1',
          relationship_representative_dob_year: '1950',
          relationship_representative_first_name: user.profile.firstName,
          relationship_representative_last_name: user.profile.lastName,
          relationship_representative_executive: 'true',
          relationship_representative_title: 'Owner',
          relationship_representative_email: user.profile.contactEmail,
          // relationship_representative_id_number: '000000000',
          relationship_representative_ssn_last_4: '0000',
          relationship_representative_phone: '456-789-0123',
          relationship_representative_address_city: 'New York',
          relationship_representative_address_state: 'NY',
          relationship_representative_address_line1: '285 Fulton St',
          relationship_representative_address_postal_code: '10007'
        })
        const user2 = await TestHelper.createUser()
        const req = TestHelper.createRequest(`/api/user/connect/beneficial-owners?stripeid=${user.stripeAccount.id}`)
        req.account = user2.account
        req.session = user2.session
        let errorMessage
        try {
          await req.get()
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
        const req = TestHelper.createRequest(`/api/user/connect/beneficial-owners?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.get()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-stripe-account')
      })
    })
  })

  describe('returns', () => {
    it('array', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'DE'
      })
      await TestHelper.createStripeRegistration(user, {
        company_tax_id: '00000000',
        company_name: user.profile.firstName + '\'s company',
        company_address_country: 'DE',
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_executive: 'true',
        relationship_representative_title: 'Owner',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        company_address_city: 'Berlin',
        company_address_line1: 'First Street',
        company_address_postal_code: '01067',
        relationship_representative_address_city: 'Berlin',
        relationship_representative_address_line1: 'First Street',
        relationship_representative_address_postal_code: '01067'
      })
      const person1 = TestHelper.nextIdentity()
      const owner1 = await TestHelper.createBeneficialOwner(user, {
        relationship_owner_first_name: person1.firstName,
        relationship_owner_last_name: person1.lastName,
        relationship_owner_address_country: 'DE',
        relationship_owner_address_city: 'Berlin',
        relationship_owner_address_postal_code: '01067',
        relationship_owner_address_line1: 'First Street',
        relationship_owner_dob_day: '1',
        relationship_owner_dob_month: '1',
        relationship_owner_dob_year: '1950'
      })
      const person2 = TestHelper.nextIdentity()
      const owner2 = await TestHelper.createBeneficialOwner(user, {
        relationship_owner_first_name: person2.firstName,
        relationship_owner_last_name: person2.lastName,
        relationship_owner_address_country: 'DE',
        relationship_owner_address_city: 'Berlin',
        relationship_owner_address_postal_code: '01067',
        relationship_owner_address_line1: 'First Street',
        relationship_owner_dob_day: '1',
        relationship_owner_dob_month: '1',
        relationship_owner_dob_year: '1950'
      })
      const req = TestHelper.createRequest(`/api/user/connect/beneficial-owners?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const owners = await req.get()
      assert.strictEqual(owners.length, global.pageSize)
      assert.strictEqual(owners[0].ownerid, owner2.ownerid)
      assert.strictEqual(owners[1].ownerid, owner1.ownerid)
    })
  })
})
