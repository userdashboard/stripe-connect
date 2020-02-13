/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')

describe('/account/connect/create-registration', () => {
  describe('CreateRegistration#GET', () => {
    it('should present the form', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/account/connect/create-registration')
      req.account = user.account
      req.session = user.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
      assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
    })
  })

  describe('CreateRegistration#POST', () => {
    it('should create Stripe account (screenshots)', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/account/connect/create-registration')
      req.account = user.account
      req.session = user.session
      req.body = {
        type: 'company',
        country: 'AT'
      }
      await req.post()
      const result = await req.post()
      req.filename = __filename
      req.screenshots = [
        { hover: '#account-menu-container' },
        { click: '/account/connect' },
        { click: '/account/connect/create-registration' },
        { fill: '#submit-form' }
      ]
      const doc = TestHelper.extractDoc(result.html)
      const accountsTable = doc.getElementById('stripe-accounts-table')
      assert.notStrictEqual(accountsTable, undefined)
      assert.notStrictEqual(accountsTable, null)
    })
  })
})
