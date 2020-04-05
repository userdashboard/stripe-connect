/* eslint-env mocha */
const assert = require('assert')
const connect = require('../../../../../index.js')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')

describe('/api/user/connect/update-stripe-account', async () => {
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

    const testedMissingFields = []
    // TODO: invalid values marked as 'false' are skipped until
    // a functional erroneous value can be provided
    const invalidIndividualValues = {
      gender: 'invalid',
      id_number: '0',
      ssn_last_4: '0',
      dob_day: '0',
      dob_month: '0',
      dob_year: '0'
    }
    const invalidCompanyValues = {
      address_line1: false,
      address_city: false,
      address_state: 'invalid',
      address_country: 'invalid',
      address_postal_code: 'invalid',
      address_kana_line1: false,
      address_kana_city: false,
      address_kana_town: 'invalid',
      address_kana_state: 'invalid',
      address_kana_postal_code: false,
      address_kanji_line1: false,
      address_kanji_city: false,
      address_kanji_town: false,
      address_kanji_state: 'invalid',
      address_kanji_postal_code: false,
      business_profile_mcc: 'invalid',
      business_profile_url: 'invalid',
      tax_id: false,
      phone: 'invalid',
      name: false,
      name_kana: false,
      name_kanji: false
    }
    for (const country of connect.countrySpecs) {
      const companyPayload = TestStripeAccounts.createPostData(TestStripeAccounts.companyData[country.id])
      for (const field in companyPayload) {
        if (testedMissingFields.indexOf(field) > -1) {
          continue
        }
        testedMissingFields.push(field)
        describe(`invalid-${field}`, async () => {
          it(`missing posted ${field}`, async () => {
            const user = await TestHelper.createUser()
            await TestHelper.createStripeAccount(user, {
              country: country.id,
              type: 'company'
            })
            const req = TestHelper.createRequest(`/api/user/connect/update-stripe-account?stripeid=${user.stripeAccount.id}`)
            req.account = user.account
            req.session = user.session
            const body = TestStripeAccounts.createPostData(TestStripeAccounts.companyData[country.id])
            delete (body[field])
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
            assert.strictEqual(errorMessage, `invalid-${field}`)
          })

          if (invalidCompanyValues[field] !== undefined && invalidCompanyValues[field] !== false) {
            it(`invalid posted ${field}`, async () => {
              const user = await TestHelper.createUser()
              await TestHelper.createStripeAccount(user, {
                country: country.id,
                type: 'company'
              })
              const req = TestHelper.createRequest(`/api/user/connect/update-stripe-account?stripeid=${user.stripeAccount.id}`)
              req.account = user.account
              req.session = user.session
              const body = TestStripeAccounts.createPostData(TestStripeAccounts.companyData[country.id])
              body[field] = invalidCompanyValues[field]
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
              assert.strictEqual(errorMessage, `invalid-${field}`)
            })
          }
        })
      }
      const individualPayload = TestStripeAccounts.createPostData(TestStripeAccounts.individualData[country.id])
      for (const field in individualPayload) {
        if (testedMissingFields.indexOf(field) > -1) {
          continue
        }
        testedMissingFields.push(field)
        describe(`invalid-${field}`, async () => {
          it(`missing posted ${field}`, async () => {
            const user = await TestHelper.createUser()
            await TestHelper.createStripeAccount(user, {
              country: country.id,
              type: 'individual'
            })
            const req = TestHelper.createRequest(`/api/user/connect/update-stripe-account?stripeid=${user.stripeAccount.id}`)
            req.account = user.account
            req.session = user.session
            const body = TestStripeAccounts.createPostData(TestStripeAccounts.individualData[country.id])
            delete (body[field])
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
            assert.strictEqual(errorMessage, `invalid-${field}`)
          })

          if (invalidIndividualValues[field] !== undefined && invalidIndividualValues[field] !== false) {
            it(`invalid posted ${field}`, async () => {
              const user = await TestHelper.createUser()
              await TestHelper.createStripeAccount(user, {
                country: country.id,
                type: 'individual'
              })
              const req = TestHelper.createRequest(`/api/user/connect/update-stripe-account?stripeid=${user.stripeAccount.id}`)
              req.account = user.account
              req.session = user.session
              const body = TestStripeAccounts.createPostData(TestStripeAccounts.individualData[country.id])
              body[field] = invalidIndividualValues[field]
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
              assert.strictEqual(errorMessage, `invalid-${field}`)
            })
          }
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
    const testedRequiredFields = []
    for (const country of connect.countrySpecs) {
      const companyPayload = TestStripeAccounts.createPostData(TestStripeAccounts.companyData[country.id])
      for (const field in companyPayload) {
        if (testedRequiredFields.indexOf(field) > -1) {
          continue
        }
        testedRequiredFields.push(field)
        it(`optionally-required posted ${field}`, async () => {
          const user = await TestHelper.createUser()
          await TestHelper.createStripeAccount(user, {
            country: country.id,
            type: 'company'
          })
          const req = TestHelper.createRequest(`/api/user/connect/update-stripe-account?stripeid=${user.stripeAccount.id}`)
          req.account = user.account
          req.session = user.session
          const body = TestStripeAccounts.createPostData(TestStripeAccounts.companyData[country.id])
          req.body = TestHelper.createMultiPart(req, body, {
            verification_document_back: TestHelper['success_id_scan_back.png'],
            verification_document_front: TestHelper['success_id_scan_front.png']
          })
          const stripeAccountNow = await req.patch()
          if (field.startsWith('address_kana_')) {
            const property = field.substring('address_kana_'.length)
            assert.strictEqual(stripeAccountNow.company.address_kana[property], body[field])
          } else if (field.startsWith('address_kanji')) {
            const property = field.substring('address_kanji_'.length)
            if (field === 'address_kanji_postal_code') {
              assert.strictEqual(stripeAccountNow.company.address_kanji[property], '１５００００１')
            } else {
              assert.strictEqual(stripeAccountNow.company.address_kanji[property], body[field])
            }
          } else if (field.startsWith('address_')) {
            const property = field.substring('address_'.length)
            assert.strictEqual(stripeAccountNow.company.address[property], body[field])
          } else if (field.startsWith('business_profile')) {
            const property = field.substring('business_profile_'.length)
            assert.strictEqual(stripeAccountNow.business_profile[property], body[field])
          } else {
            // TODO: Stripe may or may not transform the phone number
            // by removing hyphons and adding the country dial code
            // but submitting in that format is not allowed too
            if (field === 'phone') {
              if (stripeAccountNow.company[field] === body[field]) {
                assert.strictEqual(stripeAccountNow.company[field], body[field])
              } else {
                let withoutCountryCode = body[field]
                withoutCountryCode = withoutCountryCode.substring(withoutCountryCode.indexOf('4'))
                assert.strictEqual(stripeAccountNow.company[field], withoutCountryCode)
              }
            } else if (field === 'tax_id') {
              assert.strictEqual(stripeAccountNow.company.tax_id_provided, true)
            } else {
              assert.strictEqual(stripeAccountNow.company[field], body[field])
            }
          }
        })
      }
      const individualPayload = TestStripeAccounts.createPostData(TestStripeAccounts.individualData[country.id])
      for (const field in individualPayload) {
        if (testedRequiredFields.indexOf(field) > -1) {
          continue
        }
        testedRequiredFields.push(field)
        it(`optionally-required posted ${field}`, async () => {
          const user = await TestHelper.createUser()
          await TestHelper.createStripeAccount(user, {
            country: country.id,
            type: 'individual'
          })
          const req = TestHelper.createRequest(`/api/user/connect/update-stripe-account?stripeid=${user.stripeAccount.id}`)
          req.account = user.account
          req.session = user.session
          const body = TestStripeAccounts.createPostData(TestStripeAccounts.individualData[country.id])
          req.body = TestHelper.createMultiPart(req, body, {
            verification_document_back: TestHelper['success_id_scan_back.png'],
            verification_document_front: TestHelper['success_id_scan_front.png'],
            verification_additionaldocument_back: TestHelper['success_id_scan_back.png'],
            verification_additional_document_front: TestHelper['success_id_scan_front.png']
          })
          const stripeAccountNow = await req.patch()
          if (field.startsWith('address_kana_')) {
            const property = field.substring('address_kana_'.length)
            assert.strictEqual(stripeAccountNow.individual.address_kana[property], body[field])
          } else if (field.startsWith('address_kanji')) {
            const property = field.substring('address_kanji_'.length)
            if (field === 'address_kanji_postal_code') {
              assert.strictEqual(stripeAccountNow.individual.address_kanji[property], '１５００００１')
            } else {
              assert.strictEqual(stripeAccountNow.individual.address_kanji[property], body[field])
            }
          } else if (field.startsWith('address_')) {
            const property = field.substring('address_'.length)
            assert.strictEqual(stripeAccountNow.individual.address[property], body[field])
          } else if (field.startsWith('business_profile')) {
            const property = field.substring('business_profile_'.length)
            assert.strictEqual(stripeAccountNow.business_profile[property], body[field])
          } else if (field.startsWith('dob_')) {
            const property = field.substring('dob_'.length)
            assert.strictEqual(stripeAccountNow.individual.dob[property], parseInt(body[field], 10))
          } else {
            // TODO: Stripe may or may not transform the phone number
            // by removing hyphons and adding the country dial code
            // but submitting in that format is not allowed too
            if (field === 'phone') {
              if (stripeAccountNow.individual[field] === body[field]) {
                assert.strictEqual(stripeAccountNow.individual[field], body[field])
              } else {
                let withoutCountryCode = body[field]
                withoutCountryCode = withoutCountryCode.substring(withoutCountryCode.indexOf('4'))
                assert.strictEqual(stripeAccountNow.individual[field], withoutCountryCode)
              }
            } else if (field === 'ssn_last_4') {
              assert.strictEqual(stripeAccountNow.individual.ssn_last_4_provided, true)
            } else if (field === 'id_number') {
              assert.strictEqual(stripeAccountNow.individual.id_number_provided, true)
            } else {
              assert.strictEqual(stripeAccountNow.individual[field], body[field])
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
      it(`optionally-required posted ${field}`, async () => {
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
      req.filename = __filename
      req.saveResponse = true
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
