/* eslint-env mocha */
const assert = require('assert')
const connect = require('../../../../../index.js')
const TestHelper = require('../../../../../test-helper.js')
// const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')

describe('/api/user/connect/update-individual-registration', () => {
  describe('exceptions', () => {
    describe('invalid-stripeid', () => {
      it('missing querystring stripeid', async () => {
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/connect/update-individual-registration')
        req.account = user.account
        req.session = user.session
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
          country: 'US',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-stripe-account')
      })

      // TODO: fix this test
      // the stripe test api cannot create fully-submitted individual
      // accounts when they fix that this test can be restored
      // it('ineligible stripe account is submitted', async () => {
      //   const user = await TestStripeAccounts.createSubmittedIndividual('NZ')
      //   const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      //   req.account = user.account
      //   req.session = user.session
      //   let errorMessage
      //   try {
      //     await req.patch(req)
      //   } catch (error) {
      //     errorMessage = error.message
      //   }
      //   assert.strictEqual(errorMessage, 'invalid-stripe-account')
      // })
    })

    describe('invalid-account', () => {
      it('ineligible accessing account', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'US',
          type: 'individual'
        })
        const user2 = await TestHelper.createUser()
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user2.account
        req.session = user2.session
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-account')
      })
    })
  })

  describe('receives', () => {
    it('optionally-required posted business_profile_mcc', async () => {
      // const user = await TestHelper.createUser()
      // await TestHelper.createStripeAccount(user, {
      //   country: 'NZ',
      //   type: 'individual'
      // })
      // const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      // req.account = user.account
      // req.session = user.session
      // const body = {
      //   business_profile_mcc: '8931',
      //   business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
      //   address_city: 'Auckland',
      //   address_line1: '844 Fleet Street',
      //   address_postal_code: '6011',
      //   address_state: 'N',
      //   dob_day: '1',
      //   dob_month: '1',
      //   dob_year: '1950',
      //   email: user.profile.contactEmail,
      //   first_name: user.profile.firstName,
      //   last_name: user.profile.lastName,
      //   phone: '456-789-0123'
      // }
      // req.uploads = {
      //   verification_document_back: TestHelper['success_id_scan_back.png'],
      //   verification_document_front: TestHelper['success_id_scan_front.png']
      // }
      // req.body = TestHelper.createMultiPart(req, body)
      // const accountNow = await req.patch()
      // assert.strictEqual(accountNow.business_profile.mcc, '8931')
    })

    it('optionally-optionally-required posted business_profile_url', async () => {
      // const user = await TestHelper.createUser()
      // await TestHelper.createStripeAccount(user, {
      //   country: 'NZ',
      //   type: 'individual'
      // })
      // const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      // req.account = user.account
      // req.session = user.session
      // const body = {
      //   business_profile_mcc: '8931',
      //   business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
      //   address_city: 'Auckland',
      //   address_line1: '844 Fleet Street',
      //   address_postal_code: '6011',
      //   address_state: 'N',
      //   dob_day: '1',
      //   dob_month: '1',
      //   dob_year: '1950',
      //   email: user.profile.contactEmail,
      //   first_name: user.profile.firstName,
      //   last_name: user.profile.lastName,
      //   phone: '456-789-0123'
      // }
      // req.uploads = {
      //   verification_document_back: TestHelper['success_id_scan_back.png'],
      //   verification_document_front: TestHelper['success_id_scan_front.png']
      // }
      // req.body = TestHelper.createMultiPart(req, body)
      // const accountNow = await req.patch()
      // assert.strictEqual(accountNow.business_profile.url, 'https://' + user.profile.contactEmail.split('@')[1])
    })

    it('optionally-optionally-required posted business_profile_product_description', async () => {
      // const user = await TestHelper.createUser()
      // await TestHelper.createStripeAccount(user, {
      //   country: 'NZ',
      //   type: 'individual'
      // })
      // const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      // req.account = user.account
      // req.session = user.session
      // const body = {
      //   business_profile_mcc: '8931',
      //   business_profile_product_description: 'Things',
      //   address_city: 'Auckland',
      //   address_line1: '844 Fleet Street',
      //   address_postal_code: '6011',
      //   address_state: 'N',
      //   dob_day: '1',
      //   dob_month: '1',
      //   dob_year: '1950',
      //   email: user.profile.contactEmail,
      //   first_name: user.profile.firstName,
      //   last_name: user.profile.lastName,
      //   phone: '456-789-0123'
      // }
      // req.uploads = {
      //   verification_document_back: TestHelper['success_id_scan_back.png'],
      //   verification_document_front: TestHelper['success_id_scan_front.png']
      // }
      // req.body = TestHelper.createMultiPart(req, body)
      // const accountNow = await req.patch()
      // assert.strictEqual(accountNow.business_profile.product_description, 'Things')
    })

    it('optionally-required posted dob_day', async () => {
      // const user = await TestHelper.createUser()
      // await TestHelper.createStripeAccount(user, {
      //   country: 'NZ',
      //   type: 'individual'
      // })
      // const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      // req.account = user.account
      // req.session = user.session
      // const body = {
      //   business_profile_mcc: '8931',
      //   business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
      //   address_city: 'Auckland',
      //   address_line1: '844 Fleet Street',
      //   address_postal_code: '6011',
      //   address_state: 'N',
      //   dob_day: '1',
      //   dob_month: '1',
      //   dob_year: '1950',
      //   email: user.profile.contactEmail,
      //   first_name: user.profile.firstName,
      //   last_name: user.profile.lastName,
      //   phone: '456-789-0123'
      // }
      // req.uploads = {
      //   verification_document_back: TestHelper['success_id_scan_back.png'],
      //   verification_document_front: TestHelper['success_id_scan_front.png']
      // }
      // req.body = TestHelper.createMultiPart(req, body)
      // const accountNow = await req.patch()
      // assert.strictEqual(accountNow.individual.dob.day, 1)
    })

    it('optionally-required posted dob_month', async () => {
      // const user = await TestHelper.createUser()
      // await TestHelper.createStripeAccount(user, {
      //   country: 'NZ',
      //   type: 'individual'
      // })
      // const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      // req.account = user.account
      // req.session = user.session
      // const body = {
      //   business_profile_mcc: '8931',
      //   business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
      //   address_city: 'Auckland',
      //   address_line1: '844 Fleet Street',
      //   address_postal_code: '6011',
      //   address_state: 'N',
      //   dob_day: '1',
      //   dob_month: '2',
      //   dob_year: '1950',
      //   email: user.profile.contactEmail,
      //   first_name: user.profile.firstName,
      //   last_name: user.profile.lastName,
      //   phone: '456-789-0123'
      // }
      // req.uploads = {
      //   verification_document_back: TestHelper['success_id_scan_back.png'],
      //   verification_document_front: TestHelper['success_id_scan_front.png']
      // }
      // req.body = TestHelper.createMultiPart(req, body)
      // const accountNow = await req.patch()
      // assert.strictEqual(accountNow.individual.dob.month, 2)
    })

    it('optionally-required posted dob_year', async () => {
      // const user = await TestHelper.createUser()
      // await TestHelper.createStripeAccount(user, {
      //   country: 'NZ',
      //   type: 'individual'
      // })
      // const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      // req.account = user.account
      // req.session = user.session
      // const body = {
      //   business_profile_mcc: '8931',
      //   business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
      //   address_city: 'Auckland',
      //   address_line1: '844 Fleet Street',
      //   address_postal_code: '6011',
      //   address_state: 'N',
      //   dob_day: '1',
      //   dob_month: '1',
      //   dob_year: '1950',
      //   email: user.profile.contactEmail,
      //   first_name: user.profile.firstName,
      //   last_name: user.profile.lastName,
      //   phone: '456-789-0123'
      // }
      // req.uploads = {
      //   verification_document_back: TestHelper['success_id_scan_back.png'],
      //   verification_document_front: TestHelper['success_id_scan_front.png']
      // }
      // req.body = TestHelper.createMultiPart(req, body)
      // const accountNow = await req.patch()
      // assert.strictEqual(accountNow.individual.dob.year, 1950)
    })

    it('optionally-required posted first_name', async () => {
      // const user = await TestHelper.createUser()
      // await TestHelper.createStripeAccount(user, {
      //   country: 'NZ',
      //   type: 'individual'
      // })
      // const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      // req.account = user.account
      // req.session = user.session
      // const body = {
      //   business_profile_mcc: '8931',
      //   business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
      //   address_city: 'Auckland',
      //   address_line1: '844 Fleet Street',
      //   address_postal_code: '6011',
      //   address_state: 'N',
      //   dob_day: '1',
      //   dob_month: '1',
      //   dob_year: '1950',
      //   email: user.profile.contactEmail,
      //   first_name: user.profile.firstName,
      //   last_name: user.profile.lastName,
      //   phone: '456-789-0123'
      // }
      // req.uploads = {
      //   verification_document_back: TestHelper['success_id_scan_back.png'],
      //   verification_document_front: TestHelper['success_id_scan_front.png']
      // }
      // req.body = TestHelper.createMultiPart(req, body)
      // const accountNow = await req.patch()
      // assert.strictEqual(accountNow.individual.first_name, user.profile.firstName)
    })

    it('optionally-required posted last_name', async () => {
      // const user = await TestHelper.createUser()
      // await TestHelper.createStripeAccount(user, {
      //   country: 'NZ',
      //   type: 'individual'
      // })
      // const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      // req.account = user.account
      // req.session = user.session
      // const body = {
      //   business_profile_mcc: '8931',
      //   business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
      //   address_city: 'Auckland',
      //   address_line1: '844 Fleet Street',
      //   address_postal_code: '6011',
      //   address_state: 'N',
      //   dob_day: '1',
      //   dob_month: '1',
      //   dob_year: '1950',
      //   email: user.profile.contactEmail,
      //   first_name: user.profile.firstName,
      //   last_name: user.profile.lastName,
      //   phone: '456-789-0123'
      // }
      // req.uploads = {
      //   verification_document_back: TestHelper['success_id_scan_back.png'],
      //   verification_document_front: TestHelper['success_id_scan_front.png']
      // }
      // req.body = TestHelper.createMultiPart(req, body)
      // const accountNow = await req.patch()
      // assert.strictEqual(accountNow.individual.last_name, user.profile.lastName)
    })

    it('optionally-optionally-required posted email', async () => {
      // const user = await TestHelper.createUser()
      // await TestHelper.createStripeAccount(user, {
      //   country: 'NZ',
      //   type: 'individual'
      // })
      // const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      // req.account = user.account
      // req.session = user.session
      // const body = {
      //   business_profile_mcc: '8931',
      //   business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
      //   address_city: 'Auckland',
      //   address_line1: '844 Fleet Street',
      //   address_postal_code: '6011',
      //   address_state: 'N',
      //   dob_day: '1',
      //   dob_month: '1',
      //   dob_year: '1950',
      //   email: user.profile.contactEmail,
      //   first_name: user.profile.firstName,
      //   last_name: user.profile.lastName,
      //   phone: '456-789-0123'
      // }
      // req.uploads = {
      //   verification_document_back: TestHelper['success_id_scan_back.png'],
      //   verification_document_front: TestHelper['success_id_scan_front.png']
      // }
      // req.body = TestHelper.createMultiPart(req, body)
      // const accountNow = await req.patch()
      // assert.strictEqual(accountNow.individual.email, user.profile.contactEmail)
    })

    it('optionally-optionally-required posted phone', async () => {
      // const user = await TestHelper.createUser()
      // await TestHelper.createStripeAccount(user, {
      //   country: 'NZ',
      //   type: 'individual'
      // })
      // const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      // req.account = user.account
      // req.session = user.session
      // const body = {
      //   business_profile_mcc: '8931',
      //   business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
      //   address_city: 'Auckland',
      //   address_line1: '844 Fleet Street',
      //   address_postal_code: '6011',
      //   address_state: 'N',
      //   dob_day: '1',
      //   dob_month: '1',
      //   dob_year: '1950',
      //   email: user.profile.contactEmail,
      //   first_name: user.profile.firstName,
      //   last_name: user.profile.lastName,
      //   phone: '456-789-0123'
      // }
      // req.uploads = {
      //   verification_document_back: TestHelper['success_id_scan_back.png'],
      //   verification_document_front: TestHelper['success_id_scan_front.png']
      // }
      // req.body = TestHelper.createMultiPart(req, body)
      // const accountNow = await req.patch()
      // assert.strictEqual(accountNow.individual.phone, '+14567890123')
    })

    it('optionally-optionally-required posted gender', async () => {
      // const user = await TestHelper.createUser()
      // await TestHelper.createStripeAccount(user, {
      //   country: 'JP',
      //   type: 'individual'
      // })
      // const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      // req.account = user.account
      // req.session = user.session
      // const body = {
      //   business_profile_mcc: '8931',
      //   business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
      //   address_kana_city: 'ｼﾌﾞﾔ',
      //   address_kana_line1: '27-15',
      //   address_kana_postal_code: '1500001',
      //   address_kana_state: 'ﾄｳｷﾖｳﾄ',
      //   address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
      //   address_kanji_city: '渋谷区',
      //   address_kanji_line1: '２７－１５',
      //   address_kanji_postal_code: '1500001',
      //   address_kanji_state: '東京都',
      //   address_kanji_town: '神宮前 ３丁目',
      //   dob_day: '1',
      //   dob_month: '1',
      //   dob_year: '1950',
      //   email: user.profile.contactEmail,
      //   first_name: user.profile.firstName,
      //   first_name_kana: 'ﾄｳｷﾖｳﾄ',
      //   first_name_kanji: '東京都',
      //   gender: 'female',
      //   last_name: user.profile.lastName,
      //   last_name_kana: 'ﾄｳｷﾖｳﾄ',
      //   last_name_kanji: '東京都',
      //   phone: '011-6789-0123'
      // }
      // req.uploads = {
      //   verification_document_back: TestHelper['success_id_scan_back.png'],
      //   verification_document_front: TestHelper['success_id_scan_front.png']
      // }
      // req.body = TestHelper.createMultiPart(req, body)
      // const accountNow = await req.patch()
      // assert.strictEqual(accountNow.individual.gender, 'female')
    })

    it('optionally-optionally-required posted ssn_last_4', async () => {
      // const user = await TestHelper.createUser()
      // await TestHelper.createStripeAccount(user, {
      //   country: 'US',
      //   type: 'individual'
      // })
      // const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      // req.account = user.account
      // req.session = user.session
      // const body = {
      //   business_profile_mcc: '8931',
      //   business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
      //   address_city: 'New York',
      //   address_line1: '285 Fulton St',
      //   address_postal_code: '10007',
      //   address_state: 'NY',
      //   dob_day: '1',
      //   dob_month: '1',
      //   dob_year: '1950',
      //   email: user.profile.contactEmail,
      //   first_name: user.profile.firstName,
      //   last_name: user.profile.lastName,
      //   phone: '456-789-0123',
      //   ssn_last_4: '0000'
      // }
      // req.uploads = {
      //   verification_document_back: TestHelper['success_id_scan_back.png'],
      //   verification_document_front: TestHelper['success_id_scan_front.png']
      // }
      // req.body = TestHelper.createMultiPart(req, body)
      // const accountNow = await req.patch()
      // assert.strictEqual(accountNow.individual.ssn_last_4_provided, true)
    })

    it('optionally-optionally-required posted id_number', async () => {
      // const user = await TestHelper.createUser()
      // await TestHelper.createStripeAccount(user, {
      //   country: 'HK',
      //   type: 'individual'
      // })
      // const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      // req.account = user.account
      // req.session = user.session
      // const body = {
      //   business_profile_mcc: '8931',
      //   business_profile_url: 'https://a-website.com',
      //   address_city: 'Hong Kong',
      //   address_line1: '123 Sesame St',
      //   address_postal_code: '999077',
      //   address_state: 'HK',
      //   dob_day: '1',
      //   dob_month: '1',
      //   dob_year: '1950',
      //   id_number: '000000000',
      //   phone: '456-789-0123',
      //   email: user.profile.contactEmail,
      //   first_name: user.profile.firstName,
      //   last_name: user.profile.lastName
      // }
      // req.uploads = {
      //   verification_document_back: TestHelper['success_id_scan_back.png'],
      //   verification_document_front: TestHelper['success_id_scan_front.png']
      // }
      // req.body = TestHelper.createMultiPart(req, body)
      // const accountNow = await req.patch()
      // assert.strictEqual(accountNow.individual.id_number_provided, true)
    })

    it('optionally-optionally-required posted address_state', async () => {
      // const user = await TestHelper.createUser()
      // await TestHelper.createStripeAccount(user, {
      //   country: 'AU',
      //   type: 'individual'
      // })
      // const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      // req.account = user.account
      // req.session = user.session
      // const body = {
      //   business_profile_mcc: '8931',
      //   business_profile_url: 'https://a-website.com',
      //   address_city: 'Brisbane',
      //   address_line1: '123 Park Lane',
      //   address_postal_code: '4000',
      //   address_state: 'QLD',
      //   name: 'Company',
      //   phone: '456-789-0123',
      //   tax_id: '00000000000',
      //   email: user.profile.contactEmail,
      //   first_name: user.profile.firstName,
      //   last_name: user.profile.lastName,
      //   phone: '456-789-0123'
      // }
      // req.uploads = {
      //   verification_document_back: TestHelper['success_id_scan_back.png'],
      //   verification_document_front: TestHelper['success_id_scan_front.png']
      // }
      // req.body = TestHelper.createMultiPart(req, body)
      // const accountNow = await req.patch()
      // assert.strictEqual(accountNow.individual.address.state, 'QLD')
    })

    it('optionally-optionally-required posted address_postal_code', async () => {
      // const user = await TestHelper.createUser()
      // await TestHelper.createStripeAccount(user, {
      //   country: 'NZ',
      //   type: 'individual'
      // })
      // const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      // req.account = user.account
      // req.session = user.session
      // const body = {
      //   business_profile_mcc: '8931',
      //   business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
      //   address_city: 'Auckland',
      //   address_line1: '844 Fleet Street',
      //   address_postal_code: '6011',
      //   address_state: 'N',
      //   dob_day: '1',
      //   dob_month: '1',
      //   dob_year: '1950',
      //   email: user.profile.contactEmail,
      //   first_name: user.profile.firstName,
      //   last_name: user.profile.lastName,
      //   phone: '456-789-0123'
      // }
      // req.uploads = {
      //   verification_document_back: TestHelper['success_id_scan_back.png'],
      //   verification_document_front: TestHelper['success_id_scan_front.png']
      // }
      // req.body = TestHelper.createMultiPart(req, body)
      // const accountNow = await req.patch()
      // assert.strictEqual(accountNow.individual.address.postal_code, '6011')
    })

    it('optionally-optionally-required posted address_line1', async () => {
      // const user = await TestHelper.createUser()
      // await TestHelper.createStripeAccount(user, {
      //   country: 'NZ',
      //   type: 'individual'
      // })
      // const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      // req.account = user.account
      // req.session = user.session
      // const body = {
      //   business_profile_mcc: '8931',
      //   business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
      //   address_city: 'Auckland',
      //   address_line1: '844 Fleet Street',
      //   address_postal_code: '6011',
      //   address_state: 'N',
      //   dob_day: '1',
      //   dob_month: '1',
      //   dob_year: '1950',
      //   email: user.profile.contactEmail,
      //   first_name: user.profile.firstName,
      //   last_name: user.profile.lastName,
      //   phone: '456-789-0123'
      // }
      // req.uploads = {
      //   verification_document_back: TestHelper['success_id_scan_back.png'],
      //   verification_document_front: TestHelper['success_id_scan_front.png']
      // }
      // req.body = TestHelper.createMultiPart(req, body)
      // const accountNow = await req.patch()
      // assert.strictEqual(accountNow.individual.address.line1, '844 Fleet Street')
    })

    it('optionally-optionally-required posted address_line2', async () => {
      // const user = await TestHelper.createUser()
      // await TestHelper.createStripeAccount(user, {
      //   country: 'NZ',
      //   type: 'individual'
      // })
      // const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      // req.account = user.account
      // req.session = user.session
      // const body = {
      //   business_profile_mcc: '8931',
      //   business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
      //   address_city: 'Auckland',
      //   address_line1: '844 Fleet Street',
      //   address_line2: 'More details',
      //   address_postal_code: '6011',
      //   address_state: 'N',
      //   dob_day: '1',
      //   dob_month: '1',
      //   dob_year: '1950',
      //   email: user.profile.contactEmail,
      //   first_name: user.profile.firstName,
      //   last_name: user.profile.lastName,
      //   phone: '456-789-0123'
      // }
      // req.uploads = {
      //   verification_document_back: TestHelper['success_id_scan_back.png'],
      //   verification_document_front: TestHelper['success_id_scan_front.png']
      // }
      // req.body = TestHelper.createMultiPart(req, body)
      // const accountNow = await req.patch()
      // assert.strictEqual(accountNow.individual.address.line2, 'More details')
    })

    it('optionally-optionally-required posted first_name_kana', async () => {
      // const user = await TestHelper.createUser()
      // await TestHelper.createStripeAccount(user, {
      //   country: 'JP',
      //   type: 'individual'
      // })
      // const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      // req.account = user.account
      // req.session = user.session
      // const body = {
      //   business_profile_mcc: '8931',
      //   business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
      //   address_kana_city: 'ｼﾌﾞﾔ',
      //   address_kana_line1: '27-15',
      //   address_kana_postal_code: '1500001',
      //   address_kana_state: 'ﾄｳｷﾖｳﾄ',
      //   address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
      //   address_kanji_city: '渋谷区',
      //   address_kanji_line1: '２７－１５',
      //   address_kanji_postal_code: '1500001',
      //   address_kanji_state: '東京都',
      //   address_kanji_town: '神宮前 ３丁目',
      //   dob_day: '1',
      //   dob_month: '1',
      //   dob_year: '1950',
      //   email: user.profile.contactEmail,
      //   first_name: user.profile.firstName,
      //   first_name_kana: 'ﾄｳｷﾖｳﾄ',
      //   first_name_kanji: '東京都',
      //   gender: 'female',
      //   last_name: user.profile.lastName,
      //   last_name_kana: 'ﾄｳｷﾖｳﾄ',
      //   last_name_kanji: '東京都',
      //   phone: '011-6789-0123'
      // }
      // req.uploads = {
      //   verification_document_back: TestHelper['success_id_scan_back.png'],
      //   verification_document_front: TestHelper['success_id_scan_front.png']
      // }
      // req.body = TestHelper.createMultiPart(req, body)
      // const accountNow = await req.patch()
      // assert.strictEqual(accountNow.individual.first_name_kana, 'ﾄｳｷﾖｳﾄ')
    })

    it('optionally-optionally-required posted last_name_kana', async () => {
      // const user = await TestHelper.createUser()
      // await TestHelper.createStripeAccount(user, {
      //   country: 'JP',
      //   type: 'individual'
      // })
      // const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      // req.account = user.account
      // req.session = user.session
      // const body = {
      //   business_profile_mcc: '8931',
      //   business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
      //   address_kana_city: 'ｼﾌﾞﾔ',
      //   address_kana_line1: '27-15',
      //   address_kana_postal_code: '1500001',
      //   address_kana_state: 'ﾄｳｷﾖｳﾄ',
      //   address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
      //   address_kanji_city: '渋谷区',
      //   address_kanji_line1: '２７－１５',
      //   address_kanji_postal_code: '1500001',
      //   address_kanji_state: '東京都',
      //   address_kanji_town: '神宮前 ３丁目',
      //   dob_day: '1',
      //   dob_month: '1',
      //   dob_year: '1950',
      //   email: user.profile.contactEmail,
      //   first_name: user.profile.firstName,
      //   first_name_kana: 'ﾄｳｷﾖｳﾄ',
      //   first_name_kanji: '東京都',
      //   gender: 'female',
      //   last_name: user.profile.lastName,
      //   last_name_kana: 'ﾄｳｷﾖｳﾄ',
      //   last_name_kanji: '東京都',
      //   phone: '011-6789-0123'
      // }
      // req.uploads = {
      //   verification_document_back: TestHelper['success_id_scan_back.png'],
      //   verification_document_front: TestHelper['success_id_scan_front.png']
      // }
      // req.body = TestHelper.createMultiPart(req, body)
      // const accountNow = await req.patch()
      // assert.strictEqual(accountNow.individual.last_name_kana, 'ﾄｳｷﾖｳﾄ')
    })

    it('optionally-optionally-required posted address_kana_town', async () => {
      // const user = await TestHelper.createUser()
      // await TestHelper.createStripeAccount(user, {
      //   country: 'JP',
      //   type: 'individual'
      // })
      // const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      // req.account = user.account
      // req.session = user.session
      // const body = {
      //   business_profile_mcc: '8931',
      //   business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
      //   address_kana_city: 'ｼﾌﾞﾔ',
      //   address_kana_line1: '27-15',
      //   address_kana_postal_code: '1500001',
      //   address_kana_state: 'ﾄｳｷﾖｳﾄ',
      //   address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
      //   address_kanji_city: '渋谷区',
      //   address_kanji_line1: '２７－１５',
      //   address_kanji_postal_code: '1500001',
      //   address_kanji_state: '東京都',
      //   address_kanji_town: '神宮前 ３丁目',
      //   dob_day: '1',
      //   dob_month: '1',
      //   dob_year: '1950',
      //   email: user.profile.contactEmail,
      //   first_name: user.profile.firstName,
      //   first_name_kana: 'ﾄｳｷﾖｳﾄ',
      //   first_name_kanji: '東京都',
      //   gender: 'female',
      //   last_name: user.profile.lastName,
      //   last_name_kana: 'ﾄｳｷﾖｳﾄ',
      //   last_name_kanji: '東京都',
      //   phone: '011-6789-0123'
      // }
      // req.uploads = {
      //   verification_document_back: TestHelper['success_id_scan_back.png'],
      //   verification_document_front: TestHelper['success_id_scan_front.png']
      // }
      // req.body = TestHelper.createMultiPart(req, body)
      // const accountNow = await req.patch()
      // assert.strictEqual(accountNow.individual.address_kana.town, 'ｼﾞﾝｸﾞｳﾏｴ 3-')
    })

    it('optionally-optionally-required posted address_kana_state', async () => {
      // const user = await TestHelper.createUser()
      // await TestHelper.createStripeAccount(user, {
      //   country: 'JP',
      //   type: 'individual'
      // })
      // const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      // req.account = user.account
      // req.session = user.session
      // const body = {
      //   business_profile_mcc: '8931',
      //   business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
      //   address_kana_city: 'ｼﾌﾞﾔ',
      //   address_kana_line1: '27-15',
      //   address_kana_postal_code: '1500001',
      //   address_kana_state: 'ﾄｳｷﾖｳﾄ',
      //   address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
      //   address_kanji_city: '渋谷区',
      //   address_kanji_line1: '２７－１５',
      //   address_kanji_postal_code: '1500001',
      //   address_kanji_state: '東京都',
      //   address_kanji_town: '神宮前 ３丁目',
      //   dob_day: '1',
      //   dob_month: '1',
      //   dob_year: '1950',
      //   email: user.profile.contactEmail,
      //   first_name: user.profile.firstName,
      //   first_name_kana: 'ﾄｳｷﾖｳﾄ',
      //   first_name_kanji: '東京都',
      //   gender: 'female',
      //   last_name: user.profile.lastName,
      //   last_name_kana: 'ﾄｳｷﾖｳﾄ',
      //   last_name_kanji: '東京都',
      //   phone: '011-6789-0123'
      // }
      // req.uploads = {
      //   verification_document_back: TestHelper['success_id_scan_back.png'],
      //   verification_document_front: TestHelper['success_id_scan_front.png']
      // }
      // req.body = TestHelper.createMultiPart(req, body)
      // const accountNow = await req.patch()
      // assert.strictEqual(accountNow.individual.address_kana.state, 'ﾄｳｷﾖｳﾄ')
    })

    it('optionally-optionally-required posted address_kana_postal_code', async () => {
      // const user = await TestHelper.createUser()
      // await TestHelper.createStripeAccount(user, {
      //   country: 'JP',
      //   type: 'individual'
      // })
      // const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      // req.account = user.account
      // req.session = user.session
      // const body = {
      //   business_profile_mcc: '8931',
      //   business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
      //   address_kana_city: 'ｼﾌﾞﾔ',
      //   address_kana_line1: '27-15',
      //   address_kana_postal_code: '1500001',
      //   address_kana_state: 'ﾄｳｷﾖｳﾄ',
      //   address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
      //   address_kanji_city: '渋谷区',
      //   address_kanji_line1: '２７－１５',
      //   address_kanji_postal_code: '1500001',
      //   address_kanji_state: '東京都',
      //   address_kanji_town: '神宮前 ３丁目',
      //   dob_day: '1',
      //   dob_month: '1',
      //   dob_year: '1950',
      //   email: user.profile.contactEmail,
      //   first_name: user.profile.firstName,
      //   first_name_kana: 'ﾄｳｷﾖｳﾄ',
      //   first_name_kanji: '東京都',
      //   gender: 'female',
      //   last_name: user.profile.lastName,
      //   last_name_kana: 'ﾄｳｷﾖｳﾄ',
      //   last_name_kanji: '東京都',
      //   phone: '011-6789-0123'
      // }
      // req.uploads = {
      //   verification_document_back: TestHelper['success_id_scan_back.png'],
      //   verification_document_front: TestHelper['success_id_scan_front.png']
      // }
      // req.body = TestHelper.createMultiPart(req, body)
      // const accountNow = await req.patch()
      // assert.strictEqual(accountNow.individual.address_kana.postal_code, '1500001')
    })

    it('optionally-optionally-required posted address_kana_line1', async () => {
      // const user = await TestHelper.createUser()
      // await TestHelper.createStripeAccount(user, {
      //   country: 'JP',
      //   type: 'individual'
      // })
      // const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      // req.account = user.account
      // req.session = user.session
      // const body = {
      //   business_profile_mcc: '8931',
      //   business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
      //   address_kana_city: 'ｼﾌﾞﾔ',
      //   address_kana_line1: '27-15',
      //   address_kana_postal_code: '1500001',
      //   address_kana_state: 'ﾄｳｷﾖｳﾄ',
      //   address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
      //   address_kanji_city: '渋谷区',
      //   address_kanji_line1: '２７－１５',
      //   address_kanji_postal_code: '1500001',
      //   address_kanji_state: '東京都',
      //   address_kanji_town: '神宮前 ３丁目',
      //   dob_day: '1',
      //   dob_month: '1',
      //   dob_year: '1950',
      //   email: user.profile.contactEmail,
      //   first_name: user.profile.firstName,
      //   first_name_kana: 'ﾄｳｷﾖｳﾄ',
      //   first_name_kanji: '東京都',
      //   gender: 'female',
      //   last_name: user.profile.lastName,
      //   last_name_kana: 'ﾄｳｷﾖｳﾄ',
      //   last_name_kanji: '東京都',
      //   phone: '011-6789-0123'
      // }
      // req.uploads = {
      //   verification_document_back: TestHelper['success_id_scan_back.png'],
      //   verification_document_front: TestHelper['success_id_scan_front.png']
      // }
      // req.body = TestHelper.createMultiPart(req, body)
      // const accountNow = await req.patch()
      // assert.strictEqual(accountNow.individual.address_kana.line1, '27-15')
    })

    it('optionally-optionally-required posted first_name_kanji', async () => {
      // const user = await TestHelper.createUser()
      // await TestHelper.createStripeAccount(user, {
      //   country: 'JP',
      //   type: 'individual'
      // })
      // const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      // req.account = user.account
      // req.session = user.session
      // const body = {
      //   business_profile_mcc: '8931',
      //   business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
      //   address_kana_city: 'ｼﾌﾞﾔ',
      //   address_kana_line1: '27-15',
      //   address_kana_postal_code: '1500001',
      //   address_kana_state: 'ﾄｳｷﾖｳﾄ',
      //   address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
      //   address_kanji_city: '渋谷区',
      //   address_kanji_line1: '２７－１５',
      //   address_kanji_postal_code: '1500001',
      //   address_kanji_state: '東京都',
      //   address_kanji_town: '神宮前 ３丁目',
      //   dob_day: '1',
      //   dob_month: '1',
      //   dob_year: '1950',
      //   email: user.profile.contactEmail,
      //   first_name: user.profile.firstName,
      //   first_name_kana: 'ﾄｳｷﾖｳﾄ',
      //   first_name_kanji: '東京都',
      //   gender: 'female',
      //   last_name: user.profile.lastName,
      //   last_name_kana: 'ﾄｳｷﾖｳﾄ',
      //   last_name_kanji: '東京都',
      //   phone: '011-6789-0123'
      // }
      // req.uploads = {
      //   verification_document_back: TestHelper['success_id_scan_back.png'],
      //   verification_document_front: TestHelper['success_id_scan_front.png']
      // }
      // req.body = TestHelper.createMultiPart(req, body)
      // const accountNow = await req.patch()
      // assert.strictEqual(accountNow.individual.first_name_kanji, '東京都')
    })

    it('optionally-optionally-required posted last_name_kanji', async () => {
      // const user = await TestHelper.createUser()
      // await TestHelper.createStripeAccount(user, {
      //   country: 'JP',
      //   type: 'individual'
      // })
      // const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      // req.account = user.account
      // req.session = user.session
      // const body = {
      //   business_profile_mcc: '8931',
      //   business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
      //   address_kana_city: 'ｼﾌﾞﾔ',
      //   address_kana_line1: '27-15',
      //   address_kana_postal_code: '1500001',
      //   address_kana_state: 'ﾄｳｷﾖｳﾄ',
      //   address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
      //   address_kanji_city: '渋谷区',
      //   address_kanji_line1: '２７－１５',
      //   address_kanji_postal_code: '1500001',
      //   address_kanji_state: '東京都',
      //   address_kanji_town: '神宮前 ３丁目',
      //   dob_day: '1',
      //   dob_month: '1',
      //   dob_year: '1950',
      //   email: user.profile.contactEmail,
      //   first_name: user.profile.firstName,
      //   first_name_kana: 'ﾄｳｷﾖｳﾄ',
      //   first_name_kanji: '東京都',
      //   gender: 'female',
      //   last_name: user.profile.lastName,
      //   last_name_kana: 'ﾄｳｷﾖｳﾄ',
      //   last_name_kanji: '東京都',
      //   phone: '011-6789-0123'
      // }
      // req.uploads = {
      //   verification_document_back: TestHelper['success_id_scan_back.png'],
      //   verification_document_front: TestHelper['success_id_scan_front.png']
      // }
      // req.body = TestHelper.createMultiPart(req, body)
      // const accountNow = await req.patch()
      // assert.strictEqual(accountNow.individual.last_name_kanji, '東京都')
    })

    it('optionally-optionally-required posted address_kanji_state', async () => {
      // const user = await TestHelper.createUser()
      // await TestHelper.createStripeAccount(user, {
      //   country: 'JP',
      //   type: 'individual'
      // })
      // const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      // req.account = user.account
      // req.session = user.session
      // const body = {
      //   business_profile_mcc: '8931',
      //   business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
      //   address_kana_city: 'ｼﾌﾞﾔ',
      //   address_kana_line1: '27-15',
      //   address_kana_postal_code: '1500001',
      //   address_kana_state: 'ﾄｳｷﾖｳﾄ',
      //   address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
      //   address_kanji_city: '渋谷区',
      //   address_kanji_line1: '２７－１５',
      //   address_kanji_postal_code: '1500001',
      //   address_kanji_state: '東京都',
      //   address_kanji_town: '神宮前 ３丁目',
      //   dob_day: '1',
      //   dob_month: '1',
      //   dob_year: '1950',
      //   email: user.profile.contactEmail,
      //   first_name: user.profile.firstName,
      //   first_name_kana: 'ﾄｳｷﾖｳﾄ',
      //   first_name_kanji: '東京都',
      //   gender: 'female',
      //   last_name: user.profile.lastName,
      //   last_name_kana: 'ﾄｳｷﾖｳﾄ',
      //   last_name_kanji: '東京都',
      //   phone: '011-6789-0123'
      // }
      // req.uploads = {
      //   verification_document_back: TestHelper['success_id_scan_back.png'],
      //   verification_document_front: TestHelper['success_id_scan_front.png']
      // }
      // req.body = TestHelper.createMultiPart(req, body)
      // const accountNow = await req.patch()
      // assert.strictEqual(accountNow.individual.address_kanji.state, '東京都')
    })

    it('optionally-optionally-required posted address_kanji_postal_code', async () => {
      // const user = await TestHelper.createUser()
      // await TestHelper.createStripeAccount(user, {
      //   country: 'JP',
      //   type: 'individual'
      // })
      // const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      // req.account = user.account
      // req.session = user.session
      // const body = {
      //   business_profile_mcc: '8931',
      //   business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
      //   address_kana_city: 'ｼﾌﾞﾔ',
      //   address_kana_line1: '27-15',
      //   address_kana_postal_code: '1500001',
      //   address_kana_state: 'ﾄｳｷﾖｳﾄ',
      //   address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
      //   address_kanji_city: '渋谷区',
      //   address_kanji_line1: '２７－１５',
      //   address_kanji_postal_code: '1500001',
      //   address_kanji_state: '東京都',
      //   address_kanji_town: '神宮前 ３丁目',
      //   dob_day: '1',
      //   dob_month: '1',
      //   dob_year: '1950',
      //   email: user.profile.contactEmail,
      //   first_name: user.profile.firstName,
      //   first_name_kana: 'ﾄｳｷﾖｳﾄ',
      //   first_name_kanji: '東京都',
      //   gender: 'female',
      //   last_name: user.profile.lastName,
      //   last_name_kana: 'ﾄｳｷﾖｳﾄ',
      //   last_name_kanji: '東京都',
      //   phone: '011-6789-0123'
      // }
      // req.uploads = {
      //   verification_document_back: TestHelper['success_id_scan_back.png'],
      //   verification_document_front: TestHelper['success_id_scan_front.png']
      // }
      // req.body = TestHelper.createMultiPart(req, body)
      // const accountNow = await req.patch()
      // assert.strictEqual(accountNow.individual.address_kanji.postal_code, '1500001')
    })

    it('optionally-optionally-required posted address_kanji_line1', async () => {
      // const user = await TestHelper.createUser()
      // await TestHelper.createStripeAccount(user, {
      //   country: 'JP',
      //   type: 'individual'
      // })
      // const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      // req.account = user.account
      // req.session = user.session
      // const body = {
      //   business_profile_mcc: '8931',
      //   business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
      //   address_kana_city: 'ｼﾌﾞﾔ',
      //   address_kana_line1: '27-15',
      //   address_kana_postal_code: '1500001',
      //   address_kana_state: 'ﾄｳｷﾖｳﾄ',
      //   address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
      //   address_kanji_city: '渋谷区',
      //   address_kanji_line1: '２７－１５',
      //   address_kanji_postal_code: '1500001',
      //   address_kanji_state: '東京都',
      //   address_kanji_town: '神宮前 ３丁目',
      //   dob_day: '1',
      //   dob_month: '1',
      //   dob_year: '1950',
      //   email: user.profile.contactEmail,
      //   first_name: user.profile.firstName,
      //   first_name_kana: 'ﾄｳｷﾖｳﾄ',
      //   first_name_kanji: '東京都',
      //   gender: 'female',
      //   last_name: user.profile.lastName,
      //   last_name_kana: 'ﾄｳｷﾖｳﾄ',
      //   last_name_kanji: '東京都',
      //   phone: '011-6789-0123'
      // }
      // req.uploads = {
      //   verification_document_back: TestHelper['success_id_scan_back.png'],
      //   verification_document_front: TestHelper['success_id_scan_front.png']
      // }
      // req.body = TestHelper.createMultiPart(req, body)
      // const accountNow = await req.patch()
      // assert.strictEqual(accountNow.individual.address_kanji.line1, '２７－１５')
    })

    it('optionally-optionally-required posted address_kanji_town', async () => {
      // const user = await TestHelper.createUser()
      // await TestHelper.createStripeAccount(user, {
      //   country: 'JP',
      //   type: 'individual'
      // })
      // const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      // req.account = user.account
      // req.session = user.session
      // const body = {
      //   business_profile_mcc: '8931',
      //   business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
      //   address_kana_city: 'ｼﾌﾞﾔ',
      //   address_kana_line1: '27-15',
      //   address_kana_postal_code: '1500001',
      //   address_kana_state: 'ﾄｳｷﾖｳﾄ',
      //   address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
      //   address_kanji_city: '渋谷区',
      //   address_kanji_line1: '２７－１５',
      //   address_kanji_postal_code: '1500001',
      //   address_kanji_state: '東京都',
      //   address_kanji_town: '神宮前 ３丁目',
      //   dob_day: '1',
      //   dob_month: '1',
      //   dob_year: '1950',
      //   email: user.profile.contactEmail,
      //   first_name: user.profile.firstName,
      //   first_name_kana: 'ﾄｳｷﾖｳﾄ',
      //   first_name_kanji: '東京都',
      //   gender: 'female',
      //   last_name: user.profile.lastName,
      //   last_name_kana: 'ﾄｳｷﾖｳﾄ',
      //   last_name_kanji: '東京都',
      //   phone: '011-6789-0123'
      // }
      // req.uploads = {
      //   verification_document_back: TestHelper['success_id_scan_back.png'],
      //   verification_document_front: TestHelper['success_id_scan_front.png']
      // }
      // req.body = TestHelper.createMultiPart(req, body)
      // const accountNow = await req.patch()
      // assert.strictEqual(accountNow.individual.address_kanji.town, '神宮前 ３丁目')
    })

    it('optionally-optionally-required posted file verification_document_front', async () => {
      // const user = await TestHelper.createUser()
      // await TestHelper.createStripeAccount(user, {
      //   country: 'NZ',
      //   type: 'individual'
      // })
      // const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      // req.account = user.account
      // req.session = user.session
      // const body = {
      //   business_profile_mcc: '8931',
      //   business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
      //   address_city: 'Auckland',
      //   address_line1: '844 Fleet Street',
      //   address_postal_code: '6011',
      //   address_state: 'N',
      //   dob_day: '1',
      //   dob_month: '1',
      //   dob_year: '1950',
      //   email: user.profile.contactEmail,
      //   first_name: user.profile.firstName,
      //   last_name: user.profile.lastName,
      //   phone: '456-789-0123'
      // }
      // req.uploads = {
      //   verification_document_back: TestHelper['success_id_scan_back.png'],
      //   verification_document_front: TestHelper['success_id_scan_front.png']
      // }
      // req.body = TestHelper.createMultiPart(req, body)
      // const accountNow = await req.patch()
      // assert.notStrictEqual(accountNow.individual.verification.document.front, null)
      // assert.notStrictEqual(accountNow.individual.verification.document.front, undefined)
    })

    it('optionally-optionally-required posted file verification_document_back', async () => {
      // const user = await TestHelper.createUser()
      // await TestHelper.createStripeAccount(user, {
      //   country: 'NZ',
      //   type: 'individual'
      // })
      // const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      // req.account = user.account
      // req.session = user.session
      // const body = {
      //   business_profile_mcc: '8931',
      //   business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
      //   address_city: 'Auckland',
      //   address_line1: '844 Fleet Street',
      //   address_postal_code: '6011',
      //   address_state: 'N',
      //   dob_day: '1',
      //   dob_month: '1',
      //   dob_year: '1950',
      //   email: user.profile.contactEmail,
      //   first_name: user.profile.firstName,
      //   last_name: user.profile.lastName,
      //   phone: '456-789-0123'
      // }
      // req.uploads = {
      //   verification_document_back: TestHelper['success_id_scan_back.png'],
      //   verification_document_front: TestHelper['success_id_scan_front.png']
      // }
      // req.body = TestHelper.createMultiPart(req, body)
      // const accountNow = await req.patch()
      // assert.notStrictEqual(accountNow.individual.verification.document.back, null)
      // assert.notStrictEqual(accountNow.individual.verification.document.back, undefined)
    })

    it('optionally-optionally-required posted file verification_additional_document_front', async () => {
      // const user = await TestHelper.createUser()
      // await TestHelper.createStripeAccount(user, {
      //   country: 'NZ',
      //   type: 'individual'
      // })
      // const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      // req.account = user.account
      // req.session = user.session
      // const body = {
      //   business_profile_mcc: '8931',
      //   business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
      //   address_city: 'Auckland',
      //   address_line1: '844 Fleet Street',
      //   address_postal_code: '6011',
      //   address_state: 'N',
      //   dob_day: '1',
      //   dob_month: '1',
      //   dob_year: '1950',
      //   email: user.profile.contactEmail,
      //   first_name: user.profile.firstName,
      //   last_name: user.profile.lastName,
      //   phone: '456-789-0123'
      // }
      // req.uploads = {
      //   verification_document_back: TestHelper['success_id_scan_back.png'],
      //   verification_document_front: TestHelper['success_id_scan_front.png']
      // }
      // req.body = TestHelper.createMultiPart(req, body)
      // const accountNow = await req.patch()
      // assert.notStrictEqual(accountNow.individual.verification.additional_document.front, null)
      // assert.notStrictEqual(accountNow.individual.verification.additional_document.front, undefined)
    })

    it('optionally-optionally-required posted file verification_additional_document_back', async () => {
      // const user = await TestHelper.createUser()
      // await TestHelper.createStripeAccount(user, {
      //   country: 'NZ',
      //   type: 'individual'
      // })
      // const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
      // req.account = user.account
      // req.session = user.session
      // const body = {
      //   business_profile_mcc: '8931',
      //   business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
      //   address_city: 'Auckland',
      //   address_line1: '844 Fleet Street',
      //   address_postal_code: '6011',
      //   address_state: 'N',
      //   dob_day: '1',
      //   dob_month: '1',
      //   dob_year: '1950',
      //   email: user.profile.contactEmail,
      //   first_name: user.profile.firstName,
      //   last_name: user.profile.lastName,
      //   phone: '456-789-0123'
      // }
      // req.uploads = {
      //   verification_document_back: TestHelper['success_id_scan_back.png'],
      //   verification_document_front: TestHelper['success_id_scan_front.png']
      // }
      // req.body = TestHelper.createMultiPart(req, body)
      // const accountNow = await req.patch()
      // assert.notStrictEqual(accountNow.individual.verification.additional_document.back, null)
      // assert.notStrictEqual(accountNow.individual.verification.additional_document.back, undefined)
    })
  })

  describe('returns', () => {
    for (const country of connect.countrySpecs) {
      it('object (' + country.id + ')', async () => {
        // const user = await TestHelper.createUser()
        // await TestHelper.createStripeAccount(user, {
        //   country: country.id,
        //   type: 'individual'
        // })
        // const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        // req.account = user.account
        // req.session = user.session
        // req.body = TestStripeAccounts.individualData[country.id]
        // if (country.id !== 'JP') {
        //   req.body.email = user.profile.contactEmail
        //   req.body.first_name = user.profile.firstName
        //   req.body.last_name = user.profile.lastName
        // }
        // req.uploads = {
        //   verification_document_front: TestHelper['success_id_scan_back.png'],
        //   verification_document_back: TestHelper['success_id_scan_back.png']
        // }
        // req.body = TestHelper.createMultiPart(req, req.body)
        // req.filename = __filename
        // req.saveResponse = true
        // const accountNow = await req.patch()
        // assert.notStrictEqual(accountNow.individual.verification.document.front, null)
        // assert.notStrictEqual(accountNow.individual.verification.document.front, undefined)
        // assert.notStrictEqual(accountNow.individual.verification.document.back, null)
        // assert.notStrictEqual(accountNow.individual.verification.document.back, undefined)
      })
    }
  })

  describe('configuration', () => {
    it('environment STRIPE_JS', async () => {
      // global.stripeJS = 3
      // const user = await TestHelper.createUser()
      // await TestHelper.createStripeAccount(user, {
      //   country: 'US',
      //   type: 'individual'
      // })
      // const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
      // req.waitOnSubmit = true
      // req.account = user.account
      // req.session = user.session
      // req.body = TestStripeAccounts.individualData.US
      // req.uploads = {
      //   verification_document_back: TestHelper['success_id_scan_back.png'],
      //   verification_document_front: TestHelper['success_id_scan_front.png']
      // }
      // req.body = TestHelper.createMultiPart(req, req.body)
      // await req.post()
      // const accountNow = await global.api.user.connect.StripeAccount.get(req)
      // assert.notStrictEqual(accountNow.metadata.token, 'false')
    })
  })
})
