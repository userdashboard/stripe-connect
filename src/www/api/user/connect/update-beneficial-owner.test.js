/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')

describe('/api/user/connect/update-beneficial-owner', async () => {
  describe('UpdateBeneficialOwner#PATCH', () => {
    it('should reject invalid ownerid', async () => {
      const user = await TestHelper.createUser()
      const person = TestHelper.nextIdentity()
      const req = TestHelper.createRequest('/api/user/connect/update-beneficial-owner?ownerid=invalid')
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_owner_first_name: person.firstName,
        relationship_owner_last_name: person.lastName,
        relationship_owner_address_country: 'GB',
        relationship_owner_address_city: 'London',
        relationship_owner_address_line1: 'A building',
        relationship_owner_address_postal_code: 'EC1A 1AA',
        relationship_owner_dob_day: '1',
        relationship_owner_dob_month: '1',
        relationship_owner_dob_year: '1950'
      }
      let errorMessage
      try {
        await req.patch(req)
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
      const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?ownerid=${owner.ownerid}`)
      req.account = user2.account
      req.session = user2.session
      req.body = {
        relationship_owner_first_name: person.firstName,
        relationship_owner_last_name: person.lastName,
        relationship_owner_address_country: 'GB',
        relationship_owner_address_city: 'London',
        relationship_owner_address_line1: 'A building',
        relationship_owner_address_postal_code: 'EC1A 1AA',
        relationship_owner_dob_day: '1',
        relationship_owner_dob_month: '1',
        relationship_owner_dob_year: '1950'
      }
      let errorMessage
      try {
        await req.patch(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-account')
    })

    it('should reject invalid fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'GB'
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
      const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?ownerid=${owner.ownerid}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_owner_first_name: person.firstName,
        relationship_owner_last_name: person.lastName,
        relationship_owner_address_country: 'GB',
        relationship_owner_address_city: 'London',
        relationship_owner_address_line1: 'A building',
        relationship_owner_address_postal_code: 'EC1A 1AA',
        relationship_owner_dob_day: '1',
        relationship_owner_dob_month: '1',
        relationship_owner_dob_year: '1950'
      }
      let errors = 0
      for (const field in req.body) {
        const valueWas = req.body[field]
        req.body[field] = null
        try {
          await req.patch(req)
        } catch (error) {
          assert.strictEqual(error.message, `invalid-${field}`)
          errors++
        }
        req.body[field] = valueWas
      }
      assert.strictEqual(errors, Object.keys(req.body).length)
    })

    it('should update owner', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'GB'
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
      const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?ownerid=${owner.ownerid}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_owner_first_name: 'Modified name',
        relationship_owner_last_name: person.lastName,
        relationship_owner_address_country: 'GB',
        relationship_owner_address_city: 'London',
        relationship_owner_address_line1: 'A building',
        relationship_owner_address_postal_code: 'EC1A 1AA',
        relationship_owner_dob_day: '1',
        relationship_owner_dob_month: '1',
        relationship_owner_dob_year: '1950'
      }
      const ownerNow = await req.patch()
      assert.strictEqual(ownerNow.relationship_owner_first_name, 'Modified name')
    })
  })
})
