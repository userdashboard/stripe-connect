/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')

describe('/account/connect/edit-beneficial-owner', () => {
  describe('EditBeneficialOwner#BEFORE', () => {
    it('should reject invalid personid', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/account/connect/edit-beneficial-owner?personid=invalid')
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

    it('should reject registration with submitted owners', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'DE',
        type: 'company'
      })
      const person = TestHelper.nextIdentity()
      await TestHelper.createBeneficialOwner(user, {
        address_city: 'Berlin',
        address_country: 'DE',
        address_line1: 'First Street',
        address_postal_code: '01067',
        address_state: 'BW',
        dob_day: '1',
        dob_month: '1',
        dob_year: '1950',
        email: person.email,
        first_name: person.firstName,
        last_name: person.lastName
      }, {
        verification_document_back: TestHelper['success_id_scan_back.png'],
        verification_document_front: TestHelper['success_id_scan_front.png']
      })
      await TestHelper.submitBeneficialOwners(user)
      const req = TestHelper.createRequest(`/account/connect/edit-beneficial-owner?personid=${user.owner.id}`)
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
        country: 'DE',
        type: 'company'
      })
      const person = TestHelper.nextIdentity()
      await TestHelper.createBeneficialOwner(user, {
        address_city: 'Berlin',
        address_country: 'DE',
        address_line1: 'First Street',
        address_postal_code: '01067',
        address_state: 'BW',
        dob_day: '1',
        dob_month: '1',
        dob_year: '1950',
        email: person.email,
        first_name: person.firstName,
        last_name: person.lastName
      }, {
        verification_document_back: TestHelper['success_id_scan_back.png'],
        verification_document_front: TestHelper['success_id_scan_front.png']
      })
      const user2 = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/account/connect/edit-beneficial-owner?personid=${user.owner.id}`)
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

    it('should bind owner to req', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'DE',
        type: 'company'
      })
      const person = TestHelper.nextIdentity()
      await TestHelper.createBeneficialOwner(user, {
        address_city: 'Berlin',
        address_country: 'DE',
        address_line1: 'First Street',
        address_postal_code: '01067',
        address_state: 'BW',
        dob_day: '1',
        dob_month: '1',
        dob_year: '1950',
        email: person.email,
        first_name: person.firstName,
        last_name: person.lastName
      }, {
        verification_document_back: TestHelper['success_id_scan_back.png'],
        verification_document_front: TestHelper['success_id_scan_front.png']
      })
      const req = TestHelper.createRequest(`/account/connect/edit-beneficial-owner?personid=${user.owner.id}`)
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.owner.id, user.owner.id)
    })
  })

  describe('EditBeneficialOwner#GET', () => {
    it('should present the form', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'DE',
        type: 'company'
      })
      const person = TestHelper.nextIdentity()
      await TestHelper.createBeneficialOwner(user, {
        address_city: 'Berlin',
        address_country: 'DE',
        address_line1: 'First Street',
        address_postal_code: '01067',
        address_state: 'BW',
        dob_day: '1',
        dob_month: '1',
        dob_year: '1950',
        email: person.email,
        first_name: person.firstName,
        last_name: person.lastName
      }, {
        verification_document_back: TestHelper['success_id_scan_back.png'],
        verification_document_front: TestHelper['success_id_scan_front.png']
      })
      const req = TestHelper.createRequest(`/account/connect/edit-beneficial-owner?personid=${user.owner.id}`)
      req.account = user.account
      req.session = user.session
      const page = await req.get()
      const doc = TestHelper.extractDoc(page)
      assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
      assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
    })
  })

  describe('EditBeneficialOwner#POST', () => {
    it('should update required document (screenshots)', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'DE',
        type: 'company'
      })
      await TestHelper.createStripeRegistration(user, {
        business_profile_mcc: '7531',
        business_profile_url: 'https://www.abcde.com',
        address_city: 'Frederiksberg',
        address_line1: '123 Park Lane',
        address_postal_code: '01067',
        address_state: 'BW',
        name: 'Company',
        phone: '456-789-0123',
        tax_id: '00000000000'
      })
      const person = TestHelper.nextIdentity()
      await TestHelper.createCompanyRepresentative(user, {
        address_city: 'Berlin',
        address_line1: 'First Street',
        address_postal_code: '01067',
        address_state: 'BW',
        dob_day: '1',
        dob_month: '1',
        dob_year: '1950',
        email: person.email,
        phone: '456-789-0123',
        first_name: person.firstName,
        last_name: person.lastName
      }, {
        verification_document_back: TestHelper['success_id_scan_back.png'],
        verification_document_front: TestHelper['success_id_scan_front.png']
      })
      const person2 = TestHelper.nextIdentity()
      await TestHelper.createBeneficialOwner(user, {
        address_city: 'Berlin',
        address_country: 'DE',
        address_line1: 'First Street',
        address_postal_code: '01067',
        address_state: 'BW',
        dob_day: '1',
        dob_month: '1',
        dob_year: '1950',
        email: person2.email,
        first_name: person2.firstName,
        last_name: person2.lastName
      })
      await TestHelper.createExternalAccount(user, {
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_holder_type: 'individual',
        account_number: '000123456789',
        country: 'US',
        currency: 'usd',
        routing_number: '110000000'
      })
      await TestHelper.submitBeneficialOwners(user)
      await TestHelper.submitCompanyDirectors(user)
      await TestHelper.submitStripeAccount(user)
      await TestHelper.waitForPersonRequirement(user, user.owner.id, 'verification.additional_document')
      const req = TestHelper.createRequest(`/account/connect/edit-beneficial-owner?personid=${user.owner.id}`)
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
        { click: `/account/connect/beneficial-owner?personid=${user.owner.id}` },
        { click: `/account/connect/edit-beneficial-owner?personid=${user.owner.id}` },
        { fill: '#submit-form' }
      ]
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should update required additional_document', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'DE',
        type: 'company'
      })
      const person = TestHelper.nextIdentity()
      await TestHelper.createBeneficialOwner(user, {
        address_city: 'Berlin',
        address_line1: 'First Street',
        address_postal_code: '01067',
        address_state: 'BW',
        dob_day: '1',
        dob_month: '1',
        dob_year: '1950',
        email: person.email,
        first_name: person.firstName,
        last_name: person.lastName
      }, {
        verification_document_back: TestHelper['success_id_scan_back.png'],
        verification_document_front: TestHelper['success_id_scan_front.png']
      })
      await TestHelper.waitForPersonRequirement(user, user.owner.id, 'verification.additional_document')
      const req = TestHelper.createRequest(`/account/connect/edit-beneficial-owner?personid=${user.owner.id}`)
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
  })
})
