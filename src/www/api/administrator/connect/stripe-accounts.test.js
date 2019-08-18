
/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')

describe(`/api/administrator/connect/stripe-accounts`, () => {
  describe('StripeAccounts#GET', () => {
    it('should limit Stripe accounts to one page', async () => {
      const administrator = await TestHelper.createAdministrator()
       for (let i = 0, len = global.pageSize + 1; i < len; i++) {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'US'
        })
        await TestHelper.createStripeRegistration(user, {
          company_name: 'Company',
          company_tax_id: '8',
          company_phone: '456-123-7890',
          company_address_city: 'New York',
          company_address_line1: '123 Park Lane',
          company_address_postal_code: '10001',
          company_address_state: 'NY',
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.email.split('@')[1],
          relationship_account_opener_dob_day: '1',
          relationship_account_opener_dob_month: '1',
          relationship_account_opener_dob_year: '1950',
          relationship_account_opener_first_name: user.profile.firstName,
          relationship_account_opener_last_name: user.profile.lastName,
          relationship_account_opener_email: user.profile.email,
          relationship_account_opener_phone: '456-789-0123',
          relationship_account_opener_address_city: 'New York',
        //  relationship_account_opener_address_state: 'New York',
          relationship_account_opener_address_line1: '285 Fulton St',
          relationship_account_opener_address_postal_code: '10007'
        })
      }
      const req = TestHelper.createRequest(`/api/administrator/connect/stripe-accounts`)
      req.account = administrator.account
      req.session = administrator.session
      const stripeAccounts = await req.get()
      assert.strictEqual(stripeAccounts.length, global.pageSize)
    })

    it('should enforce page size', async () => {
      global.pageSize = 3
      const administrator = await TestHelper.createAdministrator()
      for (let i = 0, len = global.pageSize + 1; i < len; i++) {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'US'
        })
        await TestHelper.createStripeRegistration(user, {
          company_name: 'Company',
          company_tax_id: '8',
          company_phone: '456-123-7890',
          company_address_city: 'New York',
          company_address_line1: '123 Park Lane',
          company_address_postal_code: '10001',
          company_address_state: 'NY',
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.email.split('@')[1],
          relationship_account_opener_dob_day: '1',
          relationship_account_opener_dob_month: '1',
          relationship_account_opener_dob_year: '1950',
          relationship_account_opener_first_name: user.profile.firstName,
          relationship_account_opener_last_name: user.profile.lastName,
          relationship_account_opener_email: user.profile.email,
          relationship_account_opener_phone: '456-789-0123',
          relationship_account_opener_address_city: 'New York',
          relationship_account_opener_address_state: 'NY',
          relationship_account_opener_address_line1: '285 Fulton St',
          relationship_account_opener_address_postal_code: '10007'
      })
      }
      const req = TestHelper.createRequest(`/api/administrator/connect/stripe-accounts`)
      req.account = administrator.account
      req.session = administrator.session
      const stripeAccounts = await req.get()
      assert.strictEqual(stripeAccounts.length, global.pageSize)
    })

    it('should enforce specified offset', async () => {
      const offset = 1
      const stripeAccounts = []
      const administrator = await TestHelper.createAdministrator()
      for (let i = 0, len = global.pageSize + 1; i < len; i++) {
        const user = await TestHelper.createUser()
        const stripeAccount = await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'US'
        })
        await TestHelper.createStripeRegistration(user, {
          company_name: 'Company',
          company_tax_id: '8',
          company_phone: '456-123-7890',
          company_address_city: 'New York',
          company_address_line1: '123 Park Lane',
          company_address_postal_code: '10001',
          company_address_state: 'NY',
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.email.split('@')[1],
          relationship_account_opener_dob_day: '1',
          relationship_account_opener_dob_month: '1',
          relationship_account_opener_dob_year: '1950',
          relationship_account_opener_first_name: user.profile.firstName,
          relationship_account_opener_last_name: user.profile.lastName,
          relationship_account_opener_email: user.profile.email,
          relationship_account_opener_phone: '456-789-0123',
          relationship_account_opener_address_city: 'New York',
          relationship_account_opener_address_state: 'NY',
          relationship_account_opener_address_line1: '285 Fulton St',
          relationship_account_opener_address_postal_code: '10007'
        })
        stripeAccounts.unshift(stripeAccount)
      }
      const req = TestHelper.createRequest(`/api/administrator/connect/stripe-accounts?offset=${offset}`)
      req.account = administrator.account
      req.session = administrator.session
      const stripeAccountsNow = await req.get()
      for (let i = 0, len = global.pageSize; i < len; i++) {
        assert.strictEqual(stripeAccountsNow[i].id, stripeAccounts[offset + i].id)
      }
    })

    it('should return all records', async () => {
      const administrator = await TestHelper.createAdministrator()
      const stripeAccounts = []
      for (let i = 0, len = global.pageSize + 1; i < len; i++) {
        const user = await TestHelper.createUser()
        const stripeAccount = await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'US'
        })
        await TestHelper.createStripeRegistration(user, {
          company_name: 'Company',
          company_tax_id: '8',
          company_phone: '456-123-7890',
          company_address_city: 'New York',
          company_address_line1: '123 Park Lane',
          company_address_postal_code: '10001',
          company_address_state: 'NY',
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.email.split('@')[1],
          relationship_account_opener_dob_day: '1',
          relationship_account_opener_dob_month: '1',
          relationship_account_opener_dob_year: '1950',
          relationship_account_opener_first_name: user.profile.firstName,
          relationship_account_opener_last_name: user.profile.lastName,
          relationship_account_opener_email: user.profile.email,
          relationship_account_opener_phone: '456-789-0123',
          relationship_account_opener_address_city: 'New York',
          relationship_account_opener_address_state: 'NY',
          relationship_account_opener_address_line1: '285 Fulton St',
          relationship_account_opener_address_postal_code: '10007'
        })
        stripeAccounts.unshift(stripeAccount)
      }
      const req = TestHelper.createRequest(`/api/administrator/connect/stripe-accounts?all=true`)
      req.account = administrator.account
      req.session = administrator.session
      const stripeAccountsNow = await req.get()
      for (let i = 0, len = global.pageSize + 1; i < len; i++) {
        assert.strictEqual(stripeAccountsNow[i].id, stripeAccounts[i].id)
      }
    })
  })
})
