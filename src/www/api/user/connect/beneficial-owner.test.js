/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')

describe('/api/user/connect/beneficial-owner', () => {
  describe('BeneficialOwner#GET', () => {
    it('should reject invalid ownerid', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/api/user/connect/beneficial-owner?ownerid=invalid`)
      req.account = user.account
      req.session = user.session
      const owner = await req.get()
      assert.strictEqual(owner.message, 'invalid-ownerid')
    })

    it('should reject other account\'s owner', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'DE'
      })
      const person = TestHelper.nextIdentity()
      await TestHelper.createBeneficialOwner(user, {
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
      const req = TestHelper.createRequest(`/api/user/connect/beneficial-owner?ownerid=${user.owner.ownerid}`)
      req.account = user2.account
      req.session = user2.session
      const owner = await req.get()
      assert.strictEqual(owner.message, 'invalid-account')
    })

    it('should return owner data', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'DE'
      })
      const person = TestHelper.nextIdentity()
      await TestHelper.createBeneficialOwner(user, {
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
      const req = TestHelper.createRequest(`/api/user/connect/beneficial-owner?ownerid=${user.owner.ownerid}`)
      req.account = user.account
      req.session = user.session
      const owner = await req.get()
      assert.strictEqual(owner.id, user.owner.id)
    })
  })
})
