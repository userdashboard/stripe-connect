/* eslint-env mocha */
const assert = require('assert')
const connect = require('../../../../index.js')
const TestHelper = require('../../../../test-helper.js')

describe('/account/connect/create-company-representative', () => {
  describe('CreateCompanyRepresentative#BEFORE', () => {
    it('should reject invalid registration', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/account/connect/create-company-representative?stripeid=invalid')
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
      const req = TestHelper.createRequest(`/account/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
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

  describe('CreateCompanyRepresentative#GET', () => {
    for (const country of connect.countrySpecs) {
      it('should present the form (' + country.id + ')', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: country.id,
          type: 'company'
        })
        const req = TestHelper.createRequest(`/account/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const page = await req.get()
        const doc = TestHelper.extractDoc(page)
        assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
        assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
      })
    }
  })

  describe('CreateCompanyRepresentative#POST', () => {
    for (const country of connect.countrySpecs) {
      it('should reject invalid fields (' + country.id + ')', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: country.id,
          type: 'company'
        })
        const req = TestHelper.createRequest(`/account/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = postData[country.id]
        if (country.id !== 'JP') {
          req.body.first_name = user.profile.firstName
          req.body.last_name = user.profile.lastName
        }
        if (country.id !== 'JP' && country.id !== 'CA' && country.id !== 'HK' && country.id !== 'MY' && country.id !== 'SG') {
          req.body.email = user.profile.contactEmail
        }
        const fields = Object.keys(req.body)
        const body = JSON.stringify(req.body)
        for (const field of fields) {
          req.body = JSON.parse(body)
          if (req.body[field]) {
            delete (req.body[field])
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
      it('should create representative (' + country.id + ') (screenshots)', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: country.id,
          type: 'company'
        })
        const req = TestHelper.createRequest(`/account/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = postData[country.id]
        if (country.id !== 'JP') {
          req.body.first_name = user.profile.firstName
          req.body.last_name = user.profile.lastName
        }
        if (country.id !== 'JP' && country.id !== 'CA' && country.id !== 'HK' && country.id !== 'MY' && country.id !== 'SG') {
          req.body.email = user.profile.contactEmail
        }
        req.filename = __filename
        req.screenshots = [
          { hover: '#account-menu-container' },
          { click: '/account/connect' },
          { click: `/account/connect/stripe-account?stripeid=${user.stripeAccount.id}` },
          { click: `/account/connect/create-company-representative?stripeid=${user.stripeAccount.id}` },
          { fill: '#submit-form' }
        ]
        const page = await req.post()
        const doc = TestHelper.extractDoc(page)
        const representativesTable = doc.getElementById('representatives-table')
        const rows = representativesTable.getElementsByTagName('tr')
        assert.strictEqual(rows.length, 2)
      })
    }
  })
})

const postData = {
  AT: {
    address_city: 'Vienna',
    address_line1: '123 Sesame St',
    address_postal_code: '1020',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  AU: {
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
    address_city: 'Brussels',
    address_line1: '123 Sesame St',
    address_postal_code: '1020',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  CA: {
    address_city: 'Vancouver',
    address_line1: '123 Sesame St',
    address_postal_code: 'V5K 0A1',
    address_state: 'BC',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  CH: {
    address_city: 'Bern',
    address_line1: '123 Sesame St',
    address_postal_code: '1020',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  DE: {
    address_city: 'Berlin',
    address_line1: '123 Sesame St',
    address_postal_code: '01067',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  DK: {
    address_city: 'Copenhagen',
    address_line1: '123 Sesame St',
    address_postal_code: '1000',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  EE: {
    address_city: 'Tallinn',
    address_line1: '123 Sesame St',
    address_postal_code: '10128',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  ES: {
    address_city: 'Madrid',
    address_line1: '123 Park Lane',
    address_postal_code: '03179',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  FI: {
    address_city: 'Helsinki',
    address_line1: '123 Sesame St',
    address_postal_code: '00990',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  FR: {
    address_city: 'Paris',
    address_line1: '123 Sesame St',
    address_postal_code: '75001',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  GB: {
    address_city: 'London',
    address_line1: '123 Sesame St',
    address_postal_code: 'EC1A 1AA',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  GR: {
    address_city: 'Athens',
    address_line1: '123 Park Lane',
    address_postal_code: '104',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  HK: {
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  IE: {
    address_city: 'Dublin',
    address_line1: '123 Sesame St',
    address_state: 'D',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  IT: {
    address_city: 'Rome',
    address_line1: '123 Sesame St',
    address_postal_code: '00010',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  JP: {
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
    last_name_kanji: '東京都'
  },
  LT: {
    address_city: 'Vilnius',
    address_line1: '123 Sesame St',
    address_postal_code: 'LT-00000',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  LU: {
    address_city: 'Luxemburg',
    address_line1: '123 Sesame St',
    address_postal_code: '1623',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  LV: {
    address_city: 'Riga',
    address_line1: '123 Sesame St',
    address_postal_code: 'LV–1073',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  MY: {
    address_city: 'Kuala Lumpur',
    address_line1: '123 Sesame St',
    address_postal_code: '50450',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    id_number: '000000000'
  },
  NL: {
    address_city: 'Amsterdam',
    address_line1: '123 Sesame St',
    address_postal_code: '1071 JA',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  NO: {
    address_city: 'Oslo',
    address_line1: '123 Sesame St',
    address_postal_code: '0001',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  NZ: {
    address_city: 'Auckland',
    address_line1: '844 Fleet Street',
    address_postal_code: '6011',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  PL: {
    address_city: 'Krakow',
    address_line1: '123 Park Lane',
    address_postal_code: '32-400',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  PT: {
    address_city: 'Lisbon',
    address_line1: '123 Sesame St',
    address_postal_code: '4520',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  SE: {
    address_city: 'Stockholm',
    address_line1: '123 Park Lane',
    address_postal_code: '00150',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  SG: {
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  SI: {
    address_city: 'Ljubljana',
    address_line1: '123 Sesame St',
    address_postal_code: '1210',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  SK: {
    address_city: 'Slovakia',
    address_line1: '123 Sesame St',
    address_postal_code: '00102',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  US: {
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
