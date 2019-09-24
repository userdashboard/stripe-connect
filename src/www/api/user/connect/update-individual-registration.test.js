/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')

describe('/api/user/connect/update-individual-registration', () => {
  describe('exceptions', () => {
    describe('invalid-stripeid', () => {
      it('missing querystring stripeid', async () => {
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/connect/update-individual-registration')
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

      it('invalid querystring stripeid', async () => {
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/connect/update-individual-registration?stripeid=invalid')
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
    })

    describe('invalid-stripe-account', () => {
      it('ineligible stripe account for company', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'US'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
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

      it('ineligible stripe account is submitted', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'individual',
          country: 'US'
        })
        await TestHelper.createStripeRegistration(user, {
          business_profile_mcc: '7997',
          business_profile_url: 'https://www.' + user.profile.contactEmail.split('@')[1],
          individual_address_city: 'New York',
          individual_address_line1: '285 Fulton St',
          individual_address_postal_code: '10007',
          // individual_id_number: '000000000',
          individual_address_state: 'NY',
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_ssn_last_4: '0000',
          individual_phone: '456-123-7890',
          individual_email: user.profile.contactEmail,
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
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
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
    })

    describe('invalid-account', () => {
      it('ineligible accessing account', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'individual',
          country: 'US'
        })
        const user2 = await TestHelper.createUser()
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
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
    })

    describe('invalid-individual_dob_day', () => {
      it('missing posted individual_dob_day', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'individual',
          country: 'AT'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          individual_dob_day: '',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_first_name: user.profile.firstName,
          individual_last_name: user.profile.lastName
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-individual_dob_day')
      })
    })

    describe('invalid-individual_dob_month', () => {
      it('missing posted individual_dob_month', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'individual',
          country: 'AT'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          individual_dob_day: '1',
          individual_dob_month: '',
          individual_dob_year: '1950',
          individual_first_name: user.profile.firstName,
          individual_last_name: user.profile.lastName
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-individual_dob_month')
      })
    })

    describe('invalid-individual_dob_year', () => {
      it('missing posted individual_dob_year', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'individual',
          country: 'AT'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '',
          individual_first_name: user.profile.firstName,
          individual_last_name: user.profile.lastName
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-individual_dob_year')
      })
    })

    describe('invalid-individual_first_name', () => {
      it('missing posted individual_first_name', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'individual',
          country: 'AT'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_first_name: '',
          individual_last_name: user.profile.lastName
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-individual_first_name')
      })
    })

    describe('invalid-individual_last_name', () => {
      it('missing posted individual_last_name', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'individual',
          country: 'AT'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_first_name: user.profile.firstName,
          individual_last_name: ''
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-individual_last_name')
      })
    })

    describe('invalid-individual_address_city', () => {
      it('missing posted individual_address_city', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'individual',
          country: 'AU'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          individual_address_city: '',
          individual_address_state: 'QLD',
          individual_address_line1: '123 Sesame St',
          individual_address_postal_code: '4000',
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_first_name: user.profile.firstName,
          individual_last_name: user.profile.lastName
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-individual_address_city')
      })
    })

    describe('invalid-individual_address_state', () => {
      it('missing posted individual_address_state', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'individual',
          country: 'AU'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          individual_address_city: 'Brisbane',
          individual_address_state: '',
          individual_address_line1: '123 Sesame St',
          individual_address_postal_code: '4000',
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_first_name: user.profile.firstName,
          individual_last_name: user.profile.lastName
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-individual_address_state')
      })
    })

    describe('invalid-individual_address_postal_code', () => {
      it('missing posted individual_address_postal_code', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'individual',
          country: 'AU'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          individual_address_city: 'Brisbane',
          individual_address_state: 'QLD',
          individual_address_line1: '123 Sesame St',
          individual_address_postal_code: '',
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_first_name: user.profile.firstName,
          individual_last_name: user.profile.lastName
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-individual_address_postal_code')
      })
    })

    describe('invalid-individual_id_number', () => {
      it('missing posted indvidual_id_number', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'individual',
          country: 'HK'
        })
        const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          individual_address_city: 'Hong Kong',
          individual_address_line1: '123 Sesame St',
          individual_id_number: '',
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_first_name: user.profile.firstName,
          individual_last_name: user.profile.lastName
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-individual_id_number')
      })
    })

    describe('invalid-business_profile_mcc', () => {
      it('missing posted business_profile_mcc', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'individual',
          country: 'US'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          business_profile_mcc: '',
          business_profile_url: 'https://www.' + user.profile.contactEmail.split('@')[1],
          individual_address_city: 'New York',
          individual_address_line1: '285 Fulton St',
          individual_address_postal_code: '10007',
          // individual_id_number: '000000000',
          individual_address_state: 'NY',
          individual_ssn_last_4: '0000',
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_phone: '456-123-7890',
          individual_email: user.profile.contactEmail,
          individual_first_name: user.profile.firstName,
          individual_last_name: user.profile.lastName
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-business_profile_mcc')
      })
    })

    describe('invalid-business_profile_url', () => {
      it('missing posted business_profile_url', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'individual',
          country: 'US'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          business_profile_mcc: '7997',
          business_profile_url: '',
          individual_address_city: 'New York',
          individual_address_line1: '285 Fulton St',
          individual_address_postal_code: '10007',
          // individual_id_number: '000000000',
          individual_address_state: 'NY',
          individual_ssn_last_4: '0000',
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_phone: '456-123-7890',
          individual_email: user.profile.contactEmail,
          individual_first_name: user.profile.firstName,
          individual_last_name: user.profile.lastName
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-business_profile_url')
      })
    })

    describe('invalid-individual_ssn_last_4', () => {
      it('missing posted individual_ssn_last_4', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'individual',
          country: 'US'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          business_profile_mcc: '7997',
          business_profile_url: 'https://www.' + user.profile.contactEmail.split('@')[1],
          individual_address_city: 'New York',
          individual_address_line1: '285 Fulton St',
          individual_address_postal_code: '10007',
          // individual_id_number: '000000000',
          individual_address_state: 'NY',
          individual_ssn_last_4: '',
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_phone: '456-123-7890',
          individual_email: user.profile.contactEmail,
          individual_first_name: user.profile.firstName,
          individual_last_name: user.profile.lastName
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-individual_ssn_last_4')
      })
    })

    describe('invalid-individual_phone', () => {
      it('missing posted individual_phone', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'individual',
          country: 'US'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          business_profile_mcc: '7997',
          business_profile_url: 'https://www.' + user.profile.contactEmail.split('@')[1],
          individual_address_city: 'New York',
          individual_address_line1: '285 Fulton St',
          individual_address_postal_code: '10007',
          // individual_id_number: '000000000',
          individual_address_state: 'NY',
          individual_ssn_last_4: '0000',
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_phone: '',
          individual_email: user.profile.contactEmail,
          individual_first_name: user.profile.firstName,
          individual_last_name: user.profile.lastName
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-individual_phone')
      })
    })

    describe('invalid-individual_email', () => {
      it('missing posted ', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'individual',
          country: 'US'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          business_profile_mcc: '7997',
          business_profile_url: 'https://www.' + user.profile.contactEmail.split('@')[1],
          individual_address_city: 'New York',
          individual_address_line1: '285 Fulton St',
          individual_address_postal_code: '10007',
          // individual_id_number: '000000000',
          individual_address_state: 'NY',
          individual_ssn_last_4: '0000',
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_phone: '456-123-7890',
          individual_email: '',
          individual_first_name: user.profile.firstName,
          individual_last_name: user.profile.lastName
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-individual_email')
      })
    })

    describe('invalid-individual_gender', () => {
      it('missing posted individual_gender', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'individual',
          country: 'JP'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_gender: '',
          individual_first_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_last_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_first_name_kanji: '東京都',
          individual_last_name_kanji: '東京都',
          individual_phone: '011-6789-0123',
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
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-individual_gender')
      })

      it('invalid posted individual_gender', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'individual',
          country: 'JP'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_gender: 'invalid',
          individual_first_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_last_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_first_name_kanji: '東京都',
          individual_last_name_kanji: '東京都',
          individual_phone: '011-6789-0123',
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
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-individual_gender')
      })
    })

    describe('invalid-individual_first_name_kana', () => {
      it('missing posted individual_first_name_kana', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'individual',
          country: 'JP'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_gender: 'female',
          individual_first_name_kana: '',
          individual_last_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_first_name_kanji: '東京都',
          individual_last_name_kanji: '東京都',
          individual_phone: '011-6789-0123',
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
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-individual_first_name_kana')
      })
    })

    describe('invalid-individual_last_name_kana', () => {
      it('missing posted individual_last_name_kana', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'individual',
          country: 'JP'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_gender: 'female',
          individual_first_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_last_name_kana: '',
          individual_first_name_kanji: '東京都',
          individual_last_name_kanji: '東京都',
          individual_phone: '011-6789-0123',
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
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-individual_last_name_kana')
      })
    })

    describe('invalid-individual_first_name_kanji', () => {
      it('missing posted individual_first_name_kanji', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'individual',
          country: 'JP'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_gender: 'female',
          individual_first_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_last_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_first_name_kanji: '',
          individual_last_name_kanji: '東京都',
          individual_phone: '011-6789-0123',
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
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-individual_first_name_kanji')
      })
    })

    describe('invalid-individual_last_name_kanji', () => {
      it('missing posted individual_last_name_kanji', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'individual',
          country: 'JP'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_gender: 'female',
          individual_first_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_last_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_first_name_kanji: '東京都',
          individual_last_name_kanji: '',
          individual_phone: '011-6789-0123',
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
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-individual_last_name_kanji')
      })
    })

    describe('invalid-individual_address_kana_postal_code', () => {
      it('missing posted individual_address_kana_postal_code', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'individual',
          country: 'JP'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_gender: 'female',
          individual_first_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_last_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_first_name_kanji: '東京都',
          individual_last_name_kanji: '東京都',
          individual_phone: '011-6789-0123',
          individual_address_kana_postal_code: '',
          individual_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          individual_address_kana_city: 'ｼﾌﾞﾔ',
          individual_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          individual_address_kana_line1: '27-15',
          individual_address_kanji_postal_code: '1500001',
          individual_address_kanji_state: '東京都',
          individual_address_kanji_city: '渋谷区',
          individual_address_kanji_town: '神宮前　３丁目',
          individual_address_kanji_line1: '２７－１５'
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-individual_address_kana_postal_code')
      })
    })

    describe('invalid-individual_address_kana_state', () => {
      it('missing posted individual_address_kana_state', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'individual',
          country: 'JP'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_gender: 'female',
          individual_first_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_last_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_first_name_kanji: '東京都',
          individual_last_name_kanji: '東京都',
          individual_phone: '011-6789-0123',
          individual_address_kana_postal_code: '1500001',
          individual_address_kana_state: '',
          individual_address_kana_city: 'ｼﾌﾞﾔ',
          individual_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          individual_address_kana_line1: '27-15',
          individual_address_kanji_postal_code: '1500001',
          individual_address_kanji_state: '東京都',
          individual_address_kanji_city: '渋谷区',
          individual_address_kanji_town: '神宮前　３丁目',
          individual_address_kanji_line1: '２７－１５'
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-individual_address_kana_state')
      })
    })

    describe('invalid-individual_address_kana_city', () => {
      it('missing posted individual_address_kana_city', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'individual',
          country: 'JP'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_gender: 'female',
          individual_first_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_last_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_first_name_kanji: '東京都',
          individual_last_name_kanji: '東京都',
          individual_phone: '011-6789-0123',
          individual_address_kana_postal_code: '1500001',
          individual_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          individual_address_kana_city: '',
          individual_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          individual_address_kana_line1: '27-15',
          individual_address_kanji_postal_code: '1500001',
          individual_address_kanji_state: '東京都',
          individual_address_kanji_city: '渋谷区',
          individual_address_kanji_town: '神宮前　３丁目',
          individual_address_kanji_line1: '２７－１５'
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-individual_address_kana_city')
      })
    })

    describe('invalid-individual_address_kana_town', () => {
      it('missing posted individual_address_kana_town', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'individual',
          country: 'JP'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_gender: 'female',
          individual_first_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_last_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_first_name_kanji: '東京都',
          individual_last_name_kanji: '東京都',
          individual_phone: '011-6789-0123',
          individual_address_kana_postal_code: '1500001',
          individual_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          individual_address_kana_city: 'ｼﾌﾞﾔ',
          individual_address_kana_town: '',
          individual_address_kana_line1: '27-15',
          individual_address_kanji_postal_code: '1500001',
          individual_address_kanji_state: '東京都',
          individual_address_kanji_city: '渋谷区',
          individual_address_kanji_town: '神宮前　３丁目',
          individual_address_kanji_line1: '２７－１５'
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-individual_address_kana_town')
      })
    })

    describe('invalid-individual_address_kana_line1', () => {
      it('missing posted individual_address_kana_line1', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'individual',
          country: 'JP'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_gender: 'female',
          individual_first_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_last_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_first_name_kanji: '東京都',
          individual_last_name_kanji: '東京都',
          individual_phone: '011-6789-0123',
          individual_address_kana_postal_code: '1500001',
          individual_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          individual_address_kana_city: 'ｼﾌﾞﾔ',
          individual_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          individual_address_kana_line1: '',
          individual_address_kanji_postal_code: '1500001',
          individual_address_kanji_state: '東京都',
          individual_address_kanji_city: '渋谷区',
          individual_address_kanji_town: '神宮前　３丁目',
          individual_address_kanji_line1: '２７－１５'
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-individual_address_kana_line1')
      })
    })

    describe('invalid-individual_address_kanji_postal_code', () => {
      it('missing posted individual_address_kanji_postal_code', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'individual',
          country: 'JP'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_gender: 'female',
          individual_first_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_last_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_first_name_kanji: '東京都',
          individual_last_name_kanji: '東京都',
          individual_phone: '011-6789-0123',
          individual_address_kana_postal_code: '1500001',
          individual_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          individual_address_kana_city: 'ｼﾌﾞﾔ',
          individual_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          individual_address_kana_line1: '27-15',
          individual_address_kanji_postal_code: '',
          individual_address_kanji_state: '東京都',
          individual_address_kanji_city: '渋谷区',
          individual_address_kanji_town: '神宮前　３丁目',
          individual_address_kanji_line1: '２７－１５'
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-individual_address_kanji_postal_code')
      })
    })

    describe('invalid-individual_address_kanji_state', () => {
      it('missing posted individual_address_kanji_state', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'individual',
          country: 'JP'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_gender: 'female',
          individual_first_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_last_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_first_name_kanji: '東京都',
          individual_last_name_kanji: '東京都',
          individual_phone: '011-6789-0123',
          individual_address_kana_postal_code: '1500001',
          individual_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          individual_address_kana_city: 'ｼﾌﾞﾔ',
          individual_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          individual_address_kana_line1: '27-15',
          individual_address_kanji_postal_code: '1500001',
          individual_address_kanji_state: '',
          individual_address_kanji_city: '渋谷区',
          individual_address_kanji_town: '神宮前　３丁目',
          individual_address_kanji_line1: '２７－１５'
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-individual_address_kanji_state')
      })
    })

    describe('invalid-individual_address_kanji_city', () => {
      it('missing posted individual_address_kanji_city', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'individual',
          country: 'JP'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_gender: 'female',
          individual_first_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_last_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_first_name_kanji: '東京都',
          individual_last_name_kanji: '東京都',
          individual_phone: '011-6789-0123',
          individual_address_kana_postal_code: '1500001',
          individual_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          individual_address_kana_city: 'ｼﾌﾞﾔ',
          individual_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          individual_address_kana_line1: '27-15',
          individual_address_kanji_postal_code: '1500001',
          individual_address_kanji_state: '東京都',
          individual_address_kanji_city: '',
          individual_address_kanji_town: '神宮前　３丁目',
          individual_address_kanji_line1: '２７－１５'
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-individual_address_kanji_city')
      })
    })

    describe('invalid-individual_address_kanji_town', () => {
      it('missing posted individual_address_kanji_town', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'individual',
          country: 'JP'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_gender: 'female',
          individual_first_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_last_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_first_name_kanji: '東京都',
          individual_last_name_kanji: '東京都',
          individual_phone: '011-6789-0123',
          individual_address_kana_postal_code: '1500001',
          individual_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          individual_address_kana_city: 'ｼﾌﾞﾔ',
          individual_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          individual_address_kana_line1: '27-15',
          individual_address_kanji_postal_code: '1500001',
          individual_address_kanji_state: '東京都',
          individual_address_kanji_city: '渋谷区',
          individual_address_kanji_town: '',
          individual_address_kanji_line1: '２７－１５'
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-individual_address_kanji_town')
      })
    })

    describe('invalid-individual_address_kanji_line1', () => {
      it('missing posted individual_address_kanji_line1', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'individual',
          country: 'JP'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          individual_dob_day: '1',
          individual_dob_month: '1',
          individual_dob_year: '1950',
          individual_gender: 'female',
          individual_first_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_last_name_kana: 'ﾄｳｷﾖｳﾄ',
          individual_first_name_kanji: '東京都',
          individual_last_name_kanji: '東京都',
          individual_phone: '011-6789-0123',
          individual_address_kana_postal_code: '1500001',
          individual_address_kana_state: 'ﾄｳｷﾖｳﾄ',
          individual_address_kana_city: 'ｼﾌﾞﾔ',
          individual_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
          individual_address_kana_line1: '27-15',
          individual_address_kanji_postal_code: '1500001',
          individual_address_kanji_state: '東京都',
          individual_address_kanji_city: '渋谷区',
          individual_address_kanji_town: '神宮前　３丁目',
          individual_address_kanji_line1: ''
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-individual_address_kanji_line1')
      })
    })
  })

  describe('returns', () => {
    it('returns object for AT registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'AT'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration + (accountNow.metadata.registration2 || ''))
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })

    it('returns object for AU registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'AU'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        individual_address_city: 'Brisbane',
        individual_address_state: 'QLD',
        individual_address_line1: '123 Sesame St',
        individual_address_postal_code: '4000',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration + (accountNow.metadata.registration2 || ''))
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })

    it('returns object for BE registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'BE'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration + (accountNow.metadata.registration2 || ''))
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })

    it('returns object for CA registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'CA'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        individual_address_city: 'Vancouver',
        individual_address_state: 'BC',
        individual_address_line1: '123 Sesame St',
        individual_address_postal_code: 'V5K 0A1',
        // individual_id_number: '000000000',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration + (accountNow.metadata.registration2 || ''))
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })

    it('returns object for CH registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'CH'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration + (accountNow.metadata.registration2 || ''))
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })

    it('returns object for DE registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'DE'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration + (accountNow.metadata.registration2 || ''))
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })

    it('returns object for DK registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'DK'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration + (accountNow.metadata.registration2 || ''))
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })

    it('returns object for ES registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'ES'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration + (accountNow.metadata.registration2 || ''))
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })

    it('returns object for FI registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'FI'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration + (accountNow.metadata.registration2 || ''))
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })

    it('returns object for FR registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'FR'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration + (accountNow.metadata.registration2 || ''))
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })

    it('returns object for GB registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'GB'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration + (accountNow.metadata.registration2 || ''))
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })

    it('returns object for HK registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'HK'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        individual_address_city: 'Hong Kong',
        individual_address_line1: '123 Sesame St',
        // individual_id_number: '000000000',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration + (accountNow.metadata.registration2 || ''))
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })

    it('returns object for IE registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'IE'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration + (accountNow.metadata.registration2 || ''))
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })
    it('returns object for IT registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'IT'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration + (accountNow.metadata.registration2 || ''))
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })

    it('returns object for JP registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'JP'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_gender: 'female',
        individual_first_name_kana: 'ﾄｳｷﾖｳﾄ',
        individual_last_name_kana: 'ﾄｳｷﾖｳﾄ',
        individual_first_name_kanji: '東京都',
        individual_last_name_kanji: '東京都',
        individual_phone: '011-6789-0123',
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
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration + (accountNow.metadata.registration2 || ''))
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })

    it('returns object for LU registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'LU'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration + (accountNow.metadata.registration2 || ''))
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })

    it('returns object for NL registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'NL'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration + (accountNow.metadata.registration2 || ''))
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })

    it('returns object for NO registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'NO'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration + (accountNow.metadata.registration2 || ''))
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })

    it('returns object for NZ registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'NZ'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        individual_address_city: 'Auckland',
        individual_address_line1: '123 Sesame St',
        individual_address_postal_code: '6011',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration + (accountNow.metadata.registration2 || ''))
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })

    it('returns object for PT registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'PT'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration + (accountNow.metadata.registration2 || ''))
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })

    it('returns object for SE registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'SE'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration + (accountNow.metadata.registration2 || ''))
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })

    it('returns object for SG registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'SG'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        individual_address_line1: '123 Sesame St',
        individual_address_postal_code: '339696',
        // individual_id_number: '000000000',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration + (accountNow.metadata.registration2 || ''))
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })

    it('returns object for US registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'US'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        business_profile_mcc: '7997',
        business_profile_url: 'https://www.' + user.profile.contactEmail.split('@')[1],
        individual_address_city: 'New York',
        individual_address_line1: '285 Fulton St',
        individual_address_postal_code: '10007',
        // individual_id_number: '000000000',
        individual_address_state: 'NY',
        individual_ssn_last_4: '0000',
        individual_dob_day: '1',
        individual_dob_month: '1',
        individual_dob_year: '1950',
        individual_phone: '456-123-7890',
        individual_email: user.profile.contactEmail,
        individual_first_name: user.profile.firstName,
        individual_last_name: user.profile.lastName
      }
      const accountNow = await req.patch()
      const registrationNow = JSON.parse(accountNow.metadata.registration + (accountNow.metadata.registration2 || ''))
      for (const field in req.body) {
        assert.strictEqual(registrationNow[field], req.body[field])
      }
    })
  })
})
