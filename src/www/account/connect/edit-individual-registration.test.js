/* eslint-env mocha */
const assert = require('assert')
const connect = require('../../../../index.js')
const TestHelper = require('../../../../test-helper.js')

describe('/account/connect/edit-individual-registration', () => {
  describe('EditIndividualRegistration#BEFORE', () => {
    it('should reject invalid registration', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/account/connect/edit-individual-registration?stripeid=invalid')
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
      const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
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

  describe('EditIndividualRegistration#GET', () => {
    for (const country of connect.countrySpecs) {
      it('should present the form (' + country.id + ')', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: country.id,
          type: 'individual'
        })
        const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const page = await req.get()
        const doc = TestHelper.extractDoc(page)
        assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
        assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
      })
    }
  })

  describe('EditIndividualRegistration#POST', () => {
    for (const country of connect.countrySpecs) {
      it('should reject invalid fields (' + country.id + ')', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: country.id,
          type: 'individual'
        })
        const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = postData[country.id]
        if (country.id !== 'JP') {
          req.body.email = user.profile.contactEmail
          req.body.first_name = user.profile.firstName
          req.body.last_name = user.profile.lastName
        }
        let uploads
        if (connect.kycRequirements[country.id].individual.indexOf('individual.verification.document.front') > -1) {
          uploads = {
            verification_document_front: TestHelper['success_id_scan_back.png'],
            verification_document_back: TestHelper['success_id_scan_back.png']
          }
          if (connect.kycRequirements[country.id].individual.indexOf('individual.verification.additional_document.front') > -1) {
            uploads.verification_additional_document_front = TestHelper['success_id_scan_back.png']
            uploads.verification_additional_document_back = TestHelper['success_id_scan_back.png']
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
        const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = postData[country.id]
        if (country.id !== 'JP') {
          req.body.email = user.profile.contactEmail
          req.body.first_name = user.profile.firstName
          req.body.last_name = user.profile.lastName
        }
        if (connect.kycRequirements[country.id].individual.indexOf('individual.verification.document.front') > -1) {
          req.uploads = {
            verification_document_front: TestHelper['success_id_scan_back.png'],
            verification_document_back: TestHelper['success_id_scan_back.png']
          }
          if (connect.kycRequirements[country.id].individual.indexOf('individual.verification.additional_document.front') > -1) {
            req.uploads.verification_additional_document_front = TestHelper['success_id_scan_back.png']
            req.uploads.verification_additional_document_back = TestHelper['success_id_scan_back.png']
          }
        }
        req.filename = __filename
        req.screenshots = [
          { hover: '#account-menu-container' },
          { click: '/account/connect' },
          { click: '/account/connect/stripe-accounts' },
          { click: `/account/connect/stripe-account?stripeid=${user.stripeAccount.id}` },
          { click: `/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}` },
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
    address_city: 'Vienna',
    address_line1: '123 Sesame St',
    address_postal_code: '1020',
    address_state: '1',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  AU: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Brisbane',
    address_line1: '845 Oxford St',
    address_postal_code: '4000',
    address_state: 'QLD',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  BE: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Brussels',
    address_line1: '123 Sesame St',
    address_postal_code: '1020',
    address_state: 'BRU',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  CA: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Vancouver',
    address_line1: '123 Sesame St',
    address_postal_code: 'V5K 0A1',
    address_state: 'BC',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    id_number: '000000000',
    phone: '456-789-0123'
  },
  CH: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Bern',
    address_line1: '123 Sesame St',
    address_postal_code: '1020',
    address_state: 'BE',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  DE: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Berlin',
    address_line1: '123 Sesame St',
    address_postal_code: '01067',
    address_state: 'BE',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  DK: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Copenhagen',
    address_line1: '123 Sesame St',
    address_postal_code: '1000',
    address_state: '147',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  EE: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Tallinn',
    address_line1: '123 Sesame St',
    address_postal_code: '10128',
    address_state: '37',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  ES: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Madrid',
    address_line1: '123 Park Lane',
    address_postal_code: '03179',
    address_state: 'AN',
    name: 'Individual',
    phone: '456-789-0123',
    tax_id: '00000000000'
  },
  FI: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Helsinki',
    address_line1: '123 Sesame St',
    address_postal_code: '00990',
    address_state: 'AL',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  FR: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Paris',
    address_line1: '123 Sesame St',
    address_postal_code: '75001',
    address_state: 'A',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  GB: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'London',
    address_line1: '123 Sesame St',
    address_postal_code: 'EC1A 1AA',
    address_state: 'LND',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  GR: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Athens',
    address_line1: '123 Park Lane',
    address_postal_code: '104',
    address_state: 'I',
    phone: '456-789-0123',
    tax_id: '00000000000'
  },
  HK: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Hong Kong',
    address_line1: '123 Sesame St',
    address_postal_code: '999077',
    address_state: 'HK',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    id_number: '000000000',
    phone: '456-789-0123'
  },
  IE: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Dublin',
    address_line1: '123 Sesame St',
    address_postal_code: 'Dublin 1',
    address_state: 'D',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  IT: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Rome',
    address_line1: '123 Sesame St',
    address_postal_code: '00010',
    address_state: '65',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  JP: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_kana_city: 'ｼﾌﾞﾔ',
    address_kana_line1: '27-15',
    address_kana_postal_code: '1500001',
    address_kana_state: 'ﾄｳｷﾖｳﾄ',
    address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
    address_kanji_city: '渋谷区',
    address_kanji_line1: '２７－１５',
    address_kanji_postal_code: '1500001',
    address_kanji_state: '東京都',
    address_kanji_town: '神宮前 ３丁目',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    first_name_kana: 'ﾄｳｷﾖｳﾄ',
    first_name_kanji: '東京都',
    gender: 'female',
    last_name_kana: 'ﾄｳｷﾖｳﾄ',
    last_name_kanji: '東京都',
    phone: '+81112345678'
  },
  LT: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Vilnius',
    address_line1: '123 Sesame St',
    address_postal_code: 'LT-00000',
    address_state: 'AL',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  LU: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Luxemburg',
    address_line1: '123 Sesame St',
    address_postal_code: '1623',
    address_state: 'L',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  LV: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Riga',
    address_line1: '123 Sesame St',
    address_postal_code: 'LV–1073',
    address_state: 'AI',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  MY: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Kuala Lumpur',
    address_line1: '123 Sesame St',
    address_postal_code: '50450',
    address_state: 'C',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  NL: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Amsterdam',
    address_line1: '123 Sesame St',
    address_postal_code: '1071 JA',
    address_state: 'DR',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  NO: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Oslo',
    address_line1: '123 Sesame St',
    address_postal_code: '0001',
    address_state: '02',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  NZ: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Auckland',
    address_line1: '844 Fleet Street',
    address_postal_code: '6011',
    address_state: 'N',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  PL: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Krakow',
    address_line1: '123 Park Lane',
    address_postal_code: '32-400',
    address_state: 'KR',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  PT: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Lisbon',
    address_line1: '123 Sesame St',
    address_postal_code: '4520',
    address_state: '01',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  SE: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Stockholm',
    address_line1: '123 Sesame St',
    address_postal_code: '00150',
    address_state: 'K',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  SG: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Singapore',
    address_line1: '123 Sesame St',
    address_postal_code: '339696',
    address_state: 'SG',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    id_number: '000000000',
    phone: '456-789-0123'
  },
  SI: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Ljubljana',
    address_line1: '123 Sesame St',
    address_postal_code: '1210',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  SK: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Slovakia',
    address_line1: '123 Sesame St',
    address_postal_code: '00102',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  US: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'New York',
    address_line1: '285 Fulton St',
    address_postal_code: '10007',
    address_state: 'NY',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123',
    ssn_last_4: '0000'
  }
}
