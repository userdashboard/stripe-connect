
/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const DashboardTestHelper = require('@userdashboard/dashboard/test-helper.js')

describe('/api/user/connect/persons', function () {
  this.retries(5)
  this.timeout(360000)
  const cachedResponses = {}
  const cachedPersons = []
  before(async () => {
    await DashboardTestHelper.setupBeforeEach()
    await TestHelper.setupBeforeEach()
    global.delayDiskWrites = true
    const user = await TestHelper.createUser()
    await TestHelper.createStripeAccount(user, {
      country: 'AT',
      type: 'company'
    })
    await TestHelper.createPerson(user, {
      relationship_representative: 'true',
      relationship_executive: 'true',
      relationship_title: 'SVP Testing',
      relationship_percent_ownership: 0
    })
    cachedPersons.unshift(user.representative.id)
    for (let i = 0, len = 2; i < len; i++) {
      await TestHelper.createPerson(user, {
        relationship_director: 'true',
        relationship_executive: 'true',
        relationship_title: 'SVP Testing',
        relationship_percent_ownership: 0
      })
      cachedPersons.unshift(user.person.id)
      await TestHelper.createPerson(user, {
        relationship_owner: 'true',
        relationship_executive: 'true',
        relationship_title: 'SVP Testing',
        relationship_percent_ownership: 0
      })
      cachedPersons.unshift(user.person.id)
    }
    const req1 = TestHelper.createRequest(`/api/user/connect/persons?stripeid=${user.stripeAccount.id}`)
    req1.account = user.account
    req1.session = user.session
    await req1.route.api.before(req1)
    cachedResponses.before = req1.data
    cachedResponses.returns = await req1.get()
    global.pageSize = 3
    cachedResponses.pageSize = await req1.get()
    const req2 = TestHelper.createRequest(`/api/user/connect/persons?stripeid=${user.stripeAccount.id}&offset=1`)
    req2.account = user.account
    req2.session = user.session
    cachedResponses.offset = await req2.get()
    const req3 = TestHelper.createRequest(`/api/user/connect/persons?stripeid=${user.stripeAccount.id}&limit=1`)
    req3.account = user.account
    req3.session = user.session
    cachedResponses.limit = await req3.get()
    const req4 = TestHelper.createRequest(`/api/user/connect/persons?stripeid=${user.stripeAccount.id}&all=true`)
    req4.account = user.account
    req4.session = user.session
    cachedResponses.all = await req4.get()
  })
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

  describe('receives', function () {
    it('optional querystring offset (integer)', async () => {
      const offset = 1
      const personsNow = cachedResponses.offset
      for (let i = 0, len = global.pageSize; i < len; i++) {
        assert.strictEqual(personsNow[i].id, cachedPersons[offset + i])
      }
    })

    it('optional querystring limit (integer)', async () => {
      const limit = 1
      const personsNow = cachedResponses.limit
      assert.strictEqual(personsNow.length, limit)
    })

    it('optional querystring all (boolean)', async () => {
      const personsNow = cachedResponses.all
      assert.strictEqual(personsNow.length, cachedPersons.length)
    })
  })

  describe('returns', function () {
    it('array', async () => {
      const persons = cachedResponses.returns
      assert.strictEqual(persons.length, global.pageSize)
    })
  })

  describe('configuration', function () {
    it('environment PAGE_SIZE', async () => {
      global.pageSize = 3
      const persons = cachedResponses.pageSize
      assert.strictEqual(persons.length, global.pageSize)
    })
  })
})
