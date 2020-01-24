/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts.js')

describe('/account/connect/delete-company-director', () => {
  describe('DeleteCompanyDirector#BEFORE', () => {
    it('should reject invalid personid', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/account/connect/delete-company-director?personid=invalid')
      req.account = user.account
      req.session = user.session
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-personid')
    })

    it('should reject registration with directors submitted', async () => {
      const user = await TestStripeAccounts.createCompanyWithDirectors('DE', 1)
      await TestHelper.submitCompanyDirectors(user)
      const req = TestHelper.createRequest(`/account/connect/delete-company-director?personid=${user.director.id}`)
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

    it('should require own Stripe account', async () => {
      const user = await TestStripeAccounts.createCompanyWithDirectors('DE', 1)
      const user2 = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/account/connect/delete-company-director?personid=${user.director.id}`)
      req.account = user2.account
      req.session = user2.session
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-account')
    })

    it('should bind director to req', async () => {
      const user = await TestStripeAccounts.createCompanyWithDirectors('DE', 1)
      const req = TestHelper.createRequest(`/account/connect/delete-company-director?personid=${user.director.id}`)
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.director.id, user.director.id)
    })
  })

  describe('DeleteCompanyDirector#GET', () => {
    it('should present the form', async () => {
      const user = await TestStripeAccounts.createCompanyWithDirectors('DE', 1)
      const req = TestHelper.createRequest(`/account/connect/delete-company-director?personid=${user.director.id}`)
      req.account = user.account
      req.session = user.session
      const page = await req.get()
      const doc = TestHelper.extractDoc(page)
      assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
      assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
    })

    it('should present the director table', async () => {
      const user = await TestStripeAccounts.createCompanyWithDirectors('DE', 1)
      const req = TestHelper.createRequest(`/account/connect/delete-company-director?personid=${user.director.id}`)
      req.account = user.account
      req.session = user.session
      const page = await req.get()
      const doc = TestHelper.extractDoc(page)
      const row = doc.getElementById(user.director.id)
      assert.strictEqual(row.tag, 'tr')
    })
  })

  describe('DeleteCompanyDirector#POST', () => {
    it('should delete director (screenshots)', async () => {
      const user = await TestStripeAccounts.createCompanyWithDirectors('DE', 1)
      const req = TestHelper.createRequest(`/account/connect/delete-company-director?personid=${user.director.id}`)
      req.account = user.account
      req.session = user.session
      req.filename = __filename
      req.screenshots = [
        { hover: '#account-menu-container' },
        { click: '/account/connect' },
        { click: `/account/connect/stripe-account?stripeid=${user.stripeAccount.id}` },
        { click: `/account/connect/company-directors?stripeid=${user.stripeAccount.id}` },
        { click: `/account/connect/company-director?personid=${user.director.id}` },
        { click: `/account/connect/delete-company-director?personid=${user.director.id}` },
        { fill: '#submit-form' }
      ]
      await req.post()
      const req2 = TestHelper.createRequest(`/api/user/connect/company-directors?stripeid=${user.stripeAccount.id}`)
      req2.account = user.account
      req2.session = user.session
      const directors = await req2.get()
      assert.strictEqual(directors, undefined)
    })
  })
})
