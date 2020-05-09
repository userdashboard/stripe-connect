/* eslint-env mocha */
const assert = require('assert')
const connect = require('../../../../index.js')
const TestHelper = require('../../../../test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@userdashboard/dashboard/test-helper.js')

describe('/account/connect/edit-payment-information', function () {
  this.retries(5)
  this.timeout(40 * 60 * 1000)
  const hasFormResponses = {}
  const errorResponses = {}
  const submitResponses = {}
  before(async () => {
    await DashboardTestHelper.setupBeforeEach()
    await TestHelper.setupBeforeEach()
    for (const country of connect.countrySpecs) {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: country.id,
        type: 'individual'
      })
      // form responses
      const req = TestHelper.createRequest(`/account/connect/edit-payment-information?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      hasFormResponses[country.id] = await req.get()
      // errors
      let body
      if (TestStripeAccounts.paymentData[country.id].length) {
        errorResponses[country.id] = []
        for (const i in TestStripeAccounts.paymentData[country.id]) {
          const format = TestStripeAccounts.paymentData[country.id][i]
          body = TestStripeAccounts.createPostData(format)
          const fields = Object.keys(body)
          errorResponses[country.id][i] = {}
          for (const field of fields) {
            req.body = JSON.parse(JSON.stringify(body))
            req.body[field] = ''
            errorResponses[country.id][i][field] = await req.post()
          }
        }
      } else {
        body = TestStripeAccounts.createPostData(TestStripeAccounts.paymentData[country.id])
        const fields = Object.keys(body)
        errorResponses[country.id] = {}
        for (const field of fields) {
          req.body = JSON.parse(JSON.stringify(body))
          req.body[field] = ''
          errorResponses[country.id][field] = await req.post()
        }
      }
      // submit responses
      const req2 = TestHelper.createRequest(`/account/connect/edit-payment-information?stripeid=${user.stripeAccount.id}`)
      req2.account = user.account
      req2.session = user.session
      if (TestStripeAccounts.paymentData[country.id].length) {
        submitResponses[country.id] = []
        for (const i in TestStripeAccounts.paymentData[country.id]) {
          const format = TestStripeAccounts.paymentData[country.id][i]
          req2.body = TestStripeAccounts.createPostData(format, user.profile)
          submitResponses[country.id][i] = await req2.post()
        }
      } else {
        req2.body = TestStripeAccounts.createPostData(TestStripeAccounts.paymentData[country.id], user.profile)
        submitResponses[country.id] = await req2.post()
      }
    }
  })
  describe('init', () => {
    it('should reject invalid stripeid', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/account/connect/edit-payment-information?stripeid=invalid')
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

    it('should bind Stripe account to req', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-payment-information?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.stripeAccount.id, user.stripeAccount.id)
    })
  })

  describe('view', async () => {
    for (const country of connect.countrySpecs) {
      it('should present the form (' + country.id + ')', async () => {
        const result = hasFormResponses[country.id]
        const doc = TestHelper.extractDoc(result.html)
        assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
        assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
      })
    }
  })

  describe('submit', async () => {
    for (const country of connect.countrySpecs) {
      it('reject invalid fields (' + country.id + ')', async () => {
        let body
        if (TestStripeAccounts.paymentData[country.id].length) {
          for (const i in TestStripeAccounts.paymentData[country.id]) {
            const format = TestStripeAccounts.paymentData[country.id][i]
            body = TestStripeAccounts.createPostData(format)
            const fields = Object.keys(body)
            for (const field of fields) {
              const result = errorResponses[country.id][i][field]
              const doc = TestHelper.extractDoc(result.html)
              const messageContainer = doc.getElementById('message-container')
              const message = messageContainer.child[0]
              assert.strictEqual(message.attr.template, `invalid-${field}`)
            }
          }
          return
        }
        body = TestStripeAccounts.createPostData(TestStripeAccounts.paymentData[country.id])
        const fields = Object.keys(body)
        for (const field of fields) {
          const result = errorResponses[country.id][field]
          const doc = TestHelper.extractDoc(result.html)
          const messageContainer = doc.getElementById('message-container')
          const message = messageContainer.child[0]
          assert.strictEqual(message.attr.template, `invalid-${field}`)
        }
      })
    }

    for (const country of connect.countrySpecs) {
      it('submit payment information (' + country.id + ')', async () => {
        if (TestStripeAccounts.paymentData[country.id].length) {
          for (const i in TestStripeAccounts.paymentData[country.id]) {
            const result = submitResponses[country.id][i]
            const doc = TestHelper.extractDoc(result.html)
            const messageContainer = doc.getElementById('message-container')
            const message = messageContainer.child[0]
            assert.strictEqual(message.attr.template, 'success')
          }
          return
        }
        const result = submitResponses[country.id]
        const doc = TestHelper.extractDoc(result.html)
        const messageContainer = doc.getElementById('message-container')
        const message = messageContainer.child[0]
        assert.strictEqual(message.attr.template, 'success')
      })
    }

    it('submit payment information (screenshots)', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'individual'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-payment-information?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = TestStripeAccounts.createPostData(TestStripeAccounts.paymentData.US, user.profile)
      req.filename = __filename
      req.screenshots = [
        { hover: '#account-menu-container' },
        { click: '/account/connect' },
        { click: `/account/connect/stripe-account?stripeid=${user.stripeAccount.id}` },
        { click: `/account/connect/edit-payment-information?stripeid=${user.stripeAccount.id}` },
        { fill: '#submit-form' }
      ]
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })
  })
})
