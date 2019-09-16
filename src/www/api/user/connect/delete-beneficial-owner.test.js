/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')

describe('/api/user/connect/delete-beneficial-owner', async () => {
  describe('DeleteBeneficialOwner#DELETE', () => {
    it('should reject invalid ownerid', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/api/user/connect/delete-beneficial-owner?ownerid=invalid')
      req.account = user.account
      req.session = user.session
      let errorMessage
      try {
        await req.delete()
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-ownerid')
    })

    it('should reject other account\'s registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'DE'
      })
      await TestHelper.createStripeRegistration(user, {
        company_tax_id: '00000000',
        company_name: user.profile.firstName + '\'s company',
        company_address_country: 'DE',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        company_address_city: 'Berlin',
        company_address_line1: 'First Street',
        company_address_postal_code: '01067',
        relationship_account_opener_address_city: 'Berlin',
        relationship_account_opener_address_line1: 'First Street',
        relationship_account_opener_address_postal_code: '01067'
      })
      const person = TestHelper.nextIdentity()
      const owner = await TestHelper.createBeneficialOwner(user, {
        relationship_owner_first_name: person.firstName,
        relationship_owner_last_name: person.lastName,
        relationship_owner_address_country: 'GB',
        relationship_owner_address_city: 'London',
        relationship_owner_address_line1: 'A building',
        relationship_owner_address_postal_code: 'EC1A 1AA',
        relationship_owner_dob_day: '1',
        relationship_owner_dob_month: '1',
        relationship_owner_dob_year: '1950'
      })
      const user2 = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/api/user/connect/delete-beneficial-owner?ownerid=${owner.ownerid}`)
      req.account = user2.account
      req.session = user2.session
      let errorMessage
      try {
        await req.delete()
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-account')
    })

    it('should delete owner', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'DE'
      })
      await TestHelper.createStripeRegistration(user, {
        company_tax_id: '00000000',
        company_name: user.profile.firstName + '\'s company',
        company_address_country: 'DE',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        company_address_city: 'Berlin',
        company_address_line1: 'First Street',
        company_address_postal_code: '01067',
        relationship_account_opener_address_city: 'Berlin',
        relationship_account_opener_address_line1: 'First Street',
        relationship_account_opener_address_postal_code: '01067'
      })
      const person = TestHelper.nextIdentity()
      const owner = await TestHelper.createBeneficialOwner(user, {
        relationship_owner_first_name: person.firstName,
        relationship_owner_last_name: person.lastName,
        relationship_owner_address_country: 'GB',
        relationship_owner_address_city: 'London',
        relationship_owner_address_line1: 'A building',
        relationship_owner_address_postal_code: 'EC1A 1AA',
        relationship_owner_dob_day: '1',
        relationship_owner_dob_month: '1',
        relationship_owner_dob_year: '1950'
      })
      const req = TestHelper.createRequest(`/api/user/connect/delete-beneficial-owner?ownerid=${owner.ownerid}`)
      req.account = user.account
      req.session = user.session
      await req.delete()
      const req2 = TestHelper.createRequest(`/api/user/connect/beneficial-owner?ownerid=${owner.ownerid}`)
      req2.account = user.account
      req2.session = user.session
      const ownerNow = await req2.get()
      assert.strictEqual(ownerNow.message, 'invalid-ownerid')
    })
  })
})
