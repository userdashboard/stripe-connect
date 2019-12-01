/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')

describe('/api/user/connect/delete-company-director', () => {
  describe('exceptions', () => {
    describe('invalid-directorid', () => {
      it('missing querystring directorid', async () => {
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/connect/delete-company-director')
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.delete()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-directorid')
      })

      it('invalid querystring directorid', async () => {
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/connect/delete-company-director?directorid=invalid')
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.delete()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-directorid')
      })
    })

    describe('invalid-account', () => {
      it('ineligible accessing account', async () => {
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
        const req = TestHelper.createRequest(`/api/user/connect/delete-company-director?directorid=${director.directorid}`)
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
    })  
  })

  describe('returns', () => {
    it('boolean', async () => {
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
      const req = TestHelper.createRequest(`/api/user/connect/delete-company-director?directorid=${director.directorid}`)
      req.account = user.account
      req.session = user.session
      const deleted = await req.delete()
      assert.strictEqual(deleted, true)
    })
  })
})
