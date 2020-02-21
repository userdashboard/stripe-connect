/* eslint-env mocha */
const assert = require('assert')
const connect = require('../../../../index.js')
const TestHelper = require('../../../../test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts.js')

describe('/account/connect/edit-stripe-account', async () => {
  describe('EditStripeAccount#BEFORE', () => {
    it('should reject invalid registration', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/account/connect/edit-stripe-account?stripeid=invalid')
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
  })

  describe('EditStripeAccount#GET', async () => {
    const testedRequiredFields = []
    for (const country of connect.countrySpecs) {
      const companyPayload = TestStripeAccounts.createPostData(TestStripeAccounts.companyData[country.id])
      for (const field in companyPayload) {
        if (testedRequiredFields.indexOf(field) > -1) {
          continue
        }
        testedRequiredFields.push(field)
        it('should have element for ' + field , async () => {
          const user = await TestHelper.createUser()
          await TestHelper.createStripeAccount(user, {
            country: country.id,
            type: 'company'
          })
          const req = TestHelper.createRequest(`/account/connect/edit-stripe-account?stripeid=${user.stripeAccount.id}`)
          req.account = user.account
          req.session = user.session
          const result = await req.get()
          const doc = TestHelper.extractDoc(result.html)
          const elementContainer = doc.getElementById(`${field}-container`)
          assert.strictEqual(elementContainer.tag, 'div')
        })
      }

      const individualPayload = TestStripeAccounts.createPostData(TestStripeAccounts.individualData[country.id])
      for (const field in individualPayload) {
        if (testedRequiredFields.indexOf(field) > -1) {
          continue
        }
        testedRequiredFields.push(field)
        it('should have element for ' + field , async () => {
          const user = await TestHelper.createUser()
          await TestHelper.createStripeAccount(user, {
            country: country.id,
            type: 'individual'
          })
          const req = TestHelper.createRequest(`/account/connect/edit-stripe-account?stripeid=${user.stripeAccount.id}`)
          req.account = user.account
          req.session = user.session
          const result = await req.get()
          const doc = TestHelper.extractDoc(result.html)
          if (field.startsWith('dob_')) {
            const elementContainer = doc.getElementById(`dob-container`)
            assert.strictEqual(elementContainer.tag, 'div')  
          } else {
            const elementContainer = doc.getElementById(`${field}-container`)
            assert.strictEqual(elementContainer.tag, 'div')        
          }
        })   
      }
    }
  })

  describe('EditStripeAccount#POST', () => {
    const testedMissingFields = []
    for (const country of connect.countrySpecs) {
      const companyPayload = TestStripeAccounts.createPostData(TestStripeAccounts.companyData[country.id])
      for (const field in companyPayload) {
        if (testedMissingFields.indexOf(field) > -1) {
          continue
        }
        testedMissingFields.push(field)
        it('should reject invalid ' + field , async () => {
          const user = await TestHelper.createUser()
          await TestHelper.createStripeAccount(user, {
            country: country.id,
            type: 'company'
          })
          const req = TestHelper.createRequest(`/account/connect/edit-stripe-account?stripeid=${user.stripeAccount.id}`)
          req.account = user.account
          req.session = user.session
          req.body = TestStripeAccounts.createPostData(TestStripeAccounts.companyData[country.id])
          delete (req.body[field])
          const result = await req.post()
          const doc = TestHelper.extractDoc(result.html)
          const messageContainer = doc.getElementById('message-container')
          const message = messageContainer.child[0]
          assert.strictEqual(message.attr.template, `invalid-${field}`)
        })
      }
      const individualPayload = TestStripeAccounts.createPostData(TestStripeAccounts.individualData[country.id])
      for (const field in individualPayload) {
        if (testedMissingFields.indexOf(field) > -1) {
          continue
        }
        testedMissingFields.push(field)
        it('should reject invalid ' + field , async () => {
          const user = await TestHelper.createUser()
          await TestHelper.createStripeAccount(user, {
            country: country.id,
            type: 'individual'
          })
          const req = TestHelper.createRequest(`/account/connect/edit-stripe-account?stripeid=${user.stripeAccount.id}`)
          req.account = user.account
          req.session = user.session
          req.body = TestStripeAccounts.createPostData(TestStripeAccounts.individualData[country.id])
          delete (req.body[field])
          const result = await req.post()
          const doc = TestHelper.extractDoc(result.html)
          const messageContainer = doc.getElementById('message-container')
          const message = messageContainer.child[0]
          assert.strictEqual(message.attr.template, `invalid-${field}`)
        })
      }
    }

    it('should update registration (individual) (screenshots)', async () => {
      const country = connect.countrySpecs[Math.floor(Math.random() * connect.countrySpecs.length)]
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: country.id,
        type: 'individual'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-stripe-account?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = TestStripeAccounts.createPostData(TestStripeAccounts.individualData[country.id])
      req.uploads = {
        verification_document_front: TestHelper['success_id_scan_back.png'],
        verification_document_back: TestHelper['success_id_scan_back.png']
      }
      req.filename = __filename
      req.screenshots = [
        { hover: '#account-menu-container' },
        { click: '/account/connect' },
        { click: `/account/connect/stripe-account?stripeid=${user.stripeAccount.id}` },
        { click: `/account/connect/edit-stripe-account?stripeid=${user.stripeAccount.id}` },
        { fill: '#submit-form' }
      ]
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should update registration (company)', async () => {
      const country = connect.countrySpecs[Math.floor(Math.random() * connect.countrySpecs.length)]
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: country.id,
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-stripe-account?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = TestStripeAccounts.createPostData(TestStripeAccounts.companyData[country.id])
      req.uploads = {
        verification_document_front: TestHelper['success_id_scan_back.png'],
        verification_document_back: TestHelper['success_id_scan_back.png']
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })
  })
})
