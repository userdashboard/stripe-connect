/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')

describe(`/account/connect/company-directors`, () => {
  describe('CompanyDirectors#BEFORE', () => {
    it('should reject invalid stripeid', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/account/connect/company-directors?stripeid=invalid`)
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
      const req = TestHelper.createRequest(`/account/connect/company-directors?stripeid=${user.stripeAccount.id}`)
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

    it('should bind directors to req', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'DE'
      })
      const person = TestHelper.nextIdentity()
      await TestHelper.createCompanyDirector(user, {
        relationship_director_first_name: person.firstName,
        relationship_director_last_name: person.lastName
      })
      const req = TestHelper.createRequest(`/account/connect/company-directors?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.directors[0].directorid, user.director.directorid)
    })
  })

  describe('CompanyDirectors#GET', () => {
    it('should have row for each director', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'DE'
      })
      const person = TestHelper.nextIdentity()
      await TestHelper.createCompanyDirector(user, {
        relationship_director_first_name: person.firstName,
        relationship_director_last_name: person.lastName
      })
      const req = TestHelper.createRequest(`/account/connect/company-directors?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const page = await req.get()
      const doc = TestHelper.extractDoc(page)
      const row = doc.getElementById(user.director.directorid)
      assert.strictEqual(row.tag, 'tr')
    })

    it('should display submitted message with removed directors', async () => {
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
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        company_address_city: 'Berlin',
        company_address_line1: 'First Street',
        company_address_postal_'secret-code': '01067',
        relationship_account_opener_address_city: 'Berlin',
        relationship_account_opener_address_line1: 'First Street',
        relationship_account_opener_address_postal_'secret-code': '01067'
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'eur',
        country: 'DE',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        iban: 'DE89370400440532013000'
      })
      await TestHelper.submitStripeAccount(user)
      const req = TestHelper.createRequest(`/account/connect/company-directors?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const page = await req.get()
      const doc = TestHelper.extractDoc(page)
      const directorsTable = doc.getElementById('directors-table')
      assert.strictEqual(undefined, directorsTable)
      const submittedContainer = doc.getElementById('submitted-container')
      assert.strictEqual(submittedContainer.tag, 'div')
    })
  })
})
