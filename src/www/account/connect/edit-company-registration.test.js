/* eslint-env mocha */
const assert = require('assert')
const connect = require('../../../../index.js')
const TestHelper = require('../../../../test-helper.js')

describe('/account/connect/edit-company-registration', () => {
  describe('EditCompanyRegistration#BEFORE', () => {
    it('should reject invalid registration', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/account/connect/edit-company-registration?stripeid=invalid')
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

    it('should reject individual registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'individual'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
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

  describe('EditCompanyRegistration#GET', () => {
    for (const country of connect.countrySpecs) {
      it('should present the form (' + country.id + ')', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: country.id,
          type: 'company'
        })
        const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const page = await req.get()
        const doc = TestHelper.extractDoc(page)
        assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
        assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
      })
    }
  })

  describe('EditCompanyRegistration#POST', () => {
    for (const country of connect.countrySpecs) {
      it('should reject invalid fields (' + country.id + ')', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: country.id,
          type: 'company'
        })
        const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = postData[country.id]
        let uploads
        if (connect.kycRequirements[country.id].company.indexOf('company.verification.document.front') > -1) {
          uploads = {
            company_verification_document_front: TestHelper['success_id_scan_back.png'],
            company_verification_document_back: TestHelper['success_id_scan_back.png']
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
          type: 'company'
        })
        const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = postData[country.id] 
        if (connect.kycRequirements[country.id].company.indexOf('company.verification.document.front') > -1) {
          req.uploads = {
            company_verification_document_front: TestHelper['success_id_scan_back.png'],
            company_verification_document_back: TestHelper['success_id_scan_back.png']
          }
        }
        req.filename = __filename
        req.screenshots = [
          { hover: '#account-menu-container' },
          { click: '/account/connect' },
          { click: '/account/connect/stripe-accounts' },
          { click: `/account/connect/stripe-account?stripeid=${user.stripeAccount.id}` },
          { click: `/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}` },
          { fill: '#submit-form' }
        ]
        const page = await req.post()
        const doc = TestHelper.extractDoc(page)
        const messageContainer = doc.getElementById('message-container')
        if (messageContainer) {
          console.log(messageContainer.toString())
        }
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
    company_address_city: 'Vienna',
    company_address_line1: '123 Park Lane',
    company_address_postal_code: '1020',
    company_address_state: '1',
    company_name: 'Company',
    company_phone: '456-789-0123',
    company_tax_id: '00000000000'
  },
  AU: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    company_address_city: 'Brisbane',
    company_address_line1: '123 Park Lane',
    company_address_postal_code: '4000',
    company_address_state: 'QLD',
    company_name: 'Company',
    company_phone: '456-789-0123',
    company_tax_id: '00000000000'
  },
  BE: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    company_address_city: 'Brussels',
    company_address_line1: '123 Park Lane',
    company_address_postal_code: '1020',
    company_address_state: 'BRU',
    company_name: 'Company',
    company_phone: '456-789-0123',
    company_tax_id: '00000000000'
  },
  CA: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    company_address_city: 'Vancouver',
    company_address_line1: '123 Park Lane',
    company_address_postal_code: 'V5K 0A1',
    company_address_state: 'BC',
    company_name: 'Company',
    company_phone: '456-789-0123',
    company_tax_id: '00000000000'
  },
  CH: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    company_address_city: 'Bern',
    company_address_line1: '123 Park Lane',
    company_address_postal_code: '1020',
    company_address_state: 'BE',
    company_name: 'Company',
    company_phone: '456-789-0123',
    company_tax_id: '00000000000'
  },
  DE: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    company_address_city: 'Berlin',
    company_address_line1: '123 Park Lane',
    company_address_postal_code: '01067',
    company_address_state: 'BE',
    company_name: 'Company',
    company_phone: '456-789-0123',
    company_tax_id: '00000000000'
  },
  DK: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    company_address_city: 'Copenhagen',
    company_address_line1: '123 Park Lane',
    company_address_postal_code: '1000',
    company_address_state: '147',
    company_name: 'Company',
    company_phone: '456-789-0123',
    company_tax_id: '00000000000'
  },
  EE: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    company_address_city: 'Talin',
    company_address_line1: '123 Park Lane',
    company_address_postal_code: '10128',
    company_address_state: '37',
    company_name: 'Company',
    company_phone: '456-789-0123',
    company_tax_id: '00000000000'
  },
  ES: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    company_address_city: 'Madrid',
    company_address_line1: '123 Park Lane',
    company_address_postal_code: '03179',
    company_address_state: 'AN',
    company_name: 'Company',
    company_phone: '456-789-0123',
    company_tax_id: '00000000000'
  },
  FI: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    company_address_city: 'Helsinki',
    company_address_line1: '123 Park Lane',
    company_address_postal_code: '00990',
    company_address_state: 'AL',
    company_name: 'Company',
    company_phone: '456-789-0123',
    company_tax_id: '00000000000'
  },
  FR: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    company_address_city: 'Paris',
    company_address_line1: '123 Park Lane',
    company_address_postal_code: '75001',
    company_address_state: 'A',
    company_name: 'Company',
    company_phone: '456-789-0123',
    company_tax_id: '00000000000'
  },
  GB:{
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    company_address_city: 'London',
    company_address_line1: '123 Park Lane',
    company_address_postal_code: 'EC1A 1AA',
    company_address_state: 'LND',
    company_name: 'Company',
    company_phone: '456-789-0123',
    company_tax_id: '00000000000'
  },
  GR: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    company_address_city: 'Athens',
    company_address_line1: '123 Park Lane',
    company_address_postal_code: '104',
    company_address_state: 'I',
    company_name: 'Company',
    company_phone: '456-789-0123',
    company_tax_id: '00000000000'
  },
  HK: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    company_address_city: 'Hong Kong',
    company_address_line1: '123 Park Lane',
    company_address_postal_code: '00000',
    company_address_state: 'HK',
    company_name: 'Company',
    company_phone: '456-789-0234',
    company_tax_id: '00000000000'
  },
  IE: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    company_address_city: 'Dublin',
    company_address_line1: '123 Park Lane',
    company_address_postal_code: 'Dublin 1',
    company_address_state: 'D',
    company_name: 'Company',
    company_phone: '456-789-0123',
    company_tax_id: '00000000000'
  },
  IT: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    company_address_city: 'Rome',
    company_address_line1: '123 Park Lane',
    company_address_postal_code: '00010',
    company_address_state: '65',
    company_name: 'Company',
    company_phone: '456-789-0123',
    company_tax_id: '00000000000'
  },
  JP: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    company_address_kana_city: 'ｼﾌﾞﾔ',
    company_address_kana_line1: '27-15',
    company_address_kana_postal_code: '1500001',
    company_address_kana_state: 'ﾄｳｷﾖｳﾄ',
    company_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
    company_address_kanji_city: '渋谷区',
    company_address_kanji_line1: '２７－１５',
    company_address_kanji_postal_code: '1500001',
    company_address_kanji_state: '東京都',
    company_address_kanji_town: '神宮前　３丁目',
    company_name: 'Company',
    company_name_kana: 'ﾄｳｷﾖｳﾄ',
    company_name_kanji: '東京都',
    company_phone: '011-271-6677',
    company_tax_id: '00000000000'
  },
  LT: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    company_address_city: 'Vilnius',
    company_address_line1: '123 Sesame St',
    company_address_postal_code: 'LT-00000',
    company_address_state: 'AL',
    company_name: 'Company',
    company_phone: '456-789-0123',
    company_tax_id: '00000000000'
  },
  LU: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    company_address_city: 'Luxemburg',
    company_address_line1: '123 Park Lane',
    company_address_postal_code: '1623',
    company_address_state: 'L',
    company_name: 'Company',
    company_phone: '456-789-0123',
    company_tax_id: '00000000000'
  },
  LV: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    company_address_city: 'Riga',
    company_address_line1: '123 Sesame St',
    company_address_postal_code: 'LV–1073',
    company_address_state: 'AI',
    company_name: 'Company',
    company_phone: '456-789-0123',
    company_tax_id: '00000000000'
  },
  MY: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    company_address_city: 'Kuala Lumpur',
    company_address_line1: '123 Sesame St',
    company_address_postal_code: '50450',
    company_address_state: 'C',
    company_name: 'Company',
    company_phone: '456-789-0123',
    company_tax_id: '00000000000'
  },
  NL: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    company_address_city: 'Amsterdam',
    company_address_line1: '123 Park Lane',
    company_address_postal_code: '1071 JA',
    company_address_state: 'DR',
    company_name: 'Company',
    company_phone: '456-789-0123',
    company_tax_id: '00000000000'
  },
  NO: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    company_address_city: 'Oslo',
    company_address_line1: '123 Park Lane',
    company_address_postal_code: '0001',
    company_address_state: '02',
    company_name: 'Company',
    company_phone: '456-789-0123',
    company_tax_id: '00000000000'
  },
  NZ: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    company_address_city: 'Auckland',
    company_address_line1: '123 Park Lane',
    company_address_postal_code: '6011',
    company_address_state: 'N',
    company_name: 'Company',
    company_phone: '456-789-0123',
    company_tax_id: '00000000000'
  },
  PL: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    company_address_city: 'Krakow',
    company_address_line1: '123 Park Lane',
    company_address_postal_code: '32-400',
    company_address_state: 'KR',
    company_name: 'Company',
    company_phone: '456-789-0123',
    company_tax_id: '00000000000'
  },
  PT: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    company_address_city: 'Lisbon',
    company_address_line1: '123 Park Lane',
    company_address_postal_code: '4520',
    company_address_state: '01',
    company_name: 'Company',
    company_phone: '456-789-0123',
    company_tax_id: '00000000000'
  },
  SE: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    company_address_city: 'Stockholm',
    company_address_line1: '123 Park Lane',
    company_address_postal_code: '00150',
    company_address_state: 'K',
    company_name: 'Company',
    company_phone: '456-789-0123',
    company_tax_id: '00000000000'
  }, 
  SG: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    company_address_city: 'Singapore',
    company_address_line1: '123 Park Lane',
    company_address_postal_code: '339696',
    company_address_state: 'SG',
    company_name: 'Company',
    company_phone: '456-789-0123',
    company_tax_id: '00000000000'
  },
  SI: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    company_address_city: 'Ljubljana',
    company_address_line1: '123 Sesame St',
    company_address_postal_code: '1210',
    company_address_state: '07',
    company_name: 'Company',
    company_phone: '456-789-0123',
    company_tax_id: '00000000000'
  },
  SK: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    company_address_city: 'Slovakia',
    company_address_line1: '123 Sesame St',
    company_address_postal_code: '00102',
    company_address_state: 'BC',
    company_name: 'Company',
    company_phone: '456-789-0123',
    company_tax_id: '00000000000'
  },
  US: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    company_address_city: 'New York',
    company_address_line1: '285 Fulton St',
    company_address_postal_code: '10007',
    company_address_state: 'NY',
    company_name: 'Company',
    company_phone: '456-789-0123',
    company_tax_id: '00000000000'
  }
}