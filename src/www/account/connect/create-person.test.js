/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')

describe('/account/connect/create-person', () => {
  describe('CreatePerson#BEFORE', () => {
    it('should reject invalid stripeid', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/account/connect/create-person?stripeid=${user.stripeAccount.id}`)
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
      const req = TestHelper.createRequest(`/account/connect/create-person?stripeid=${user.stripeAccount.id}`)
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

  describe('CreatePerson#GET', () => {
    it('should present the form', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'GB',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/create-person?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const page = await req.get()
      const doc = TestHelper.extractDoc(page)
      assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
      assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
    })
  })

  describe('CreatePerson#POST', () => {
    it('should create representative (screenshots)', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'GB',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/create-person?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      await req.post()
      const page = await req.post()
      req.filename = __filename
      req.screenshots = [
        { hover: '#account-menu-container' },
        { click: '/account/connect' },
        { click: '/account/connect/create-person' },
        { fill: '#submit-form' }
      ]
      const doc = TestHelper.extractDoc(page)
      const accountsTable = doc.getElementById('stripe-accounts-table')
      assert.notStrictEqual(accountsTable, undefined)
      assert.notStrictEqual(accountsTable, null)
    })

    it('should create director', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'GB',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/create-person?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      await req.post()
      const page = await req.post()
      req.filename = __filename
      req.screenshots = [
        { hover: '#account-menu-container' },
        { click: '/account/connect' },
        { click: '/account/connect/create-person' },
        { fill: '#submit-form' }
      ]
      const doc = TestHelper.extractDoc(page)
      const accountsTable = doc.getElementById('stripe-accounts-table')
      assert.notStrictEqual(accountsTable, undefined)
      assert.notStrictEqual(accountsTable, null)
    })

    it('should create owner', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'GB',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/create-person?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      await req.post()
      const page = await req.post()
      req.filename = __filename
      req.screenshots = [
        { hover: '#account-menu-container' },
        { click: '/account/connect' },
        { click: '/account/connect/create-person' },
        { fill: '#submit-form' }
      ]
      const doc = TestHelper.extractDoc(page)
      const accountsTable = doc.getElementById('stripe-accounts-table')
      assert.notStrictEqual(accountsTable, undefined)
      assert.notStrictEqual(accountsTable, null)
    })

    it('should remove director option', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'HK',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/create-person?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      await req.post()
      const page = await req.post()
      req.filename = __filename
      req.screenshots = [
        { hover: '#account-menu-container' },
        { click: '/account/connect' },
        { click: '/account/connect/create-person' },
        { fill: '#submit-form' }
      ]
      const doc = TestHelper.extractDoc(page)
      const accountsTable = doc.getElementById('stripe-accounts-table')
      assert.notStrictEqual(accountsTable, undefined)
      assert.notStrictEqual(accountsTable, null)
    })

    it('should remove owner option', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'HK',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/create-person?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      await req.post()
      const page = await req.post()
      req.filename = __filename
      req.screenshots = [
        { hover: '#account-menu-container' },
        { click: '/account/connect' },
        { click: '/account/connect/create-person' },
        { fill: '#submit-form' }
      ]
      const doc = TestHelper.extractDoc(page)
      const accountsTable = doc.getElementById('stripe-accounts-table')
      assert.notStrictEqual(accountsTable, undefined)
      assert.notStrictEqual(accountsTable, null)
    })
  })
})
