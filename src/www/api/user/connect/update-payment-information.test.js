/* eslint-env mocha */
const assert = require('assert')
const connect = require('../../../../../index.js')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')

describe('/api/user/connect/update-payment-information', () => {
  describe('exceptions', () => {
    describe('invalid-stripeid', () => {
      it('missing querystring stripeid', async () => {
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/connect/update-payment-information')
        req.account = user.account
        req.session = user.session
        req.body = {
          account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
          account_holder_type: 'individual',
          account_number: '00012345',
          country: 'GB',
          currency: 'gbp',
          sort_code: '108800'
        }
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
        req.body = {
          account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
          account_holder_type: 'individual',
          account_number: '00012345',
          country: 'GB',
          currency: 'gbp',
          sort_code: '108800'
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
        req.body = {
          account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
          account_holder_type: 'individual',
          account_number: '00012345',
          country: 'GB',
          currency: 'gbp',
          sort_code: '108800'
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

    const testedMissingFields = []
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
            const user = await TestHelper.createUser()
            await TestHelper.createStripeAccount(user, {
              country: country.id,
              type: 'company'
            })
            const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
            req.account = user.account
            req.session = user.session
            req.uploads = {
              verification_document_back: TestHelper['success_id_scan_back.png'],
              verification_document_front: TestHelper['success_id_scan_front.png']
            }
            const body = TestStripeAccounts.createPostData(TestStripeAccounts.companyDirectorData[country.id])
            delete (body[field])
            req.body = body
            let errorMessage
            try {
              await req.post()
            } catch (error) {
              errorMessage = error.message
            }
            assert.strictEqual(errorMessage, `invalid-${field}`)
          })

          if (invalidValues[field] !== undefined && invalidValues[field] !== false) {
            it(`invalid posted ${field}`, async () => {
              const user = await TestHelper.createUser()
              await TestHelper.createStripeAccount(user, {
                country: country.id,
                type: 'company'
              })
              const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
              req.account = user.account
              req.session = user.session
              req.uploads = {
                verification_document_back: TestHelper['success_id_scan_back.png'],
                verification_document_front: TestHelper['success_id_scan_front.png']
              }
              const body = TestStripeAccounts.createPostData(TestStripeAccounts.companyDirectorData[country.id])
              body[field] = 'invalid'
              req.body = body
              let errorMessage
              try {
                await req.post()
              } catch (error) {
                errorMessage = error.message
              }
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
          const user = await TestStripeAccounts.createIndividualWithFailedField(country.id, 'payment')
          const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
          req.account = user.account
          req.session = user.session
          req.uploads = {
            verification_document_back: TestHelper['success_id_scan_back.png'],
            verification_document_front: TestHelper['success_id_scan_front.png']
          }
          req.body = TestStripeAccounts.createPostData(TestStripeAccounts.companyDirectorData[country.id])
          const accountNow = await req.patch()
          assert.strictEqual(accountNow.external_accounts.data[0].currency, req.body.curency)
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
          for (const format of TestStripeAccounts.paymentData[country.id]) {
            req.body = TestStripeAccounts.createPostData(format, user.profile)
            req.body.country = country.id
            req.body.account_holder_type = 'company'
            req.body.account_holder_name = `${user.profile.firstName} ${user.profile.lastName}`
            const accountNow = await req.patch()
            assert.strictEqual(accountNow.object, 'account')
          }
          return
        }
        req.body = TestStripeAccounts.createPostData(TestStripeAccounts.paymentData[country.id], user.profile)
        req.filename = __filename
        req.saveResponse = true
        const accountNow = await req.patch()
        assert.strictEqual(accountNow.object, 'account')
      })
    }
  })
})
