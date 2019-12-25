/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')

describe('/administrator/connect/stripe-accounts', () => {
  describe('StripeAccounts#BEFORE', () => {
    it('should bind Stripe accounts to req', async () => {
      const administrator = await TestHelper.createAdministrator()
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'individual'
      })
      await TestHelper.createStripeRegistration(user, {
        business_profile_mcc: '7997',
        business_profile_url: 'https://www.' + user.profile.contactEmail.split('@')[1],
        individual_address_city: 'New York',
        individual_address_line1: '285 Fulton St',
        individual_address_postal_code: '10007',
        individual_address_state: 'NY',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_email: user.profile.contactEmail,
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName,
        individual_phone: '456-789-0123',
        individual_ssn_last_4: '0000'
      })
      const req = TestHelper.createRequest('/administrator/connect/stripe-accounts')
      req.account = administrator.account
      req.session = administrator.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.stripeAccounts[0].id, user.stripeAccount.id)
    })
  })

  describe('StripeAccounts#GET', () => {
    it('should have row for each Stripe account', async () => {
      const administrator = await TestHelper.createAdministrator()
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'individual'
      })
      await TestHelper.createStripeRegistration(user, {
        business_profile_mcc: '7997',
        business_profile_url: 'https://www.' + user.profile.contactEmail.split('@')[1],
        individual_address_city: 'New York',
        individual_address_line1: '285 Fulton St',
        individual_address_postal_code: '10007',
        individual_address_state: 'NY',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_email: user.profile.contactEmail,
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName,
        individual_phone: '456-789-0123',
        individual_ssn_last_4: '0000'
      })
      const req = TestHelper.createRequest('/administrator/connect/stripe-accounts')
      req.account = administrator.account
      req.session = administrator.session
      req.filename = __filename
      req.screenshots = [
        { hover: '#administrator-menu-container' },
        { click: '/administrator/connect' },
        { click: '/administrator/connect/stripe-accounts' }
      ]
      const page = await req.get()
      const doc = TestHelper.extractDoc(page)
      const row = doc.getElementById(user.stripeAccount.id)
      assert.strictEqual(row.tag, 'tr')
    })
  })
})
