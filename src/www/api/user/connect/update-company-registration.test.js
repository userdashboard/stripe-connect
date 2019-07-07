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
      await req.route.api.patch(req)
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
        await req.route.api.patch(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-stripeid')
    })

    it('should reject individual Stripe account', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'US' })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        fileid: 'invalid'
      }
      req.body = {}
      let errorMessage
      try {
        await req.route.api.patch(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-stripe-account')
    })

    it('should reject other account\'s Stripe account', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'US' })
      const user2 = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user2.account
      req.session = user2.session
      req.body = {}
      let errorMessage
      try {
        await req.route.api.patch(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-account')
    })

    it('should reject submitted Stripe account', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'US' })
      await TestHelper.createStripeRegistration(user, { country: 'US', business_name: 'Company name', business_tax_id: '1', city: 'New York City', personal_city: 'New York City', postal_code: '10001', personal_id_number: '000000000', line1: 'First Street', day: '1', month: '1', year: '1950', company_city: 'New York City', company_state: 'New York', company_line1: 'First Street', company_postal_code: '10001', ssn_last_4: '0000' })
      await TestHelper.createExternalAccount(user, { currency: 'usd', country: 'US', account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`, account_type: 'individual', account_number: '000123456789', routing_number: '110000000' })
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
        await req.route.api.patch(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-stripe-account')
    })

    it(`should reject AT-company invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'AT' })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        personal_city: 'Vienna',
        personal_line1: 'Address First Line',
        personal_postal_code: '1020',
        company_city: 'Vienna',
        company_line1: 'Address First Line',
        company_postal_code: '1020',
        business_name: 'Company',
        business_tax_id: '8',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject AU-company invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'AU' })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_city: 'Brisbane',
        company_state: 'QLD',
        company_line1: 'Address First Line',
        company_postal_code: '4000',
        business_name: 'Company',
        business_tax_id: '8',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Australian',
        last_name: 'Person'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject BE-company invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'BE' })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        personal_city: 'Brussels',
        personal_line1: 'Address First Line',
        personal_postal_code: '1020',
        company_city: 'Brussels',
        company_line1: 'Address First Line',
        company_postal_code: '1020',
        business_name: 'Company',
        business_tax_id: '8',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject CA-company invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'CA' })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_city: 'Vancouver',
        company_state: 'BC',
        company_line1: 'Address First Line',
        company_postal_code: 'V5K 0A1',
        business_name: 'Company',
        business_tax_id: '8',
        personal_id_number: '7',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Canadian',
        last_name: 'Person'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject DE-company invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'DE' })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        personal_city: 'Berlin',
        personal_line1: 'Address First Line',
        personal_postal_code: '01067',
        company_city: 'Berlin',
        company_line1: 'Address First Line',
        company_postal_code: '01067',
        business_name: 'Company',
        business_tax_id: '8',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject DK-company invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'DK' })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        personal_city: 'Copenhagen',
        personal_line1: 'Address First Line',
        personal_postal_code: '1000',
        company_city: 'Copenhagen',
        company_line1: 'Address First Line',
        company_postal_code: '1000',
        business_name: 'Company',
        business_tax_id: '8',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject ES-company invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'ES' })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        personal_city: 'Madrid',
        personal_line1: 'Address First Line',
        personal_postal_code: '03179',
        company_city: 'Madrid',
        company_line1: 'Address First Line',
        company_postal_code: '03179',
        business_name: 'Company',
        business_tax_id: '8',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject FI-company invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'FI' })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        personal_city: 'Helsinki',
        personal_line1: 'Address First Line',
        personal_postal_code: '00990',
        company_city: 'Helsinki',
        company_line1: 'Address First Line',
        company_postal_code: '00990',
        business_name: 'Company',
        business_tax_id: '8',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject CH-company invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'CH' })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        personal_city: 'Bern',
        personal_line1: 'Address First Line',
        personal_postal_code: '1020',
        company_city: 'Bern',
        company_line1: 'Address First Line',
        company_postal_code: '1020',
        business_name: 'Company',
        business_tax_id: '8',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject FR-company invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'FR' })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        personal_city: 'Paris',
        personal_line1: 'Address First Line',
        personal_postal_code: '75001',
        company_city: 'Paris',
        company_line1: 'Address First Line',
        company_postal_code: '75001',
        business_name: 'Company',
        business_tax_id: '8',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject GB-company invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'GB' })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        personal_city: 'London',
        personal_line1: 'Address First Line',
        personal_postal_code: 'EC1A 1AA',
        company_city: 'London',
        company_line1: 'Address First Line',
        company_postal_code: 'EC1A 1AA',
        business_name: 'Company',
        business_tax_id: '8',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject HK-company invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'HK' })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        personal_city: 'Hong Kong',
        personal_line1: 'Address First Line',
        company_city: 'Hong Kong',
        company_line1: 'Address First Line',
        business_name: 'Company',
        business_tax_id: '8',
        personal_id_number: '7',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Hongkonger',
        last_name: 'Person'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject IE-company invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'IE' })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        personal_city: 'Dublin',
        personal_line1: 'Address First Line',
        personal_state: 'Dublin',
        company_city: 'Dublin',
        company_state: 'Dublin',
        company_line1: 'Address First Line',
        business_name: 'Company',
        business_tax_id: '8',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject IT-company invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'IT' })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        personal_city: 'Rome',
        personal_line1: 'Address First Line',
        personal_postal_code: '00010',
        company_city: 'Rome',
        company_line1: 'Address First Line',
        company_postal_code: '00010',
        business_name: 'Company',
        business_tax_id: '8',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject JP-company invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'JP' })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        day: '1',
        month: '1',
        year: '1950',
        gender: 'female',
        first_name_kana: 'ﾄｳｷﾖｳﾄ',
        last_name_kana: 'ﾄｳｷﾖｳﾄ',
        first_name_kanji: '東京都',
        last_name_kanji: '東京都',
        phone_number: '0859-076500',
        business_name: 'Company',
        business_name_kana: 'ﾄｳｷﾖｳﾄ',
        business_name_kanji: '東京都',
        business_tax_id: '8',
        company_postal_code_kana: '1500001',
        company_state_kana: 'ﾄｳｷﾖｳﾄ',
        company_city_kana: 'ｼﾌﾞﾔ',
        company_town_kana: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        company_line1_kana: '27-15',
        company_postal_code_kanji: '１５００００１',
        company_state_kanji: '東京都',
        company_city_kanji: '渋谷区',
        company_town_kanji: '神宮前　３丁目',
        company_line1_kanji: '２７－１５',
        personal_state_kana: 'ﾄｳｷﾖｳﾄ',
        personal_city_kana: 'ｼﾌﾞﾔ',
        personal_town_kana: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        personal_line1_kana: '27-15',
        personal_postal_code_kana: '1500001',
        personal_postal_code_kanji: '１５００００１',
        personal_state_kanji: '東京都',
        personal_city_kanji: '渋谷区',
        personal_town_kanji: '神宮前　３丁目',
        personal_line1_kanji: '２７－１５'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject LU-company invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'LU' })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        personal_city: 'Luxemburg',
        personal_line1: 'Address First Line',
        personal_postal_code: '1623',
        company_city: 'Luxemburg',
        company_line1: 'Address First Line',
        company_postal_code: '1623',
        business_name: 'Company',
        business_tax_id: '8',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject NL-company invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'NL' })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        personal_city: 'Amsterdam',
        personal_line1: 'Address First Line',
        personal_postal_code: '1071 JA',
        company_city: 'Amsterdam',
        company_line1: 'Address First Line',
        company_postal_code: '1071 JA',
        business_name: 'Company',
        business_tax_id: '8',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject NO-company invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'NO' })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        personal_city: 'Oslo',
        personal_line1: 'Address First Line',
        personal_postal_code: '0001',
        company_city: 'Oslo',
        company_line1: 'Address First Line',
        company_postal_code: '0001',
        business_name: 'Company',
        business_tax_id: '8',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject NZ-company invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'NZ' })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_city: 'Auckland',
        company_line1: 'Address First Line',
        company_postal_code: '123601145',
        business_name: 'Company',
        business_tax_id: '8',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject PT-company invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'PT' })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        personal_city: 'Lisbon',
        personal_line1: 'Address First Line',
        personal_postal_code: '4520',
        company_city: 'Lisbon',
        company_line1: 'Address First Line',
        company_postal_code: '4520',
        business_name: 'Company',
        business_tax_id: '8',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject SE-company invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'SE' })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        personal_city: 'Stockholm',
        personal_line1: 'Address First Line',
        personal_postal_code: '00150',
        company_city: 'Stockholm',
        company_line1: 'Address First Line',
        company_postal_code: '00150',
        business_name: 'Company',
        business_tax_id: '8',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      await testEachFieldAsNull(req)
    })

    // these tests only work if your Stripe account is SG
    // it(`should reject SG-company invalid fields`, async () => {
    //   const user = await TestHelper.createUser()
    //   await TestHelper.createStripeAccount(user, { type: 'company', country: 'SG' })
    //   const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
    //   req.account = user.account
    //   req.session = user.session
    //   req.body = {
    //     personal_line1: 'Address First Line',
    //     personal_postal_code: '339696',
    //     company_line1: 'Address First Line',
    //     company_postal_code: '339696',
    //     business_name: 'Company',
    //     business_tax_id: '8',
    //     personal_id_number: '7',
    //     day: '1',
    //     month: '1',
    //     year: '1950',
    //     first_name: 'Singaporean',
    //     last_name: 'Person'
    //   }
    //   await testEachFieldAsNull(req)
    // })    

    it(`should reject US-company invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'US' })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        business_name: 'Company',
        business_tax_id: '8',
        company_city: 'New York City',
        company_line1: 'Address First Line',
        company_postal_code: '10001',
        company_state: 'NY',
        ssn_last_4: '1234',
        personal_id_number: '10001',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'American',
        last_name: 'Person'
      }
      await testEachFieldAsNull(req)
    })

    it(`should update AT-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'AT' })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        personal_city: 'Vienna',
        personal_line1: 'Address First Line',
        personal_postal_code: '1020',
        company_city: 'Vienna',
        company_line1: 'Address First Line',
        company_postal_code: '1020',
        business_name: 'Company',
        business_tax_id: '8',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration)
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })

    it(`should update AU-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'AU' })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_city: 'Brisbane',
        company_state: 'QLD',
        company_line1: 'Address First Line',
        company_postal_code: '4000',
        business_name: 'Company',
        business_tax_id: '8',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Australian',
        last_name: 'Person'
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration)
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })

    it(`should update BE-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'BE' })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        personal_city: 'Brussels',
        personal_line1: 'Address First Line',
        personal_postal_code: '1020',
        company_city: 'Brussels',
        company_line1: 'Address First Line',
        company_postal_code: '1020',
        business_name: 'Company',
        business_tax_id: '8',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration)
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })

    it(`should update CA-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'CA' })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_city: 'Vancouver',
        company_state: 'BC',
        company_line1: 'Address First Line',
        company_postal_code: 'V5K 0A1',
        business_name: 'Company',
        business_tax_id: '8',
        personal_id_number: '7',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Canadian',
        last_name: 'Person'
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration)
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })

    it(`should update CH-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'CH' })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        personal_city: 'Bern',
        personal_line1: 'Address First Line',
        personal_postal_code: '1020',
        company_city: 'Bern',
        company_line1: 'Address First Line',
        company_postal_code: '1020',
        business_name: 'Company',
        business_tax_id: '8',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration)
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })

    it(`should update DE-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'DE' })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        personal_city: 'Berlin',
        personal_line1: 'Address First Line',
        personal_postal_code: '01067',
        company_city: 'Berlin',
        company_line1: 'Address First Line',
        company_postal_code: '01067',
        business_name: 'Company',
        business_tax_id: '8',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration)
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })

    it(`should update DK-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'DK' })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        personal_city: 'Copenhagen',
        personal_line1: 'Address First Line',
        personal_postal_code: '1000',
        company_city: 'Copenhagen',
        company_line1: 'Address First Line',
        company_postal_code: '1000',
        business_name: 'Company',
        business_tax_id: '8',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration)
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })

    it(`should update ES-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'ES' })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        personal_city: 'Madrid',
        personal_line1: 'Address First Line',
        personal_postal_code: '03179',
        company_city: 'Madrid',
        company_line1: 'Address First Line',
        company_postal_code: '03179',
        business_name: 'Company',
        business_tax_id: '8',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration)
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })

    it(`should update FI-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'FI' })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        personal_city: 'Helsinki',
        personal_line1: 'Address First Line',
        personal_postal_code: '00990',
        company_city: 'Helsinki',
        company_line1: 'Address First Line',
        company_postal_code: '00990',
        business_name: 'Company',
        business_tax_id: '8',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration)
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })
    it(`should update FR-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'FR' })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        personal_city: 'Paris',
        personal_line1: 'Address First Line',
        personal_postal_code: '75001',
        company_city: 'Paris',
        company_line1: 'Address First Line',
        company_postal_code: '75001',
        business_name: 'Company',
        business_tax_id: '8',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration)
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })

    it(`should update GB-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'GB' })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        personal_city: 'London',
        personal_line1: 'Address First Line',
        personal_postal_code: 'EC1A 1AA',
        company_city: 'London',
        company_line1: 'Address First Line',
        company_postal_code: 'EC1A 1AA',
        business_name: 'Company',
        business_tax_id: '8',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration)
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })


    it(`should update HK-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'HK' })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        personal_city: 'Hong Kong',
        personal_line1: 'Address First Line',
        company_city: 'Hong Kong',
        company_line1: 'Address First Line',
        business_name: 'Company',
        business_tax_id: '8',
        personal_id_number: '7',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Hongkonger',
        last_name: 'Person'
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration)
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })


    it(`should update IE-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'IE' })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        personal_city: 'Dublin',
        personal_line1: 'Address First Line',
        personal_state: 'Dublin',
        company_city: 'Dublin',
        company_state: 'Dublin',
        company_line1: 'Address First Line',
        business_name: 'Company',
        business_tax_id: '8',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration)
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })


    it(`should update IT-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'IT' })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        personal_city: 'Rome',
        personal_line1: 'Address First Line',
        personal_postal_code: '00010',
        company_city: 'Rome',
        company_line1: 'Address First Line',
        company_postal_code: '00010',
        business_name: 'Company',
        business_tax_id: '8',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration)
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })



    it(`should update JP-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'JP' })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        day: '1',
        month: '1',
        year: '1950',
        gender: 'female',
        first_name_kana: 'ﾄｳｷﾖｳﾄ',
        last_name_kana: 'ﾄｳｷﾖｳﾄ',
        first_name_kanji: '東京都',
        last_name_kanji: '東京都',
        phone_number: '0859-076500',
        business_name: 'Company',
        business_name_kana: 'ﾄｳｷﾖｳﾄ',
        business_name_kanji: '東京都',
        business_tax_id: '8',
        company_postal_code_kana: '1500001',
        company_state_kana: 'ﾄｳｷﾖｳﾄ',
        company_city_kana: 'ｼﾌﾞﾔ',
        company_town_kana: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        company_line1_kana: '27-15',
        company_postal_code_kanji: '１５００００１',
        company_state_kanji: '東京都',
        company_city_kanji: '渋谷区',
        company_town_kanji: '神宮前　３丁目',
        company_line1_kanji: '２７－１５',
        personal_state_kana: 'ﾄｳｷﾖｳﾄ',
        personal_city_kana: 'ｼﾌﾞﾔ',
        personal_town_kana: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        personal_line1_kana: '27-15',
        personal_postal_code_kana: '1500001',
        personal_postal_code_kanji: '１５００００１',
        personal_state_kanji: '東京都',
        personal_city_kanji: '渋谷区',
        personal_town_kanji: '神宮前　３丁目',
        personal_line1_kanji: '２７－１５'
      }
      const stripeAccountNow = await req.patch()
      const registration = connect.MetaData.parse(stripeAccountNow.metadata, 'registration')
      for (const field in req.body) {
        assert.strictEqual(registration[field], req.body[field])
      }
    })

    it(`should update LU-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'LU' })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        personal_city: 'Luxemburg',
        personal_line1: 'Address First Line',
        personal_postal_code: '1623',
        company_city: 'Luxemburg',
        company_line1: 'Address First Line',
        company_postal_code: '1623',
        business_name: 'Company',
        business_tax_id: '8',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration)
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })

    it(`should update NL-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'NL' })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        personal_city: 'Amsterdam',
        personal_line1: 'Address First Line',
        personal_postal_code: '1071 JA',
        company_city: 'Amsterdam',
        company_line1: 'Address First Line',
        company_postal_code: '1071 JA',
        business_name: 'Company',
        business_tax_id: '8',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration)
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })
    it(`should update NO-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'NO' })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        personal_city: 'Oslo',
        personal_line1: 'Address First Line',
        personal_postal_code: '0001',
        company_city: 'Oslo',
        company_line1: 'Address First Line',
        company_postal_code: '0001',
        business_name: 'Company',
        business_tax_id: '8',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration)
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })

    it(`should update NZ-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'NZ' })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_city: 'Auckland',
        company_line1: 'Address First Line',
        company_postal_code: '6011',
        business_name: 'Company',
        business_tax_id: '8',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration)
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })

    it(`should update PT-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'PT' })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        personal_city: 'Lisbon',
        personal_line1: 'Address First Line',
        personal_postal_code: '4520',
        company_city: 'Lisbon',
        company_line1: 'Address First Line',
        company_postal_code: '4520',
        business_name: 'Company',
        business_tax_id: '8',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration)
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })

    it(`should update SE-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'SE' })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        personal_city: 'Stockholm',
        personal_line1: 'Address First Line',
        personal_postal_code: '00150',
        company_city: 'Stockholm',
        company_line1: 'Address First Line',
        company_postal_code: '00150',
        business_name: 'Company',
        business_tax_id: '8',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration)
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })

    // these tests only work if your Stripe account is SG
    // it(`should update SG-company registration`, async () => {
    //   const user = await TestHelper.createUser()
    //   await TestHelper.createStripeAccount(user, { type: 'company', country: 'SG' })
    //   const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
    //   req.account = user.account
    //   req.session = user.session
    //   req.body = {
    //     personal_line1: 'Address First Line',
    //     personal_postal_code: '339696',
    //     company_line1: 'Address First Line',
    //     company_postal_code: '339696',
    //     business_name: 'Company',
    //     business_tax_id: '8',
    //     personal_id_number: '7',
    //     day: '1',
    //     month: '1',
    //     year: '1950',
    //     first_name: 'Singaporean',
    //     last_name: 'Person'
    //   }
    //   const accountNow = await req.patch()
    //   const registrationNow = JSON.parse(accountNow.metadata.registration)
    //   for (const field in req.body) {
    //     assert.strictEqual(registrationNow[field], req.body[field])
    //   }
    // })

    it(`should update US-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'US' })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        business_name: 'Company',
        business_tax_id: '8',
        company_city: 'New York City',
        company_line1: 'Address First Line',
        company_postal_code: '10001',
        company_state: 'NY',
        ssn_last_4: '1234',
        personal_id_number: '10001',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'American',
        last_name: 'Person'
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration)
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })
  })
})
