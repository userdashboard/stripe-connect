/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')

describe(`/api/user/connect/update-additional-owner`, async () => {
  describe('UpdateAdditionalOwner#PATCH', () => {
    it('should reject invalid ownerid', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/api/user/connect/update-additional-owner?ownerid=invalid')
      req.account = user.account
      req.session = user.session
      req.body = {
        first_name: 'First name',
        last_name: 'First name',
        country: 'GB',
        city: 'London',
        line1: 'A building',
        postal_code: 'EC1A 1AA',
        day: '1',
        month: '1',
        year: '1950'
      }
      let errorMessage
      try {
        await req.route.api.patch(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-ownerid')
    })

    it('should reject other account\'s registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'DE' })
      await TestHelper.createAdditionalOwner(user, { country: 'DE', city: 'Berlin', postal_code: '01067', line1: 'First Street', day: 1, month: 1, year: 1950 })
      const user2 = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/api/user/connect/update-additional-owner?ownerid=${user.owner.ownerid}`)
      req.account = user2.account
      req.session = user2.session
      req.body = {
        first_name: 'First name',
        last_name: 'First name',
        country: 'GB',
        city: 'London',
        line1: 'A building',
        postal_code: 'EC1A 1AA',
        day: '1',
        month: '1',
        year: '1950'
      }
      let errorMessage
      try {
        await req.route.api.patch(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-account')
    })

    it('should reject invalid fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'GB' })
      const owner = await TestHelper.createAdditionalOwner(user, { country: 'GB', city: 'London', postal_code: 'EC1A 1AA', line1: 'First Street', day: 1, month: 1, year: 1950 })
      const req = TestHelper.createRequest(`/api/user/connect/update-additional-owner?ownerid=${owner.ownerid}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        first_name: 'First name',
        last_name: 'First name',
        country: 'GB',
        city: 'London',
        line1: 'A building',
        postal_code: 'EC1A 1AA',
        day: '1',
        month: '1',
        year: '1950'
      }
      let errors = 0
      for (const field in req.body) {
        const valueWas = req.body[field]
        req.body[field] = null
        try {
          await req.route.api.patch(req)
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
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'GB' })
      const owner = await TestHelper.createAdditionalOwner(user, { country: 'GB', first_name: 'Something', city: 'London', postal_code: 'EC1A 1AA', line1: 'First Street', day: 1, month: 1, year: 1950 })
      const req = TestHelper.createRequest(`/api/user/connect/update-additional-owner?ownerid=${owner.ownerid}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        first_name: 'Modified name',
        last_name: 'First name',
        country: 'GB',
        city: 'London',
        line1: 'A building',
        postal_code: 'EC1A 1AA',
        day: '1',
        month: '1',
        year: '1950'
      }
      const ownerNow = await req.patch(req)
      assert.strictEqual(ownerNow.first_name, 'Modified name')
    })
  })
})
