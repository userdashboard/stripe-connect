
/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')

describe('/api/administrator/connect/account-stripe-accounts', () => {
  describe('exceptions', () => {
    describe('invalid-accountid', () => {
      it('missing querystring accountid', async () => {
        const administrator = await TestHelper.createAdministrator()
        const req = TestHelper.createRequest('/api/administrator/connect/account-stripe-accounts')
        req.account = administrator.account
        req.session = administrator.session
        let errorMessage
        try {
          errorMessage = await req.get()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-accountid')
      })

      it('invalid querystring accountid', async () => {
        const administrator = await TestHelper.createAdministrator()
        const req = TestHelper.createRequest('/api/administrator/connect/account-stripe-accounts?accountid=invalid')
        req.account = administrator.account
        req.session = administrator.session
        let errorMessage
        try {
          errorMessage = await req.get()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-accountid')
      })
    })

    describe('invalid-account', () => {
      it('missing querystring accountid', async () => {
        const administrator = await TestHelper.createAdministrator()
        const req = TestHelper.createRequest('/api/administrator/connect/account-stripe-accounts?accountid=')
        req.account = administrator.account
        req.session = administrator.session
        let errorMessage
        try {
          errorMessage = await req.get()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-accountid')
      })
    })
  })

  describe('receives', () => {
    it('optional querystring offset (integer)', async () => {
      const offset = 1
      global.delayDiskWrites = true
      const stripeAccounts = []
      const administrator = await TestHelper.createAdministrator()
      const user = await TestHelper.createUser()
      for (let i = 0, len = global.pageSize + 1; i < len; i++) {
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
          company_address_country: 'US',
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        })
        await TestHelper.createCompanyRepresentative(user, {
          relationship_representative_dob_day: '1',
          relationship_representative_dob_month: '1',
          relationship_representative_dob_year: '1950',
          relationship_representative_first_name: user.profile.firstName,
          relationship_representative_last_name: user.profile.lastName,
          relationship_representative_executive: 'true',
          relationship_representative_title: 'Owner',
          relationship_representative_email: user.profile.contactEmail,
          relationship_representative_phone: '456-789-0123',
          relationship_representative_ssn_last_4: '0000',
          relationship_representative_address_city: 'New York',
          relationship_representative_address_state: 'NY',
          relationship_representative_address_country: 'US',
          relationship_representative_address_line1: '285 Fulton St',
          relationship_representative_address_postal_code: '10007'
        })
        stripeAccounts.unshift(user.stripeAccount.id)
      }
      const req = TestHelper.createRequest(`/api/administrator/connect/account-stripe-accounts?accountid=${user.account.accountid}&offset=${offset}`)
      req.account = administrator.account
      req.session = administrator.session
      const stripeAccountsNow = await req.get()
      for (let i = 0, len = global.pageSize; i < len; i++) {
        assert.strictEqual(stripeAccountsNow[i].id, stripeAccounts[offset + i])
      }
    })

    it('optional querystring limit (integer)', async () => {
      const limit = 1
      const stripeAccounts = []
      const administrator = await TestHelper.createAdministrator()
      const user = await TestHelper.createUser()
      for (let i = 0, len = global.pageSize + 1; i < len; i++) {
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
          company_address_country: 'US',
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        })
        await TestHelper.createCompanyRepresentative(user, {
          relationship_representative_dob_day: '1',
          relationship_representative_dob_month: '1',
          relationship_representative_dob_year: '1950',
          relationship_representative_first_name: user.profile.firstName,
          relationship_representative_last_name: user.profile.lastName,
          relationship_representative_executive: 'true',
          relationship_representative_title: 'Owner',
          relationship_representative_email: user.profile.contactEmail,
          relationship_representative_phone: '456-789-0123',
          relationship_representative_ssn_last_4: '0000',
          relationship_representative_address_city: 'New York',
          relationship_representative_address_state: 'NY',
          relationship_representative_address_country: 'US',
          relationship_representative_address_line1: '285 Fulton St',
          relationship_representative_address_postal_code: '10007'
        })
        stripeAccounts.unshift(stripeAccount)
      }
      const req = TestHelper.createRequest(`/api/administrator/connect/account-stripe-accounts?accountid=${user.account.accountid}&limit=${limit}`)
      req.account = administrator.account
      req.session = administrator.session
      const stripeAccountsNow = await req.get()
      assert.strictEqual(stripeAccountsNow.length, limit)
    })

    it('optional querystring all (boolean)', async () => {
      const administrator = await TestHelper.createAdministrator()
      const stripeAccounts = []
      const user = await TestHelper.createUser()
      for (let i = 0, len = global.pageSize + 1; i < len; i++) {
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
          company_address_country: 'US',
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        })
        await TestHelper.createCompanyRepresentative(user, {
          relationship_representative_dob_day: '1',
          relationship_representative_dob_month: '1',
          relationship_representative_dob_year: '1950',
          relationship_representative_first_name: user.profile.firstName,
          relationship_representative_last_name: user.profile.lastName,
          relationship_representative_executive: 'true',
          relationship_representative_title: 'Owner',
          relationship_representative_email: user.profile.contactEmail,
          relationship_representative_phone: '456-789-0123',
          relationship_representative_ssn_last_4: '0000',
          relationship_representative_address_city: 'New York',
          relationship_representative_address_state: 'NY',
          relationship_representative_address_country: 'US',
          relationship_representative_address_line1: '285 Fulton St',
          relationship_representative_address_postal_code: '10007'
        })
        stripeAccounts.unshift(stripeAccount)
      }
      const req = TestHelper.createRequest(`/api/administrator/connect/account-stripe-accounts?accountid=${user.account.accountid}&all=true`)
      req.account = administrator.account
      req.session = administrator.session
      const stripeAccountsNow = await req.get()
      assert.strictEqual(stripeAccountsNow.length, stripeAccounts.length)
    })
  })
  describe('returns', () => {
    it('array', async () => {
      const administrator = await TestHelper.createAdministrator()
      const user = await TestHelper.createUser()
      for (let i = 0, len = global.pageSize + 1; i < len; i++) {
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
          company_address_country: 'US',
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        })
        await TestHelper.createCompanyRepresentative(user, {
          relationship_representative_dob_day: '1',
          relationship_representative_dob_month: '1',
          relationship_representative_dob_year: '1950',
          relationship_representative_first_name: user.profile.firstName,
          relationship_representative_last_name: user.profile.lastName,
          relationship_representative_executive: 'true',
          relationship_representative_title: 'Owner',
          relationship_representative_email: user.profile.contactEmail,
          relationship_representative_phone: '456-789-0123',
          relationship_representative_ssn_last_4: '0000',
          relationship_representative_address_city: 'New York',
          relationship_representative_address_state: 'NY',
          relationship_representative_address_country: 'US',
          relationship_representative_address_line1: '285 Fulton St',
          relationship_representative_address_postal_code: '10007'
        })
      }
      const req = TestHelper.createRequest(`/api/administrator/connect/account-stripe-accounts?accountid=${user.account.accountid}`)
      req.account = administrator.account
      req.session = administrator.session
      const stripeAccounts = await req.get()
      assert.strictEqual(stripeAccounts.length, global.pageSize)
    })
  })

  describe('configuration', () => {
    it('environment PAGE_SIZE', async () => {
      global.pageSize = 3
      const administrator = await TestHelper.createAdministrator()
      const user = await TestHelper.createUser()
      for (let i = 0, len = global.pageSize + 1; i < len; i++) {
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
          company_address_country: 'US',
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        })
        await TestHelper.createCompanyRepresentative(user, {
          relationship_representative_dob_day: '1',
          relationship_representative_dob_month: '1',
          relationship_representative_dob_year: '1950',
          relationship_representative_first_name: user.profile.firstName,
          relationship_representative_last_name: user.profile.lastName,
          relationship_representative_executive: 'true',
          relationship_representative_title: 'Owner',
          relationship_representative_email: user.profile.contactEmail,
          relationship_representative_phone: '456-789-0123',
          relationship_representative_address_city: 'New York',
          relationship_representative_ssn_last_4: '0000',
          relationship_representative_address_state: 'NY',
          relationship_representative_address_country: 'US',
          relationship_representative_address_line1: '285 Fulton St',
          relationship_representative_address_postal_code: '10007'
        })
      }
      const req = TestHelper.createRequest(`/api/administrator/connect/account-stripe-accounts?accountid=${user.account.accountid}`)
      req.account = administrator.account
      req.session = administrator.session
      const stripeAccounts = await req.get()
      assert.strictEqual(stripeAccounts.length, global.pageSize)
    })
  })
})
