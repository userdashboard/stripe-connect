/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')

describe('/api/user/connect/update-company-director', async () => {
  describe('exceptions', () => {
    describe('invalid-directorid', () => {
      it('missing querystring directorid', async () => {
        const user = await TestHelper.createUser()
        const person = TestHelper.nextIdentity()
        const req = TestHelper.createRequest('/api/user/connect/update-company-director')
        req.account = user.account
        req.session = user.session
        req.body = {
          relationship_director_first_name: person.firstName,
          relationship_director_last_name: person.lastName
        }
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-directorid')
      })

      it('invalid querystring directorid', async () => {
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
          await req.patch(req)
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
          country: 'DE'
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
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-account')
      })
    })

    describe('invalid-relationship_director_first_name', () => {
      it('missing posted relationship_director_first_name', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'GB'
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
          relationship_director_first_name: '',
          relationship_director_last_name: person.lastName
        }
        let errorMessage
        try {
          await req.patch(req)
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
          country: 'GB'
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
          relationship_director_last_name: ''
        }
        let errorMessage
        try {
          await req.patch(req)
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
        country: 'GB'
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
      const ownerNow = await req.patch()
      assert.strictEqual(ownerNow.relationship_director_first_name, 'Modified name')
    })
  })
})
