/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const DashboardTestHelper = require('@userdashboard/dashboard/test-helper.js')

describe('/account/connect/persons', function () {
  this.retries(10)
  this.timeout(30 * 60 * 1000)
  const cachedResponses = {}
  const cachedPersons = []
  let cachedRepresentative
  const cachedDirectors = []
  const cachedOwners = []
  before(async () => {
    await DashboardTestHelper.setupBeforeEach()
    await TestHelper.setupBeforeEach()
    global.delayDiskWrites = true
    const user = await TestHelper.createUser()
    await TestHelper.createStripeAccount(user, {
      country: 'AT',
      type: 'company'
    })
    cachedRepresentative = await TestHelper.createPerson(user, {
      relationship_representative: 'true',
      relationship_executive: 'true',
      relationship_title: 'SVP Testing',
      relationship_percent_ownership: '0'
    })
    for (let i = 0, len = 2; i < len; i++) {
      await TestHelper.createPerson(user, {
        relationship_director: 'true',
        relationship_executive: 'true',
        relationship_title: 'SVP Testing',
        relationship_percent_ownership: '0'
      })
      cachedDirectors.unshift(user.director.id)
      cachedPersons.unshift(user.director.id)
      await TestHelper.createPerson(user, {
        relationship_owner: 'true',
        relationship_executive: 'true',
        relationship_title: 'SVP Testing',
        relationship_percent_ownership: '11'
      })
      cachedOwners.unshift(user.owner.id)
      cachedPersons.unshift(user.owner.id)
    }
    const req1 = TestHelper.createRequest(`/account/connect/persons?stripeid=${user.stripeAccount.id}`)
    req1.account = user.account
    req1.session = user.session
    req1.filename = __filename
    req1.screenshots = [
      { hover: '#account-menu-container' },
      { click: '/account/connect' },
      { click: '/account/connect/stripe-accounts' },
      { click: `/account/connect/stripe-account?stripeid=${user.stripeAccount.id}` },
      { click: `/account/connect/persons?stripeid=${user.stripeAccount.id}` }
    ]
    await req1.route.api.before(req1)
    cachedResponses.before = req1.data
    cachedResponses.returns = await req1.get()
  })
  describe('exceptions', () => {
    it('should reject invalid stripeid', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/account/connect/persons?stripeid=invalid')
      req.account = user.account
      req.session = user.session
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-stripeid')
    })

    it('should reject individual registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'individual'
      })
      const req = TestHelper.createRequest(`/account/connect/persons?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-stripe-account')
    })
  })

  describe('before', () => {
    it('should bind data to req', async () => {
      const data = cachedResponses.before
      assert.strictEqual(data.owners.length, 2)
      assert.strictEqual(data.directors.length, 2)
      assert.strictEqual(data.representatives.length, 1)
    })
  })

  describe('view', () => {
    it('should have row for each owner (screenshots)', async () => {
      const result = await cachedResponses.returns
      const doc = TestHelper.extractDoc(result.html)
      const row = doc.getElementById(cachedOwners[0])
      assert.strictEqual(row.tag, 'tr')
    })

    it('should have row for each director', async () => {
      const result = await cachedResponses.returns
      const doc = TestHelper.extractDoc(result.html)
      const row = doc.getElementById(cachedDirectors[0])
      assert.strictEqual(row.tag, 'tr')
    })

    it('should have row for each representative', async () => {
      const result = await cachedResponses.returns
      const doc = TestHelper.extractDoc(result.html)
      const row = doc.getElementById(cachedRepresentative.id)
      assert.strictEqual(row.tag, 'tr')
    })
  })
})
