/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts.js')

describe('/account/connect/stripe-account', () => {
  describe('StripeAccount#BEFORE', () => {
    it('should reject invalid stripeid', async () => {
      const administrator = await TestHelper.createOwner()
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'individual'
      })
      const req = TestHelper.createRequest('/account/connect/stripe-account?stripeid=invalid')
      req.account = administrator.account
      req.session = administrator.session
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-stripeid')
    })

    it('should reject other account\'s stripeid', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'individual'
      })
      const user2 = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/account/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
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

    it('should bind Stripe account to req', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'individual'
      })
      const req = TestHelper.createRequest(`/account/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.stripeAccount.id, user.stripeAccount.id)
    })
  })

  describe('StripeAccount#GET', () => {
    it('should show registration unstarted (screenshots)', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'individual'
      })
      const req = TestHelper.createRequest(`/account/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.filename = __filename
      req.screenshots = [
        { hover: '#account-menu-container' },
        { click: '/account/connect' },
        { click: '/account/connect/stripe-accounts' },
        { click: `/account/connect/stripe-account?stripeid=${user.stripeAccount.id}` }
      ]
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('account-status')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'unstarted-registration')
    })

    it('should show registration completed', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'individual'
      })
      await TestHelper.updateStripeAccount(user, TestStripeAccounts.createPostData(TestStripeAccounts.individualData.US, user.profile))
      const req = TestHelper.createRequest(`/account/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('account-status')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'completed-registration')
    })

    it('should show payment information required', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'individual'
      })
      await TestHelper.updateStripeAccount(user, TestStripeAccounts.createPostData(TestStripeAccounts.individualData.US, user.profile), {
        verification_document_back: TestHelper['success_id_scan_back.png'],
        verification_document_front: TestHelper['success_id_scan_front.png']
      })
      const req = TestHelper.createRequest(`/account/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('payment-information-status')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'no-payment-information')
    })

    it('should show payment information created', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'individual'
      })
      await TestHelper.updateStripeAccount(user, TestStripeAccounts.createPostData(TestStripeAccounts.individualData.US, user.profile), {
        verification_document_back: TestHelper['success_id_scan_back.png'],
        verification_document_front: TestHelper['success_id_scan_front.png']
      })
      await TestHelper.createExternalAccount(user, {
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_holder_type: 'individual',
        account_number: '000123456789',
        country: 'US',
        currency: 'usd',
        routing_number: '110000000'
      })
      const req = TestHelper.createRequest(`/account/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('payment-information-status')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'payment-information')
    })

    it('should show ready to submit', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'individual'
      })
      await TestHelper.updateStripeAccount(user, TestStripeAccounts.createPostData(TestStripeAccounts.individualData.US, user.profile))
      const req = TestHelper.createRequest(`/account/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('submission-status')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'not-submitted-information')
    })

    it('should show registration is submitted', async () => {
      // const user = await TestStripeAccounts.createSubmittedIndividual('NZ')
      // TODO: swap with individual account
      // the Stripe test api has an error creating fully-activated accounts
      // so when that gets fixed this code can be changed to speed it up
      const user = await TestStripeAccounts.createSubmittedCompany('NZ')
      const req = TestHelper.createRequest(`/account/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('submission-status')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'submitted-information')
    })
  })
})
