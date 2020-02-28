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
        it('should have element for ' + field, async () => {
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
        it('should have element for ' + field, async () => {
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
            const elementContainer = doc.getElementById('dob-container')
            assert.strictEqual(elementContainer.tag, 'div')
          } else {
            const elementContainer = doc.getElementById(`${field}-container`)
            assert.strictEqual(elementContainer.tag, 'div')
          }
        })
      }
    }

    const uploadFields = [
      'verification_document',
      'verification_additional_document'
    ]
    for (const field of uploadFields) {
      it(`should have element for ${field}`, async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'AT',
          type: 'individual'
        })
        if (field === 'verification_additional_document') {
          await TestHelper.updateStripeAccount(user, TestStripeAccounts.createPostData(TestStripeAccounts.individualData.AT))
          await TestHelper.waitForAccountRequirement(user, 'individual.verification.document')
          await TestHelper.updateStripeAccount(user, null, {
            verification_document_front: TestHelper['success_id_scan_back.png'],
            verification_document_back: TestHelper['success_id_scan_back.png']
          })
        } else {
          await TestHelper.updateStripeAccount(user, TestStripeAccounts.createPostData(TestStripeAccounts.individualData.AT))
        }
        const property = field.replace('verification_', 'verification.')
        await TestHelper.waitForAccountRequirement(user, `individual.${property}`)
        const req = TestHelper.createRequest(`/account/connect/edit-stripe-account?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const result = await req.get()
        const doc = TestHelper.extractDoc(result.html)
        const elementContainer = doc.getElementById(`${field}-container`)
        assert.strictEqual(elementContainer.tag, 'div')
      })
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
        it('should reject invalid ' + field, async () => {
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
        it('should reject invalid ' + field, async () => {
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

    // TODO: company verificaiton document can't be tested
    // because the Stripe test API erroneously marks it as
    // under review instead of required, and this form only
    // supports required fields
    const uploadFields = [
      'verification_document_front',
      'verification_document_back',
      'verification_additional_document_front',
      'verification_additional_document_back'
    ]
    for (const field of uploadFields) {
      it(`should reject invalid ${field} (individual)`, async () => {
        const user = await TestHelper.createUser()
        if (field.indexOf('additional') > -1) {
          await TestHelper.createStripeAccount(user, {
            country: 'GB',
            type: 'individual'
          })
        } else {
          await TestHelper.createStripeAccount(user, {
            country: 'GB',
            type: 'individual'
          })
        }
        if (field.startsWith('verification_additional')) {
          await TestHelper.updateStripeAccount(user, TestStripeAccounts.createPostData(TestStripeAccounts.individualData.GB))
          await TestHelper.waitForAccountRequirement(user, 'individual.verification.document')
          await TestHelper.updateStripeAccount(user, null, {
            verification_document_front: TestHelper['success_id_scan_back.png'],
            verification_document_back: TestHelper['success_id_scan_back.png']
          })
          await TestHelper.waitForAccountRequirement(user, 'individual.verification.additional_document')
        } else {
          await TestHelper.updateStripeAccount(user, TestStripeAccounts.createPostData(TestStripeAccounts.individualData.GB))
          await TestHelper.waitForAccountRequirement(user, 'individual.verification.document')
        }
        const req = TestHelper.createRequest(`/account/connect/edit-stripe-account?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        if (field.startsWith('verification_additional')) {
          req.uploads = {
            verification_additional_document_front: TestHelper['success_id_scan_back.png'],
            verification_additional_document_back: TestHelper['success_id_scan_back.png']
          }
        } else {
          req.uploads = {
            verification_document_front: TestHelper['success_id_scan_back.png'],
            verification_document_back: TestHelper['success_id_scan_back.png']
          }
        }
        delete (req.uploads[field])
        const result = await req.post()
        const doc = TestHelper.extractDoc(result.html)
        const messageContainer = doc.getElementById('message-container')
        const message = messageContainer.child[0]
        assert.strictEqual(message.attr.template, `invalid-${field}`)
      })
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
