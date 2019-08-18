/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')

describe('/api/user/connect/company-director', () => {
  describe('CompanyDirector#GET', () => {
    it('should reject invalid directorid', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/api/user/connect/company-director?directorid=invalid`)
      req.account = user.account
      req.session = user.session
      const director = await req.get()
      assert.strictEqual(director.message, 'invalid-directorid')
    })

    it('should reject other account\'s director', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'DE'
      })
      const person = TestHelper.nextIdentity()
      await TestHelper.createCompanyDirector(user, {
        relationship_director_first_name: person.firstName,
        relationship_director_last_name: person.lastName
      })
      const user2 = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/api/user/connect/company-director?directorid=${user.director.directorid}`)
      req.account = user2.account
      req.session = user2.session
      const director = await req.get()
      assert.strictEqual(director.message, 'invalid-account')
    })

    it('should return director data', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'DE'
      })
      const person = TestHelper.nextIdentity()
      await TestHelper.createCompanyDirector(user, {
        relationship_director_first_name: person.firstName,
        relationship_director_last_name: person.lastName
      })
      const req = TestHelper.createRequest(`/api/user/connect/company-director?directorid=${user.director.directorid}`)
      req.account = user.account
      req.session = user.session
      const director = await req.get()
      assert.strictEqual(director.id, user.director.id)
    })
  })
})
