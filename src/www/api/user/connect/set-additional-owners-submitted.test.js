/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')

describe(`/api/user/connect/set-additional-owners-submitted`, async () => {
  describe('SetAdditionalOwnersSubmitted#BEFORE', () => {
    it('should reject invalid stripeid', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/api/user/connect/set-additional-owners-submitted?stripeid=invalid')
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

    it('should reject individual account', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'US' })
      const req = TestHelper.createRequest(`/api/user/connect/set-additional-owners-submitted?stripeid=${user.stripeAccount.id}`)
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

    it('should reject other account\'s registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'DE' })
      const user2 = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/api/user/connect/set-additional-owners-submitted?stripeid=${user.stripeAccount.id}`)
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

    it('should reject company that doesn\'t require owner info', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'US' })
      const req = TestHelper.createRequest(`/api/user/connect/set-additional-owners-submitted?stripeid=${user.stripeAccount.id}`)
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

    it('should reject registration with owners already submitted', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'DE' })
      await TestHelper.submitAdditionalOwners(user)
      const req = TestHelper.createRequest(`/api/user/connect/set-additional-owners-submitted?stripeid=${user.stripeAccount.id}`)
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

  describe('SetAdditionalOwnersSubmitted#PATCH', () => {
    it('should submit blank owners', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'DE' })
      const req = TestHelper.createRequest(`/api/user/connect/set-additional-owners-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.strictEqual(accountNow.legal_entity.additional_owners.length, 0)
      assert.notStrictEqual(accountNow.metadata.submittedOwners, undefined)
      assert.notStrictEqual(accountNow.metadata.submittedOwners, null)
    })

    it('should submit owners', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'DE' })
      await TestHelper.createAdditionalOwner(user, { country: 'DE', city: 'Berlin', postal_code: '01067', line1: 'First Street', day: 1, month: 1, year: 1951 })
      await TestHelper.createAdditionalOwner(user, { country: 'DE', city: 'Berlin', postal_code: '01067', line1: 'Second Street', day: 2, month: 2, year: 1952 })
      await TestHelper.createAdditionalOwner(user, { country: 'DE', city: 'Berlin', postal_code: '01067', line1: 'Third Street', day: 3, month: 3, year: 1953 })
      await TestHelper.createAdditionalOwner(user, { country: 'DE', city: 'Berlin', postal_code: '01067', line1: 'Fourth Street', day: 4, month: 4, year: 1954 })
      const req = TestHelper.createRequest(`/api/user/connect/set-additional-owners-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submittedOwners, undefined)
      assert.notStrictEqual(accountNow.metadata.submittedOwners, null)
    })
  })
})
