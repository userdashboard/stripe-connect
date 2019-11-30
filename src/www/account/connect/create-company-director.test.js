/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')

describe('/account/connect/create-company-director', () => {
  describe('CreateCompanyDirector#BEFORE', () => {
    it('should reject invalid stripeid', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/account/connect/create-company-director?stripeid=invalid')
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

    it('should reject submitted registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'DE'
      })
      await TestHelper.createStripeRegistration(user, {
        company_tax_id: '00000000',
        company_name: user.profile.firstName + '\'s company',
        company_address_country: 'DE',
        company_address_city: 'Berlin',
        company_address_line1: 'First Street',
        company_address_postal_code: '01067',
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_executive: 'true',
        relationship_representative_title: 'Owner',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_address_city: 'Berlin',
        relationship_representative_address_line1: 'First Street',
        relationship_representative_address_postal_code: '01067'
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'eur',
        country: 'DE',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_holder_type: 'individual',
        iban: 'DE89370400440532013000'
      })
      await TestHelper.submitStripeAccount(user)
      const req = TestHelper.createRequest(`/account/connect/create-company-director?stripeid=${user.stripeAccount.id}`)
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
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'DE'
      })
      const user2 = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/account/connect/create-company-director?stripeid=${user.stripeAccount.id}`)
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
  })

  describe('CreateCompanyDirector#GET', () => {
    it('should present the form', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'DE'
      })
      const req = TestHelper.createRequest(`/account/connect/create-company-director?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const page = await req.get()
      const doc = TestHelper.extractDoc(page)
      assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
      assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
    })
  })

  describe('CreateCompanyDirector#POST', () => {
    it('should require each field', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'DE'
      })
      const req = TestHelper.createRequest(`/account/connect/create-company-director?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const fields = [
        'relationship_director_verification_document_front',
        'relationship_director_verification_document_back'
      ]
      for (const field of fields) {
        req.uploads = {
          relationship_director_verification_document_front: TestHelper['success_id_scan_front.png'],
          relationship_director_verification_document_back: TestHelper['success_id_scan_back.png']
        }
        const person = TestHelper.nextIdentity()
        req.body = {
          relationship_director_first_name: person.firstName,
          relationship_director_last_name: person.lastName
        }
        if (req.uploads[field]) {
          delete (req.uploads[field])
        }
        if (req.body[field]) {
          req.body[field] = ''
        }
        const page = await req.post()
        const doc = TestHelper.extractDoc(page)
        const messageContainer = doc.getElementById('message-container')
        const message = messageContainer.child[0]
        assert.strictEqual(message.attr.template, `invalid-${field}`)
      }
    })

    it('should require a document id front upload', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'DE'
      })
      const req = TestHelper.createRequest(`/account/connect/create-company-director?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_director_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      const person = TestHelper.nextIdentity()
      req.body = {
        relationship_director_first_name: person.firstName,
        relationship_director_last_name: person.lastName
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-relationship_director_verification_document_front')
    })

    it('should require a document id back upload', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'DE'
      })
      const req = TestHelper.createRequest(`/account/connect/create-company-director?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_director_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const person = TestHelper.nextIdentity()
      req.body = {
        relationship_director_first_name: person.firstName,
        relationship_director_last_name: person.lastName
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-relationship_director_verification_document_back')
    })

    it('should create director', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'DE'
      })
      const req = TestHelper.createRequest(`/account/connect/create-company-director?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_director_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_director_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      const person = TestHelper.nextIdentity()
      req.body = {
        relationship_director_first_name: person.firstName,
        relationship_director_last_name: person.lastName
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const redirectURL = TestHelper.extractRedirectURL(doc)
      assert.strictEqual(redirectURL, `/account/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
    })
  })
})
