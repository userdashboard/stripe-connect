/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../..//test-helper.js')

describe(`/account/connect/additional-owners`, () => {
  describe('AdditionalOwners#BEFORE', () => {
    it('should reject invalid stripeid', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/account/connect/additional-owners?stripeid=invalid`)
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
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'US' })
      const req = TestHelper.createRequest(`/account/connect/additional-owners?stripeid=${user.stripeAccount.id}`)
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

    it('should reject registration that doesn\'t require additional owners', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'US' })
      const req = TestHelper.createRequest(`/account/connect/additional-owners?stripeid=${user.stripeAccount.id}`)
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
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'DE' })
      await TestHelper.createAdditionalOwner(user, { country: 'DE', city: 'Berlin', postal_code: '01067', line1: 'First Street', day: 1, month: 1, year: 1950 })
      const req = TestHelper.createRequest(`/account/connect/additional-owners?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.owners[0].ownerid, user.owner.ownerid)
    })
  })

  describe('AdditionalOwners#GET', () => {
    it('should have row for each owner', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'DE' })
      await TestHelper.createAdditionalOwner(user, { country: 'DE', city: 'Berlin', postal_code: '01067', line1: 'First Street', day: 1, month: 1, year: 1950 })
      const req = TestHelper.createRequest(`/account/connect/additional-owners?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const page = await req.get()
      const doc = TestHelper.extractDoc(page)
      const row = doc.getElementById(user.owner.ownerid)
      assert.strictEqual(row.tag, 'tr')
    })

    it('should display submitted message with removed owners', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'DE' })
      await TestHelper.submitAdditionalOwners(user)
      const req = TestHelper.createRequest(`/account/connect/additional-owners?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const page = await req.get()
      const doc = TestHelper.extractDoc(page)
      const ownersTable = doc.getElementById('owners-table')
      assert.strictEqual(undefined, ownersTable)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'submitted-owners')
    })
  })
})
