/* eslint-env mocha */
const assert = require('assert')
const connect = require('../../../../index.js')
const TestHelper = require('../../../../test-helper.js')

describe('/account/connect/edit-account-opener', () => {
  describe('EditAccountOpener#BEFORE', () => {
    it('should reject invalid registration', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/account/connect/edit-account-opener?stripeid=invalid')
      req.account = user.account
      req.session = user.session
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-stripeid')
    })

    it('should reject company registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-account-opener?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-stripe-account')
    })
  })

  describe('EditAccountOpener#GET', () => {
    for (const country of connect.countrySpecs) {
      it('should present the form (' + country.id + ')', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: country.id,
          type: 'individual'
        })
        const req = TestHelper.createRequest(`/account/connect/edit-account-opener?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const page = await req.get()
        const doc = TestHelper.extractDoc(page)
        assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
        assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
      })
    }
  })

  describe('EditAccountOpener#POST', () => {
    for (const country of connect.countrySpecs) {
      it('should reject invalid fields (' + country.id + ')', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: country.id,
          type: 'individual'
        })
        const req = TestHelper.createRequest(`/account/connect/edit-account-opener?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = postData[country.id]
        if (country.id !== 'JP') {
          req.body.relationship_account_opener_email = user.profile.contactEmail
          req.body.relationship_account_opener_first_name = user.profile.firstName
          req.body.relationship_account_opener_last_name = user.profile.lastName
        }
        let uploads
        if (connect.kycRequirements[country.id].relationship.account_opener.indexOf('relationship.account_opener.verification.document.front') > -1) {
          uploads = {
            relationship_account_opener_verification_document_front: TestHelper['success_id_scan_back.png'],
            relationship_account_opener_verification_document_back: TestHelper['success_id_scan_back.png']
          }
          if (connect.kycRequirements[country.id].relationship.account_opener.indexOf('relationship.account_opener.verification.additional_document.front') > -1) {
            uploads.relationship_account_opener_verification_additional_document_front = TestHelper['success_id_scan_back.png']
            uploads.relationship_account_opener_verification_additional_document_back = TestHelper['success_id_scan_back.png']
          }
        }
        let fields = Object.keys(req.body)
        if (uploads) {
          fields = fields.concat(Object.keys(uploads))
        }
        const body = JSON.stringify(req.body)
        for (const field of fields) {
          if (uploads) {
            req.uploads = {}
            for (const file in uploads) {
              req.uploads[file] = uploads[file]
            }
          }
          req.body = JSON.parse(body)
          if (req.body[field]) {
            delete (req.body[field])
          }
          if (req.uploads && req.uploads[field]) {
            delete (req.uploads[field])
          }
          const page = await req.post()
          const doc = TestHelper.extractDoc(page)
          const messageContainer = doc.getElementById('message-container')
          const message = messageContainer.child[0]
          assert.strictEqual(message.attr.template, `invalid-${field}`)
        }
      })
    }

    for (const country of connect.countrySpecs) {
      it('should update information (' + country.id + ')', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: country.id,
          type: 'individual'
        })
        const req = TestHelper.createRequest(`/account/connect/edit-account-opener?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = postData[country.id]
        if (country.id !== 'JP') {
          req.body.relationship_account_opener_email = user.profile.contactEmail
          req.body.relationship_account_opener_first_name = user.profile.firstName
          req.body.relationship_account_opener_last_name = user.profile.lastName
        }
        if (connect.kycRequirements[country.id].relationship.account_opener.indexOf('relationship.account_opener.verification.document.front') > -1) {
          req.uploads = {
            relationship_account_opener_verification_document_front: TestHelper['success_id_scan_back.png'],
            relationship_account_opener_verification_document_back: TestHelper['success_id_scan_back.png']
          }
          if (connect.kycRequirements[country.id].relationship.account_opener.indexOf('relationship.account_opener.verification.additional_document.front') > -1) {
            req.uploads.relationship_account_opener_verification_additional_document_front = TestHelper['success_id_scan_back.png']
            req.uploads.relationship_account_opener_verification_additional_document_back = TestHelper['success_id_scan_back.png']
          }
        }
        req.filename = __filename
        req.screenshots = [
          { hover: '#account-menu-container' },
          { click: '/account/connect' },
          { click: '/account/connect/stripe-accounts' },
          { click: `/account/connect/stripe-account?stripeid=${user.stripeAccount.id}` },
          { click: `/account/connect/edit-account-opener?stripeid=${user.stripeAccount.id}` },
          { fill: '#submit-form' }
        ]
        const page = await req.post()
        const doc = TestHelper.extractDoc(page)
        const redirectURL = TestHelper.extractRedirectURL(doc)
        assert.strictEqual(redirectURL, `/account/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
      })
    }
  })
})

const postData = {
  AT: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    relationship_account_opener_address_city: 'Vienna',
    relationship_account_opener_address_line1: '123 Sesame St',
    relationship_account_opener_address_postal_code: '1020',
    relationship_account_opener_address_state: '1',
    relationship_account_opener_dob_day: '1',
    relationship_account_opener_dob_month: '1',
    relationship_account_opener_dob_year: '1950',
    relationship_account_opener_phone: '456-789-0123'
  },
  AU: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    relationship_account_opener_address_city: 'Brisbane',
    relationship_account_opener_address_line1: '845 Oxford St',
    relationship_account_opener_address_postal_code: '4000',
    relationship_account_opener_address_state: 'QLD',
    relationship_account_opener_dob_day: '1',
    relationship_account_opener_dob_month: '1',
    relationship_account_opener_dob_year: '1950',
    relationship_account_opener_phone: '456-789-0123'
  },
  BE: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    relationship_account_opener_address_city: 'Brussels',
    relationship_account_opener_address_line1: '123 Sesame St',
    relationship_account_opener_address_postal_code: '1020',
    relationship_account_opener_address_state: 'BRU',
    relationship_account_opener_dob_day: '1',
    relationship_account_opener_dob_month: '1',
    relationship_account_opener_dob_year: '1950',
    relationship_account_opener_phone: '456-789-0123'
  },
  CA: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    relationship_account_opener_address_city: 'Vancouver',
    relationship_account_opener_address_line1: '123 Sesame St',
    relationship_account_opener_address_postal_code: 'V5K 0A1',
    relationship_account_opener_address_state: 'BC',
    relationship_account_opener_dob_day: '1',
    relationship_account_opener_dob_month: '1',
    relationship_account_opener_dob_year: '1950',
    relationship_account_opener_id_number: '000000000',
    relationship_account_opener_phone: '456-789-0123'
  },
  CH: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    relationship_account_opener_address_city: 'Bern',
    relationship_account_opener_address_line1: '123 Sesame St',
    relationship_account_opener_address_postal_code: '1020',
    relationship_account_opener_address_state: 'BE',
    relationship_account_opener_dob_day: '1',
    relationship_account_opener_dob_month: '1',
    relationship_account_opener_dob_year: '1950',
    relationship_account_opener_phone: '456-789-0123'
  },
  DE: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    relationship_account_opener_address_city: 'Berlin',
    relationship_account_opener_address_line1: '123 Sesame St',
    relationship_account_opener_address_postal_code: '01067',
    relationship_account_opener_address_state: 'BE',
    relationship_account_opener_dob_day: '1',
    relationship_account_opener_dob_month: '1',
    relationship_account_opener_dob_year: '1950',
    relationship_account_opener_phone: '456-789-0123'
  },
  DK: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    relationship_account_opener_address_city: 'Copenhagen',
    relationship_account_opener_address_line1: '123 Sesame St',
    relationship_account_opener_address_postal_code: '1000',
    relationship_account_opener_address_state: '147',
    relationship_account_opener_dob_day: '1',
    relationship_account_opener_dob_month: '1',
    relationship_account_opener_dob_year: '1950',
    relationship_account_opener_phone: '456-789-0123'
  },
  EE: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    relationship_account_opener_address_city: 'Tallinn',
    relationship_account_opener_address_line1: '123 Sesame St',
    relationship_account_opener_address_postal_code: '10128',
    relationship_account_opener_address_state: '37',
    relationship_account_opener_dob_day: '1',
    relationship_account_opener_dob_month: '1',
    relationship_account_opener_dob_year: '1950',
    relationship_account_opener_phone: '456-789-0123'
  },
  ES: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    relationship_account_opener_address_city: 'Madrid',
    relationship_account_opener_address_line1: '123 Park Lane',
    relationship_account_opener_address_postal_code: '03179',
    relationship_account_opener_address_state: 'AN',
    relationship_account_opener_name: 'Individual',
    relationship_account_opener_phone: '456-789-0123',
    relationship_account_opener_tax_id: '00000000000'
  },
  FI: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    relationship_account_opener_address_city: 'Helsinki',
    relationship_account_opener_address_line1: '123 Sesame St',
    relationship_account_opener_address_postal_code: '00990',
    relationship_account_opener_address_state: 'AL',
    relationship_account_opener_dob_day: '1',
    relationship_account_opener_dob_month: '1',
    relationship_account_opener_dob_year: '1950',
    relationship_account_opener_phone: '456-789-0123'
  },
  FR: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    relationship_account_opener_address_city: 'Paris',
    relationship_account_opener_address_line1: '123 Sesame St',
    relationship_account_opener_address_postal_code: '75001',
    relationship_account_opener_address_state: 'A',
    relationship_account_opener_dob_day: '1',
    relationship_account_opener_dob_month: '1',
    relationship_account_opener_dob_year: '1950',
    relationship_account_opener_phone: '456-789-0123'
  },
  GB: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    relationship_account_opener_address_city: 'London',
    relationship_account_opener_address_line1: '123 Sesame St',
    relationship_account_opener_address_postal_code: 'EC1A 1AA',
    relationship_account_opener_address_state: 'LND',
    relationship_account_opener_dob_day: '1',
    relationship_account_opener_dob_month: '1',
    relationship_account_opener_dob_year: '1950',
    relationship_account_opener_phone: '456-789-0123'
  },
  GR: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    relationship_account_opener_address_city: 'Athens',
    relationship_account_opener_address_line1: '123 Park Lane',
    relationship_account_opener_address_postal_code: '104',
    relationship_account_opener_address_state: 'I',
    relationship_account_opener_phone: '456-789-0123',
    relationship_account_opener_tax_id: '00000000000'
  },
  HK: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    relationship_account_opener_address_city: 'Hong Kong',
    relationship_account_opener_address_line1: '123 Sesame St',
    relationship_account_opener_address_postal_code: '999077',
    relationship_account_opener_address_state: 'HK',
    relationship_account_opener_dob_day: '1',
    relationship_account_opener_dob_month: '1',
    relationship_account_opener_dob_year: '1950',
    relationship_account_opener_id_number: '000000000',
    relationship_account_opener_phone: '456-789-0123'
  },
  IE: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    relationship_account_opener_address_city: 'Dublin',
    relationship_account_opener_address_line1: '123 Sesame St',
    relationship_account_opener_address_postal_code: 'Dublin 1',
    relationship_account_opener_address_state: 'D',
    relationship_account_opener_dob_day: '1',
    relationship_account_opener_dob_month: '1',
    relationship_account_opener_dob_year: '1950',
    relationship_account_opener_phone: '456-789-0123'
  },
  IT: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    relationship_account_opener_address_city: 'Rome',
    relationship_account_opener_address_line1: '123 Sesame St',
    relationship_account_opener_address_postal_code: '00010',
    relationship_account_opener_address_state: '65',
    relationship_account_opener_dob_day: '1',
    relationship_account_opener_dob_month: '1',
    relationship_account_opener_dob_year: '1950',
    relationship_account_opener_phone: '456-789-0123'
  },
  JP: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    relationship_account_opener_address_kana_city: 'ｼﾌﾞﾔ',
    relationship_account_opener_address_kana_line1: '27-15',
    relationship_account_opener_address_kana_postal_code: '1500001',
    relationship_account_opener_address_kana_state: 'ﾄｳｷﾖｳﾄ',
    relationship_account_opener_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
    relationship_account_opener_address_kanji_city: '渋谷区',
    relationship_account_opener_address_kanji_line1: '２７－１５',
    relationship_account_opener_address_kanji_postal_code: '1500001',
    relationship_account_opener_address_kanji_state: '東京都',
    relationship_account_opener_address_kanji_town: '神宮前 ３丁目',
    relationship_account_opener_dob_day: '1',
    relationship_account_opener_dob_month: '1',
    relationship_account_opener_dob_year: '1950',
    relationship_account_opener_first_name_kana: 'ﾄｳｷﾖｳﾄ',
    relationship_account_opener_first_name_kanji: '東京都',
    relationship_account_opener_gender: 'female',
    relationship_account_opener_last_name_kana: 'ﾄｳｷﾖｳﾄ',
    relationship_account_opener_last_name_kanji: '東京都',
    relationship_account_opener_phone: '+81112345678'
  },
  LT: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    relationship_account_opener_address_city: 'Vilnius',
    relationship_account_opener_address_line1: '123 Sesame St',
    relationship_account_opener_address_postal_code: 'LT-00000',
    relationship_account_opener_address_state: 'AL',
    relationship_account_opener_dob_day: '1',
    relationship_account_opener_dob_month: '1',
    relationship_account_opener_dob_year: '1950',
    relationship_account_opener_phone: '456-789-0123'
  },
  LU: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    relationship_account_opener_address_city: 'Luxemburg',
    relationship_account_opener_address_line1: '123 Sesame St',
    relationship_account_opener_address_postal_code: '1623',
    relationship_account_opener_address_state: 'L',
    relationship_account_opener_dob_day: '1',
    relationship_account_opener_dob_month: '1',
    relationship_account_opener_dob_year: '1950',
    relationship_account_opener_phone: '456-789-0123'
  },
  LV: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    relationship_account_opener_address_city: 'Riga',
    relationship_account_opener_address_line1: '123 Sesame St',
    relationship_account_opener_address_postal_code: 'LV–1073',
    relationship_account_opener_address_state: 'AI',
    relationship_account_opener_dob_day: '1',
    relationship_account_opener_dob_month: '1',
    relationship_account_opener_dob_year: '1950',
    relationship_account_opener_phone: '456-789-0123'
  },
  MY: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    relationship_account_opener_address_city: 'Kuala Lumpur',
    relationship_account_opener_address_line1: '123 Sesame St',
    relationship_account_opener_address_postal_code: '50450',
    relationship_account_opener_address_state: 'C',
    relationship_account_opener_dob_day: '1',
    relationship_account_opener_dob_month: '1',
    relationship_account_opener_dob_year: '1950',
    relationship_account_opener_phone: '456-789-0123'
  },
  NL: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    relationship_account_opener_address_city: 'Amsterdam',
    relationship_account_opener_address_line1: '123 Sesame St',
    relationship_account_opener_address_postal_code: '1071 JA',
    relationship_account_opener_address_state: 'DR',
    relationship_account_opener_dob_day: '1',
    relationship_account_opener_dob_month: '1',
    relationship_account_opener_dob_year: '1950',
    relationship_account_opener_phone: '456-789-0123'
  },
  NO: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    relationship_account_opener_address_city: 'Oslo',
    relationship_account_opener_address_line1: '123 Sesame St',
    relationship_account_opener_address_postal_code: '0001',
    relationship_account_opener_address_state: '02',
    relationship_account_opener_dob_day: '1',
    relationship_account_opener_dob_month: '1',
    relationship_account_opener_dob_year: '1950',
    relationship_account_opener_phone: '456-789-0123'
  },
  NZ: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    relationship_account_opener_address_city: 'Auckland',
    relationship_account_opener_address_line1: '844 Fleet Street',
    relationship_account_opener_address_postal_code: '6011',
    relationship_account_opener_address_state: 'N',
    relationship_account_opener_dob_day: '1',
    relationship_account_opener_dob_month: '1',
    relationship_account_opener_dob_year: '1950',
    relationship_account_opener_phone: '456-789-0123'
  },
  PL: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    relationship_account_opener_address_city: 'Krakow',
    relationship_account_opener_address_line1: '123 Park Lane',
    relationship_account_opener_address_postal_code: '32-400',
    relationship_account_opener_address_state: 'KR',
    relationship_account_opener_dob_day: '1',
    relationship_account_opener_dob_month: '1',
    relationship_account_opener_dob_year: '1950',
    relationship_account_opener_phone: '456-789-0123'
  },
  PT: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    relationship_account_opener_address_city: 'Lisbon',
    relationship_account_opener_address_line1: '123 Sesame St',
    relationship_account_opener_address_postal_code: '4520',
    relationship_account_opener_address_state: '01',
    relationship_account_opener_dob_day: '1',
    relationship_account_opener_dob_month: '1',
    relationship_account_opener_dob_year: '1950',
    relationship_account_opener_phone: '456-789-0123'
  },
  SE: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    relationship_account_opener_address_city: 'Stockholm',
    relationship_account_opener_address_line1: '123 Sesame St',
    relationship_account_opener_address_postal_code: '00150',
    relationship_account_opener_address_state: 'K',
    relationship_account_opener_dob_day: '1',
    relationship_account_opener_dob_month: '1',
    relationship_account_opener_dob_year: '1950',
    relationship_account_opener_phone: '456-789-0123'
  },
  SG: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    relationship_account_opener_address_city: 'Singapore',
    relationship_account_opener_address_line1: '123 Sesame St',
    relationship_account_opener_address_postal_code: '339696',
    relationship_account_opener_address_state: 'SG',
    relationship_account_opener_dob_day: '1',
    relationship_account_opener_dob_month: '1',
    relationship_account_opener_dob_year: '1950',
    relationship_account_opener_id_number: '000000000',
    relationship_account_opener_phone: '456-789-0123'
  },
  SI: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    relationship_account_opener_address_city: 'Ljubljana',
    relationship_account_opener_address_line1: '123 Sesame St',
    relationship_account_opener_address_postal_code: '1210',
    relationship_account_opener_dob_day: '1',
    relationship_account_opener_dob_month: '1',
    relationship_account_opener_dob_year: '1950',
    relationship_account_opener_phone: '456-789-0123'
  },
  SK: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    relationship_account_opener_address_city: 'Slovakia',
    relationship_account_opener_address_line1: '123 Sesame St',
    relationship_account_opener_address_postal_code: '00102',
    relationship_account_opener_dob_day: '1',
    relationship_account_opener_dob_month: '1',
    relationship_account_opener_dob_year: '1950',
    relationship_account_opener_phone: '456-789-0123'
  },
  US: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    relationship_account_opener_address_city: 'New York',
    relationship_account_opener_address_line1: '285 Fulton St',
    relationship_account_opener_address_postal_code: '10007',
    relationship_account_opener_address_state: 'NY',
    relationship_account_opener_dob_day: '1',
    relationship_account_opener_dob_month: '1',
    relationship_account_opener_dob_year: '1950',
    relationship_account_opener_phone: '456-789-0123',
    relationship_account_opener_ssn_last_4: '0000'
  }
}
