
/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')

describe('/api/user/connect/persons', () => {
  describe('exceptions', () => {
    describe('invalid-stripeid', () => {
      it('missing querystring stripeid', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'US',
          type: 'individual'
        })
        const req = TestHelper.createRequest('/api/user/connect/persons')
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
        const req = TestHelper.createRequest('/api/user/connect/persons?stripeid=invalid')
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
          country: 'US',
          type: 'company'
        })
        const user2 = await TestHelper.createUser()
        const req = TestHelper.createRequest(`/api/user/connect/persons?stripeid=${user.stripeAccount.id}`)
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
          country: 'US',
          type: 'individual'
        })
        const req = TestHelper.createRequest(`/api/user/connect/persons?stripeid=${user.stripeAccount.id}`)
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

  describe('receives', () => {
    it('optional querystring offset (integer)', async () => {
      const offset = 1
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'DE',
        type: 'company'
      })
      const persons = []
      for (let i = 0, len = global.pageSize + 1; i < len; i++) {
        await TestHelper.createPerson(user, {
          relationship_director: true,
          relationship_title: 'Director',
          relationship_percent_ownership: '0'
        })
        persons.unshift(user.director.id)
      }
      const req = TestHelper.createRequest(`/api/user/connect/persons?stripeid=${user.stripeAccount.id}&offset=${offset}`)
      req.account = user.account
      req.session = user.session
      const personsNow = await req.get()
      for (let i = 0, len = global.pageSize; i < len; i++) {
        assert.strictEqual(personsNow[i].id, persons[offset + i])
      }
    })

    it('optional querystring limit (integer)', async () => {
      const limit = 1
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'DE',
        type: 'company'
      })
      for (let i = 0, len = limit + 1; i < len; i++) {
        await TestHelper.createPerson(user, {
          relationship_director: true,
          relationship_title: 'Director',
          relationship_percent_ownership: '0'
        })
      }
      const req = TestHelper.createRequest(`/api/user/connect/persons?stripeid=${user.stripeAccount.id}&limit=${limit}`)
      req.account = user.account
      req.session = user.session
      const personsNow = await req.get()
      assert.strictEqual(personsNow.length, limit)
    })

    it('optional querystring all (boolean)', async () => {
      global.pageSize = 1
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'DE',
        type: 'company'
      })
      for (let i = 0, len = global.pageSize + 1; i < len; i++) {
        await TestHelper.createPerson(user, {
          relationship_director: true,
          relationship_title: 'Director',
          relationship_percent_ownership: '0'
        })
      }
      const req = TestHelper.createRequest(`/api/user/connect/persons?stripeid=${user.stripeAccount.id}&all=true`)
      req.account = user.account
      req.session = user.session
      const personsNow = await req.get()
      assert.strictEqual(personsNow.length, global.pageSize + 1)
    })
  })

  describe('returns', () => {
    it('array', async () => {
      const user = await TestStripeAccounts.createCompanyWithDirectors('FI', 2)
      const req = TestHelper.createRequest(`/api/user/connect/persons?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.filename = __filename
      req.saveResponse = true
      const persons = await req.get()
      assert.strictEqual(persons.length, 2)
    })
  })
})
