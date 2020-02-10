/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts.js')

describe('/account/connect/persons', () => {
  describe('Persons#BEFORE', () => {
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

    it('should bind owners to req', async () => {
      const user = await TestStripeAccounts.createCompanyWithOwners('DE', 2)
      const req = TestHelper.createRequest(`/account/connect/persons?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.owners.length, 2)
    })

    it('should bind directors to req', async () => {
      const user = await TestStripeAccounts.createCompanyWithDirectors('DE', 2)
      const req = TestHelper.createRequest(`/account/connect/persons?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.directors.length, 2)
    })

    it('should bind representatives to req', async () => {
      const user = await TestStripeAccounts.createCompanyWithRepresentative('DE')
      const req = TestHelper.createRequest(`/account/connect/persons?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.representatives.length, 1)
    })
  })

  describe('Persons#GET', () => {
    it('should have row for each owner (screenshots)', async () => {
      const user = await TestStripeAccounts.createCompanyWithOwners('DE', 1)
      const req = TestHelper.createRequest(`/account/connect/persons?stripeid=${user.stripeAccount.id}`)
      req.filename = __filename
      req.screenshots = [
        { hover: '#account-menu-container' },
        { click: '/account/connect' },
        { click: '/account/connect/stripe-accounts' },
        { click: `/account/connect/stripe-account?stripeid=${user.stripeAccount.id}` },
        { click: `/account/connect/persons?stripeid=${user.stripeAccount.id}` }
      ]
      req.account = user.account
      req.session = user.session
      const page = await req.get()
      const doc = TestHelper.extractDoc(page)
      const row = doc.getElementById(user.owner.id)
      assert.strictEqual(row.tag, 'tr')
    })

    it('should have row for each director', async () => {
      const user = await TestStripeAccounts.createCompanyWithDirectors('DE', 1)
      const req = TestHelper.createRequest(`/account/connect/persons?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const page = await req.get()
      const doc = TestHelper.extractDoc(page)
      const row = doc.getElementById(user.director.id)
      assert.strictEqual(row.tag, 'tr')
    })

    it('should have row for each representative', async () => {
      const user = await TestStripeAccounts.createCompanyWithRepresentative('DE')
      const req = TestHelper.createRequest(`/account/connect/persons?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const page = await req.get()
      const doc = TestHelper.extractDoc(page)
      const row = doc.getElementById(user.representative.id)
      assert.strictEqual(row.tag, 'tr')
    })
  })
})
