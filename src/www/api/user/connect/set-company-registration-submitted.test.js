/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')

describe(`/api/user/connect/set-company-registration-submitted`, async () => {
  describe('SetCompanyRegistrationSubmitted#PATCH', () => {
    it('should reject invalid stripeid', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/api/user/connect/set-company-registration-submitted?stripeid=invalid')
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

    it('should reject individual account', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'US' })
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
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
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'US' })
      await TestHelper.createStripeRegistration(user, { business_tax_id: 1, business_name: user.profile.firstName + '\'s company', country: 'US', city: 'New York City', personal_city: 'New York City', postal_code: '10001', personal_id_number: '000000000', line1: 'First Street', day: '1', month: '1', year: '1950', company_city: 'New York City', company_state: 'New York', company_line1: 'First Street', company_postal_code: '10001', ssn_last_4: '0000' })
      await TestHelper.createExternalAccount(user, { currency: 'usd', country: 'US', account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`, account_type: 'individual', account_number: '000123456789', routing_number: '110000000' })
      await TestHelper.submitStripeAccount(user)
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
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
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'DE' })
      const user2 = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
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
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'DE' })
      await TestHelper.createStripeRegistration(user, { business_tax_id: 1, business_name: user.profile.firstName + '\'s company', country: 'DE', day: '1', month: '1', year: '1950', company_city: 'Berlin', company_line1: 'First Street', company_postal_code: '01067', personal_city: 'Berlin', personal_line1: 'First Street', personal_postal_code: '01067' })
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
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

    it('should require additional owners submitted', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'DE' })
      await TestHelper.createStripeRegistration(user, { business_tax_id: 1, business_name: user.profile.firstName + '\'s company', country: 'DE', day: '1', month: '1', year: '1950', company_city: 'Berlin', company_line1: 'First Street', company_postal_code: '01067', personal_city: 'Berlin', personal_line1: 'First Street', personal_postal_code: '01067' })
      await TestHelper.createExternalAccount(user, { currency: 'eur', country: 'DE', account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`, account_type: 'individual', iban: 'DE89370400440532013000' })
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      let errorMessage
      try {
        await req.route.api.patch(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-additional-owners')
    })

    it(`should submit AT-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'AT' })
      await TestHelper.createStripeRegistration(user, { country: 'AT', business_tax_id: 1, business_name: user.profile.firstName + '\'s company', country: 'AT', day: '1', month: '1', year: '1950', company_city: 'Vienna', company_postal_code: '1020', company_line1: 'First Street', personal_city: 'Vienna', personal_line1: 'First Street', personal_postal_code: '1020' })
      await TestHelper.createExternalAccount(user, { currency: 'eur', country: 'AT', account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`, account_type: 'individual', iban: 'AT89370400440532013000' })
      await TestHelper.submitAdditionalOwners(user)
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
      assert.strictEqual(accountNow.verification.fields_needed.length, 0)
    })

    it(`should submit AU-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'AU' })
      await TestHelper.createStripeRegistration(user, { country: 'AU', business_tax_id: 1, business_name: user.profile.firstName + '\'s company', country: 'AU', day: '1', month: '1', year: '1950', company_city: 'Brisbane', company_country: 'AU', company_line1: 'First Street', company_postal_code: '4000', company_state: 'QLD', personal_postal_code: '4000', personal_city: 'Brisbane', personal_state: 'QLD', personal_line1: 'First Street' })
      await TestHelper.createExternalAccount(user, { currency: 'aud', country: 'AU', account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`, account_type: 'individual', account_number: '000123456', bsb_number: '110000' })
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
      assert.strictEqual(accountNow.verification.fields_needed.length, 0)
    })

    it(`should submit BE-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'BE' })
      await TestHelper.createStripeRegistration(user, { country: 'BE', business_tax_id: 1, business_name: user.profile.firstName + '\'s company', country: 'BE', day: '1', month: '1', year: '1950', company_city: 'Brussels', company_postal_code: '1020', company_line1: 'First street', personal_city: 'Brussels', personal_postal_code: '1020', personal_line1: 'First Street' })
      await TestHelper.createExternalAccount(user, { currency: 'eur', country: 'BE', account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`, account_type: 'individual', iban: 'BE89370400440532013000' })
      await TestHelper.submitAdditionalOwners(user)
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
      assert.strictEqual(accountNow.verification.fields_needed.length, 0)
    })

    it(`should submit CA-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'CA' })
      await TestHelper.createStripeRegistration(user, { country: 'CA', business_tax_id: 1, business_name: user.profile.firstName + '\'s company', country: 'CA', day: '1', month: '1', year: '1950', company_city: 'Vancouver', company_state: 'BC', company_postal_code: 'V7G 0A1', company_line1: 'First Street', personal_city: 'Vancouver', personal_state: 'BC', personal_postal_code: 'VK5-0A1', personal_line1: 'First Street', personal_id_number: '000000000' })
      await TestHelper.createExternalAccount(user, { currency: 'cad', country: 'CA', account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`, account_type: 'individual', account_number: '000123456789', transit_number: '11000', institution_number: '000' })
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
      assert.strictEqual(accountNow.verification.fields_needed.length, 0)
    })

    it(`should submit CH-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'CH' })
      await TestHelper.createStripeRegistration(user, { country: 'CH', business_tax_id: 1, business_name: user.profile.firstName + '\'s company', country: 'CH', day: '1', month: '1', year: '1950', company_city: 'Bern', company_postal_code: '1020', company_line1: 'First Street', personal_city: 'Bern', personal_postal_code: '1020', personal_line1: 'First Street' })
      await TestHelper.createExternalAccount(user, { currency: 'eur', country: 'CH', account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`, account_type: 'individual', iban: 'CH89370400440532013000' })
      await TestHelper.submitAdditionalOwners(user)
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
      assert.strictEqual(accountNow.verification.fields_needed.length, 0)
    })

    it(`should submit DE-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'DE' })
      await TestHelper.createStripeRegistration(user, { business_tax_id: 1, business_name: user.profile.firstName + '\'s company', country: 'DE', day: '1', month: '1', year: '1950', company_city: 'Berlin', company_line1: 'First Street', company_postal_code: '01067', personal_city: 'Berlin', personal_line1: 'First Street', personal_postal_code: '01067' })
      await TestHelper.createExternalAccount(user, { currency: 'eur', country: 'DE', account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`, account_type: 'individual', iban: 'DE89370400440532013000' })
      await TestHelper.submitAdditionalOwners(user)
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
    })

    it(`should submit DK-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'DK' })
      await TestHelper.createStripeRegistration(user, { country: 'DK', business_tax_id: 1, business_name: user.profile.firstName + '\'s company', country: 'DK', day: '1', month: '1', year: '1950', company_city: 'Copenhagen', company_postal_code: '2300', company_line1: 'First Street', personal_city: 'Copenhagen', personal_postal_code: '2300', personal_line1: 'First Street' })
      await TestHelper.createExternalAccount(user, { currency: 'eur', country: 'DK', account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`, account_type: 'individual', iban: 'DK89370400440532013000' })
      await TestHelper.submitAdditionalOwners(user)
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
      assert.strictEqual(accountNow.verification.fields_needed.length, 0)
    })

    it(`should submit ES-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'ES' })
      await TestHelper.createStripeRegistration(user, { country: 'ES', business_tax_id: 1, business_name: user.profile.firstName + '\'s company', country: 'ES', day: '1', month: '1', year: '1950', company_city: 'Madrid', company_postal_code: '03179', company_line1: 'First Street', personal_city: 'Madrid', personal_postal_code: '03179', personal_line1: 'First Street' })
      await TestHelper.createExternalAccount(user, { currency: 'eur', country: 'ES', account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`, account_type: 'individual', iban: 'ES89370400440532013000' })
      await TestHelper.submitAdditionalOwners(user)
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
      assert.strictEqual(accountNow.verification.fields_needed.length, 0)
    })

    it(`should submit FI-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'FI' })
      await TestHelper.createStripeRegistration(user, { country: 'FI', business_tax_id: 1, business_name: user.profile.firstName + '\'s company', country: 'FI', day: '1', month: '1', year: '1950', company_city: 'Helsinki', company_postal_code: '00990', company_line1: 'First Street', personal_city: 'Helsinki', personal_postal_code: '00990', personal_line1: 'First Street' })
      await TestHelper.createExternalAccount(user, { currency: 'eur', country: 'FI', account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`, account_type: 'individual', iban: 'FI89370400440532013000' })
      await TestHelper.submitAdditionalOwners(user)
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
      assert.strictEqual(accountNow.verification.fields_needed.length, 0)
    })

    it(`should submit FR-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'FR' })
      await TestHelper.createStripeRegistration(user, { country: 'FR', business_tax_id: 1, business_name: user.profile.firstName + '\'s company', country: 'FR', day: '1', month: '1', year: '1950', company_city: 'Paris', company_postal_code: '75001', company_line1: 'First Street', personal_city: 'Paris', personal_postal_code: '75001', personal_line1: 'First Street' })
      await TestHelper.createExternalAccount(user, { currency: 'eur', country: 'FR', account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`, account_type: 'individual', iban: 'FR89370400440532013000' })
      await TestHelper.submitAdditionalOwners(user)
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
      assert.strictEqual(accountNow.verification.fields_needed.length, 0)
    })

    it(`should submit GB-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'GB' })
      await TestHelper.createStripeRegistration(user, { country: 'GB', business_tax_id: 1, business_name: user.profile.firstName + '\'s company', country: 'GB', day: '1', month: '1', year: '1950', company_city: 'London', company_postal_code: 'EC1A 1AA', company_line1: 'First Street', personal_city: 'London', personal_postal_code: 'EC1A 1AA', personal_line1: 'First Street' })
      await TestHelper.createExternalAccount(user, { currency: 'eur', country: 'GB', account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`, account_type: 'individual', iban: 'GB89370400440532013000' })
      await TestHelper.submitAdditionalOwners(user)
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
      assert.strictEqual(accountNow.verification.fields_needed.length, 0)
    })

    it(`should submit HK-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'HK' })
      await TestHelper.createStripeRegistration(user, { country: 'HK', business_tax_id: 1, business_name: user.profile.firstName + '\'s company', country: 'HK', personal_id_number: '7', line1: 'First Street', day: '1', month: '1', year: '1950', company_city: 'Hong Kong', personal_city: 'Hong Kong', company_line1: 'First Street', personal_line1: 'First Street' })
      await TestHelper.createExternalAccount(user, { currency: 'hkd', country: 'HK', account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`, account_type: 'individual', account_number: '000123-456', clearing_code: '110', branch_code: '000' })
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
      assert.strictEqual(accountNow.verification.fields_needed.length, 0)
    })

    it(`should submit IE-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'IE' })
      await TestHelper.createStripeRegistration(user, { country: 'IE', business_tax_id: 1, business_name: user.profile.firstName + '\'s company', country: 'IE', day: '1', month: '1', year: '1950', company_city: 'Dublin', company_line1: 'First Street', personal_city: 'Dublin', personal_line1: 'First Street', company_state: 'Dublin', personal_state: 'Dublin' })
      await TestHelper.createExternalAccount(user, { currency: 'eur', country: 'IE', company_state: 'Dublin', account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`, account_type: 'individual', iban: 'IE89370400440532013000' })
      await TestHelper.submitAdditionalOwners(user)
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
      assert.strictEqual(accountNow.verification.fields_needed.length, 0)
    })

    it(`should submit IT-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'IT' })
      await TestHelper.createStripeRegistration(user, { country: 'IT', business_tax_id: 1, business_name: user.profile.firstName + '\'s company', country: 'IT', day: '1', month: '1', year: '1950', company_city: 'Rome', company_postal_code: '00010', company_line1: 'First Street', personal_city: 'Rome', personal_line1: 'First Street', personal_postal_code: '00010' })
      await TestHelper.createExternalAccount(user, { currency: 'eur', country: 'IT', account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`, account_type: 'individual', iban: 'IT89370400440532013000' })
      await TestHelper.submitAdditionalOwners(user)
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
      assert.strictEqual(accountNow.verification.fields_needed.length, 0)
    })

    it(`should submit JP-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'JP' })
      await TestHelper.createStripeRegistration(user, { country: 'JP', business_tax_id: 1, business_name: user.profile.firstName + '\'s company', business_name_kana: user.profile.firstName + '\'s company', business_name_kanji: user.profile.firstName + '\'s company', country: 'JP', day: '1', month: '1', year: '1950', gender: 'female', first_name_kana: 'ﾄｳｷﾖｳﾄ', last_name_kana: 'ﾄｳｷﾖｳﾄ', first_name_kanji: '東京都', last_name_kanji: '東京都', phone_number: '0859-076500', personal_postal_code_kana: '1500001', personal_state_kana: 'ﾄｳｷﾖｳﾄ', personal_city_kana: 'ｼﾌﾞﾔ', personal_town_kana: 'ｼﾞﾝｸﾞｳﾏｴ 3-', personal_line1_kana: '27-15', personal_postal_code_kanji: '１５００００１', personal_state_kanji: '東京都', personal_city_kanji: '渋谷区', personal_town_kanji: '神宮前　３丁目', personal_line1_kanji: '２７－１５', company_postal_code_kana: '1500001', company_state_kana: 'ﾄｳｷﾖｳﾄ', company_city_kana: 'ｼﾌﾞﾔ', company_town_kana: 'ｼﾞﾝｸﾞｳﾏｴ 3-', company_line1_kana: '27-15', company_postal_code_kanji: '１５００００１', company_state_kanji: '東京都', company_city_kanji: '渋谷区', company_town_kanji: '神宮前　３丁目', company_line1_kanji: '２７－１５' })
      await TestHelper.createExternalAccount(user, { currency: 'jpy', country: 'JP', account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`, account_type: 'individual', account_number: '00012345', bank_code: '1100', branch_code: '000' })
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
      assert.strictEqual(accountNow.verification.fields_needed.length, 0)
    })

    it(`should submit LU-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'LU' })
      await TestHelper.createStripeRegistration(user, { country: 'LU', business_tax_id: 1, business_name: user.profile.firstName + '\'s company', country: 'LU', day: '1', month: '1', year: '1950', company_city: 'Luxemburg', company_postal_code: '1623', company_line1: 'First Street', personal_city: 'Luxemburg', personal_postal_code: '1623', personal_line1: 'First Street' })
      await TestHelper.createExternalAccount(user, { currency: 'eur', country: 'LU', account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`, account_type: 'individual', iban: 'LU89370400440532013000' })
      await TestHelper.submitAdditionalOwners(user)
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
      assert.strictEqual(accountNow.verification.fields_needed.length, 0)
    })

    it(`should submit NL-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'NL' })
      await TestHelper.createStripeRegistration(user, { country: 'NL', business_tax_id: 1, business_name: user.profile.firstName + '\'s company', country: 'NL', day: '1', month: '1', year: '1950', company_city: 'Amsterdam', company_postal_code: '1071 JA', company_line1: 'First Street', personal_city: 'Amsterdam', personal_postal_code: '1071 JA', personal_line1: 'First Street' })
      await TestHelper.createExternalAccount(user, { currency: 'eur', country: 'NL', account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`, account_type: 'individual', iban: 'NL89370400440532013000' })
      await TestHelper.submitAdditionalOwners(user)
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
      assert.strictEqual(accountNow.verification.fields_needed.length, 0)
    })

    it(`should submit NO-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'NO' })
      await TestHelper.createStripeRegistration(user, { country: 'NO', business_tax_id: 1, business_name: user.profile.firstName + '\'s company', country: 'NO', day: '1', month: '1', year: '1950', company_city: 'Oslo', company_postal_code: '0001', company_line1: 'First Street', personal_city: 'Oslo', personal_postal_code: '0001', personal_line1: 'First Street' })
      await TestHelper.createExternalAccount(user, { currency: 'eur', country: 'NO', account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`, account_type: 'individual', iban: 'NO89370400440532013000' })
      await TestHelper.submitAdditionalOwners(user)
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
      assert.strictEqual(accountNow.verification.fields_needed.length, 0)
    })

    it(`should submit NZ-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'NZ' })
      await TestHelper.createStripeRegistration(user, { country: 'NZ', business_tax_id: 1, business_name: user.profile.firstName + '\'s company', country: 'NZ', day: '1', month: '1', year: '1950', company_city: 'Auckland', company_postal_code: '6011', company_line1: 'First Street', personal_city: 'Auckland', personal_postal_code: '6011', personal_line1: 'First Street' })
      await TestHelper.createExternalAccount(user, { currency: 'nzd', country: 'NZ', account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`, account_type: 'individual', account_number: '0000000010', routing_number: '110000' })
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
      assert.strictEqual(accountNow.verification.fields_needed.length, 0)
    })

    it(`should submit PT-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'PT' })
      await TestHelper.createStripeRegistration(user, { country: 'PT', business_tax_id: 1, business_name: user.profile.firstName + '\'s company', country: 'PT', day: '1', month: '1', year: '1950', company_city: 'Lisbon', company_postal_code: '4520', company_line1: 'First Street', personal_city: 'Lisbon', personal_postal_code: '4520', personal_line1: 'First Street' })
      await TestHelper.createExternalAccount(user, { currency: 'eur', country: 'PT', account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`, account_type: 'individual', iban: 'PT89370400440532013000' })
      await TestHelper.submitAdditionalOwners(user)
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
      assert.strictEqual(accountNow.verification.fields_needed.length, 0)
    })

    it(`should submit SE-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'SE' })
      await TestHelper.createStripeRegistration(user, { country: 'SE', business_tax_id: 1, business_name: user.profile.firstName + '\'s company', country: 'SE', day: '1', month: '1', year: '1950', company_city: 'Stockholm', company_postal_code: '00150', company_line1: 'First Street', personal_city: 'Stockholm', personal_postal_code: '00150', personal_line1: 'First Street' })
      await TestHelper.createExternalAccount(user, { currency: 'eur', country: 'SE', account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`, account_type: 'individual', iban: 'SE89370400440532013000' })
      await TestHelper.submitAdditionalOwners(user)
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
      assert.strictEqual(accountNow.verification.fields_needed.length, 0)
    })

    // these tests only work if your Stripe account is SG
    // it(`should submit SG-company registration`, async () => {
    //   const user = await TestHelper.createUser()
    //   await TestHelper.createStripeAccount(user, { type: 'company', country: 'SG' })
    //   await TestHelper.createStripeRegistration(user, { country: 'SG', business_tax_id: 1, business_name: user.profile.firstName + '\'s company', country: 'SG', postal_code: '339696', line1: 'First Street', day: '1', month: '1', year: '1950', company_line1: 'First Street', company_postal_code: '339696', personal_line1: 'First Street', personal_postal_code: '339696', personal_id_number: '000000000' })
    //   await TestHelper.createExternalAccount(user, { currency: 'sgd', country: 'SG', account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`, account_type: 'individual', account_number: '000123456', bank_code: '1100', branch_code: '000' })
    //   await TestHelper.submitAdditionalOwners(user)
    //   const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
    //   req.account = user.account
    //   req.session = user.session
    //   const accountNow = await req.patch()
    //   assert.notStrictEqual(accountNow.metadata.submitted, undefined)
    //   assert.notStrictEqual(accountNow.metadata.submitted, null)
    //   assert.strictEqual(accountNow.verification.fields_needed.length, 0)
    // })

    it(`should submit US-company registration`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'US' })
      await TestHelper.createStripeRegistration(user, { business_tax_id: 1, business_name: user.profile.firstName + '\'s company', country: 'US', city: 'New York City', personal_city: 'New York City', postal_code: '10001', personal_id_number: '000000000', line1: 'First Street', day: '1', month: '1', year: '1950', company_city: 'New York City', company_state: 'New York', company_line1: 'First Street', company_postal_code: '10001', ssn_last_4: '0000' })
      await TestHelper.createExternalAccount(user, { currency: 'usd', country: 'US', account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`, account_type: 'individual', account_number: '000123456789', routing_number: '110000000' })
      const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.notStrictEqual(accountNow.metadata.submitted, undefined)
      assert.notStrictEqual(accountNow.metadata.submitted, null)
      assert.strictEqual(accountNow.verification.fields_needed.length, 0)
    })
  })
})
