/* eslint-env mocha */

// TODO: this script now only supports information specified
// in the requirements.currently_due and eventually_due
// collections.  Testing most fields is disabled until
// they submit data that fails validation first.

// TODO: fix this when Stripe fixes company.verification.document
// the 'company.verification.document' erroneously shows up in the
// 'requirements.pending_validation' signifying it is under review, then
// it is removed from that, but really it needs to show up in currently_due
// and then submit the documents and then it should be pending_validation
const assert = require('assert')
const connect = require('../../../../../index.js')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')

describe('/api/user/connect/update-company-registration', () => {
  describe('exceptions', () => {
    describe('invalid-stripeid', () => {
      it('missing querystring stripeid', async () => {
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/connect/update-company-registration')
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
        const req = TestHelper.createRequest('/api/user/connect/update-company-registration?stripeid=invalid')
        req.account = user.account
        req.session = user.session
        req.body = {
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          address_city: 'New York',
          address_line1: '285 Fulton St',
          address_postal_code: '10007',
          address_state: 'NY',
          name: 'Company',
          phone: '456-789-0123',
          tax_id: '00000000000'
        }
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
      it('ineligible stripe account for individuals', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'US',
          type: 'individual'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          address_city: 'New York',
          address_line1: '285 Fulton St',
          address_postal_code: '10007',
          address_state: 'NY',
          name: 'Company',
          phone: '456-789-0123',
          tax_id: '00000000000'
        }
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-stripe-account')
      })

      it('ineligible stripe account is submitted', async () => {
        const user = await TestStripeAccounts.createSubmittedCompany('NZ')
        const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          address_city: 'New York',
          address_line1: '285 Fulton St',
          address_postal_code: '10007',
          address_state: 'NY',
          name: 'Company',
          phone: '456-789-0123',
          tax_id: '00000000000'
        }
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
          country: 'US',
          type: 'company'
        })
        const user2 = await TestHelper.createUser()
        const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user2.account
        req.session = user2.session
        req.body = {
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          address_city: 'New York',
          address_line1: '285 Fulton St',
          address_postal_code: '10007',
          address_state: 'NY',
          name: 'Company',
          phone: '456-789-0123',
          tax_id: '00000000000'
        }
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
    it('optionally-required posted token', async () => {
      // global.stripeJS = 3
      // const user = await TestHelper.createUser()
      // await TestHelper.createStripeAccount(user, {
      //   country: 'US',
      //   type: 'company'
      // })
      // const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      // req.account = user.account
      // req.session = user.session
      // req.body = {
      //   business_profile_mcc: '8931',
      //   business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
      //   address_city: 'New York',
      //   address_line1: '285 Fulton St',
      //   address_postal_code: '10007',
      //   address_state: 'NY',
      //   name: 'Company',
      //   phone: '456-789-0123',
      //   tax_id: '00000000000'
      // }
      // let errorMessage
      // try {
      //   await req.patch()
      // } catch (error) {
      //   errorMessage = error.message
      // }
      // assert.strictEqual(errorMessage, 'invalid-token')
    })

    it('optionally-required posted file verification_document_front', async () => {
    })

    it('optionally-required posted file verification_document_back', async () => {
    })

    it('required posted business_profile_mcc', async () => {
      // const user = await TestHelper.createUser()
      // await TestHelper.createStripeAccount(user, {
      //   country: 'US',
      //   type: 'company'
      // })
      // const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      // req.account = user.account
      // req.session = user.session
      // req.body = {
      //   business_profile_mcc: '8931',
      //   business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
      //   address_city: 'New York',
      //   address_line1: '285 Fulton St',
      //   address_postal_code: '10007',
      //   address_state: 'NY',
      //   name: 'Company',
      //   phone: '456-789-0123',
      //   tax_id: '00000000000'
      // }
      // const companyNow = await req.patch()
      // assert.strictEqual(companyNow.business_profile.mcc, '8931')
    })

    it('optionally-required posted business_profile_url', async () => {
      // const user = await TestHelper.createUser()
      // await TestHelper.createStripeAccount(user, {
      //   country: 'US',
      //   type: 'company'
      // })
      // const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      // req.account = user.account
      // req.session = user.session
      // req.body = {
      //   business_profile_mcc: '8931',
      //   business_profile_url: 'https://updated.com',
      //   address_city: 'New York',
      //   address_line1: '285 Fulton St',
      //   address_postal_code: '10007',
      //   address_state: 'NY',
      //   name: 'Company',
      //   phone: '456-789-0123',
      //   tax_id: '00000000000'
      // }
      // const companyNow = await req.patch()
      // assert.strictEqual(companyNow.business_profile.url, 'https://updated.com')
    })

    it('optionally-required posted business_profile_product_description', async () => {
      // const user = await TestHelper.createUser()
      // await TestHelper.createStripeAccount(user, {
      //   country: 'US',
      //   type: 'company'
      // })
      // const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      // req.account = user.account
      // req.session = user.session
      // req.body = {
      //   business_profile_mcc: '8931',
      //   business_profile_product_description: 'thing',
      //   address_city: 'New York',
      //   address_line1: '285 Fulton St',
      //   address_postal_code: '10007',
      //   address_state: 'NY',
      //   name: 'Company',
      //   phone: '456-789-0123',
      //   tax_id: '00000000000'
      // }
      // const companyNow = await req.patch()
      // assert.strictEqual(companyNow.business_profile.product_description, 'thing')
    })

    it('optionally-required posted phone', async () => {
      // const user = await TestHelper.createUser()
      // await TestHelper.createStripeAccount(user, {
      //   country: 'US',
      //   type: 'company'
      // })
      // const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      // req.account = user.account
      // req.session = user.session
      // req.body = {
      //   business_profile_mcc: '8931',
      //   business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
      //   address_city: 'New York',
      //   address_line1: '285 Fulton St',
      //   address_postal_code: '10007',
      //   address_state: 'NY',
      //   name: 'Company',
      //   phone: '456-789-0123',
      //   tax_id: '00000000000'
      // }
      // const companyNow = await req.patch()
      // assert.strictEqual(companyNow.company.phone, '+14567890123')
    })

    it('optionally-required posted name', async () => {
      // const user = await TestHelper.createUser()
      // await TestHelper.createStripeAccount(user, {
      //   country: 'US',
      //   type: 'company'
      // })

      // const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      // req.account = user.account
      // req.session = user.session
      // req.body = {
      //   business_profile_mcc: '8931',
      //   business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
      //   address_city: 'New York',
      //   address_line1: '285 Fulton St',
      //   address_postal_code: '10007',
      //   address_state: 'NY',
      //   name: 'Updated name',
      //   phone: '456-789-0123',
      //   tax_id: '00000000000'
      // }
      // const companyNow = await req.patch()
      // assert.strictEqual(companyNow.company.name, 'Updated name')
    })

    it('optionally-required posted address_postal_code', async () => {
      // const user = await TestHelper.createUser()
      // await TestHelper.createStripeAccount(user, {
      //   country: 'US',
      //   type: 'company'
      // })
      // const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      // req.account = user.account
      // req.session = user.session
      // req.body = {
      //   business_profile_mcc: '8931',
      //   business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
      //   address_city: 'New York',
      //   address_line1: '285 Fulton St',
      //   address_postal_code: '10008',
      //   address_state: 'NY',
      //   name: 'Company',
      //   phone: '456-789-0123',
      //   tax_id: '00000000000'
      // }
      // const companyNow = await req.patch()
      // assert.strictEqual(companyNow.company.address.postal_code, '10008')
    })

    it('optionally-required posted address_city', async () => {
      // const user = await TestHelper.createUser()
      // await TestHelper.createStripeAccount(user, {
      //   country: 'US',
      //   type: 'company'
      // })
      // const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      // req.account = user.account
      // req.session = user.session
      // req.body = {
      //   business_profile_mcc: '8931',
      //   business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
      //   address_city: 'Providence',
      //   address_line1: '285 Fulton St',
      //   address_postal_code: '10008',
      //   address_state: 'NY',
      //   name: 'Company',
      //   phone: '456-789-0123',
      //   tax_id: '00000000000'
      // }
      // const companyNow = await req.patch()
      // assert.strictEqual(companyNow.address.city, 'Providence')
    })

    it('optionally-required posted address_state', async () => {
      // const user = await TestHelper.createUser()
      // await TestHelper.createStripeAccount(user, {
      //   country: 'US',
      //   type: 'company'
      // })
      // const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      // req.account = user.account
      // req.session = user.session
      // req.body = {
      //   business_profile_mcc: '7623',
      //   business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
      //   address_city: 'New York',
      //   address_line1: '285 Fulton St',
      //   address_postal_code: '10008',
      //   address_state: 'NJ',
      //   name: 'Company',
      //   phone: '456-789-0123',
      //   tax_id: '00000000000'
      // }
      // const companyNow = await req.patch()
      // assert.strictEqual(companyNow.company.address.state, 'NJ')
    })

    it('optionally-required posted address_line1', async () => {
      // const user = await TestHelper.createUser()
      // await TestHelper.createStripeAccount(user, {
      //   country: 'US',
      //   type: 'company'
      // })
      // const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      // req.account = user.account
      // req.session = user.session
      // req.body = {
      //   business_profile_mcc: '7623',
      //   business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
      //   address_city: 'New York',
      //   address_line1: '285 Fulton St',
      //   address_postal_code: '10008',
      //   address_state: 'NJ',
      //   name: 'Company',
      //   phone: '456-789-0123',
      //   tax_id: '00000000000'
      // }
      // const companyNow = await req.patch()
      // assert.strictEqual(companyNow.company.address.line1, '285 Fulton St')
    })

    it('optionally-required posted name_kana', async () => {
      // const user = await TestHelper.createUser()
      // await TestHelper.createStripeAccount(user, {
      //   country: 'JP',
      //   type: 'company'
      // })
      // const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      // req.account = user.account
      // req.session = user.session
      // req.body = {
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
      //   name: 'Company',
      //   name_kana: 'ﾄｳｷﾖｳﾄ',
      //   name_kanji: '東京都',
      //   phone: '011-271-6677',
      //   tax_id: '00000000000'
      // }
      // const stripeAccountNow = await req.patch()
      // assert.strictEqual(stripeAccountNow.company.name_kana, 'ﾄｳｷﾖｳﾄ')
    })

    it('optionally-required posted name_kanji', async () => {
      // const user = await TestHelper.createUser()
      // await TestHelper.createStripeAccount(user, {
      //   country: 'JP',
      //   type: 'company'
      // })
      // const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      // req.account = user.account
      // req.session = user.session
      // req.body = {
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
      //   name: 'Company',
      //   name_kana: 'ﾄｳｷﾖｳﾄ',
      //   name_kanji: '東京都',
      //   phone: '011-271-6677',
      //   tax_id: '00000000000'
      // }
      // const stripeAccountNow = await req.patch()
      // assert.strictEqual(stripeAccountNow.company.name_kanji, '東京都')
    })

    it('optionally-required posted address_kana_postal_code', async () => {
      // const user = await TestHelper.createUser()
      // await TestHelper.createStripeAccount(user, {
      //   country: 'JP',
      //   type: 'company'
      // })
      // const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      // req.account = user.account
      // req.session = user.session
      // req.body = {
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
      //   name: 'Company',
      //   name_kana: 'ﾄｳｷﾖｳﾄ',
      //   name_kanji: '東京都',
      //   phone: '011-271-6677',
      //   tax_id: '00000000000'
      // }
      // const stripeAccountNow = await req.patch()
      // assert.strictEqual(stripeAccountNow.company.address.kana_postal_code, '1500001')
    })

    it('optionally-required posted address_kana_city', async () => {
      // const user = await TestHelper.createUser()
      // await TestHelper.createStripeAccount(user, {
      //   country: 'JP',
      //   type: 'company'
      // })
      // const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      // req.account = user.account
      // req.session = user.session
      // req.body = {
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
      //   name: 'Company',
      //   name_kana: 'ﾄｳｷﾖｳﾄ',
      //   name_kanji: '東京都',
      //   phone: '011-271-6677',
      //   tax_id: '00000000000'
      // }
      // const stripeAccountNow = await req.patch()
      // assert.strictEqual(stripeAccountNow.company.address.kana_city, 'ｼﾌﾞﾔ')
    })

    it('optionally-required posted address_kana_state', async () => {
      // const user = await TestHelper.createUser()
      // await TestHelper.createStripeAccount(user, {
      //   country: 'JP',
      //   type: 'company'
      // })
      // const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      // req.account = user.account
      // req.session = user.session
      // req.body = {
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
      //   name: 'Company',
      //   name_kana: 'ﾄｳｷﾖｳﾄ',
      //   name_kanji: '東京都',
      //   phone: '011-271-6677',
      //   tax_id: '00000000000'
      // }
      // const stripeAccountNow = await req.patch()
      // assert.strictEqual(stripeAccountNow.company.address.kana_state, 'ﾄｳｷﾖｳﾄ')
    })

    it('optionally-required posted address_kana_town', async () => {
      // const user = await TestHelper.createUser()
      // await TestHelper.createStripeAccount(user, {
      //   country: 'JP',
      //   type: 'company'
      // })
      // const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      // req.account = user.account
      // req.session = user.session
      // req.body = {
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
      //   name: 'Company',
      //   name_kana: 'ﾄｳｷﾖｳﾄ',
      //   name_kanji: '東京都',
      //   phone: '011-271-6677',
      //   tax_id: '00000000000'
      // }
      // const stripeAccountNow = await req.patch()
      // assert.strictEqual(stripeAccountNow.company.address.kana_town, 'ｼﾞﾝｸﾞｳﾏｴ 3-')
    })

    it('optionally-required posted address_kana_line1', async () => {
      // const user = await TestHelper.createUser()
      // await TestHelper.createStripeAccount(user, {
      //   country: 'JP',
      //   type: 'company'
      // })
      // const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      // req.account = user.account
      // req.session = user.session
      // req.body = {
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
      //   name: 'Company',
      //   name_kana: 'ﾄｳｷﾖｳﾄ',
      //   name_kanji: '東京都',
      //   phone: '011-271-6677',
      //   tax_id: '00000000000'
      // }
      // const stripeAccountNow = await req.patch()
      // assert.strictEqual(stripeAccountNow.company.address.kana_line1, '27-15')
    })

    it('optionally-required posted address_kanji_postal_code', async () => {
      // const user = await TestHelper.createUser()
      // await TestHelper.createStripeAccount(user, {
      //   country: 'JP',
      //   type: 'company'
      // })
      // const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      // req.account = user.account
      // req.session = user.session
      // req.body = {
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
      //   name: 'Company',
      //   name_kana: 'ﾄｳｷﾖｳﾄ',
      //   name_kanji: '東京都',
      //   phone: '011-271-6677',
      //   tax_id: '00000000000'
      // }
      // const stripeAccountNow = await req.patch()
      // assert.strictEqual(stripeAccountNow.company.address.kanji_postal_code, '1500001')
    })

    it('optionally-required posted address_kanji_city', async () => {
      // const user = await TestHelper.createUser()
      // await TestHelper.createStripeAccount(user, {
      //   country: 'JP',
      //   type: 'company'
      // })
      // const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      // req.account = user.account
      // req.session = user.session
      // req.body = {
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
      //   name: 'Company',
      //   name_kana: 'ﾄｳｷﾖｳﾄ',
      //   name_kanji: '東京都',
      //   phone: '011-271-6677',
      //   tax_id: '00000000000'
      // }
      // const stripeAccountNow = await req.patch()
      // assert.strictEqual(stripeAccountNow.company.address.kanji_city, '渋谷区')
    })

    it('optionally-required posted address_kanji_state', async () => {
      // const user = await TestHelper.createUser()
      // await TestHelper.createStripeAccount(user, {
      //   country: 'JP',
      //   type: 'company'
      // })
      // const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      // req.account = user.account
      // req.session = user.session
      // req.body = {
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
      //   name: 'Company',
      //   name_kana: 'ﾄｳｷﾖｳﾄ',
      //   name_kanji: '東京都',
      //   phone: '011-271-6677',
      //   tax_id: '00000000000'
      // }
      // const stripeAccountNow = await req.patch()
      // assert.strictEqual(stripeAccountNow.company.address.kanji_state, '東京都')
    })

    it('optionally-required posted address_kanji_town', async () => {
      // const user = await TestHelper.createUser()
      // await TestHelper.createStripeAccount(user, {
      //   country: 'JP',
      //   type: 'company'
      // })
      // const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      // req.account = user.account
      // req.session = user.session
      // req.body = {
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
      //   name: 'Company',
      //   name_kana: 'ﾄｳｷﾖｳﾄ',
      //   name_kanji: '東京都',
      //   phone: '011-271-6677',
      //   tax_id: '00000000000'
      // }
      // const stripeAccountNow = await req.patch()
      // assert.strictEqual(stripeAccountNow.company.address.kanji_town, '神宮前 ３丁目')
    })

    it('optionally-required posted address_kanji_line1', async () => {
      // const user = await TestHelper.createUser()
      // await TestHelper.createStripeAccount(user, {
      //   country: 'JP',
      //   type: 'company'
      // })
      // const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      // req.account = user.account
      // req.session = user.session
      // req.body = {
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
      //   name: 'Company',
      //   name_kana: 'ﾄｳｷﾖｳﾄ',
      //   name_kanji: '東京都',
      //   phone: '011-271-6677',
      //   tax_id: '00000000000'
      // }
      // const stripeAccountNow = await req.patch()
      // assert.strictEqual(stripeAccountNow.company.address.kanji_line1, '２７－１５')
    })
  })

  describe('returns', () => {
    for (const country of connect.countrySpecs) {
      it('object (' + country.id + ')', async () => {
        // const user = await TestHelper.createUser()
        // await TestHelper.createStripeAccount(user, {
        //   country: country.id,
        //   type: 'company'
        // })
        // const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
        // req.account = user.account
        // req.session = user.session
        // req.body = TestStripeAccounts.companyData[country.id]
        // req.uploads = {
        //   verification_document_front: TestHelper['success_id_scan_back.png'],
        //   verification_document_back: TestHelper['success_id_scan_back.png']
        // }
        // req.body = TestHelper.createMultiPart(req, req.body)
        // req.filename = __filename
        // req.saveResponse = true
        // const accountNow = await req.patch()
        // assert.notStrictEqual(accountNow.company.verification.document.front, null)
        // assert.notStrictEqual(accountNow.company.verification.document.front, undefined)
        // assert.notStrictEqual(accountNow.company.verification.document.back, null)
        // assert.notStrictEqual(accountNow.company.verification.document.back, undefined)
      })
    }
  })

  describe('configuration', () => {
    it('environment STRIPE_JS', async () => {
      // global.stripeJS = 3
      // const user = await TestHelper.createUser()
      // await TestHelper.createStripeAccount(user, {
      //   country: 'US',
      //   type: 'company'
      // })
      // const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      // req.waitOnSubmit = true
      // req.account = user.account
      // req.session = user.session
      // req.body = {
      //   business_profile_mcc: '8931',
      //   business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
      //   address_city: 'New York',
      //   address_line1: '285 Fulton St',
      //   address_postal_code: '10007',
      //   address_state: 'NY',
      //   name: 'Company',
      //   phone: '456-789-0123',
      //   tax_id: '00000000000'
      // }
      // await req.post()
      // const req2 = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      // req2.waitOnSubmit = true
      // req2.account = user.account
      // req2.session = user.session
      // req2.body = {
      //   business_profile_mcc: '8931',
      //   business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
      //   address_city: 'New York',
      //   address_line1: '285 Fulton St',
      //   address_postal_code: '10007',
      //   address_state: 'NY',
      //   name: 'Company',
      //   phone: '456-789-0123',
      //   tax_id: '00000000000'
      // }
      // await req2.post()
      // const accountNow = await global.api.user.connect.StripeAccount.get(req2)
      // assert.notStrictEqual(accountNow.metadata.token, 'false')
    })
  })
})
