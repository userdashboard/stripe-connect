/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')

async function testEachFieldAsNull (req) {
  let errors = 0
  for (const field in req.body) {
    const valueWas = req.body[field]
    req.body[field] = null
    try {
      await req.route.api.before(req)
    } catch (error) {
      assert.strictEqual(error.message, `invalid-${field}`)
      errors++
    }
    req.body[field] = valueWas
  }
  assert.strictEqual(errors, Object.keys(req.body).length)
}

describe('/api/user/connect/update-individual-registration', () => {
  describe('UpdateIndividualRegistration#BEFORE', () => {
    it('should reject invalid stripeid', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=invalid`)
      req.account = user.account
      req.session = user.session
      req.body = {}
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-stripeid')
    })

    it('should reject company Stripe account', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'US' })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        fileid: 'invalid'
      }
      req.body = {}
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-stripe-account')
    })

    it('should reject other account\'s Stripe account', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'US' })
      const user2 = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user2.account
      req.session = user2.session
      req.body = {}
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-account')
    })

    it('should reject submitted Stripe account', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'US' })
      await TestHelper.createStripeRegistration(user, { city: 'New York City', postal_code: '10001', personal_id_number: '000000000', line1: 'First Street', day: '1', month: '1', year: '1950', state: 'New York', ssn_last_4: '0000' })
      await TestHelper.createExternalAccount(user, { currency: 'usd', country: 'US', account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`, account_type: 'individual', account_number: '000123456789', routing_number: '110000000' })
      await TestHelper.submitStripeAccount(user)
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        fileid: 'invalid'
      }
      req.body = {}
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-stripe-account')
    })

    it(`should reject AT-individual invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'AT' })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject AU-individual invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'AU' })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        city: 'Brisbane',
        line1: 'Address First Line',
        postal_code: '4000',
        state: 'QLD',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Australian',
        last_name: 'Person'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject BE-individual invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'BE' })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject CA-individual invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'CA' })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        city: 'Vancouver',
        line1: 'Address First Line',
        postal_code: 'V5K 0A1',
        state: 'BC',
        personal_id_number: '7',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Canadian',
        last_name: 'Person'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject CH-individual invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'CH' })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      await testEachFieldAsNull(req)
    })
    
    it(`should reject DE-individual invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'DE' })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject DK-individual invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'DK' })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject ES-individual invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'ES' })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      await testEachFieldAsNull(req)
    })
    
    it(`should reject FI-individual invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'FI' })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject FR-individual invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'FR' })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject GB-individual invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'GB' })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject HK-individual invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'HK' })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        city: 'Hong Kong',
        line1: 'Address First Line',
        personal_id_number: '7',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Hongkonger',
        last_name: 'Person'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject IE-individual invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'IE' })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject IT-individual invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'IT' })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject JP-individual invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'JP' })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
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
        postal_code_kana: '1500001',
        state_kana: 'ﾄｳｷﾖｳﾄ',
        city_kana: 'ｼﾌﾞﾔ',
        town_kana: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        line1_kana: '27-15',
        postal_code_kanji: '１５００００１',
        state_kanji: '東京都',
        city_kanji: '渋谷区',
        town_kanji: '神宮前　３丁目',
        line1_kanji: '２７－１５'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject LU-individual invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'LU' })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject NL-individual invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'NL' })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      await testEachFieldAsNull(req)
    })
    
    it(`should reject NO-individual invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'NO' })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject NZ-individual invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'NZ' })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        city: 'Auckland',
        line1: 'Address First Line',
        postal_code: '6011',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject PT-individual invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'PT' })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject SE-individual invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'SE' })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      await testEachFieldAsNull(req)
    })

    // these tests only work if your Stripe account is SG
    // it(`should reject SG-individual invalid fields`, async () => {
    //   const user = await TestHelper.createUser()
    //   await TestHelper.createStripeAccount(user, { type: 'individual', country: 'SG' })
    //   const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
    //   req.account = user.account
    //   req.session = user.session
    //   req.body = {
    //     line1: 'Address First Line',
    //     postal_code: '339696',
    //     personal_id_number: '7',
    //     day: '1',
    //     month: '1',
    //     year: '1950',
    //     first_name: 'Singaporean',
    //     last_name: 'Person'
    //   }
    //   await testEachFieldAsNull(req)
    // })

    it(`should reject US-individual invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'US' })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        city: 'New York City',
        line1: 'Address First Line',
        postal_code: '10001',
        state: 'NY',
        ssn_last_4: '1234',
        personal_id_number: '000000000',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'American',
        last_name: 'Person'
      }
      await testEachFieldAsNull(req)
    })
  })

  describe('UpdateIndividualRegistration#PATCH', () => {

    it(`should update AT-individual registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'AT' })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
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

    it(`should update AU-individual registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'AU' })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        city: 'Brisbane',
        state: 'QLD',
        line1: 'Address First Line',
        postal_code: '4000',
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

    it(`should update BE-individual registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'BE' })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
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

    it(`should update CA-individual registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'CA' })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        city: 'Vancouver',
        line1: 'Address First Line',
        postal_code: 'V5K 0A1',
        state: 'BC',
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

    it(`should update CH-individual registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'CH' })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
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

    it(`should update DE-individual registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'DE' })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
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

    it(`should update DK-individual registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'DK' })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
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

    it(`should update ES-individual registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'ES' })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
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

    it(`should update FI-individual registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'FI' })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
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

    it(`should update FR-individual registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'FR' })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
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

    it(`should update GB-individual registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'GB' })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
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

    it(`should update HK-individual registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'HK' })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        city: 'Hong Kong',
        line1: 'Address First Line',
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

    it(`should update IE-individual registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'IE' })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
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
    it(`should update IT-individual registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'IT' })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
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

    it(`should update JP-individual registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'JP' })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
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
        postal_code_kana: '1500001',
        state_kana: 'ﾄｳｷﾖｳﾄ',
        city_kana: 'ｼﾌﾞﾔ',
        town_kana: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        line1_kana: '27-15',
        postal_code_kanji: '１５００００１',
        state_kanji: '東京都',
        city_kanji: '渋谷区',
        town_kanji: '神宮前　３丁目',
        line1_kanji: '２７－１５'
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration)
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })

    it(`should update LU-individual registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'LU' })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
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

    it(`should update NL-individual registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'NL' })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
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

    it(`should update NO-individual registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'NO' })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
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

    it(`should update NZ-individual registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'NZ' })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        city: 'Auckland',
        line1: 'Address First Line',
        postal_code: '6011',
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

    it(`should update PT-individual registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'PT' })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
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

    it(`should update SE-individual registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'SE' })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
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
    // it(`should update SG-individual registration`, async () => {
    //   const user = await TestHelper.createUser()
    //   await TestHelper.createStripeAccount(user, { type: 'individual', country: 'SG' })
    //   const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
    //   req.account = user.account
    //   req.session = user.session
    //   req.body = {
    //     line1: 'Address First Line',
    //     postal_code: '339696',
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

    it(`should update US-individual registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'US' })
      await TestHelper.createStripeRegistration(user, { city: 'New York City', postal_code: '10001', personal_id_number: '000000000', line1: 'First Street', day: '1', month: '1', year: '1950', state: 'New York', ssn_last_4: '0000' })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        city: 'New York City',
        line1: 'Address First Line',
        postal_code: '10001',
        state: 'NY',
        ssn_last_4: '1234',
        personal_id_number: '000000000',
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
