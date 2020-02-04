/* eslint-env mocha */
const assert = require('assert')
const connect = require('../../../../../index.js')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')

describe('/api/user/connect/create-company-representative', () => {
  describe('exceptions', () => {
    describe('invalid-stripeid', () => {
      it('missing querystring stripeid', async () => {
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/connect/create-company-representative')
        req.account = user.account
        req.session = user.session

        let errorMessage
        try {
          await req.post(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-stripeid')
      })

      it('invalid querystring stripeid', async () => {
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/connect/create-company-representative?stripeid=invalid')
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.post(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-stripeid')
      })
    })

    describe('invalid-stripe-account', () => {
      it('ineligible stripe account for individuals', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'US',
          type: 'individual'
        })
        const req = TestHelper.createRequest(`/api/user/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.post(req)
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
          country: 'US',
          type: 'company'
        })
        const user2 = await TestHelper.createUser()
        const req = TestHelper.createRequest(`/api/user/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
        req.account = user2.account
        req.session = user2.session
        let errorMessage
        try {
          await req.post(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-account')
      })
    })

    const testedMissingFields = []
    // TODO: invalid values marked as 'false' are skipped until they can be verified
    const invalidValues = {
      address_line1: false,
      address_city: false,
      address_state: 'invalid',
      address_postal_code: false,
      address_kana_line1: false,
      address_kana_city: false,
      address_kana_town: false,
      address_kana_state: false,
      address_kana_postal_code: false,
      address_kanji_line1: false,
      address_kanji_city: false,
      address_kanji_town: false,
      address_kanji_state: false,
      address_kanji_postal_code: false,
      dob_day: '32',
      dob_month: '15',
      dob_year: '2020',
      first_name: false,
      first_name_kana: false,
      first_name_kanji: false,
      last_name: false,
      last_name_kana: false,
      last_name_kanji: false,
      email: false,
      gender: 'invalid',
      phone: false,
      id_number: false,
      relationship_executive: false,
      relationship_title: false,
      ssn_last_4: 'invalid'
    }
    for (const country of connect.countrySpecs) {
      const payload = TestStripeAccounts.createPostData(TestStripeAccounts.representativeData[country.id])
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
            const req = TestHelper.createRequest(`/api/user/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
            req.account = user.account
            req.session = user.session
            req.uploads = {
              verification_document_back: TestHelper['success_id_scan_back.png'],
              verification_document_front: TestHelper['success_id_scan_front.png']
            }
            const body = TestStripeAccounts.createPostData(TestStripeAccounts.representativeData[country.id])
            delete (body[field])
            req.body = TestHelper.createMultiPart(req, body)
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
              const req = TestHelper.createRequest(`/api/user/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
              req.account = user.account
              req.session = user.session
              req.uploads = {
                verification_document_back: TestHelper['success_id_scan_back.png'],
                verification_document_front: TestHelper['success_id_scan_front.png']
              }
              const body = TestStripeAccounts.createPostData(TestStripeAccounts.representativeData[country.id])
              body[field] = 'invalid'
              req.body = TestHelper.createMultiPart(req, body)
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

    describe('invalid-token', () => {
      it('missing posted token', async () => {
        global.stripeJS = 3
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'US',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          verification_document_back: TestHelper['success_id_scan_back.png'],
          verification_document_front: TestHelper['success_id_scan_front.png']
        }
        req.body = {
          token: ''
        }
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-token')
      })

      it('invalid posted token', async () => {
        global.stripeJS = 3
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'US',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          verification_document_back: TestHelper['success_id_scan_back.png'],
          verification_document_front: TestHelper['success_id_scan_front.png']
        }
        req.body = {
          token: 'invalid'
        }
        let errorMessage
        try {
          await req.post()
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
      const payload = TestStripeAccounts.createPostData(TestStripeAccounts.representativeData[country.id])
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
            type: 'company'
          })
          const req = TestHelper.createRequest(`/api/user/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
          req.account = user.account
          req.session = user.session
          req.uploads = {
            verification_document_back: TestHelper['success_id_scan_back.png'],
            verification_document_front: TestHelper['success_id_scan_front.png']
          }
          const body = TestStripeAccounts.createPostData(TestStripeAccounts.representativeData[country.id])
          req.body = TestHelper.createMultiPart(req, body)
          const representative = await req.post()
          if (field.startsWith('address_kana')) {
            const property = field.substring('address_kana_'.length)
            assert.strictEqual(representative.address_kana[property], body[field])
          } else if (field.startsWith('address_kanji')) {
            const property = field.substring('address_kanji_'.length)
            assert.strictEqual(representative.address_kanji[property], body[field])
          } else if (field.startsWith('address_')) {
            const property = field.substring('address_'.length)
            assert.strictEqual(representative.address[property], body[field])
          } else if (field.startsWith('dob_')) {
            const property = field.substring('dob_'.length)
            assert.strictEqual(representative.dob[property], parseInt(body[field]))
          } else if (field.startsWith('relationship_')) {
            const property = field.substring('relationship_'.length)
            if (body[field] === 'true') {
              assert.strictEqual(representative.relationship[property], true)
            } else {
              assert.strictEqual(representative.relationship[property], body[field])
            }
          } else if (field === 'id_number') {
            assert.strictEqual(representative.id_number_provided, true)
          } else if (field === 'ssn_last_4') {
            assert.strictEqual(representative.ssn_last_4_provided, true)
          } else {
            // TODO: Stripe may or may not transform the phone number
            // by removing hyphons and adding the country dial code
            // so all test data is using that format, but
            // Stripe may also remove the country code too so this
            // can be fixed when they have a consistent transformation
            if (field === 'phone') {
              if (representative[field] === body[field]) {
                assert.strictEqual(representative[field], body[field])
              } else {
                let withoutCountryCode = body[field]
                withoutCountryCode = withoutCountryCode.substring(withoutCountryCode.indexOf('4'))
                assert.strictEqual(representative[field], withoutCountryCode)
              }
            } else {
              assert.strictEqual(representative[field], body[field])
            }
          }
        })
      }
    }

    it('optionally-required posted token', async () => {
      global.stripeJS = 3
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
      req.waitOnSubmit = true
      req.account = user.account
      req.session = user.session
      req.uploads = {
        verification_document_back: TestHelper['success_id_scan_back.png'],
        verification_document_front: TestHelper['success_id_scan_front.png']
      }
      req.body = TestStripeAccounts.createPostData(TestStripeAccounts.representativeData.US, user.profile)
      await req.post()
      const req2 = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
      req2.waitOnSubmit = true
      req2.account = user.account
      req2.session = user.session
      req2.uploads = {
        verification_document_back: TestHelper['success_id_scan_back.png'],
        verification_document_front: TestHelper['success_id_scan_front.png']
      }
      req2.body = TestHelper.createMultiPart(req, {})
      await req2.post()
      const personNow = await global.api.user.connect.StripeAccount.get(req2)
      assert.strictEqual(personNow.metadata.token, undefined)
    })
  })

  describe('returns', () => {
    for (const country of connect.countrySpecs) {
      it('object (' + country.id + ')', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: country.id,
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = TestStripeAccounts.createPostData(TestStripeAccounts.representativeData[country.id], user.profile)
        req.uploads = {
          verification_document_front: TestHelper['success_id_scan_back.png'],
          verification_document_back: TestHelper['success_id_scan_back.png']
        }
        req.filename = __filename
        req.saveResponse = true
        req.body = TestHelper.createMultiPart(req, req.body)
        const representative = await req.post()
        assert.strictEqual(representative.object, 'person')
        assert.strictEqual(representative.metadata.token, 'false')
      })
    }
  })

  describe('configuration', () => {
    it('environment STRIPE_JS', async () => {
      global.stripeJS = 3
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
      req.waitOnSubmit = true
      req.account = user.account
      req.session = user.session
      req.uploads = {
        verification_document_back: TestHelper['success_id_scan_back.png'],
        verification_document_front: TestHelper['success_id_scan_front.png']
      }
      req.body = TestStripeAccounts.createPostData(TestStripeAccounts.representativeData.US, user.profile)
      await req.post()
      const req2 = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
      req2.waitOnSubmit = true
      req2.account = user.account
      req2.session = user.session
      req2.uploads = {
        verification_document_back: TestHelper['success_id_scan_back.png'],
        verification_document_front: TestHelper['success_id_scan_front.png']
      }
      req2.body = TestHelper.createMultiPart(req, {})
      await req2.post()
      const personNow = await global.api.user.connect.StripeAccount.get(req2)
      assert.strictEqual(personNow.metadata.token, undefined)
    })
  })
})
