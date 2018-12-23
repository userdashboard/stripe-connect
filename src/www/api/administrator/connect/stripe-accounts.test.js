
/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')

describe(`/api/administrator/connect/stripe-accounts`, () => {
  describe('StripeAccounts#GET', () => {
    it('should limit Stripe accounts to one page', async () => {
      const administrator = await TestHelper.createAdministrator()
       for (let i = 0, len = global.pageSize + 1; i < len; i++) {
        const user = await TestHelper.createUser()
         await TestHelper.createStripeAccount(user, { type: 'company', country: 'US' })
         await TestHelper.createStripeRegistration(user, { business_tax_id: 1, business_name: user.profile.firstName + '\'s company', country: 'US', city: 'New York City', personal_city: 'New York City', postal_code: '10001', personal_id_number: '000000000', line1: 'First Street', day: '1', month: '1', year: '1950', company_city: 'New York City', company_state: 'New York', company_line1: 'First Street', company_postal_code: '10001', ssn_last_4: '0000' })
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
        await TestHelper.createStripeAccount(user, { type: 'company', country: 'US' })
        await TestHelper.createStripeRegistration(user, { business_tax_id: 1, business_name: user.profile.firstName + '\'s company', country: 'US', city: 'New York City', personal_city: 'New York City', postal_code: '10001', personal_id_number: '000000000', line1: 'First Street', day: '1', month: '1', year: '1950', company_city: 'New York City', company_state: 'New York', company_line1: 'First Street', company_postal_code: '10001', ssn_last_4: '0000' })
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
        const stripeAccount = await TestHelper.createStripeAccount(user, { type: 'company', country: 'US' })
        await TestHelper.createStripeRegistration(user, { business_tax_id: 1, business_name: user.profile.firstName + '\'s company', country: 'US', city: 'New York City', personal_city: 'New York City', postal_code: '10001', personal_id_number: '000000000', line1: 'First Street', day: '1', month: '1', year: '1950', company_city: 'New York City', company_state: 'New York', company_line1: 'First Street', company_postal_code: '10001', ssn_last_4: '0000' })
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
        const stripeAccount = await TestHelper.createStripeAccount(user, { type: 'company', country: 'US' })
        await TestHelper.createStripeRegistration(user, { business_tax_id: 1, business_name: user.profile.firstName + '\'s company', country: 'US', city: 'New York City', personal_city: 'New York City', postal_code: '10001', personal_id_number: '000000000', line1: 'First Street', day: '1', month: '1', year: '1950', company_city: 'New York City', company_state: 'New York', company_line1: 'First Street', company_postal_code: '10001', ssn_last_4: '0000' })
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
