/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')

describe('/account/connect/delete-company-director', () => {
  describe('DeleteCompanyDirector#BEFORE', () => {
    it('should reject invalid directorid', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/account/connect/delete-company-director?directorid=invalid')
      req.account = user.account
      req.session = user.session
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-directorid')
    })

    it('should reject submitted registration', async () => {
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
        relationship_representative_address_line1: 'First Street',
        relationship_representative_address_postal_code: '01067',
        relationship_representative_address_state: 'BW',
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
      await TestHelper.createExternalAccount(user, {
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_holder_type: 'individual',
        country: 'DE',
        currency: 'eur',
        iban: 'DE89370400440532013000'
      })
      const person = TestHelper.nextIdentity()
      await TestHelper.createCompanyDirector(user, {
        relationship_director_dob_day: '1',
        relationship_director_dob_month: '1',
        relationship_director_dob_year: '1950',
        relationship_director_first_name: person.firstName,
        relationship_director_last_name: person.lastName
      }, {
        relationship_director_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_director_verification_document_front: TestHelper['success_id_scan_front.png']
      })
      await TestHelper.setCompanyRepresentative(user)
      await TestHelper.submitCompanyDirectors(user)
      await TestHelper.submitBeneficialOwners(user)
      await TestHelper.submitStripeAccount(user)
      const req = TestHelper.createRequest(`/account/connect/delete-company-director?directorid=${user.director.directorid}`)
      req.account = user.account
      req.session = user.session
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-directorid')
    })

    it('should require own Stripe account', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'DE',
        type: 'company'
      })
      const person = TestHelper.nextIdentity()
      await TestHelper.createCompanyDirector(user, {
        relationship_director_dob_day: '1',
        relationship_director_dob_month: '1',
        relationship_director_dob_year: '1950',
        relationship_director_first_name: person.firstName,
        relationship_director_last_name: person.lastName
      }, {
        relationship_director_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_director_verification_document_front: TestHelper['success_id_scan_front.png']
      })
      const user2 = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/account/connect/delete-company-director?directorid=${user.director.directorid}`)
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
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'DE',
        type: 'company'
      })
      const person = TestHelper.nextIdentity()
      await TestHelper.createCompanyDirector(user, {
        relationship_director_dob_day: '1',
        relationship_director_dob_month: '1',
        relationship_director_dob_year: '1950',
        relationship_director_first_name: person.firstName,
        relationship_director_last_name: person.lastName
      }, {
        relationship_director_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_director_verification_document_front: TestHelper['success_id_scan_front.png']
      })
      const req = TestHelper.createRequest(`/account/connect/delete-company-director?directorid=${user.director.directorid}`)
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.director.directorid, user.director.directorid)
    })
  })

  describe('DeleteCompanyDirector#GET', () => {
    it('should present the form', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'DE',
        type: 'company'
      })
      const person = TestHelper.nextIdentity()
      await TestHelper.createCompanyDirector(user, {
        relationship_director_dob_day: '1',
        relationship_director_dob_month: '1',
        relationship_director_dob_year: '1950',
        relationship_director_first_name: person.firstName,
        relationship_director_last_name: person.lastName
      }, {
        relationship_director_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_director_verification_document_front: TestHelper['success_id_scan_front.png']
      })
      const req = TestHelper.createRequest(`/account/connect/delete-company-director?directorid=${user.director.directorid}`)
      req.account = user.account
      req.session = user.session
      const page = await req.get()
      const doc = TestHelper.extractDoc(page)
      assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
      assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
    })

    it('should present the director table', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'DE',
        type: 'company'
      })
      const person = TestHelper.nextIdentity()
      await TestHelper.createCompanyDirector(user, {
        relationship_director_dob_day: '1',
        relationship_director_dob_month: '1',
        relationship_director_dob_year: '1950',
        relationship_director_first_name: person.firstName,
        relationship_director_last_name: person.lastName
      }, {
        relationship_director_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_director_verification_document_front: TestHelper['success_id_scan_front.png']
      })
      const req = TestHelper.createRequest(`/account/connect/delete-company-director?directorid=${user.director.directorid}`)
      req.account = user.account
      req.session = user.session
      const page = await req.get()
      const doc = TestHelper.extractDoc(page)
      const row = doc.getElementById(user.director.directorid)
      assert.strictEqual(row.tag, 'tr')
    })
  })

  describe('DeleteCompanyDirector#POST', () => {
    it('should delete director', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'DE',
        type: 'company'
      })
      const person = TestHelper.nextIdentity()
      await TestHelper.createCompanyDirector(user, {
        relationship_director_dob_day: '1',
        relationship_director_dob_month: '1',
        relationship_director_dob_year: '1950',
        relationship_director_first_name: person.firstName,
        relationship_director_last_name: person.lastName
      }, {
        relationship_director_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_director_verification_document_front: TestHelper['success_id_scan_front.png']
      })
      const req = TestHelper.createRequest(`/account/connect/delete-company-director?directorid=${user.director.directorid}`)
      req.account = user.account
      req.session = user.session
      req.filename = __filename
      req.screenshots = [
        { hover: '#account-menu-container' },
        { click: '/account/connect' },
        { click: '/account/connect/stripe-accounts' },
        { click: `/account/connect/stripe-account?stripeid=${user.stripeAccount.id}` },
        { click: `/account/connect/company-directors?stripeid=${user.stripeAccount.id}` },
        { click: `/account/connect/company-director?directorid=${user.director.directorid}` },
        { click: `/account/connect/delete-company-director?directorid=${user.director.directorid}` },
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
