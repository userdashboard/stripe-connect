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

  describe.only('EditIndividualRegistration#POST', () => {
    for (const country of connect.countrySpecs) {
      it.only('should reject invalid fields (' + country.id + ')', async () => {
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
          req.body.individual_email = user.profile.contactEmail
          req.body.individual_first_name = user.profile.firstName
          req.body.individual_last_name = user.profile.lastName
        }
        let uploads
        if (connect.kycRequirements[country.id].individual.indexOf('individual.verification.document.front') > -1) {
          uploads = {
            individual_verification_document_front: TestHelper['success_id_scan_back.png'],
            individual_verification_document_back: TestHelper['success_id_scan_back.png']
          }
          if (connect.kycRequirements[country.id].individual.indexOf('individual.verification.additional_document.front') > -1) {
            uploads.individual_verification_additional_document_front = TestHelper['success_id_scan_back.png']
            uploads.individual_verification_additional_document_back = TestHelper['success_id_scan_back.png']
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
          req.body.individual_email = user.profile.contactEmail
          req.body.individual_first_name = user.profile.firstName
          req.body.individual_last_name = user.profile.lastName
        }
        if (connect.kycRequirements[country.id].individual.indexOf('individual.verification.document.front') > -1) {
          req.uploads = {
            individual_verification_document_front: TestHelper['success_id_scan_back.png'],
            individual_verification_document_back: TestHelper['success_id_scan_back.png']
          }
          if (connect.kycRequirements[country.id].individual.indexOf('individual.verification.additional_document.front') > -1) {
            req.uploads.individual_verification_additional_document_front = TestHelper['success_id_scan_back.png']
            req.uploads.individual_verification_additional_document_back = TestHelper['success_id_scan_back.png']
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
    individual_address_city: 'Vienna',
    individual_address_line1: '123 Sesame St',
    individual_address_postal_code: '1020',
    individual_address_state: '1',
    individual_dob_day: '1',
    individual_dob_month: '1',
    individual_dob_year: '1950',
    individual_phone: '456-789-0123'
  },
  AU: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    individual_address_city: 'Brisbane',
    individual_address_line1: '845 Oxford St',
    individual_address_postal_code: '4000',
    individual_address_state: 'QLD',
    individual_dob_day: '1',
    individual_dob_month: '1',
    individual_dob_year: '1950',
    individual_phone: '456-789-0123'
  },
  BE: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    individual_address_city: 'Brussels',
    individual_address_line1: '123 Sesame St',
    individual_address_postal_code: '1020',
    individual_address_state: 'BRU',
    individual_dob_day: '1',
    individual_dob_month: '1',
    individual_dob_year: '1950',
    individual_phone: '456-789-0123'
  },
  CA: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    individual_address_city: 'Vancouver',
    individual_address_line1: '123 Sesame St',
    individual_address_postal_code: 'V5K 0A1',
    individual_address_state: 'BC',
    individual_dob_day: '1',
    individual_dob_month: '1',
    individual_dob_year: '1950',
    individual_id_number: '000000000',
    individual_phone: '456-789-0123'
  },
  CH: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    individual_address_city: 'Bern',
    individual_address_line1: '123 Sesame St',
    individual_address_postal_code: '1020',
    individual_address_state: 'BE',
    individual_dob_day: '1',
    individual_dob_month: '1',
    individual_dob_year: '1950',
    individual_phone: '456-789-0123'
  },
  DE: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    individual_address_city: 'Berlin',
    individual_address_line1: '123 Sesame St',
    individual_address_postal_code: '01067',
    individual_address_state: 'BE',
    individual_dob_day: '1',
    individual_dob_month: '1',
    individual_dob_year: '1950',
    individual_phone: '456-789-0123'
  },
  DK: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    individual_address_city: 'Copenhagen',
    individual_address_line1: '123 Sesame St',
    individual_address_postal_code: '1000',
    individual_address_state: '147',
    individual_dob_day: '1',
    individual_dob_month: '1',
    individual_dob_year: '1950',
    individual_phone: '456-789-0123'
  },
  EE: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    individual_address_city: 'Tallinn',
    individual_address_line1: '123 Sesame St',
    individual_address_postal_code: '10128',
    individual_address_state: '37',
    individual_dob_day: '1',
    individual_dob_month: '1',
    individual_dob_year: '1950',
    individual_phone: '456-789-0123'
  },
  ES: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    individual_address_city: 'Madrid',
    individual_address_line1: '123 Park Lane',
    individual_address_postal_code: '03179',
    individual_address_state: 'AN',
    individual_name: 'Individual',
    individual_phone: '456-789-0123',
    individual_tax_id: '00000000000'
  },
  FI: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    individual_address_city: 'Helsinki',
    individual_address_line1: '123 Sesame St',
    individual_address_postal_code: '00990',
    individual_address_state: 'AL',
    individual_dob_day: '1',
    individual_dob_month: '1',
    individual_dob_year: '1950',
    individual_phone: '456-789-0123'
  },
  FR: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    individual_address_city: 'Paris',
    individual_address_line1: '123 Sesame St',
    individual_address_postal_code: '75001',
    individual_address_state: 'A',
    individual_dob_day: '1',
    individual_dob_month: '1',
    individual_dob_year: '1950',
    individual_phone: '456-789-0123'
  },
  GB:{
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    individual_address_city: 'London',
    individual_address_line1: '123 Sesame St',
    individual_address_postal_code: 'EC1A 1AA',
    individual_address_state: 'LND',
    individual_dob_day: '1',
    individual_dob_month: '1',
    individual_dob_year: '1950',
    individual_phone: '456-789-0123'
  },
  GR: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    individual_address_city: 'Athens',
    individual_address_line1: '123 Park Lane',
    individual_address_postal_code: '104',
    individual_address_state: 'I',
    individual_phone: '456-789-0123',
    individual_tax_id: '00000000000'
  },
  HK: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    individual_address_city: 'Hong Kong',
    individual_address_line1: '123 Sesame St',
    individual_address_postal_code: '999077',
    individual_address_state: 'HK',
    individual_dob_day: '1',
    individual_dob_month: '1',
    individual_dob_year: '1950',
    individual_id_number: '000000000',
    individual_phone: '456-789-0123'
  },
  IE: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    individual_address_city: 'Dublin',
    individual_address_line1: '123 Sesame St',
    individual_address_postal_code: 'Dublin 1',
    individual_address_state: 'D',
    individual_dob_day: '1',
    individual_dob_month: '1',
    individual_dob_year: '1950',
    individual_phone: '456-789-0123'
  },
  IT: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    individual_address_city: 'Rome',
    individual_address_line1: '123 Sesame St',
    individual_address_postal_code: '00010',
    individual_address_state: '65',
    individual_dob_day: '1',
    individual_dob_month: '1',
    individual_dob_year: '1950',
    individual_phone: '456-789-0123'
  },
  JP: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    individual_address_kana_city: 'ｼﾌﾞﾔ',
    individual_address_kana_line1: '27-15',
    individual_address_kana_postal_code: '1500001',
    individual_address_kana_state: 'ﾄｳｷﾖｳﾄ',
    individual_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
    individual_address_kanji_city: '渋谷区',
    individual_address_kanji_line1: '２７－１５',
    individual_address_kanji_postal_code: '1500001',
    individual_address_kanji_state: '東京都',
    individual_address_kanji_town: '神宮前 ３丁目',
    individual_dob_day: '1',
    individual_dob_month: '1',
    individual_dob_year: '1950',
    individual_first_name_kana: 'ﾄｳｷﾖｳﾄ',
    individual_first_name_kanji: '東京都',
    individual_gender: 'female',
    individual_last_name_kana: 'ﾄｳｷﾖｳﾄ',
    individual_last_name_kanji: '東京都',
    individual_phone: '+81112345678'
  },
  LT: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    individual_address_city: 'Vilnius',
    individual_address_line1: '123 Sesame St',
    individual_address_postal_code: 'LT-00000',
    individual_address_state: 'AL',
    individual_dob_day: '1',
    individual_dob_month: '1',
    individual_dob_year: '1950',
    individual_phone: '456-789-0123'
  },
  LU: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    individual_address_city: 'Luxemburg',
    individual_address_line1: '123 Sesame St',
    individual_address_postal_code: '1623',
    individual_address_state: 'L',
    individual_dob_day: '1',
    individual_dob_month: '1',
    individual_dob_year: '1950',
    individual_phone: '456-789-0123'
  },
  LV: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    individual_address_city: 'Riga',
    individual_address_line1: '123 Sesame St',
    individual_address_postal_code: 'LV–1073',
    individual_address_state: 'AI',
    individual_dob_day: '1',
    individual_dob_month: '1',
    individual_dob_year: '1950',
    individual_phone: '456-789-0123'
  },
  MY: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    individual_address_city: 'Kuala Lumpur',
    individual_address_line1: '123 Sesame St',
    individual_address_postal_code: '50450',
    individual_address_state: 'C',
    individual_dob_day: '1',
    individual_dob_month: '1',
    individual_dob_year: '1950',
    individual_phone: '456-789-0123'
  },
  NL: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    individual_address_city: 'Amsterdam',
    individual_address_line1: '123 Sesame St',
    individual_address_postal_code: '1071 JA',
    individual_address_state: 'DR',
    individual_dob_day: '1',
    individual_dob_month: '1',
    individual_dob_year: '1950',
    individual_phone: '456-789-0123'
  },
  NO: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    individual_address_city: 'Oslo',
    individual_address_line1: '123 Sesame St',
    individual_address_postal_code: '0001',
    individual_address_state: '02',
    individual_dob_day: '1',
    individual_dob_month: '1',
    individual_dob_year: '1950',
    individual_phone: '456-789-0123'
  },
  NZ: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    individual_address_city: 'Auckland',
    individual_address_line1: '844 Fleet Street',
    individual_address_postal_code: '6011',
    individual_address_state: 'N',
    individual_dob_day: '1',
    individual_dob_month: '1',
    individual_dob_year: '1950',
    individual_phone: '456-789-0123'
  },
  PL: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    individual_address_city: 'Krakow',
    individual_address_line1: '123 Park Lane',
    individual_address_postal_code: '32-400',
    individual_address_state: 'KR',
    individual_dob_day: '1',
    individual_dob_month: '1',
    individual_dob_year: '1950',
    individual_phone: '456-789-0123'
  },
  PT: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    individual_address_city: 'Lisbon',
    individual_address_line1: '123 Sesame St',
    individual_address_postal_code: '4520',
    individual_address_state: '01',
    individual_dob_day: '1',
    individual_dob_month: '1',
    individual_dob_year: '1950',
    individual_phone: '456-789-0123'
  },
  SE: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    individual_address_city: 'Stockholm',
    individual_address_line1: '123 Sesame St',
    individual_address_postal_code: '00150',
    individual_address_state: 'K',
    individual_dob_day: '1',
    individual_dob_month: '1',
    individual_dob_year: '1950',
    individual_phone: '456-789-0123'
  }, 
  SG: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    individual_address_city: 'Singapore',
    individual_address_line1: '123 Sesame St',
    individual_address_postal_code: '339696',
    individual_address_state: 'SG',
    individual_dob_day: '1',
    individual_dob_month: '1',
    individual_dob_year: '1950',
    individual_id_number: '000000000',
    individual_phone: '456-789-0123'
  },
  SI: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    individual_address_city: 'Ljubljana',
    individual_address_line1: '123 Sesame St',
    individual_address_postal_code: '1210',
    individual_dob_day: '1',
    individual_dob_month: '1',
    individual_dob_year: '1950',
    individual_phone: '456-789-0123'
  },
  SK: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    individual_address_city: 'Slovakia',
    individual_address_line1: '123 Sesame St',
    individual_address_postal_code: '00102',
    individual_dob_day: '1',
    individual_dob_month: '1',
    individual_dob_year: '1950',
    individual_phone: '456-789-0123'
  },
  US: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    individual_address_city: 'New York',
    individual_address_line1: '285 Fulton St',
    individual_address_postal_code: '10007',
    individual_address_state: 'NY',
    individual_dob_day: '1',
    individual_dob_month: '1',
    individual_dob_year: '1950',
    individual_phone: '456-789-0123',
    individual_ssn_last_4: '0000'
  }
}
