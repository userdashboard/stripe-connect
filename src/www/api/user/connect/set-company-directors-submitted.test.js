/* eslint-env mocha */
const assert = require('assert')
const connect = require('../../../../../index.js')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')

describe('/api/user/connect/set-company-directors-submitted', () => {
  describe('exceptions', () => {
    describe('invalid-stripeid', () => {
      it('missing querystring stripeid', async () => {
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/connect/set-company-directors-submitted')
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
        const req = TestHelper.createRequest('/api/user/connect/set-company-directors-submitted?stripeid=invalid')
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
      it('ineligible stripe account for individual', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'US',
          type: 'individual'
        })
        const req = TestHelper.createRequest(`/api/user/connect/set-company-directors-submitted?stripeid=${user.stripeAccount.id}`)
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

      it('ineligible company directors are submitted', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'AT',
          type: 'company'
        })
        await TestHelper.submitCompanyDirectors(user)
        const req = TestHelper.createRequest(`/api/user/connect/set-company-directors-submitted?stripeid=${user.stripeAccount.id}`)
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
    })

    describe('invalid-account', () => {
      it('ineligible accessing account', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'DE',
          type: 'company'
        })
        const user2 = await TestHelper.createUser()
        const req = TestHelper.createRequest(`/api/user/connect/set-company-directors-submitted?stripeid=${user.stripeAccount.id}`)
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

  describe('returns', () => {
    for (const country of connect.countrySpecs) {
      if (TestStripeAccounts.companyDirectorData[country.id] === false) {
        continue
      }
      it('object (' + country.id + ')', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: country.id,
          type: 'company'
        })
        const person = TestHelper.nextIdentity()
        const director = JSON.parse(JSON.stringify(TestStripeAccounts.beneficialOwnerData[country.id]))
        director.first_name = person.firstName
        director.last_name = person.lastName
        await TestHelper.createCompanyDirector(user, director, {
          verification_document_back: TestHelper['success_id_scan_back.png'],
          verification_document_front: TestHelper['success_id_scan_front.png']
        })
        const req = TestHelper.createRequest(`/api/user/connect/set-company-directors-submitted?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const accountNow = await req.patch()
        assert.strictEqual(accountNow.company.directors_provided, true)
        const directors = await global.api.user.connect.CompanyDirectors.get(req)
        for (const director of directors) {
          assert.strictEqual(director.requirements.past_due.length, 0)
          assert.strictEqual(director.requirements.eventually_due.length, 0)
          assert.strictEqual(director.requirements.currently_due.length, 0)
        }
      })
    }
  })

  describe('configuration', () => {
    it('environment STRIPE_JS', async () => {
      global.stripeJS = 3
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'DE',
        type: 'company'
      })
      const person = TestHelper.nextIdentity()
      const req = TestHelper.createRequest(`/account/connect/create-company-director?stripeid=${user.stripeAccount.id}`)
      req.waitOnSubmit = true
      req.account = user.account
      req.session = user.session
      req.uploads = {
        verification_document_back: TestHelper['success_id_scan_back.png'],
        verification_document_front: TestHelper['success_id_scan_front.png']
      }
      req.body = {
        dob_day: '1',
        dob_month: '1',
        dob_year: '1950',
        email: person.email,
        first_name: person.firstName,
        last_name: person.lastName
      }
      req.filename = __filename
      req.saveResponse = true
      await req.post()
      const req2 = TestHelper.createRequest(`/api/user/connect/set-company-directors-submitted?stripeid=${user.stripeAccount.id}`)
      req2.account = user.account
      req2.session = user.session
      const accountNow = await req2.patch()
      assert.strictEqual(accountNow.company.directors_provided, true)
    })
  })
})
