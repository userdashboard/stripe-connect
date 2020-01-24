/* eslint-env mocha */
const assert = require('assert')
const connect = require('../../../../index.js')
const TestHelper = require('../../../../test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts.js')

describe('/account/connect/edit-company-representative', () => {
  describe('EditCompanyRepresentative#BEFORE', () => {
    it('should reject invalid registration', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/account/connect/edit-company-representative?stripeid=invalid')
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
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
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

  describe('EditCompanyRepresentative#GET', () => {
    for (const country of connect.countrySpecs) {
      it('should present the form (' + country.id + ')', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: country.id,
          type: 'company'
        })
        const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const page = await req.get()
        const doc = TestHelper.extractDoc(page)
        assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
        assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
      })
    }
  })

  describe('EditCompanyRepresentative#POST', () => {
    for (const country of connect.countrySpecs) {
      it('should reject invalid fields (' + country.id + ')', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: country.id,
          type: 'company'
        })
        const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = JSON.parse(JSON.stringify(TestStripeAccounts.representativeData[country.id]))
        if (country.id !== 'JP') {
          req.body.first_name = user.profile.firstName
          req.body.last_name = user.profile.lastName
        }
        if (country.id !== 'CA' && country.id !== 'HK' && country.id !== 'JP' && country.id !== 'MY' && country.id !== 'SG') {
          req.body.email = user.profile.contactEmail
        }
        const fields = Object.keys(req.body)
        const body = JSON.stringify(req.body)
        for (const field of fields) {
          req.body = JSON.parse(body)
          if (req.body[field]) {
            delete (req.body[field])
          }
          const page = await req.post()
          const doc = TestHelper.extractDoc(page)
          const messageContainer = doc.getElementById('message-container')
          const message = messageContainer.child[0]
          assert.strictEqual(message.attr.template, `invalid-${field}`)
        }
      })
    }

    for (const country of connect.countrySpecs) {
      it('should update information (' + country.id + ') (screenshots)', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: country.id,
          type: 'company'
        })
        const createBody = JSON.parse(JSON.stringify(TestStripeAccounts.representativeData[country.id]))
        if (country.id !== 'JP') {
          createBody.first_name = user.profile.firstName
          createBody.last_name = user.profile.lastName
        }
        if (country.id !== 'CA' && country.id !== 'HK' && country.id !== 'JP' && country.id !== 'MY' && country.id !== 'SG') {
          createBody.email = user.profile.contactEmail
        }
        await TestHelper.createCompanyRepresentative(user, createBody, {
          verification_document_back: TestHelper['success_id_scan_back.png'],
          verification_document_front: TestHelper['success_id_scan_front.png']
        })
        await TestHelper.waitForPersonRequirement(user, user.representative.id, 'verification.additional_document')
        const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          verification_additional_document_back: TestHelper['success_id_scan_back.png'],
          verification_additional_document_front: TestHelper['success_id_scan_front.png']
        }
        req.filename = __filename
        req.screenshots = [
          { hover: '#account-menu-container' },
          { click: '/account/connect' },
          { click: `/account/connect/stripe-account?stripeid=${user.stripeAccount.id}` },
          { click: `/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}` },
          { fill: '#submit-form' }
        ]
        const page = await req.post()
        const doc = TestHelper.extractDoc(page)
        const messageContainer = doc.getElementById('message-container')
        const message = messageContainer.child[0]
        assert.strictEqual(message.attr.template, 'success')
      })
    }
  })
})
