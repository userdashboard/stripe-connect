/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')

describe(`/account/connect/delete-company-owner`, async () => {
  describe('DeleteBeneficialOwner#BEFORE', () => {
    it('should reject invalid ownerid', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/account/connect/delete-company-owner?ownerid=invalid`)
      req.account = user.account
      req.session = user.session
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-ownerid')
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
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.email,
        relationship_account_opener_phone: '456-789-0123',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        company_address_city: 'Berlin', 
        company_address_line1: 'First Street',
        company_address_postal_code: '01067',
        relationship_account_opener_address_city: 'Berlin',
        relationship_account_opener_address_line1: 'First Street',
        relationship_account_opener_address_postal_code: '01067'
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'eur',
        country: 'DE',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        iban: 'DE89370400440532013000'
      })
      const person = TestHelper.nextIdentity()
      await TestHelper.createBeneficialOwner(user, {
        relationship_owner_first_name: person.firstName,
        relationship_owner_last_name: person.lastName,
        relationship_owner_address_country: 'DE',
        relationship_owner_address_city: 'Berlin',
        relationship_owner_address_postal_code: '01067',
        relationship_owner_address_line1: 'First Street',
        relationship_owner_dob_day: '1',
        relationship_owner_dob_month: '1',
        relationship_owner_dob_year: '1950'
      })
      await TestHelper.submitStripeAccount(user)
      const req = TestHelper.createRequest(`/account/connect/delete-company-owner?ownerid=${user.owner.ownerid}`)
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
      const person = TestHelper.nextIdentity()
      await TestHelper.createBeneficialOwner(user, {
        relationship_owner_first_name: person.firstName,
        relationship_owner_last_name: person.lastName,
        relationship_owner_address_country: 'DE',
        relationship_owner_address_city: 'Berlin',
        relationship_owner_address_postal_code: '01067', 
        relationship_owner_address_line1: 'First Street',
        relationship_owner_dob_day: '1',
        relationship_owner_dob_month: '1', 
        relationship_owner_dob_year: '1950' 
      })
      const user2 = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/account/connect/delete-company-owner?ownerid=${user.owner.ownerid}`)
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
        type: 'company',
        country: 'DE'
      })
      const person = TestHelper.nextIdentity()
      await TestHelper.createBeneficialOwner(user, {
        relationship_owner_first_name: person.firstName,
        relationship_owner_last_name: person.lastName,
        relationship_owner_address_country: 'DE',
        relationship_owner_address_city: 'Berlin',
        relationship_owner_address_postal_code: '01067',
        relationship_owner_address_line1: 'First Street',
        relationship_owner_dob_day: '1',
        relationship_owner_dob_month: '1', 
        relationship_owner_dob_year: '1950' 
      })
      const req = TestHelper.createRequest(`/account/connect/delete-company-owner?ownerid=${user.owner.ownerid}`)
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.owner.ownerid, user.owner.ownerid)
    })
  })

  describe('DeleteBeneficialOwner#GET', () => {
    it('should present the form', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'DE'
      })
      const person = TestHelper.nextIdentity()
      await TestHelper.createBeneficialOwner(user, {
        relationship_owner_first_name: person.firstName,
        relationship_owner_last_name: person.lastName,
        relationship_owner_address_country: 'DE',
        relationship_owner_address_city: 'Berlin',
        relationship_owner_address_postal_code: '01067', 
        relationship_owner_address_line1: 'First Street',
        relationship_owner_dob_day: '1',
        relationship_owner_dob_month: '1', 
        relationship_owner_dob_year: '1950' 
      })
      const req = TestHelper.createRequest(`/account/connect/delete-company-owner?ownerid=${user.owner.ownerid}`)
      req.account = user.account
      req.session = user.session
      const page = await req.get()
      const doc = TestHelper.extractDoc(page)
      assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
      assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
    })

    it('should present the owner table', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'DE'
      })
      const person = TestHelper.nextIdentity()
      await TestHelper.createBeneficialOwner(user, {
        relationship_owner_first_name: person.firstName,
        relationship_owner_last_name: person.lastName,
        relationship_owner_address_country: 'DE',
        relationship_owner_address_city: 'Berlin',
        relationship_owner_address_postal_code: '01067', 
        relationship_owner_address_line1: 'First Street',
        relationship_owner_dob_day: '1',
        relationship_owner_dob_month: '1',
        relationship_owner_dob_year: '1950' 
      })
      const req = TestHelper.createRequest(`/account/connect/delete-company-owner?ownerid=${user.owner.ownerid}`)
      req.account = user.account
      req.session = user.session
      const page = await req.get()
      const doc = TestHelper.extractDoc(page)
      const row = doc.getElementById(user.owner.ownerid)
      assert.strictEqual(row.tag, 'tr')
    })
  })

  describe('DeleteBeneficialOwner#POST', () => {
    it('should delete owner', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'DE'
      })
      const person = TestHelper.nextIdentity()
      await TestHelper.createBeneficialOwner(user, {
        relationship_owner_first_name: person.firstName,
        relationship_owner_last_name: person.lastName,
        relationship_owner_address_country: 'DE',
        relationship_owner_address_city: 'Berlin',
        relationship_owner_address_postal_code: '01067', 
        relationship_owner_address_line1: 'First Street',
        relationship_owner_dob_day: '1',
        relationship_owner_dob_month: '1', 
        relationship_owner_dob_year: '1950' 
      })
      const req = TestHelper.createRequest(`/account/connect/delete-company-owner?ownerid=${user.owner.ownerid}`)
      req.account = user.account
      req.session = user.session
      await req.post()
      const req2 = TestHelper.createRequest(`/api/user/connect/beneficial-owners?stripeid=${user.stripeAccount.id}`)
      req2.account = user.account
      req2.session = user.session
      const owners = await req2.get()
      assert.strictEqual(owners, undefined)
    })
  })
})
