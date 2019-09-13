/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')

describe('/api/user/connect/company-directors', () => {
  describe('CompanyDirectors#GET', () => {
    it('should reject invalid stripeid', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/api/user/connect/company-directors?stripeid=invalid`)
      req.account = user.account
      req.session = user.session
      const directors = await req.get()
      assert.strictEqual(directors.message, 'invalid-stripeid')
    })

    it('should reject individual account', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'US'
      })
      const req = TestHelper.createRequest(`/api/user/connect/company-directors?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const directors = await req.get()
      assert.strictEqual(directors.message, 'invalid-stripe-account')
    })

    it('should reject other account\'s registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'FI'
      })
      const user2 = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/api/user/connect/company-directors?stripeid=${user.stripeAccount.id}`)
      req.account = user2.account
      req.session = user2.session
      const directors = await req.get()
      assert.strictEqual(directors.message, 'invalid-account')
    })

    it('array', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'FI'
      })
      const person1 = TestHelper.nextIdentity()
      const director1 = await TestHelper.createCompanyDirector(user, {
        relationship_director_first_name: person1.firstName,
        relationship_director_last_name: person1.lastName
      })
      const person2 = TestHelper.nextIdentity()
      const director2 = await TestHelper.createCompanyDirector(user, {
        relationship_director_first_name: person2.firstName,
        relationship_director_last_name: person2.lastName
      })
      const req = TestHelper.createRequest(`/api/user/connect/company-directors?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const directors = await req.get()
      assert.strictEqual(directors.length, global.pageSize)
      assert.strictEqual(directors[0].directorid, director2.directorid)
      assert.strictEqual(directors[1].directorid, director1.directorid)
    })
  })
})
