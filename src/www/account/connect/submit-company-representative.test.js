/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')

describe('/account/connect/submit-company-representative', () => {
  describe('SubmitCompanyRepresentative#BEFORE', () => {
    it('should reject invalid stripeid', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/account/connect/submit-company-representative?stripeid=invalid')
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

    it('should reject already-submitted representative', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'DE',
        type: 'company'
      })
      await TestHelper.createStripeRegistration(user, {
        business_profile_mcc: '5542',
        business_profile_url: 'https://website.com',
        company_address_city: 'Berlin',
        company_address_line1: 'First Street',
        company_address_postal_code: '01067',
        company_address_state: 'BW',
        company_name: user.profile.firstName + '\'s company',
        company_phone: '456-789-0123',
        company_tax_id: '00000000'
      })
      await TestHelper.createCompanyRepresentative(user, {
        relationship_representative_address_city: 'Berlin',
        relationship_representative_address_country: 'DE',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: '01067',
        relationship_representative_address_state: 'BE',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }, {
        relationship_representative_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
      })
      await TestHelper.setCompanyRepresentative(user)
      await TestHelper.waitForVerificationFieldsToLeave(user, 'person_')
      const req = TestHelper.createRequest(`/account/connect/submit-company-representative?stripeid=${user.stripeAccount.id}`)
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
      await TestHelper.createCompanyRepresentative(user, {
        relationship_representative_address_city: 'Berlin',
        relationship_representative_address_country: 'DE',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: '01067',
        relationship_representative_address_state: 'BE',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }, {
        relationship_representative_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
      })
      const user2 = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/account/connect/submit-company-representative?stripeid=${user.stripeAccount.id}`)
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

  describe('SubmitCompanyRepresentative#GET', () => {
    it('should present the form', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'DE',
        type: 'company'
      })
      await TestHelper.createCompanyRepresentative(user, {
        relationship_representative_address_city: 'Berlin',
        relationship_representative_address_country: 'DE',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: '01067',
        relationship_representative_address_state: 'BE',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }, {
        relationship_representative_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
      })
      const req = TestHelper.createRequest(`/account/connect/submit-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const page = await req.get()
      const doc = TestHelper.extractDoc(page)
      assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
      assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
    })
  })

  describe('SubmitCompanyRepresentative#POST', () => {
    it('should set company representative', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'DE',
        type: 'company'
      })
      await TestHelper.createCompanyRepresentative(user, {
        relationship_representative_address_city: 'Berlin',
        relationship_representative_address_country: 'DE',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: '01067',
        relationship_representative_address_state: 'BE',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }, {
        relationship_representative_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
      })
      const req = TestHelper.createRequest(`/account/connect/submit-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.filename = __filename
      req.screenshots = [
        { hover: '#account-menu-container' },
        { click: '/account/connect' },
        { click: '/account/connect/stripe-accounts' },
        { click: `/account/connect/stripe-account?stripeid=${user.stripeAccount.id}` },
        { click: `/account/connect/submit-company-representative?stripeid=${user.stripeAccount.id}` },
        { fill: '#submit-form' }
      ]
      await req.post()
      const req2 = TestHelper.createRequest(`/api/user/connect/company-directors?stripeid=${user.stripeAccount.id}`)
      req2.account = user.account
      req2.session = user.session
      const directors = await req2.get()
      assert.strictEqual(directors, undefined)
    })
  })
})
