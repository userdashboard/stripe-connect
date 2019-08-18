/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')

describe(`/api/user/connect/update-company-director`, async () => {
  describe('UpdateCompanyDirector#PATCH', () => {
    it('should reject invalid directorid', async () => {
      const user = await TestHelper.createUser()
      const person = TestHelper.nextIdentity()
      const req = TestHelper.createRequest('/api/user/connect/update-company-director?directorid=invalid')
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_director_first_name: person.firstName,
        relationship_director_last_name: person.lastName
      }
      let errorMessage
      try {
        await req.route.api.patch(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-directorid')
    })

    it('should reject other account\'s registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'FI'
      })
      const person = TestHelper.nextIdentity()
      const director = await TestHelper.createCompanyDirector(user, {
        relationship_director_first_name: person.firstName,
        relationship_director_last_name: person.lastName
      })
      const user2 = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/api/user/connect/update-company-director?directorid=${director.directorid}`)
      req.account = user2.account
      req.session = user2.session
      req.body = {
        relationship_director_first_name: person.firstName,
        relationship_director_last_name: person.lastName
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
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'FI'
      })
      const person = TestHelper.nextIdentity()
      const director = await TestHelper.createCompanyDirector(user, {
        relationship_director_first_name: person.firstName,
        relationship_director_last_name: person.lastName
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-director?directorid=${director.directorid}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_director_first_name: person.firstName,
        relationship_director_last_name: person.lastName
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

    it('should update director', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'FI'
      })
      const person = TestHelper.nextIdentity()
      const director = await TestHelper.createCompanyDirector(user, {
        relationship_director_first_name: person.firstName,
        relationship_director_last_name: person.lastName
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-director?directorid=${director.directorid}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_director_first_name: 'Modified name',
        relationship_director_last_name: person.lastName
      }
      const directorNow = await req.patch(req)
      assert.strictEqual(directorNow.relationship_director_first_name, 'Modified name')
    })
  })
})
