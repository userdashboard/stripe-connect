/* eslint-env mocha */
const assert = require('assert')
const connect = require('../../../../../index.js')
const TestHelper = require('../../../../../test-helper.js')

async function testEachFieldAsNull (req) {
  let errors = 0
  for (const field in req.body) {
    const valueWas = req.body[field]
    req.body[field] = null
    try {
      await req.patch(req)
    } catch (error) {
      assert.strictEqual(error.message, `invalid-${field}`)
      errors++
    }
    req.body[field] = valueWas
  }
  assert.strictEqual(errors, Object.keys(req.body).length)
}

describe('/api/user/connect/update-company-registration', () => {
  describe('UpdateCompanyRegistration#PATCH', () => {
    it('should reject invalid stripeid', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=invalid`)
      req.account = user.account
      req.session = user.session
      req.body = {}
      let errorMessage
      try {
        await req.patch(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-stripeid')
    })

    it('should reject individual Stripe account', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'US'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        fileid: 'invalid'
      }
      req.body = {}
      let errorMessage
      try {
        await req.patch(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-stripe-account')
    })

    it('should reject other account\'s Stripe account', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'US'
      })
      const user2 = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user2.account
      req.session = user2.session
      req.body = {}
      let errorMessage
      try {
        await req.patch(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-account')
    })

    it('should reject submitted Stripe account', async () => {
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
        company_address_postal_'secret-code': '10001',
        company_address_state: 'NY',
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123',
        relationship_account_opener_ssn_last_4: '0000',
        relationship_account_opener_address_city: 'New York',
        relationship_account_opener_address_state: 'NY',
        relationship_account_opener_address_line1: '285 Fulton St',
        relationship_account_opener_address_postal_'secret-code': '10007'
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'usd',
        country: 'US',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        account_number: '000123456789',
        routing_number: '110000000'
      })
      await TestHelper.submitStripeAccount(user)
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        fileid: 'invalid'
      }
      req.body = {}
      let errorMessage
      try {
        await req.patch(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-stripe-account')
    })

    it(`should reject AT-company invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'AT'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_line1: '123 Park Lane',
        company_address_postal_'secret-code': '1020',
        company_name: 'Company',
        company_tax_id: '8',
        company_address_city: 'Vienna',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123',
        relationship_account_opener_address_city: 'Vienna',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_'secret-code': '1020'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject AU-company invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'AU'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Brisbane',
        company_address_state: 'QLD',
        company_address_line1: '123 Park Lane',
        company_address_postal_'secret-code': '4000',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123',
        relationship_account_opener_address_city: 'Brisbane',
        relationship_account_opener_address_line1: '845 Oxford St',
        relationship_account_opener_address_postal_'secret-code': '4000'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject BE-company invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'BE'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Brussels',
        company_address_line1: '123 Park Lane',
        company_address_postal_'secret-code': '1020',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Brussels',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_'secret-code': '1020',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject CA-company invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'CA'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Vancouver',
        company_address_state: 'BC',
        company_address_line1: '123 Park Lane',
        company_address_postal_'secret-code': 'V5K 0A1',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123',
        relationship_account_opener_address_city: 'Vancouver',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_'secret-code': 'V5K 0A1'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject CH-company invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'CH'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Bern',
        company_address_line1: '123 Park Lane',
        company_address_postal_'secret-code': '1020',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Bern',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_'secret-code': '1020',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject DE-company invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'DE'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Bern',
        company_address_line1: '123 Park Lane',
        company_address_postal_'secret-code': '1020',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Bern',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_'secret-code': '1020',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject DK-company invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'DK'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Copenhagen',
        company_address_line1: '123 Park Lane',
        company_address_postal_'secret-code': '1000',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Copenhagen',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_'secret-code': '1000',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject ES-company invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'ES'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Madrid',
        company_address_line1: '123 Park Lane',
        company_address_postal_'secret-code': '03179',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Madrid',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_'secret-code': '03179',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject FI-company invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'FI'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Helsinki',
        company_address_line1: '123 Park Lane',
        company_address_postal_'secret-code': '00990',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Helsinki',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_'secret-code': '00990',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject FR-company invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'FR'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Paris',
        company_address_line1: '123 Park Lane',
        company_address_postal_'secret-code': '75001',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Paris',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_'secret-code': '75001',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject GB-company invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'GB'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'London',
        company_address_line1: '123 Park Lane',
        company_address_postal_'secret-code': 'EC1A 1AA',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'London',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_'secret-code': 'EC1A 1AA',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject HK-company invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'HK'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Hong Kong',
        company_address_line1: '123 Park Lane',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123',
        relationship_account_opener_address_city: 'Hong Kong',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_'secret-code': '999077'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject IE-company invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'IE'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Dublin',
        company_address_state: 'Dublin',
        company_address_line1: '123 Park Lane',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Dublin',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123',
        relationship_account_opener_address_postal_'secret-code': 'Dublin 1'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject IT-company invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'IT'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Rome',
        company_address_line1: '123 Park Lane',
        company_address_postal_'secret-code': '00010',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Rome',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_'secret-code': '00010',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject JP-company invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'JP'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_tax_id: '8',
        company_name: 'Company',
        company_phone: '011-271-6677',
        company_business_name_kana: 'ﾄｳｷﾖｳﾄ',
        company_business_name_kanji: '東京都',
        company_address_kana_postal_'secret-code': '1500001',
        company_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        company_address_kana_city: 'ｼﾌﾞﾔ',
        company_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        company_address_kana_line1: '27-15',
        company_address_kanji_postal_'secret-code': '1500001',
        company_address_kanji_state: '東京都',
        company_address_kanji_city: '渋谷区',
        company_address_kanji_town: '神宮前　３丁目',
        company_address_kanji_line1: '２７－１５',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123',
        relationship_account_opener_gender: 'female',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name_kana: 'ﾄｳｷﾖｳﾄ',
        relationship_account_opener_last_name_kana: 'ﾄｳｷﾖｳﾄ',
        relationship_account_opener_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        relationship_account_opener_address_kana_city: 'ｼﾌﾞﾔ',
        relationship_account_opener_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        relationship_account_opener_address_kana_line1: '27-15',
        relationship_account_opener_address_kana_postal_'secret-code': '1500001',
        relationship_account_opener_first_name_kanji: '東京都',
        relationship_account_opener_last_name_kanji: '東京都',
        relationship_account_opener_address_kanji_postal_'secret-code': '1500001',
        relationship_account_opener_address_kanji_state: '東京都',
        relationship_account_opener_address_kanji_city: '渋谷区',
        relationship_account_opener_address_kanji_town: '神宮前　３丁目',
        relationship_account_opener_address_kanji_line1: '２７－１５'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject LU-company invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'LU'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Luxemburg',
        company_address_line1: '123 Park Lane',
        company_address_postal_'secret-code': '1623',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Luxemburg',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_'secret-code': '1623',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject NL-company invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'NL'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Amsterdam',
        company_address_line1: '123 Park Lane',
        company_address_postal_'secret-code': '1071 JA',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Amsterdam',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_'secret-code': '1071 JA',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject NO-company invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'NO'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Oslo',
        company_address_line1: '123 Park Lane',
        company_address_postal_'secret-code': '0001',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Oslo',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_'secret-code': '0001',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject NZ-company invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'NZ'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Auckland',
        company_address_line1: '123 Park Lane',
        company_address_postal_'secret-code': '6011',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123',
        relationship_account_opener_address_city: 'Auckland',
        relationship_account_opener_address_postal_'secret-code': '6011',
        relationship_account_opener_address_line1: '844 Fleet Street'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject PT-company invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'PT'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Lisbon',
        company_address_line1: '123 Park Lane',
        company_address_postal_'secret-code': '4520',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Lisbon',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_'secret-code': '4520',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject SE-company invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'SE'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Stockholm',
        company_address_line1: '123 Park Lane',
        company_address_postal_'secret-code': '00150',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Stockholm',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_'secret-code': '00150',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject SG-company invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'SG'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_line1: '123 Park Lane',
        company_address_postal_'secret-code': '339696',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_'secret-code': '339696',
        relationship_account_opener_address_city: 'Singapore'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject US-company invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'US'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_name: 'Company',
        company_tax_id: '8',
        company_phone: '456-123-7890',
        company_address_city: 'New York',
        company_address_line1: '285 Fulton St',
        company_address_postal_'secret-code': '10007',
        company_address_state: 'NY',
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123',
        relationship_account_opener_ssn_last_4: '0000',
        relationship_account_opener_address_city: 'New York',
        relationship_account_opener_address_line1: '285 Fulton St',
        relationship_account_opener_address_postal_'secret-code': '10007'
      }
      await testEachFieldAsNull(req)
    })

    it(`should update AT-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'AT'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_line1: '123 Park Lane',
        company_address_postal_'secret-code': '1020',
        company_name: 'Company',
        company_tax_id: '8',
        company_address_city: 'Vienna',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123',
        relationship_account_opener_address_city: 'Vienna',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_'secret-code': '1020'
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration + (accountNow.metadata.registration2 || ''))
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })

    it(`should update AU-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'AU'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Brisbane',
        company_address_state: 'QLD',
        company_address_line1: '123 Park Lane',
        company_address_postal_'secret-code': '4000',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123',
        relationship_account_opener_address_city: 'Brisbane',
        relationship_account_opener_address_line1: '845 Oxford St',
        relationship_account_opener_address_postal_'secret-code': '4000'
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration + (accountNow.metadata.registration2 || ''))
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })

    it(`should update BE-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'BE'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Brussels',
        company_address_line1: '123 Park Lane',
        company_address_postal_'secret-code': '1020',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Brussels',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_'secret-code': '1020',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration + (accountNow.metadata.registration2 || ''))
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })

    it(`should update CA-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'CA'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Vancouver',
        company_address_state: 'BC',
        company_address_line1: '123 Park Lane',
        company_address_postal_'secret-code': 'V5K 0A1',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123',
        relationship_account_opener_address_city: 'Vancouver',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_'secret-code': 'V5K 0A1'
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration + (accountNow.metadata.registration2 || ''))
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })

    it(`should update CH-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'CH'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Bern',
        company_address_line1: '123 Park Lane',
        company_address_postal_'secret-code': '1020',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Bern',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_'secret-code': '1020',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration + (accountNow.metadata.registration2 || ''))
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })

    it(`should update DE-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'DE'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Berlin',
        company_address_line1: '123 Park Lane',
        company_address_postal_'secret-code': '01067',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Berlin',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_'secret-code': '01067',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration + (accountNow.metadata.registration2 || ''))
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })

    it(`should update DK-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'DK'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Copenhagen',
        company_address_line1: '123 Park Lane',
        company_address_postal_'secret-code': '1000',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Copenhagen',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_'secret-code': '1000',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration + (accountNow.metadata.registration2 || ''))
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })

    it(`should update ES-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'ES'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Madrid',
        company_address_line1: '123 Park Lane',
        company_address_postal_'secret-code': '03179',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Madrid',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_'secret-code': '03179',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration + (accountNow.metadata.registration2 || ''))
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })

    it(`should update FI-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'FI'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Helsinki',
        company_address_line1: '123 Park Lane',
        company_address_postal_'secret-code': '00990',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Helsinki',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_'secret-code': '00990',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration + (accountNow.metadata.registration2 || ''))
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })
    it(`should update FR-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'FR'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Paris',
        company_address_line1: '123 Park Lane',
        company_address_postal_'secret-code': '75001',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Paris',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_'secret-code': '75001',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration + (accountNow.metadata.registration2 || ''))
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })

    it(`should update GB-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'GB'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'London',
        company_address_line1: '123 Park Lane',
        company_address_postal_'secret-code': 'EC1A 1AA',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'London',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_'secret-code': 'EC1A 1AA',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration + (accountNow.metadata.registration2 || ''))
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })

    it(`should update HK-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'HK'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Hong Kong',
        company_address_line1: '123 Park Lane',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_address_city: 'Hong Kong',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_'secret-code': '999077',
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration + (accountNow.metadata.registration2 || ''))
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })

    it(`should update IE-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'IE'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Dublin',
        company_address_state: 'Dublin',
        company_address_line1: '123 Park Lane',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Dublin',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123',
        relationship_account_opener_address_postal_'secret-code': 'Dublin 1'
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration + (accountNow.metadata.registration2 || ''))
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })

    it(`should update IT-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'IT'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Rome',
        company_address_line1: '123 Park Lane',
        company_address_postal_'secret-code': '00010',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Rome',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_'secret-code': '00010',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration + (accountNow.metadata.registration2 || ''))
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })

    it(`should update JP-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'JP'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_tax_id: '8',
        company_name: 'Company',
        company_phone: '011-271-6677',
        company_business_name_kana: 'ﾄｳｷﾖｳﾄ',
        company_business_name_kanji: '東京都',
        company_address_kana_postal_'secret-code': '1500001',
        company_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        company_address_kana_city: 'ｼﾌﾞﾔ',
        company_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        company_address_kana_line1: '27-15',
        company_address_kanji_postal_'secret-code': '1500001',
        company_address_kanji_state: '東京都',
        company_address_kanji_city: '渋谷区',
        company_address_kanji_town: '神宮前　３丁目',
        company_address_kanji_line1: '２７－１５',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123',
        relationship_account_opener_gender: 'female',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name_kana: 'ﾄｳｷﾖｳﾄ',
        relationship_account_opener_last_name_kana: 'ﾄｳｷﾖｳﾄ',
        relationship_account_opener_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        relationship_account_opener_address_kana_city: 'ｼﾌﾞﾔ',
        relationship_account_opener_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        relationship_account_opener_address_kana_line1: '27-15',
        relationship_account_opener_address_kana_postal_'secret-code': '1500001',
        relationship_account_opener_first_name_kanji: '東京都',
        relationship_account_opener_last_name_kanji: '東京都',
        relationship_account_opener_address_kanji_postal_'secret-code': '1500001',
        relationship_account_opener_address_kanji_state: '東京都',
        relationship_account_opener_address_kanji_city: '渋谷区',
        relationship_account_opener_address_kanji_town: '神宮前　３丁目',
        relationship_account_opener_address_kanji_line1: '２７－１５'
      }
      const stripeAccountNow = await req.patch()
      const registration = connect.MetaData.parse(stripeAccountNow.metadata, 'registration')
      for (const field in req.body) {
        assert.strictEqual(registration[field], req.body[field])
      }
    })

    it(`should update LU-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'LU'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Luxemburg',
        company_address_line1: '123 Park Lane',
        company_address_postal_'secret-code': '1623',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Luxemburg',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_'secret-code': '1623',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration + (accountNow.metadata.registration2 || ''))
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })

    it(`should update NL-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'NL'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Amsterdam',
        company_address_line1: '123 Park Lane',
        company_address_postal_'secret-code': '1071 JA',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Amsterdam',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_'secret-code': '1071 JA',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration + (accountNow.metadata.registration2 || ''))
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })
    it(`should update NO-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'NO'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Oslo',
        company_address_line1: '123 Park Lane',
        company_address_postal_'secret-code': '0001',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Oslo',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_'secret-code': '0001',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration + (accountNow.metadata.registration2 || ''))
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })

    it(`should update NZ-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'NZ'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Auckland',
        company_address_line1: '123 Park Lane',
        company_address_postal_'secret-code': '6011',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123',
        relationship_account_opener_address_city: 'Auckland',
        relationship_account_opener_address_postal_'secret-code': '6011',
        relationship_account_opener_address_line1: '844 Fleet Street'
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration + (accountNow.metadata.registration2 || ''))
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })

    it(`should update PT-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'PT'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Lisbon',
        company_address_line1: '123 Park Lane',
        company_address_postal_'secret-code': '4520',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Lisbon',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_'secret-code': '4520',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration + (accountNow.metadata.registration2 || ''))
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })

    it(`should update SE-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'SE'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Stockholm',
        company_address_line1: '123 Park Lane',
        company_address_postal_'secret-code': '00150',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Stockholm',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_'secret-code': '00150',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration + (accountNow.metadata.registration2 || ''))
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })

    it(`should update SG-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'SG'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_line1: '123 Park Lane',
        company_address_postal_'secret-code': '339696',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_'secret-code': '339696',
        relationship_account_opener_address_city: 'Singapore',
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration + (accountNow.metadata.registration2 || ''))
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })

    it(`should update US-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'US'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_name: 'Company',
        company_tax_id: '8',
        company_phone: '456-123-7890',
        company_address_city: 'New York',
        company_address_line1: '285 Fulton St',
        company_address_postal_'secret-code': '10007',
        company_address_state: 'NY',
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123',
        relationship_account_opener_ssn_last_4: '0000',
        relationship_account_opener_address_city: 'New York',
        relationship_account_opener_address_state: 'NY',
        relationship_account_opener_address_line1: '285 Fulton St',
        relationship_account_opener_address_postal_'secret-code': '10007'
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration + (accountNow.metadata.registration2 || ''))
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })
  })
})
