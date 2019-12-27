/* eslint-env mocha */
const assert = require('assert')
const connect = require('../../../../index.js')
const TestHelper = require('../../../../test-helper.js')

describe('/account/connect/edit-payment-information', () => {
  describe('EditPaymentInformation#BEFORE', () => {
    it('should reject invalid stripeid', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/account/connect/edit-payment-information?stripeid=invalid')
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

    it('should bind Stripe account to req', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-payment-information?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.stripeAccount.id, user.stripeAccount.id)
    })
  })

  describe('EditPaymentInformation#GET', async () => {
    for (const country of connect.countrySpecs) {
      it('should present the form (' + country.id + ')', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: country.id,
          type: 'individual'
        })
        const req = TestHelper.createRequest(`/account/connect/edit-payment-information?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const page = await req.get()
        const doc = TestHelper.extractDoc(page)
        assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
        assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
      })
    }
  })

  describe('EditPaymentInformation#POST', async () => {
    for (const country of connect.countrySpecs) {
      it('reject invalid fields (' + country.id + ')', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: country.id,
          type: 'company'
        })
        const req = TestHelper.createRequest(`/account/connect/edit-payment-information?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        if (postData[country.id].length) {
          for (const format of postData[country.id]) {
            req.body = format
            req.body.country = country.id
            req.body.account_holder_type = 'company'
            req.body.account_holder_name = `${user.profile.firstName} ${user.profile.lastName}`
            const body = JSON.stringify(req.body)
            const fields = Object.keys(req.body)
            for (const field of fields) {
              req.body = JSON.parse(body)
              req.body[field] = ''
              const page = await req.post()
              const doc = TestHelper.extractDoc(page)
              const messageContainer = doc.getElementById('message-container')
              const message = messageContainer.child[0]
              assert.strictEqual(message.attr.template, `invalid-${field}`)
            }
          }
          return
        } 
        req.body = postData[country.id]
        req.body.country = country.id
        req.body.account_holder_type = 'company'
        req.body.account_holder_name = `${user.profile.firstName} ${user.profile.lastName}`
        const body = JSON.stringify(req.body)
        const fields = Object.keys(req.body)
        for (const field of fields) {
          req.body = JSON.parse(body)
          req.body[field] = ''
          const page = await req.post()
          const doc = TestHelper.extractDoc(page)
          const messageContainer = doc.getElementById('message-container')
          const message = messageContainer.child[0]
          assert.strictEqual(message.attr.template, `invalid-${field}`)
        }
      })
    }

    for (const country of connect.countrySpecs) {
      it('submit payment information (' + country.id + ')', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: country.id,
          type: 'individual'
        })
        const req = TestHelper.createRequest(`/account/connect/edit-payment-information?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        if (postData[country.id].length) {
          for (const format of postData[country.id]) {
            req.body = format
            req.body.country = country.id
            req.body.account_holder_type = 'company'
            req.body.account_holder_name = `${user.profile.firstName} ${user.profile.lastName}`
            const page = await req.post()
            const doc = TestHelper.extractDoc(page)
            const messageContainer = doc.getElementById('message-container')
            const message = messageContainer.child[0]
            assert.strictEqual(message.attr.template, 'success')
          }
          return
        }
        req.body = postData[country.id]
        req.body.country = country.id
        req.body.account_holder_type = 'individual'
        req.body.account_holder_name = `${user.profile.firstName} ${user.profile.lastName}`
        req.filename = __filename
        req.screenshots = [
          { hover: '#account-menu-container' },
          { click: '/account/connect' },
          { click: '/account/connect/stripe-accounts' },
          { click: `/account/connect/stripe-account?stripeid=${user.stripeAccount.id}` },
          { click: `/account/connect/edit-payment-information?stripeid=${user.stripeAccount.id}` },
          { fill: '#submit-form' }
        ]
        const page = await req.post()
        const doc = TestHelper.extractDoc(page)
        const messageContainer = doc.getElementById('message-container')
        const message = messageContainer.child[0]
        assert.strictEqual(message.attr.template, 'success')
      })
    }
  })
})

const postData = {
  AT: {
    currency: 'eur',
    iban: 'AT89370400440532013000'
  },
  AU: {
    account_number: '000123456',
    bsb_number: '110000',
    currency: 'aud'
  },
  BE: {
    currency: 'eur',
    iban: 'BE89370400440532013000'
  },
  CA: {
    account_number: '000123456789',
    currency: 'cad',
    institution_number: '000',
    transit_number: '11000'
  },
  CH: {
    currency: 'eur',
    iban: 'CH89370400440532013000'
  },
  DE: {
    currency: 'eur',
    iban: 'DE89370400440532013000'
  },
  DK: {
    currency: 'eur',
    iban: 'DK89370400440532013000'
  },
  EE: {
    currency: 'eur',
    iban: 'EE89370400440532013000'
  },
  ES: {
    currency: 'eur',
    iban: 'ES89370400440532013000'
  },
  FI: {
    currency: 'eur',
    iban: 'FI89370400440532013000'
  },
  FR: {
    currency: 'eur',
    iban: 'FR89370400440532013000'
  },
  GB: [{
    account_number: '00012345',
    currency: 'gbp',
    sort_code: '108800'
  }, {
    currency: 'eur',
    iban: 'GB89370400440532013000'
  }],
  GR: {
    currency: 'eur',
    iban: 'GR89370400440532013000'
  },
  HK: {
    account_number: '000123456',
    branch_code: '000',
    clearing_code: '110',
    currency: 'hkd'
  },
  IE: {
    currency: 'eur',
    iban: 'IE89370400440532013000'
  },
  IT: {
    currency: 'eur',
    iban: 'IT89370400440532013000'
  },
  JP: {
    account_number: '0001234',
    bank_code: '1100',
    branch_code: '000',
    currency: 'jpy'
  },
  LT: {
    currency: 'eur',
    iban: 'LT89370400440532013000'
  },
  LU: {
    currency: 'eur',
    iban: 'LU89370400440532013000'
  },
  LV: {
    currency: 'eur',
    iban: 'LV89370400440532013000'
  },
  MY: {
    currency: 'myr',
    routing_number: 'TESTMYKL',
    account_number: '000123456000'
  },
  NL: {
    currency: 'eur',
    iban: 'NL89370400440532013000'
  },
  NO: {
    currency: 'eur',
    iban: 'NO89370400440532013000'
  },
  NZ: {
    account_number: '0000000010',
    currency: 'nzd',
    routing_number: '110000'
  },
  PL: {
    currency: 'eur',
    iban: 'PL89370400440532013000'
  },
  PT: {
    currency: 'eur',
    iban: 'PT89370400440532013000'
  },
  SE: {
    currency: 'eur',
    iban: 'SE89370400440532013000'
  }, 
  SG: {
    account_number: '000123456',
    bank_code: '1100',
    branch_code: '000',
    currency: 'sgd'
  },
  SI: {
    currency: 'eur',
    iban: 'SI89370400440532013000'
  },
  SK: {
    currency: 'eur',
    iban: 'SK89370400440532013000'
  },
  US: {
    account_number: '000123456789',
    currency: 'usd',
    routing_number: '110000000'
  }
}