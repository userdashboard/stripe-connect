/* eslint-env mocha */
const assert = require('assert')
const connect = require('../../../../../index.js')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@userdashboard/dashboard/test-helper.js')

describe('/api/user/connect/update-payment-information', function () {
  this.retries(0)
  this.timeout(15 * 60 * 1000)
  // TODO: invalid values marked as 'false' are skipped until they can be verified
  const invalidValues = {
    account_holder_name: false,
    account_holder_type: 'invalid',
    routing_number: '111111111',
    account_number: '111111111',
    bank_code: false,
    branch_code: false,
    clearing_code: false,
    bsb_number: false,
    institution_number: false,
    currency: 'invalid',
    country: 'invalid',
    iban: 'invalid',
    transit_number: false,
    sort_code: false
  }
  const errorMessages = {}
  const invalidMessages = {}
  const submitResponses = {}
  const submitIdentities = {}
  before(async () => {
    await DashboardTestHelper.setupBeforeEach()
    await TestHelper.setupBeforeEach()
    const testedMissingFields = []
    for (const country of connect.countrySpecs) {
      let payload
      if (TestStripeAccounts.paymentData[country.id].length) {
        payload = TestStripeAccounts.createPostData(TestStripeAccounts.paymentData[country.id])[0]
      } else {
        payload = TestStripeAccounts.createPostData(TestStripeAccounts.paymentData[country.id])
      }
      if (payload === false) {
        continue
      }
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: country.id,
        type: 'company'
      })
      errorMessages[country.id] = {}
      invalidMessages[country.id] = {}
      submitIdentities[country.id] = user.identity
      for (const field in payload) {
        if (testedMissingFields.indexOf(field) > -1) {
          continue
        }
        testedMissingFields.push(field)
        const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        if (TestStripeAccounts.paymentData[country.id].length) {
          req.body = TestStripeAccounts.createPostData(TestStripeAccounts.paymentData[country.id][0], user.identity)
        } else {
          req.body = TestStripeAccounts.createPostData(TestStripeAccounts.paymentData[country.id], user.identity)
        }
        delete (req.body[field])
        try {
          await req.patch()
        } catch (error) {
          errorMessages[country.id][field] = error.message
        }
        req.body[field] = invalidValues[field]
        try {
          await req.patch()
        } catch (error) {
          invalidMessages[country.id][field] = error.message
        }
      }
      const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      if (TestStripeAccounts.paymentData[country.id].length) {
        req.body = TestStripeAccounts.createPostData(TestStripeAccounts.paymentData[country.id][0])
      } else {
        req.body = TestStripeAccounts.createPostData(TestStripeAccounts.paymentData[country.id])
      }
      submitResponses[country.id] = await req.patch()
    }
    console.log(submitIdentities)
  })

  describe('exceptions', () => {
    describe('invalid-stripeid', () => {
      it('missing querystring stripeid', async () => {
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/connect/update-payment-information')
        req.account = user.account
        req.session = user.session
        req.body = TestStripeAccounts.createPostData(TestStripeAccounts.paymentData.US)
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
        const req = TestHelper.createRequest('/api/user/connect/update-payment-information?stripeid=invalid')
        req.account = user.account
        req.session = user.session
        req.body = TestStripeAccounts.createPostData(TestStripeAccounts.paymentData.US)
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-stripeid')
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
        const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
        req.account = user2.account
        req.session = user2.session
        req.body = TestStripeAccounts.createPostData(TestStripeAccounts.paymentData[user.stripeAccount.country])
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-account')
      })
    })
    const testedMissingFields = []
    for (const country of connect.countrySpecs) {
      let payload
      if (TestStripeAccounts.paymentData[country.id].length) {
        payload = TestStripeAccounts.createPostData(TestStripeAccounts.paymentData[country.id])[0]
      } else {
        payload = TestStripeAccounts.createPostData(TestStripeAccounts.paymentData[country.id])
      }
      if (payload === false) {
        continue
      }
      for (const field in payload) {
        if (testedMissingFields.indexOf(field) > -1) {
          continue
        }
        testedMissingFields.push(field)
        describe(`invalid-${field}`, () => {
          it(`missing posted ${field}`, async () => {
            const errorMessage = errorMessages[country.id][field]
            assert.strictEqual(errorMessage, `invalid-${field}`)
          })
          if (invalidValues[field] !== undefined && invalidValues[field] !== false) {
            it(`invalid posted ${field}`, async () => {
              const errorMessage = invalidMessages[country.id][field]
              assert.strictEqual(errorMessage, `invalid-${field}`)
            })
          }
        })
      }
    }
  })

  describe('receives', () => {
    const testedRequiredFields = []
    for (const country of connect.countrySpecs) {
      let payload
      if (TestStripeAccounts.paymentData[country.id].length) {
        payload = TestStripeAccounts.createPostData(TestStripeAccounts.paymentData[country.id])[0]
      } else {
        payload = TestStripeAccounts.createPostData(TestStripeAccounts.paymentData[country.id])
      }
      if (payload === false) {
        continue
      }
      for (const field in payload) {
        if (testedRequiredFields.indexOf(field) > -1) {
          continue
        }
        testedRequiredFields.push(field)
        it(`optionally-required posted ${field}`, async () => {
          const stripeAccountNow = submitResponses[country.id]
          if (field === 'iban' || field === 'account_number') {
            assert.strictEqual(stripeAccountNow.external_accounts.data[0].last4, payload[field].substring(payload[field].length - 4))
          } else if (field === 'bsb_number' ||
                     field === 'institution_number' ||
                     field === 'sort_code' ||
                     field === 'bank_code' ||
                     field === 'branch_code' ||
                     field === 'clearing_code' ||
                     field === 'transit_number') {
            const routing = stripeAccountNow.external_accounts.data[0].routing_number.split(' ').join('').split('-').join('')
            assert.strictEqual(true, routing.indexOf(payload[field]) > -1)
          } else if (field === 'account_holder_name') {
            assert.strictEqual(stripeAccountNow.external_accounts.data[0][field], submitIdentities[country.id].firstName + ' ' +  submitIdentities[country.id].lastName)
          } else {
            assert.strictEqual(stripeAccountNow.external_accounts.data[0][field], payload[field])
          }
        })
      }
    }
  })

  describe('returns', () => {
    for (const country of connect.countrySpecs) {
      it('object (' + country.id + ')', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: country.id,
          type: 'individual'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        if (TestStripeAccounts.paymentData[country.id].length) {
          let accounts = 0
          for (const format of TestStripeAccounts.paymentData[country.id]) {
            accounts++
            req.body = TestStripeAccounts.createPostData(format, user.profile)
            req.body.country = country.id
            req.body.account_holder_type = 'company'
            req.body.account_holder_name = `${user.profile.firstName} ${user.profile.lastName}`
            const stripeAccountNow = await req.patch()
            assert.strictEqual(stripeAccountNow.object, 'account')
            assert.strictEqual(stripeAccountNow.external_accounts.data.length, accounts)
          }
          return
        }
        req.body = TestStripeAccounts.createPostData(TestStripeAccounts.paymentData[country.id], user.profile)
        req.filename = __filename
        req.saveResponse = true
        const stripeAccountNow = await req.patch()
        assert.strictEqual(stripeAccountNow.object, 'account')
        assert.strictEqual(stripeAccountNow.external_accounts.data.length, 1)
      })
    }
  })
})
