/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts.js')

describe('/account/connect/person', function () {
  this.retries(4)
  this.timeout(10 * 60 * 1000)
  describe('before', () => {
    it('should reject invalid personid', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/account/connect/person?personid=invalid')
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

    it('should bind data to req', async () => {
      const user = await TestStripeAccounts.createCompanyWithOwners('FR', 1)
      const req = TestHelper.createRequest(`/account/connect/person?personid=${user.owner.id}`)
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.person.id, user.owner.id)
    })
  })

  describe('view', () => {
    it('should show table for person (screenshots)', async () => {
      const user = await TestStripeAccounts.createCompanyWithOwners('GB', 1)
      const req = TestHelper.createRequest(`/account/connect/person?personid=${user.owner.id}`)
      req.account = user.account
      req.session = user.session
      req.filename = __filename
      req.screenshots = [
        { hover: '#account-menu-container' },
        { click: '/account/connect' },
        { click: '/account/connect/stripe-accounts' },
        { click: `/account/connect/stripe-account?stripeid=${user.stripeAccount.id}` },
        { click: `/account/connect/persons?stripeid=${user.stripeAccount.id}` },
        { click: `/account/connect/person?personid=${user.owner.id}` }
      ]
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      const row = doc.getElementById(user.owner.id)
      assert.strictEqual(row.tag, 'tbody')
    })

    it('should show person is representative', async () => {
      const user = await TestStripeAccounts.createCompanyWithRepresentative()
      const req = TestHelper.createRequest(`/account/connect/person?personid=${user.representative.id}`)
      req.account = user.account
      req.session = user.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      const cell = doc.getElementById('representative')
      assert.strictEqual(cell.tag, 'td')
    })

    it('should show person is owner', async () => {
      const user = await TestStripeAccounts.createCompanyWithOwners('GB', 1)
      const req = TestHelper.createRequest(`/account/connect/person?personid=${user.owner.id}`)
      req.account = user.account
      req.session = user.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      const cell = doc.getElementById('owner')
      assert.strictEqual(cell.tag, 'td')
    })

    it('should show person is director', async () => {
      const user = await TestStripeAccounts.createCompanyWithDirectors('GB', 1)
      const req = TestHelper.createRequest(`/account/connect/person?personid=${user.director.id}`)
      req.account = user.account
      req.session = user.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      const cell = doc.getElementById('director')
      assert.strictEqual(cell.tag, 'td')
    })

    it('should show person requires additional information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'GB',
        type: 'company'
      })
      await TestHelper.createPerson(user, {
        relationship_owner: 'true',
        relationship_title: 'Shareholder',
        relationship_percent_ownership: '10'
      })
      const req = TestHelper.createRequest(`/account/connect/person?personid=${user.owner.id}`)
      req.account = user.account
      req.session = user.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      const row = doc.getElementById('requires-information')
      assert.strictEqual(row.tag, 'tr')
    })
  })
})
