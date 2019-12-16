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
      const person1 = TestHelper.nextIdentity()
      const owner1 = await TestHelper.createBeneficialOwner(user, {
        relationship_owner_email: person1.email,
        relationship_owner_first_name: person1.firstName,
        relationship_owner_last_name: person1.lastName,
        relationship_owner_address_country: 'DE',
        relationship_owner_address_city: 'Berlin',
        relationship_owner_address_state: 'BW',
        relationship_owner_address_postal_code: '01067',
        relationship_owner_address_line1: 'First Street',
        relationship_owner_dob_day: '1',
        relationship_owner_dob_month: '1',
        relationship_owner_dob_year: '1950'
      })
      const person2 = TestHelper.nextIdentity()
      const owner2 = await TestHelper.createBeneficialOwner(user, {
        relationship_owner_email: person2.email,
        relationship_owner_first_name: person2.firstName,
        relationship_owner_last_name: person2.lastName,
        relationship_owner_address_country: 'DE',
        relationship_owner_address_city: 'Berlin',
        relationship_owner_address_state: 'BW',
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
