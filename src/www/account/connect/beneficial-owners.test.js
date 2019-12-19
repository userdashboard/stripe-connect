/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')

describe('/account/connect/beneficial-owners', () => {
  describe('BeneficialOwners#BEFORE', () => {
    it('should reject invalid stripeid', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/account/connect/beneficial-owners?stripeid=invalid')
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
        type: 'individual',
        country: 'US'
      })
      const req = TestHelper.createRequest(`/account/connect/beneficial-owners?stripeid=${user.stripeAccount.id}`)
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

    it('should bind owners to req', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'DE'
      })
      const person = TestHelper.nextIdentity()
      await TestHelper.createBeneficialOwner(user, {
        relationship_owner_email: person.email,
        relationship_owner_first_name: person.firstName,
        relationship_owner_last_name: person.lastName,
        relationship_owner_address_country: 'DE',
        relationship_owner_address_state: 'BW',
        relationship_owner_address_city: 'Berlin',
        relationship_owner_address_postal_code: '01067',
        relationship_owner_address_line1: 'First Street',
        relationship_owner_dob_day: '1',
        relationship_owner_dob_month: '1',
        relationship_owner_dob_year: '1950'
      }, {
        relationship_owner_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_owner_verification_document_back: TestHelper['success_id_scan_back.png']
      })
      const req = TestHelper.createRequest(`/account/connect/beneficial-owners?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.owners[0].ownerid, user.owner.ownerid)
    })
  })

  describe('BeneficialOwners#GET', () => {
    it('should have row for each owner', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'DE'
      })
      const person = TestHelper.nextIdentity()
      await TestHelper.createBeneficialOwner(user, {
        relationship_owner_email: person.email,
        relationship_owner_first_name: person.firstName,
        relationship_owner_last_name: person.lastName,
        relationship_owner_address_country: 'DE',
        relationship_owner_address_state: 'BW',
        relationship_owner_address_city: 'Berlin',
        relationship_owner_address_postal_code: '01067',
        relationship_owner_address_line1: 'First Street',
        relationship_owner_dob_day: '1',
        relationship_owner_dob_month: '1',
        relationship_owner_dob_year: '1950'
      }, {
        relationship_owner_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_owner_verification_document_back: TestHelper['success_id_scan_back.png']
      })
      const req = TestHelper.createRequest(`/account/connect/beneficial-owners?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const page = await req.get()
      const doc = TestHelper.extractDoc(page)
      const row = doc.getElementById(user.owner.ownerid)
      assert.strictEqual(row.tag, 'tr')
    })

    it('should display submitted message with removed owners', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'DE'
      })
      await TestHelper.createStripeRegistration(user, {
        company_address_city: 'Berlin',
        company_address_line1: 'First Street',
        company_address_postal_code: '01067',
        company_tax_id: '00000000',
        company_name: user.profile.firstName + '\'s company',
        company_address_country: 'DE',
        company_address_state: 'BW'
      })
      await TestHelper.createCompanyRepresentative(user, {
        relationship_owner_first_name: user.profile.firstName,
        relationship_owner_last_name: user.profile.lastName,
        relationship_owner_executive: 'true',
        relationship_owner_title: 'Owner',
        relationship_owner_email: user.profile.contactEmail,
        relationship_owner_phone: '456-789-0123',
        relationship_owner_dob_day: '1',
        relationship_owner_dob_month: '1',
        relationship_owner_dob_year: '1950',
        relationship_owner_address_city: 'Berlin',
        relationship_owner_address_state: 'BW',
        relationship_owner_address_line1: 'First Street',
        relationship_owner_address_postal_code: '01067'
      }, {
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png']
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'eur',
        country: 'DE',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_holder_type: 'individual',
        iban: 'DE89370400440532013000'
      })
      await TestHelper.setCompanyRepresentative(user)
      await TestHelper.submitCompanyDirectors(user)
      await TestHelper.submitBeneficialOwners(user)
      await TestHelper.submitStripeAccount(user)
      const req = TestHelper.createRequest(`/account/connect/beneficial-owners?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const page = await req.get()
      const doc = TestHelper.extractDoc(page)
      const ownersTable = doc.getElementById('owners-table')
      assert.strictEqual(undefined, ownersTable)
      const submittedContainer = doc.getElementById('submitted-container')
      assert.strictEqual(submittedContainer.tag, 'div')
    })
  })
})
