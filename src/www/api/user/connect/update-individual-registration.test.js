/* eslint-env mocha */
const assert = require('assert')
const connect = require('../../../../../index.js')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')

describe('/api/user/connect/update-individual-registration', () => {
  describe('exceptions', () => {
    describe('invalid-stripeid', () => {
      it('missing querystring stripeid', async () => {
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/connect/update-individual-registration')
        req.account = user.account
        req.session = user.session
        req.body = TestStripeAccounts.createPostData(TestStripeAccounts.individualData.US)
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
        const req = TestHelper.createRequest('/api/user/connect/update-individual-registration?stripeid=invalid')
        req.account = user.account
        req.session = user.session
        req.body = TestStripeAccounts.createPostData(TestStripeAccounts.individualData.US)
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
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user2.account
        req.session = user2.session
        req.body = TestStripeAccounts.createPostData(TestStripeAccounts.individualData.DE)
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-account')
      })
    })

    describe('invalid-stripe-account', () => {
      it('ineligible querystring stripe account', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'DE',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = TestStripeAccounts.createPostData(TestStripeAccounts.individualData.DE)
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-stripe-account')
      })
    })

    const testedMissingFields = []
    // TODO: invalid values marked as 'false' are skipped until they can be verified
    const invalidValues = {
      address_line1: false,
      address_city: false,
      address_state: 'invalid',
      address_country: 'invalid',
      address_postal_code: 'invalid',
      address_kana_line1: false,
      address_kana_city: false,
      address_kana_town: 'invalid',
      address_kana_state: 'invalid',
      address_kana_postal_code: 'invalid',
      address_kanji_line1: false,
      address_kanji_city: false,
      address_kanji_town: false,
      address_kanji_state: false,
      address_kanji_postal_code: false,
      business_profile_mcc: 'invalid',
      business_profile_url: 'invalid',
      dob_day: '32',
      dob_month: '15',
      dob_year: '2020',
      first_name: false,
      first_name_kana: false,
      first_name_kanji: false,
      gender: false,
      id_number: false,
      last_name: false,
      last_name_kana: false,
      last_name_kanji: false,
      email: false,
      phone: false,
      ssn_last_4: false
    }
    for (const country of connect.countrySpecs) {
      const payload = TestStripeAccounts.createPostData(TestStripeAccounts.individualData[country.id])
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
              type: 'individual'
            })
            const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
            req.account = user.account
            req.session = user.session
            req.uploads = {
              verification_document_back: TestHelper['success_id_scan_back.png'],
              verification_document_front: TestHelper['success_id_scan_front.png']
            }
            const body = TestStripeAccounts.createPostData(TestStripeAccounts.individualData[country.id])
            delete (body[field])
            req.body = TestHelper.createMultiPart(req, body)
            let errorMessage
            try {
              await req.patch()
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
                type: 'individual'
              })
              const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
              req.account = user.account
              req.session = user.session
              req.uploads = {
                verification_document_back: TestHelper['success_id_scan_back.png'],
                verification_document_front: TestHelper['success_id_scan_front.png']
              }
              const body = TestStripeAccounts.createPostData(TestStripeAccounts.individualData[country.id])
              body[field] = invalidValues[field]
              req.body = TestHelper.createMultiPart(req, body)
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
          type: 'individual'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          verification_document_back: TestHelper['success_id_scan_back.png'],
          verification_document_front: TestHelper['success_id_scan_front.png']
        }
        req.body = TestHelper.createMultiPart(req, TestStripeAccounts.createPostData(TestStripeAccounts.individualData.GB))
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
          type: 'individual'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          verification_document_back: TestHelper['success_id_scan_back.png'],
          verification_document_front: TestHelper['success_id_scan_front.png']
        }
        const body = TestStripeAccounts.createPostData(TestStripeAccounts.individualData.GB)
        body.token = 'invalid'
        req.body = TestHelper.createMultiPart(req, body)
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
      const payload = TestStripeAccounts.createPostData(TestStripeAccounts.individualData[country.id])
      if (payload === false) {
        continue
      }
      for (const field in payload) {
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
          const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
          req.account = user.account
          req.session = user.session
          req.uploads = {
            verification_document_back: TestHelper['success_id_scan_back.png'],
            verification_document_front: TestHelper['success_id_scan_front.png']
          }
          const body = TestStripeAccounts.createPostData(TestStripeAccounts.individualData[country.id])
          req.body = TestHelper.createMultiPart(req, body)
          const stripeAccount = await req.patch()
          if (field.startsWith('address_kana')) {
            const property = field.substring('address_kana_'.length)
            assert.strictEqual(stripeAccount.individual.address_kana[property], body[field])
          } else if (field.startsWith('address_kanji')) {
            if (field === 'address_kanji_postal_code') {
              // TODO: Stripe transforms the character set used in this data
              // so a direct comparison isn't possible right now
              assert.strictEqual(stripeAccount.individual.address_kanji.postal_code, '１５００００１')
            } else {
              const property = field.substring('address_kanji_'.length)
              assert.strictEqual(stripeAccount.individual.address_kanji[property], body[field])
            }
          } else if (field.startsWith('address_')) {
            const property = field.substring('address_'.length)
            assert.strictEqual(stripeAccount.individual.address[property], body[field])
          } else if (field.startsWith('dob_')) {
            const property = field.substring('dob_'.length)
            assert.strictEqual(stripeAccount.individual.dob[property], parseInt(body[field]))
          } else if (field.startsWith('business_profile')) {
            const property = field.substring('business_profile_'.length)
            assert.strictEqual(stripeAccount.business_profile[property], body[field])
          } else if (field === 'id_number') {
            assert.strictEqual(stripeAccount.individual.id_number_provided, true)
          } else if (field === 'ssn_last_4') {
            assert.strictEqual(stripeAccount.individual.ssn_last_4_provided, true)
          } else {
            // TODO: Stripe may or may not transform the phone number
            // by removing hyphons and adding the country dial code
            // but submitting in that format is not allowed too
            if (field === 'phone') {
              if (stripeAccount.individual[field] === body[field]) {
                assert.strictEqual(stripeAccount.individual[field], body[field])
              } else {
                const withCountryCode = `+1${body[field]}`
                assert.strictEqual(stripeAccount.individual[field], withCountryCode)
              }
            } else {
              assert.strictEqual(stripeAccount.individual[field], body[field])
            }
          }
        })
      }
    }

    const uploadFields = [
      'verification_document_front',
      'verification_document_back',
      'verification_additional_document_front',
      'verification_additional_document_back'
    ]
    for (const field of uploadFields) {
      it(`optionally-required posted ${field}`, async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'GB',
          type: 'individual'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          [field]: TestHelper['success_id_scan_back.png']
        }
        const body = TestStripeAccounts.createPostData(TestStripeAccounts.individualData.GB)
        body[field] = 'invalid'
        req.body = TestHelper.createMultiPart(req, body)
        const stripeAccount = await req.patch()
        if (field === 'verification_document_front') {
          assert.notStrictEqual(stripeAccount.individual.verification.document.front, null)
          assert.notStrictEqual(stripeAccount.individual.verification.document.front, undefined)
        } else if (field === 'verification_document_back') {
          assert.notStrictEqual(stripeAccount.individual.verification.document.back, null)
          assert.notStrictEqual(stripeAccount.individual.verification.document.back, undefined)
        } else if (field === 'verification_additional_document_front') {
          assert.notStrictEqual(stripeAccount.individual.verification.additional_document.front, null)
          assert.notStrictEqual(stripeAccount.individual.verification.additional_document.front, undefined)
        } else if (field === 'verification_additional_document_back') {
          assert.notStrictEqual(stripeAccount.individual.verification.additional_document.back, null)
          assert.notStrictEqual(stripeAccount.individual.verification.additional_document.back, undefined)
        }
      })
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
        const req = TestHelper.createRequest(`/api/user/connect/update-individual-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = TestStripeAccounts.createPostData(TestStripeAccounts.individualData[country.id])
        req.filename = __filename
        req.saveResponse = true
        const stripeAccountNow = await req.patch()
        assert.strictEqual(stripeAccountNow.metadata.token, 'false')
        assert.strictEqual(stripeAccountNow.object, 'account')
      })
    }
  })

  describe('configuration', () => {
    it('environment STRIPE_JS', async () => {
      global.stripeJS = 3
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'GB',
        type: 'individual'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        verification_document_back: TestHelper['success_id_scan_back.png'],
        verification_document_front: TestHelper['success_id_scan_front.png']
      }
      req.body = TestStripeAccounts.createPostData(TestStripeAccounts.individualData.GB, user.profile)
      await req.post()
      const stripeAccountNow = await global.api.user.connect.StripeAccount.get(req)
      // TODO: verifying information was submitted by token is not possible
      // so for now when objects are created/updated without a token they
      // have a metadata.token = false flag set
      assert.strictEqual(stripeAccountNow.metadata.token, undefined)
    })
  })
})
