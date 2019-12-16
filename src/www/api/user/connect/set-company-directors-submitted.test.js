/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')

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
          type: 'individual',
          country: 'US'
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
          type: 'company',
          country: 'AT'
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
          type: 'company',
          country: 'DE'
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
    it('object for AT registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'AT'
      })
      const person = TestHelper.nextIdentity()
      await TestHelper.createCompanyDirector(user, {
        relationship_director_first_name: person.firstName,
        relationship_director_last_name: person.lastName,
        relationship_director_dob_day: '1',
        relationship_director_dob_month: '1',
        relationship_director_dob_year: '1950'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-company-directors-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.strictEqual(accountNow.company.directors_provided, true)
      await TestHelper.waitForVerificationFields(user, 'relationship.director')
      const directors = await global.api.user.connect.CompanyDirectors.get(req)
      for (const director of directors) {
        assert.strictEqual(director.requirements.past_due.length, 0)
        assert.strictEqual(director.requirements.eventually_due.length, 0)
        assert.strictEqual(director.requirements.currently_due.length, 0)
      }
    })

    it('object for AU registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'AU'
      })
      const person = TestHelper.nextIdentity()
      await TestHelper.createCompanyDirector(user, {
        relationship_director_email: person.email,
        relationship_director_relationship_title: 'SVP',
        relationship_director_first_name: person.firstName,
        relationship_director_last_name: person.lastName,
        relationship_director_dob_day: '1',
        relationship_director_dob_month: '1',
        relationship_director_dob_year: '1950'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-company-directors-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.strictEqual(accountNow.company.directors_provided, true)
      await TestHelper.waitForVerificationFields(user, 'relationship.director')
      const directors = await global.api.user.connect.CompanyDirectors.get(req)
      for (const director of directors) {
        assert.strictEqual(director.requirements.past_due.length, 0)
        assert.strictEqual(director.requirements.eventually_due.length, 0)
        assert.strictEqual(director.requirements.currently_due.length, 0)
      }
    })

    it('object for BE registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'BE'
      })
      const person = TestHelper.nextIdentity()
      await TestHelper.createCompanyDirector(user, {
        relationship_director_first_name: person.firstName,
        relationship_director_last_name: person.lastName,
        relationship_director_dob_day: '1',
        relationship_director_dob_month: '1',
        relationship_director_dob_year: '1950'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-company-directors-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.strictEqual(accountNow.company.directors_provided, true)
      await TestHelper.waitForVerificationFields(user, 'relationship.director')
      const directors = await global.api.user.connect.CompanyDirectors.get(req)
      for (const director of directors) {
        assert.strictEqual(director.requirements.past_due.length, 0)
        assert.strictEqual(director.requirements.eventually_due.length, 0)
        assert.strictEqual(director.requirements.currently_due.length, 0)
      }
    })

    it('object for CH registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'CH'
      })
      const person = TestHelper.nextIdentity()
      await TestHelper.createCompanyDirector(user, {
        relationship_director_first_name: person.firstName,
        relationship_director_last_name: person.lastName,
        relationship_director_dob_day: '1',
        relationship_director_dob_month: '1',
        relationship_director_dob_year: '1950'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-company-directors-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.strictEqual(accountNow.company.directors_provided, true)
      await TestHelper.waitForVerificationFields(user, 'relationship.director')
      const directors = await global.api.user.connect.CompanyDirectors.get(req)
      for (const director of directors) {
        assert.strictEqual(director.requirements.past_due.length, 0)
        assert.strictEqual(director.requirements.eventually_due.length, 0)
        assert.strictEqual(director.requirements.currently_due.length, 0)
      }
    })

    it('object for DE registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'DE'
      })
      const person = TestHelper.nextIdentity()
      await TestHelper.createCompanyDirector(user, {
        relationship_director_first_name: person.firstName,
        relationship_director_last_name: person.lastName,
        relationship_director_dob_day: '1',
        relationship_director_dob_month: '1',
        relationship_director_dob_year: '1950'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-company-directors-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.strictEqual(accountNow.company.directors_provided, true)
      await TestHelper.waitForVerificationFields(user, 'relationship.director')
      const directors = await global.api.user.connect.CompanyDirectors.get(req)
      for (const director of directors) {
        assert.strictEqual(director.requirements.past_due.length, 0)
        assert.strictEqual(director.requirements.eventually_due.length, 0)
        assert.strictEqual(director.requirements.currently_due.length, 0)
      }
    })

    it('object for DK registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'DK'
      })
      const person = TestHelper.nextIdentity()
      await TestHelper.createCompanyDirector(user, {
        relationship_director_first_name: person.firstName,
        relationship_director_last_name: person.lastName,
        relationship_director_dob_day: '1',
        relationship_director_dob_month: '1',
        relationship_director_dob_year: '1950'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-company-directors-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.strictEqual(accountNow.company.directors_provided, true)
      await TestHelper.waitForVerificationFields(user, 'relationship.director')
      const directors = await global.api.user.connect.CompanyDirectors.get(req)
      for (const director of directors) {
        assert.strictEqual(director.requirements.past_due.length, 0)
        assert.strictEqual(director.requirements.eventually_due.length, 0)
        assert.strictEqual(director.requirements.currently_due.length, 0)
      }
    })

    it('object for EE registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'EE'
      })
      const person = TestHelper.nextIdentity()
      await TestHelper.createCompanyDirector(user, {
        relationship_director_first_name: person.firstName,
        relationship_director_last_name: person.lastName,
        relationship_director_dob_day: '1',
        relationship_director_dob_month: '1',
        relationship_director_dob_year: '1950'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-company-directors-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.strictEqual(accountNow.company.directors_provided, true)
      await TestHelper.waitForVerificationFields(user, 'relationship.director')
      const directors = await global.api.user.connect.CompanyDirectors.get(req)
      for (const director of directors) {
        assert.strictEqual(director.requirements.past_due.length, 0)
        assert.strictEqual(director.requirements.eventually_due.length, 0)
        assert.strictEqual(director.requirements.currently_due.length, 0)
      }
    })

    it('object for ES registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'ES'
      })
      const person = TestHelper.nextIdentity()
      await TestHelper.createCompanyDirector(user, {
        relationship_director_first_name: person.firstName,
        relationship_director_last_name: person.lastName,
        relationship_director_dob_day: '1',
        relationship_director_dob_month: '1',
        relationship_director_dob_year: '1950'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-company-directors-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.strictEqual(accountNow.company.directors_provided, true)
      await TestHelper.waitForVerificationFields(user, 'relationship.director')
      const directors = await global.api.user.connect.CompanyDirectors.get(req)
      for (const director of directors) {
        assert.strictEqual(director.requirements.past_due.length, 0)
        assert.strictEqual(director.requirements.eventually_due.length, 0)
        assert.strictEqual(director.requirements.currently_due.length, 0)
      }
    })

    it('object for FI registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'FI'
      })
      const person = TestHelper.nextIdentity()
      await TestHelper.createCompanyDirector(user, {
        relationship_director_first_name: person.firstName,
        relationship_director_last_name: person.lastName,
        relationship_director_dob_day: '1',
        relationship_director_dob_month: '1',
        relationship_director_dob_year: '1950'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-company-directors-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.strictEqual(accountNow.company.directors_provided, true)
      await TestHelper.waitForVerificationFields(user, 'relationship.director')
      const directors = await global.api.user.connect.CompanyDirectors.get(req)
      for (const director of directors) {
        assert.strictEqual(director.requirements.past_due.length, 0)
        assert.strictEqual(director.requirements.eventually_due.length, 0)
        assert.strictEqual(director.requirements.currently_due.length, 0)
      }
    })

    it('object for FR registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'FR'
      })
      const person = TestHelper.nextIdentity()
      await TestHelper.createCompanyDirector(user, {
        relationship_director_first_name: person.firstName,
        relationship_director_last_name: person.lastName,
        relationship_director_dob_day: '1',
        relationship_director_dob_month: '1',
        relationship_director_dob_year: '1950'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-company-directors-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.strictEqual(accountNow.company.directors_provided, true)
      await TestHelper.waitForVerificationFields(user, 'relationship.director')
      const directors = await global.api.user.connect.CompanyDirectors.get(req)
      for (const director of directors) {
        assert.strictEqual(director.requirements.past_due.length, 0)
        assert.strictEqual(director.requirements.eventually_due.length, 0)
        assert.strictEqual(director.requirements.currently_due.length, 0)
      }
    })

    it('object for GB registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'GB'
      })
      const person = TestHelper.nextIdentity()
      await TestHelper.createCompanyDirector(user, {
        relationship_director_first_name: person.firstName,
        relationship_director_last_name: person.lastName,
        relationship_director_dob_day: '1',
        relationship_director_dob_month: '1',
        relationship_director_dob_year: '1950'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-company-directors-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.strictEqual(accountNow.company.directors_provided, true)
      await TestHelper.waitForVerificationFields(user, 'relationship.director')
      const directors = await global.api.user.connect.CompanyDirectors.get(req)
      for (const director of directors) {
        assert.strictEqual(director.requirements.past_due.length, 0)
        assert.strictEqual(director.requirements.eventually_due.length, 0)
        assert.strictEqual(director.requirements.currently_due.length, 0)
      }
    })

    it('object for IE registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'IE'
      })
      const person = TestHelper.nextIdentity()
      await TestHelper.createCompanyDirector(user, {
        relationship_director_first_name: person.firstName,
        relationship_director_last_name: person.lastName,
        relationship_director_dob_day: '1',
        relationship_director_dob_month: '1',
        relationship_director_dob_year: '1950'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-company-directors-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.strictEqual(accountNow.company.directors_provided, true)
      await TestHelper.waitForVerificationFields(user, 'relationship.director')
      const directors = await global.api.user.connect.CompanyDirectors.get(req)
      for (const director of directors) {
        assert.strictEqual(director.requirements.past_due.length, 0)
        assert.strictEqual(director.requirements.eventually_due.length, 0)
        assert.strictEqual(director.requirements.currently_due.length, 0)
      }
    })

    it('object for IT registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'IT'
      })
      const person = TestHelper.nextIdentity()
      await TestHelper.createCompanyDirector(user, {
        relationship_director_first_name: person.firstName,
        relationship_director_last_name: person.lastName,
        relationship_director_dob_day: '1',
        relationship_director_dob_month: '1',
        relationship_director_dob_year: '1950'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-company-directors-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.strictEqual(accountNow.company.directors_provided, true)
      await TestHelper.waitForVerificationFields(user, 'relationship.director')
      const directors = await global.api.user.connect.CompanyDirectors.get(req)
      for (const director of directors) {
        assert.strictEqual(director.requirements.past_due.length, 0)
        assert.strictEqual(director.requirements.eventually_due.length, 0)
        assert.strictEqual(director.requirements.currently_due.length, 0)
      }
    })

    it('object for LT registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'LT'
      })
      const person = TestHelper.nextIdentity()
      await TestHelper.createCompanyDirector(user, {
        relationship_director_first_name: person.firstName,
        relationship_director_last_name: person.lastName,
        relationship_director_dob_day: '1',
        relationship_director_dob_month: '1',
        relationship_director_dob_year: '1950'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-company-directors-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.strictEqual(accountNow.company.directors_provided, true)
      await TestHelper.waitForVerificationFields(user, 'relationship.director')
      const directors = await global.api.user.connect.CompanyDirectors.get(req)
      for (const director of directors) {
        assert.strictEqual(director.requirements.past_due.length, 0)
        assert.strictEqual(director.requirements.eventually_due.length, 0)
        assert.strictEqual(director.requirements.currently_due.length, 0)
      }
    })

    it('object for LU registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'LU'
      })
      const person = TestHelper.nextIdentity()
      await TestHelper.createCompanyDirector(user, {
        relationship_director_first_name: person.firstName,
        relationship_director_last_name: person.lastName,
        relationship_director_dob_day: '1',
        relationship_director_dob_month: '1',
        relationship_director_dob_year: '1950'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-company-directors-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.strictEqual(accountNow.company.directors_provided, true)
      await TestHelper.waitForVerificationFields(user, 'relationship.director')
      const directors = await global.api.user.connect.CompanyDirectors.get(req)
      for (const director of directors) {
        assert.strictEqual(director.requirements.past_due.length, 0)
        assert.strictEqual(director.requirements.eventually_due.length, 0)
        assert.strictEqual(director.requirements.currently_due.length, 0)
      }
    })

    it('object for LV registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'LV'
      })
      const person = TestHelper.nextIdentity()
      await TestHelper.createCompanyDirector(user, {
        relationship_director_first_name: person.firstName,
        relationship_director_last_name: person.lastName,
        relationship_director_dob_day: '1',
        relationship_director_dob_month: '1',
        relationship_director_dob_year: '1950'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-company-directors-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.strictEqual(accountNow.company.directors_provided, true)
      await TestHelper.waitForVerificationFields(user, 'relationship.director')
      const directors = await global.api.user.connect.CompanyDirectors.get(req)
      for (const director of directors) {
        assert.strictEqual(director.requirements.past_due.length, 0)
        assert.strictEqual(director.requirements.eventually_due.length, 0)
        assert.strictEqual(director.requirements.currently_due.length, 0)
      }
    })

    it('object for NL registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'NL'
      })
      const person = TestHelper.nextIdentity()
      await TestHelper.createCompanyDirector(user, {
        relationship_director_first_name: person.firstName,
        relationship_director_last_name: person.lastName,
        relationship_director_dob_day: '1',
        relationship_director_dob_month: '1',
        relationship_director_dob_year: '1950'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-company-directors-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.strictEqual(accountNow.company.directors_provided, true)
      await TestHelper.waitForVerificationFields(user, 'relationship.director')
      const directors = await global.api.user.connect.CompanyDirectors.get(req)
      for (const director of directors) {
        assert.strictEqual(director.requirements.past_due.length, 0)
        assert.strictEqual(director.requirements.eventually_due.length, 0)
        assert.strictEqual(director.requirements.currently_due.length, 0)
      }
    })

    it('object for NO registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'NO'
      })
      const person = TestHelper.nextIdentity()
      await TestHelper.createCompanyDirector(user, {
        relationship_director_first_name: person.firstName,
        relationship_director_last_name: person.lastName,
        relationship_director_dob_day: '1',
        relationship_director_dob_month: '1',
        relationship_director_dob_year: '1950'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-company-directors-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.strictEqual(accountNow.company.directors_provided, true)
      await TestHelper.waitForVerificationFields(user, 'relationship.director')
      const directors = await global.api.user.connect.CompanyDirectors.get(req)
      for (const director of directors) {
        assert.strictEqual(director.requirements.past_due.length, 0)
        assert.strictEqual(director.requirements.eventually_due.length, 0)
        assert.strictEqual(director.requirements.currently_due.length, 0)
      }
    })

    it('object for NZ registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'NZ'
      })
      const person = TestHelper.nextIdentity()
      await TestHelper.createCompanyDirector(user, {
        relationship_director_first_name: person.firstName,
        relationship_director_last_name: person.lastName,
        relationship_director_dob_day: '1',
        relationship_director_dob_month: '1',
        relationship_director_dob_year: '1950'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-company-directors-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.strictEqual(accountNow.company.directors_provided, true)
      await TestHelper.waitForVerificationFields(user, 'relationship.director')
      const directors = await global.api.user.connect.CompanyDirectors.get(req)
      for (const director of directors) {
        assert.strictEqual(director.requirements.past_due.length, 0)
        assert.strictEqual(director.requirements.eventually_due.length, 0)
        assert.strictEqual(director.requirements.currently_due.length, 0)
      }
    })

    it('object for PT registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'PT'
      })
      const person = TestHelper.nextIdentity()
      await TestHelper.createCompanyDirector(user, {
        relationship_director_first_name: person.firstName,
        relationship_director_last_name: person.lastName,
        relationship_director_dob_day: '1',
        relationship_director_dob_month: '1',
        relationship_director_dob_year: '1950'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-company-directors-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.strictEqual(accountNow.company.directors_provided, true)
      await TestHelper.waitForVerificationFields(user, 'relationship.director')
      const directors = await global.api.user.connect.CompanyDirectors.get(req)
      for (const director of directors) {
        assert.strictEqual(director.requirements.past_due.length, 0)
        assert.strictEqual(director.requirements.eventually_due.length, 0)
        assert.strictEqual(director.requirements.currently_due.length, 0)
      }
    })

    it('object for SE registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'SE'
      })
      const person = TestHelper.nextIdentity()
      await TestHelper.createCompanyDirector(user, {
        relationship_director_first_name: person.firstName,
        relationship_director_last_name: person.lastName,
        relationship_director_dob_day: '1',
        relationship_director_dob_month: '1',
        relationship_director_dob_year: '1950'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-company-directors-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.strictEqual(accountNow.company.directors_provided, true)
      await TestHelper.waitForVerificationFields(user, 'relationship.director')
      const directors = await global.api.user.connect.CompanyDirectors.get(req)
      for (const director of directors) {
        assert.strictEqual(director.requirements.past_due.length, 0)
        assert.strictEqual(director.requirements.eventually_due.length, 0)
        assert.strictEqual(director.requirements.currently_due.length, 0)
      }
    })

    it('object for SI registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'SI'
      })
      const person = TestHelper.nextIdentity()
      await TestHelper.createCompanyDirector(user, {
        relationship_director_first_name: person.firstName,
        relationship_director_last_name: person.lastName,
        relationship_director_dob_day: '1',
        relationship_director_dob_month: '1',
        relationship_director_dob_year: '1950'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-company-directors-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.strictEqual(accountNow.company.directors_provided, true)
      await TestHelper.waitForVerificationFields(user, 'relationship.director')
      const directors = await global.api.user.connect.CompanyDirectors.get(req)
      for (const director of directors) {
        assert.strictEqual(director.requirements.past_due.length, 0)
        assert.strictEqual(director.requirements.eventually_due.length, 0)
        assert.strictEqual(director.requirements.currently_due.length, 0)
      }
    })

    it('object for SK registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'SK'
      })
      const person = TestHelper.nextIdentity()
      await TestHelper.createCompanyDirector(user, {
        relationship_director_first_name: person.firstName,
        relationship_director_last_name: person.lastName,
        relationship_director_dob_day: '1',
        relationship_director_dob_month: '1',
        relationship_director_dob_year: '1950'
      })
      const req = TestHelper.createRequest(`/api/user/connect/set-company-directors-submitted?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const accountNow = await req.patch()
      assert.strictEqual(accountNow.company.directors_provided, true)
      await TestHelper.waitForVerificationFields(user, 'relationship.director')
      const directors = await global.api.user.connect.CompanyDirectors.get(req)
      for (const director of directors) {
        assert.strictEqual(director.requirements.past_due.length, 0)
        assert.strictEqual(director.requirements.eventually_due.length, 0)
        assert.strictEqual(director.requirements.currently_due.length, 0)
      }
    })
  })

  describe('configuration', () => {
    it('environment STRIPE_JS', async () => {
      global.stripeJS = 3
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'DE'
      })
      const person = TestHelper.nextIdentity()
      const req = TestHelper.createRequest(`/account/connect/create-company-director?stripeid=${user.stripeAccount.id}`)
      req.waitOnSubmit = true
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_director_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_director_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      req.body = {
        relationship_director_first_name: person.firstName,
        relationship_director_last_name: person.lastName,
        relationship_director_dob_day: '1',
        relationship_director_dob_month: '1',
        relationship_director_dob_year: '1950'
      }
      await req.post()
      const req2 = TestHelper.createRequest(`/api/user/connect/set-company-directors-submitted?stripeid=${user.stripeAccount.id}`)
      req2.account = user.account
      req2.session = user.session
      const accountNow = await req2.patch()
      assert.strictEqual(accountNow.company.directors_provided, true)
    })
  })
})
