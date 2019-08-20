/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')

describe(`/api/user/connect/set-individual-registration-submitted`, async () => {
  describe('SetIndividualRegistrationSubmitted#PATCH', () => {
    it('should reject invalid stripeid', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/api/user/connect/set-individual-registration-submitted?stripeid=invalid')
      req.account = user.account
      req.session = user.session
      let errorMessage
      try {
        await req.route.api.patch(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-stripeid')
    })

    it('should reject company account', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'US'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-individual-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      let errorMessage
      try {
        await req.route.api.patch(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-stripe-account')
    })

    it('should reject submitted registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'US'
      })
      await TestHelper.createStripeRegistration(user, {
        business_profile_mcc: '7997',
        business_profile_url: 'https://www.' + user.profile.email.split('@')[1],
        individual_address_city: 'New York',
        individual_address_line1: '285 Fulton St',
        individual_address_postal_code: '10007',
        individual_id_number: '000000000',
        individual_address_state: 'NY',
        individual_ssn_last_4: '0000',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_phone: '456-123-7890',
        individual_email: user.profile.email,
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName
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
      const req = TestHelper.createRequest(`/api/user/connect/set-individual-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      let errorMessage
      try {
        await req.route.api.patch(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-stripe-account')
    })

    it('should reject other account\'s registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'DE'
      })
      const user2 = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/api/user/connect/set-individual-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user2.account
      req.session = user2.session
      let errorMessage
      try {
        await req.route.api.patch(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-account')
    })

    it('should require payment details', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'DE'
      })
      await TestHelper.createStripeRegistration(user, {
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-individual-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      let errorMessage
      try {
        await req.route.api.patch(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-payment-details')
    })

    it(`should submit AT-individual registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'AT'
      })
      await TestHelper.createStripeRegistration(user, {
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'eur',
        country: 'AT',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        iban: 'AT89370400440532013000'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-individual-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
    })

    it(`should submit AU-individual registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'AU'
      })
      await TestHelper.createStripeRegistration(user, {
        individual_address_city: 'Brisbane',
        individual_address_state: 'QLD',
        individual_address_line1: '123 Sesame St',
        individual_address_postal_code: '4000',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'aud',
        country: 'AU',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        account_number: '000123456',
        bsb_number: '110000'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-individual-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
    })

    it(`should submit BE-individual registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'BE'
      })
      await TestHelper.createStripeRegistration(user, {
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'eur',
        country: 'BE',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        iban: 'BE89370400440532013000'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-individual-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
    })

    it(`should submit CA-individual registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'CA'
      })
      await TestHelper.createStripeRegistration(user, {
        individual_address_city: 'Vancouver',
        individual_address_state: 'BC',
        individual_address_line1: '123 Sesame St',
        individual_address_postal_code: 'V5K 0A1',
        individual_id_number: '000000000',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'cad',
        country: 'CA',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        account_number: '000123456789',
        transit_number: '11000',
        institution_number: '000'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-individual-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
    })

    it(`should submit CH-individual registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'CH'
      })
      await TestHelper.createStripeRegistration(user, {
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'eur',
        country: 'CH',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        iban: 'CH89370400440532013000'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-individual-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
    })

    it(`should submit DE-individual registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'DE'
      })
      await TestHelper.createStripeRegistration(user, {
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'eur',
        country: 'DE',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        iban: 'DE89370400440532013000'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-individual-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
    })

    it(`should submit DK-individual registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'DK'
      })
      await TestHelper.createStripeRegistration(user, {
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'eur',
        country: 'DK',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        iban: 'DK89370400440532013000'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-individual-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
    })

    it(`should submit ES-individual registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'ES'
      })
      await TestHelper.createStripeRegistration(user, {
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'eur',
        country: 'ES',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        iban: 'ES89370400440532013000'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-individual-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
    })

    it(`should submit FI-individual registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'FI'
      })
      await TestHelper.createStripeRegistration(user, {
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'eur',
        country: 'FI',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        iban: 'FI89370400440532013000'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-individual-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
    })

    it(`should submit FR-individual registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'FR'
      })
      await TestHelper.createStripeRegistration(user, {
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'eur',
        country: 'FR',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        iban: 'FR89370400440532013000'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-individual-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
    })

    it(`should submit GB-individual registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'GB'
      })
      await TestHelper.createStripeRegistration(user, {
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'eur',
        country: 'GB',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        iban: 'GB89370400440532013000'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-individual-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
    })

    it(`should submit HK-individual registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'HK'
      })
      await TestHelper.createStripeRegistration(user, {
        individual_address_city: 'Hong Kong',
        individual_address_line1: '123 Sesame St',
        individual_id_number: '00000000000',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'hkd',
        country: 'HK',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        account_number: '000123-456',
        clearing_code: '110',
        branch_code: '000'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-individual-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
    })

    it(`should submit IE-individual registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'IE'
      })
      await TestHelper.createStripeRegistration(user, {
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'eur',
        country: 'IE',
        state: 'Dublin',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        iban: 'IE89370400440532013000'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-individual-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
    })

    it(`should submit IT-individual registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'IT'
      })
      await TestHelper.createStripeRegistration(user, {
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'eur',
        country: 'IT',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        iban: 'IT89370400440532013000'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-individual-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
    })

    it(`should submit JP-individual registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'JP'
      })
      await TestHelper.createStripeRegistration(user, {
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_gender: 'female',
        individual_phone: '+81112345678',
        individual_first_name_kana: 'ﾄｳｷﾖｳﾄ',
        individual_last_name_kana: 'ﾄｳｷﾖｳﾄ',
        individual_first_name_kanji: '東京都',
        individual_last_name_kanji: '東京都',
        individual_address_kana_postal_code: '1500001',
        individual_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        individual_address_kana_city: 'ｼﾌﾞﾔ',
        individual_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        individual_address_kana_line1: '27-15',
        individual_address_kanji_postal_code: '1500001',
        individual_address_kanji_state: '東京都',
        individual_address_kanji_city: '渋谷区',
        individual_address_kanji_town: '神宮前　３丁目',
        individual_address_kanji_line1: '２７－１５'
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'jpy',
        country: 'JP',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        account_number: '00012345',
        bank_code: '1100',
        branch_code: '000'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-individual-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
    })

    it(`should submit LU-individual registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'LU'
      })
      await TestHelper.createStripeRegistration(user, {
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'eur',
        country: 'LU',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        iban: 'LU89370400440532013000'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-individual-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
    })

    it(`should submit NL-individual registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'NL'
      })
      await TestHelper.createStripeRegistration(user, {
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'eur',
        country: 'NL',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        iban: 'NL89370400440532013000'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-individual-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
    })

    it(`should submit NO-individual registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'NO'
      })
      await TestHelper.createStripeRegistration(user, {
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'eur',
        country: 'NO',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        iban: 'NO89370400440532013000'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-individual-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
    })

    it(`should submit NZ-individual registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'NZ'
      })
      await TestHelper.createStripeRegistration(user, {
        individual_address_city: 'Auckland',
        individual_address_line1: '123 Sesame St',
        individual_address_postal_code: '6011',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'nzd',
        country: 'NZ',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        account_number: '0000000010',
        routing_number: '110000'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-individual-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
    })

    it(`should submit PT-individual registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'PT'
      })
      await TestHelper.createStripeRegistration(user, {
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'eur',
        country: 'PT',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        iban: 'PT89370400440532013000'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-individual-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
    })

    it(`should submit SE-individual registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'SE'
      })
      await TestHelper.createStripeRegistration(user, {
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'eur',
        country: 'SE',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        iban: 'SE89370400440532013000'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-individual-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
    })

    it(`should submit SG-individual registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'SG'
      })
      await TestHelper.createStripeRegistration(user, {
        individual_address_line1: '123 Sesame St',
        individual_address_postal_code: '339696',
        individual_id_number: '00000000000',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'sgd',
        country: 'SG',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        account_number: '000123456',
        bank_code: '1100',
        branch_code: '000'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-individual-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
    })

    it(`should submit US-individual registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'US'
      })
      await TestHelper.createStripeRegistration(user, {
        business_profile_mcc: '7997',
        business_profile_url: 'https://www.' + user.profile.email.split('@')[1],
        individual_address_city: 'New York',
        individual_address_line1: '285 Fulton St',
        individual_address_postal_code: '10007',
        individual_id_number: '000000000',
        individual_address_state: 'NY',
        individual_ssn_last_4: '0000',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_phone: '456-123-7890',
        individual_email: user.profile.email,
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'usd',
        country: 'US',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        account_number: '000123456789',
        routing_number: '110000000'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-individual-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
    })
  })
})
