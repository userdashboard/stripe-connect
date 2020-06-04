/* eslint-env mocha */
const assert = require('assert')
const connect = require('../../../../../index.js')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@userdashboard/dashboard/test-helper.js')

describe('/api/user/connect/update-stripe-account', function () {
  this.timeout(60 * 60 * 1000)
  const rejectIndividualMissingResults = {}
  const rejectCompanyMissingResults = {}
  const submitIndividualResponse = {}
  const submitIndividualPayload = {}
  const submitCompanyResponse = {}
  const submitCompanyPayload = {}
  const testedIndividualRequiredFields = []
  const testedCompanyRequiredFields = [
    'relationship_title',
    'relationship_director',
    'relationship_executive',
    'relationship_representative',
    'relationship_owner'
  ]
  const uploadFields = [
    'verification_document_front',
    'verification_document_back',
    'verification_additional_document_front',
    'verification_additional_document_back'
  ]
  after(TestHelper.deleteOldWebhooks)
  before(async () => {
    await DashboardTestHelper.setupBeforeEach()
    await TestHelper.setupBeforeEach()
    await TestHelper.setupWebhook()
    const individuals = {}
    const companies = {}
    for (const country of connect.countrySpecs) {
      let individual = individuals[country.id]
      if (!individual) {
        individual = await TestHelper.createUser()
        await TestHelper.createStripeAccount(individual, {
          country: country.id,
          type: 'individual'
        })
        individuals[country.id] = individual
      }
      const individualPayload = TestStripeAccounts.createPostData(TestStripeAccounts.individualData[country.id])
      if (individualPayload === false) {
        continue
      }
      for (const field in individualPayload) {
        if (testedIndividualRequiredFields.indexOf(field) > -1) {
          continue
        }
        testedIndividualRequiredFields.push(field)
        const req3 = TestHelper.createRequest(`/api/user/connect/update-stripe-account?stripeid=${individual.stripeAccount.id}`)
        req3.account = individual.account
        req3.session = individual.session
        req3.body = TestStripeAccounts.createPostData(TestStripeAccounts.individualData[country.id])
        delete (req3.body[field])
        try {
          await req3.patch()
        } catch (error) {
          rejectIndividualMissingResults[field] = error.message
        }
      }
      const req3 = TestHelper.createRequest(`/api/user/connect/update-stripe-account?stripeid=${individual.stripeAccount.id}`)
      req3.account = individual.account
      req3.session = individual.session
      req3.body = TestStripeAccounts.createPostData(TestStripeAccounts.individualData[country.id])
      const submitResponse = await req3.patch()
      for (const field in individualPayload) {
        submitIndividualResponse[field] = submitResponse
      }
      submitIndividualPayload[country.id] = individualPayload
      let company = companies[country.id]
      if (!company) {
        company = await TestHelper.createUser()
        await TestHelper.createStripeAccount(company, {
          country: country.id,
          type: 'company'
        })
        companies[country.id] = company
      }
      const companyPayload = TestStripeAccounts.createPostData(TestStripeAccounts.companyData[country.id])
      if (companyPayload === false) {
        continue
      }
      for (const field in companyPayload) {
        if (testedCompanyRequiredFields.indexOf(field) > -1) {
          continue
        }
        testedCompanyRequiredFields.push(field)
        const req3 = TestHelper.createRequest(`/api/user/connect/update-stripe-account?stripeid=${company.stripeAccount.id}`)
        req3.account = company.account
        req3.session = company.session
        req3.body = TestStripeAccounts.createPostData(TestStripeAccounts.companyData[country.id])
        delete (req3.body[field])
        try {
          await req3.patch()
        } catch (error) {
          rejectCompanyMissingResults[field] = error.message
        }
      }
      const req4 = TestHelper.createRequest(`/api/user/connect/update-stripe-account?stripeid=${company.stripeAccount.id}`)
      req4.account = company.account
      req4.session = company.session
      req4.body = TestStripeAccounts.createPostData(TestStripeAccounts.companyData[country.id])
      const submitResponse2 = await req4.patch()
      for (const field in companyPayload) {
        submitCompanyResponse[field] = submitResponse2
      }
      submitCompanyPayload[country.id] = companyPayload
    }
    // upload fields
    const individual1 = await TestHelper.createUser()
    await TestHelper.createStripeAccount(individual1, {
      country: 'AT',
      type: 'individual'
    })
    await TestHelper.updateStripeAccount(individual1, TestStripeAccounts.createPostData(TestStripeAccounts.individualData.AT))
    const individual2 = await TestHelper.createUser()
    await TestHelper.createStripeAccount(individual2, {
      country: 'AT',
      type: 'individual'
    })
    await TestHelper.updateStripeAccount(individual2, TestStripeAccounts.createPostData(TestStripeAccounts.individualData.AT))
    await TestHelper.updateStripeAccount(individual2, null, {
      verification_document_front: TestHelper['success_id_scan_back.png'],
      verification_document_back: TestHelper['success_id_scan_back.png']
    })
    for (const field of uploadFields) {
      const user = field.startsWith('verification_additional') ? individual2 : individual1
      const property = field.replace('verification_', 'verification.').replace('_front', '').replace('_back', '')
      await TestHelper.waitForAccountRequirement(user, `individual.${property}`)
      const req2 = TestHelper.createRequest(`/api/user/connect/update-stripe-account?stripeid=${user.stripeAccount.id}`)
      req2.uploads = {
        verification_additional_document_front: TestHelper['success_id_scan_back.png'],
        verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        verification_document_front: TestHelper['success_id_scan_back.png'],
        verification_document_back: TestHelper['success_id_scan_back.png']
      }
      delete (req2.uploads[field])
      try {
        await req2.patch()
      } catch (error) {
        rejectIndividualMissingResults[field] = error.message
      }
    }
  })
  describe('exceptions', async () => {
    describe('invalid-stripeid', () => {
      it('missing querystring stripeid', async () => {
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/connect/update-stripe-account')
        req.account = user.account
        req.session = user.session
        req.body = TestStripeAccounts.createPostData(TestStripeAccounts.companyData.US)
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
        const req = TestHelper.createRequest('/api/user/connect/update-stripe-account?stripeid=invalid')
        req.account = user.account
        req.session = user.session
        req.body = TestStripeAccounts.createPostData(TestStripeAccounts.companyData.US)
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
          country: 'DE',
          type: 'company'
        })
        const user2 = await TestHelper.createUser()
        const req = TestHelper.createRequest(`/api/user/connect/update-stripe-account?stripeid=${user.stripeAccount.id}`)
        req.account = user2.account
        req.session = user2.session
        req.body = TestStripeAccounts.createPostData(TestStripeAccounts.companyData.DE)
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-account')
      })
    })
    // const invalidIndividualValues = {
    //   gender: 'invalid',
    //   id_number: '0',
    //   ssn_last_4: '0',
    //   dob_day: '0',
    //   dob_month: '0',
    //   dob_year: '0'
    // }
    // const invalidCompanyValues = {
    //   address_line1: false,
    //   address_city: false,
    //   address_state: 'invalid',
    //   address_country: 'invalid',
    //   address_postal_code: 'invalid',
    //   address_kana_line1: false,
    //   address_kana_city: false,
    //   address_kana_town: 'invalid',
    //   address_kana_state: 'invalid',
    //   address_kana_postal_code: false,
    //   address_kanji_line1: false,
    //   address_kanji_city: false,
    //   address_kanji_town: false,
    //   address_kanji_state: 'invalid',
    //   address_kanji_postal_code: false,
    //   business_profile_mcc: 'invalid',
    //   business_profile_url: 'invalid',
    //   tax_id: false,
    //   phone: 'invalid',
    //   name: false,
    //   name_kana: false,
    //   name_kanji: false
    // }
    const testedCompanyMissingFields = []
    for (const country of connect.countrySpecs) {
      const companyPayload = TestStripeAccounts.createPostData(TestStripeAccounts.companyData[country.id])
      for (const field in companyPayload) {
        if (testedCompanyMissingFields.indexOf(field) > -1) {
          continue
        }
        testedCompanyMissingFields.push(field)
        describe(`invalid-${field}`, async () => {
          it(`missing posted ${field} (company)`, async () => {
            const errorMessage = rejectCompanyMissingResults[field]
            assert.strictEqual(errorMessage, `invalid-${field}`)
          })

          // if (invalidCompanyValues[field] !== undefined && invalidCompanyValues[field] !== false) {
          //   it(`invalid posted ${field}`, async () => {
          //     const errorMessage = rejectCompanyInvalidResults[field]
          //     assert.strictEqual(errorMessage, `invalid-${field}`)
          //   })
          // }
        })
      }
    }
    const testedIndividualMissingFields = []
    for (const country of connect.countrySpecs) {
      const individualPayload = TestStripeAccounts.createPostData(TestStripeAccounts.individualData[country.id])
      for (const field in individualPayload) {
        if (testedIndividualMissingFields.indexOf(field) > -1) {
          continue
        }
        testedIndividualMissingFields.push(field)
        describe(`invalid-${field}`, async () => {
          it(`missing posted ${field} (individual)`, async () => {
            const errorMessage = rejectIndividualMissingResults[field]
            assert.strictEqual(errorMessage, `invalid-${field}`)
          })

          // if (invalidIndividualValues[field] !== undefined && invalidIndividualValues[field] !== false) {
          //   it(`invalid posted ${field}`, async () => {
          //     const errorMessage = rejectInvidividualInvalidResults[field]
          //     assert.strictEqual(errorMessage, `invalid-${field}`)
          //   })
          // }
        })
      }
    }

    describe('invalid-token', () => {
      it('missing posted token', async () => {
        global.stripeJS = 3
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'GB',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-stripe-account?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = TestHelper.createMultiPart(req, TestStripeAccounts.createPostData(TestStripeAccounts.companyData.GB), {
          verification_document_back: TestHelper['success_id_scan_back.png'],
          verification_document_front: TestHelper['success_id_scan_front.png']
        })
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-token')
      })

      it('invalid posted token', async () => {
        global.stripeJS = 3
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'GB',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-stripe-account?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const body = TestStripeAccounts.createPostData(TestStripeAccounts.companyData.GB)
        body.token = 'invalid'
        req.body = TestHelper.createMultiPart(req, body, {
          verification_document_back: TestHelper['success_id_scan_back.png'],
          verification_document_front: TestHelper['success_id_scan_front.png']
        })
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-token')
      })
    })
  })

  describe('receives', () => {
    const testedCompanyRequiredFields = []
    for (const country of connect.countrySpecs) {
      const companyPayload = submitCompanyPayload[country.id]
      for (const field in companyPayload) {
        if (testedCompanyRequiredFields.indexOf(field) > -1) {
          continue
        }
        testedCompanyRequiredFields.push(field)
        it(`optionally-required posted ${field}`, async () => {
          const stripeAccountNow = submitCompanyResponse[field]
          if (field.startsWith('address_kana_')) {
            const property = field.substring('address_kana_'.length)
            assert.strictEqual(stripeAccountNow.company.address_kana[property], companyPayload[field])
          } else if (field.startsWith('address_kanji')) {
            const property = field.substring('address_kanji_'.length)
            if (field === 'address_kanji_patchal_code') {
              assert.strictEqual(stripeAccountNow.company.address_kanji[property], '１５００００１')
            } else {
              assert.strictEqual(stripeAccountNow.company.address_kanji[property], companyPayload[field])
            }
          } else if (field.startsWith('address_')) {
            const property = field.substring('address_'.length)
            assert.strictEqual(stripeAccountNow.company.address[property], companyPayload[field])
          } else if (field.startsWith('business_profile')) {
            const property = field.substring('business_profile_'.length)
            assert.strictEqual(stripeAccountNow.business_profile[property], companyPayload[field])
          } else {
            // TODO: Stripe may or may not transform the phone number
            // by removing hyphons and adding the country dial code
            // but submitting in that format is not allowed too
            if (field === 'phone') {
              if (stripeAccountNow.company[field] === companyPayload[field]) {
                assert.strictEqual(stripeAccountNow.company[field], companyPayload[field])
              } else {
                let withoutCountryCode = companyPayload[field]
                withoutCountryCode = withoutCountryCode.substring(withoutCountryCode.indexOf('4'))
                assert.strictEqual(stripeAccountNow.company[field], withoutCountryCode)
              }
            } else if (field === 'tax_id') {
              assert.strictEqual(stripeAccountNow.company.tax_id_provided, true)
            } else {
              assert.strictEqual(stripeAccountNow.company[field], companyPayload[field])
            }
          }
        })
      }
    }
    const testedIndividualRequiredFields = []
    for (const country of connect.countrySpecs) {
      const individualPayload = submitIndividualPayload[country.id]
      for (const field in individualPayload) {
        if (testedIndividualRequiredFields.indexOf(field) > -1) {
          continue
        }
        testedIndividualRequiredFields.push(field)
        it(`optionally-required posted ${field}`, async () => {
          const stripeAccountNow = submitIndividualResponse[field]
          if (field.startsWith('address_kana_')) {
            const property = field.substring('address_kana_'.length)
            assert.strictEqual(stripeAccountNow.individual.address_kana[property], individualPayload[field])
          } else if (field.startsWith('address_kanji')) {
            const property = field.substring('address_kanji_'.length)
            if (field === 'address_kanji_patchal_code') {
              assert.strictEqual(stripeAccountNow.individual.address_kanji[property], '１５００００１')
            } else {
              assert.strictEqual(stripeAccountNow.individual.address_kanji[property], individualPayload[field])
            }
          } else if (field.startsWith('address_')) {
            const property = field.substring('address_'.length)
            assert.strictEqual(stripeAccountNow.individual.address[property], individualPayload[field])
          } else if (field.startsWith('business_profile')) {
            const property = field.substring('business_profile_'.length)
            assert.strictEqual(stripeAccountNow.business_profile[property], individualPayload[field])
          } else if (field.startsWith('dob_')) {
            const property = field.substring('dob_'.length)
            assert.strictEqual(stripeAccountNow.individual.dob[property], parseInt(individualPayload[field], 10))
          } else {
            // TODO: Stripe may or may not transform the phone number
            // by removing hyphons and adding the country dial code
            // but submitting in that format is not allowed too
            if (field === 'phone') {
              if (stripeAccountNow.individual[field] === individualPayload[field]) {
                assert.strictEqual(stripeAccountNow.individual[field], individualPayload[field])
              } else {
                let withoutCountryCode = individualPayload[field]
                withoutCountryCode = withoutCountryCode.substring(withoutCountryCode.indexOf('4'))
                assert.strictEqual(stripeAccountNow.individual[field], withoutCountryCode)
              }
            } else if (field === 'ssn_last_4') {
              assert.strictEqual(stripeAccountNow.individual.ssn_last_4_provided, true)
            } else if (field === 'id_number') {
              assert.strictEqual(stripeAccountNow.individual.id_number_provided, true)
            } else {
              assert.strictEqual(stripeAccountNow.individual[field], individualPayload[field])
            }
          }
        })
      }
    }

    const uploadFields = [
      // may be company or individual verification document
      'verification_document_front',
      'verification_document_back',
      // only individual
      'verification_additional_document_front',
      'verification_additional_document_back'
    ]
    for (const field of uploadFields) {
      it(`optionally-required patched ${field}`, async () => {
        const user = await TestHelper.createUser()
        if (field.indexOf('additional') > -1) {
          await TestHelper.createStripeAccount(user, {
            country: 'GB',
            type: 'individual'
          })
        } else {
          await TestHelper.createStripeAccount(user, {
            country: 'GB',
            type: 'company'
          })
        }
        const req = TestHelper.createRequest(`/api/user/connect/update-stripe-account?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        let body
        if (user.stripeAccount.business_type === 'company') {
          body = TestStripeAccounts.createPostData(TestStripeAccounts.companyData.GB)
        } else {
          body = TestStripeAccounts.createPostData(TestStripeAccounts.individualData.GB)
        }
        req.body = TestHelper.createMultiPart(req, body, {
          [field]: TestHelper['success_id_scan_back.png']
        })
        const stripeAccountNow = await req.patch()
        if (field === 'verification_document_front') {
          assert.notStrictEqual(stripeAccountNow.company.verification.document.front, null)
          assert.notStrictEqual(stripeAccountNow.company.verification.document.front, undefined)
        } else if (field === 'verification_document_back') {
          assert.notStrictEqual(stripeAccountNow.company.verification.document.back, null)
          assert.notStrictEqual(stripeAccountNow.company.verification.document.back, undefined)
        } else if (field === 'verification_additional_document_front') {
          assert.notStrictEqual(stripeAccountNow.individual.verification.additional_document.front, null)
          assert.notStrictEqual(stripeAccountNow.individual.verification.additional_document.front, undefined)
        } else {
          assert.notStrictEqual(stripeAccountNow.individual.verification.additional_document.back, null)
          assert.notStrictEqual(stripeAccountNow.individual.verification.additional_document.back, undefined)
        }
      })
    }
  })

  describe('returns', () => {
    it('object (company)', async () => {
      const country = connect.countrySpecs[Math.floor(Math.random() * connect.countrySpecs.length)]
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: country.id,
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-stripe-account?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = TestStripeAccounts.createPostData(TestStripeAccounts.companyData[country.id])
      req.uploads = {
        verification_document_back: TestHelper['success_id_scan_back.png'],
        verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const stripeAccountNow = await req.patch()
      assert.strictEqual(stripeAccountNow.object, 'account')
      assert.strictEqual(stripeAccountNow.metadata.token, 'false')
    })

    it('object (individual)', async () => {
      const country = connect.countrySpecs[Math.floor(Math.random() * connect.countrySpecs.length)]
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: country.id,
        type: 'individual'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-stripe-account?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = TestStripeAccounts.createPostData(TestStripeAccounts.individualData[country.id])
      req.uploads = {
        verification_document_back: TestHelper['success_id_scan_back.png'],
        verification_document_front: TestHelper['success_id_scan_front.png']
      }
      req.filename = __filename
      req.saveResponse = true
      const stripeAccountNow = await req.patch()
      assert.strictEqual(stripeAccountNow.object, 'account')
      assert.strictEqual(stripeAccountNow.metadata.token, 'false')
    })
  })

  describe('configuration', () => {
    it('environment STRIPE_JS', async () => {
      global.stripeJS = 3
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-stripe-account?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = TestStripeAccounts.createPostData(TestStripeAccounts.companyData.US)
      await req.post()
      const stripeAccountNow = await global.api.user.connect.StripeAccount.get(req)
      // TODO: verifying information was submitted by token is
      // not possible so for now when objects are updated
      // without a token they have a metadata.token = false flag set
      assert.strictEqual(stripeAccountNow.metadata.token, undefined)
    })
  })
})
