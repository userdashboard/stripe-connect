/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts.js')

describe('/account/connect/company-directors', () => {
  describe('CompanyDirectors#BEFORE', () => {
    it('should reject invalid stripeid', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/account/connect/company-directors?stripeid=invalid')
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
      const req = TestHelper.createRequest(`/account/connect/company-directors?stripeid=${user.stripeAccount.id}`)
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

    it('should bind directors to req', async () => {
      const user = await TestStripeAccounts.createCompanyWithDirectors('DE', 2)
      const req = TestHelper.createRequest(`/account/connect/company-directors?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.directors.length, 2)
    })
  })

  describe('CompanyDirectors#GET', () => {
    it('should have row for each director (screenshots)', async () => {
      const user = await TestStripeAccounts.createCompanyWithDirectors('DE', 1)
      const req = TestHelper.createRequest(`/account/connect/company-directors?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.filename = __filename
      req.screenshots = [
        { hover: '#account-menu-container' },
        { click: '/account/connect' },
        { click: '/account/connect/stripe-accounts' },
        { click: `/account/connect/stripe-account?stripeid=${user.stripeAccount.id}` },
        { click: `/account/connect/company-directors?stripeid=${user.stripeAccount.id}` }
      ]
      const page = await req.get()
      const doc = TestHelper.extractDoc(page)
      const row = doc.getElementById(user.director.id)
      assert.strictEqual(row.tag, 'tr')
    })

    it('should display submitted message with removed directors', async () => {
      const user = await TestStripeAccounts.createCompanyWithDirectors('DE', 1)
      await TestHelper.submitCompanyDirectors(user)
      const req = TestHelper.createRequest(`/account/connect/company-directors?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const page = await req.get()
      const doc = TestHelper.extractDoc(page)
      const directorsTable = doc.getElementById('directors-table')
      assert.strictEqual(undefined, directorsTable)
      const submittedContainer = doc.getElementById('submitted-container')
      assert.strictEqual(submittedContainer.tag, 'div')
    })
  })
})
