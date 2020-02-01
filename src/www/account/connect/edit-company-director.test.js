/* eslint-env mocha */
const assert = require('assert')
const connect = require('../../../../index.js')
const TestHelper = require('../../../../test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts.js')

describe('/account/connect/edit-company-director', () => {
  describe('EditCompanyDirector#BEFORE', () => {
    it('should reject invalid personid', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/account/connect/edit-company-director?personid=invalid')
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
      const req = TestHelper.createRequest(`/account/connect/edit-company-director?personid=${user.director.id}`)
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
      const req = TestHelper.createRequest(`/account/connect/edit-company-director?personid=${user.director.id}`)
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
      const req = TestHelper.createRequest(`/account/connect/edit-company-director?personid=${user.director.id}`)
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.director.id, user.director.id)
    })
  })

  describe('EditCompanyDirector#GET', () => {
    for (const country of connect.countrySpecs) {
      if (TestStripeAccounts.companyDirectorData[country.id] === false) {
        continue
      }
      it('should present the form (' + country.id + ')', async () => {
        const user = await TestStripeAccounts.createCompanyWithDirectors(country.id, 1)
        const req = TestHelper.createRequest(`/account/connect/edit-company-director?personid=${user.director.id}`)
        req.account = user.account
        req.session = user.session
        const page = await req.get()
        const doc = TestHelper.extractDoc(page)
        assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
        assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
      })
    }
  })

  describe('EditCompanyDirector#POST', () => {
    for (const country of connect.countrySpecs) {
      if (TestStripeAccounts.companyDirectorData[country.id] === false) {
        continue
      }
      it('should update required document (screenshots)', async () => {
        const user = await TestStripeAccounts.createCompanyWithDirectors(country.id, 1)
        const req = TestHelper.createRequest(`/account/connect/edit-company-director?personid=${user.director.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          verification_document_front: TestHelper['success_id_scan_back.png'],
          verification_document_back: TestHelper['success_id_scan_back.png']
        }
        req.filename = __filename
        req.screenshots = [
          { hover: '#account-menu-container' },
          { click: '/account/connect' },
          { click: `/account/connect/stripe-account?stripeid=${user.stripeAccount.id}` },
          { click: `/account/connect/company-director?personid=${user.director.id}` },
          { click: `/account/connect/edit-company-director?personid=${user.director.id}` },
          { fill: '#submit-form' }
        ]
        const page = await req.post()
        const doc = TestHelper.extractDoc(page)
        const messageContainer = doc.getElementById('message-container')
        const message = messageContainer.child[0]
        assert.strictEqual(message.attr.template, 'success')
      })
    }

    for (const country of connect.countrySpecs) {
      if (TestStripeAccounts.companyDirectorData[country.id] === false) {
        continue
      }
      it('should update required additional document', async () => {
        const user = await TestStripeAccounts.createCompanyWithDirectors(country.id, 1)
        const req = TestHelper.createRequest(`/account/connect/edit-company-director?personid=${user.director.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          verification_additional_document_front: TestHelper['success_id_scan_back.png'],
          verification_additional_document_back: TestHelper['success_id_scan_back.png']
        }
        const page = await req.post()
        const doc = TestHelper.extractDoc(page)
        const messageContainer = doc.getElementById('message-container')
        const message = messageContainer.child[0]
        assert.strictEqual(message.attr.template, 'success')
      })
    }
  })
})
