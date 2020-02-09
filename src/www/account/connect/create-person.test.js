/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')

describe('/account/connect/create-person', () => {
  describe('CreatePerson#BEFORE', () => {
    it('should reject invalid stripeid', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/account/connect/create-person?stripeid=invalid`)
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

    it('should remove director option', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'HK',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/create-person?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const page = await req.get()
      const doc = TestHelper.extractDoc(page)
      const option = doc.getElementById('relationship_director')
      assert.strictEqual(option, undefined)
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
      const page = await req.get()
      const doc = TestHelper.extractDoc(page)
      const option = doc.getElementById('relationship_owner')
      assert.strictEqual(option, undefined)
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
      req.waitOnSubmit = true
      req.body = {
        relationship_representative: true,
        relationship_executive: true,
        relationship_owner: false,
        relationship_director: false,
        relationship_title: 'SVP Testing',
        relationship_percent_ownership: '0'
      }
      req.filename = __filename
      req.screenshots = [
        { hover: '#account-menu-container' },
        { click: '/account/connect' },
        { click: `/account/connect/stripe-account?stripeid=${user.stripeAccount.id}` },       
        { click: `/account/connect/create-person?stripeid=${user.stripeAccount.id}` },
        { fill: '#submit-form' }
      ]
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)      
      const personsTable = doc.getElementById('persons-table')
      assert.notStrictEqual(personsTable, undefined)
      assert.notStrictEqual(personsTable, null)
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
      req.waitOnSubmit = true
      req.body = {
        relationship_director: true,
        relationship_title: 'Chairperson',
        relationship_percent_ownership: '0'
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const personsTable = doc.getElementById('persons-table')
      assert.notStrictEqual(personsTable, undefined)
      assert.notStrictEqual(personsTable, null)
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
      req.waitOnSubmit = true
      req.body = {
        relationship_owner: true,
        relationship_title: 'Shareholder',
        relationship_percent_ownership: '7'
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const personsTable = doc.getElementById('persons-table')
      assert.notStrictEqual(personsTable, undefined)
      assert.notStrictEqual(personsTable, null)
    })
  })
})
