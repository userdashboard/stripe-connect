/* eslint-env mocha */
const assert = require('assert')
const connect = require('../../../../../index.js')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')

describe('/api/user/connect/update-company-representative', () => {
  describe('exceptions', () => {
    describe('invalid-personid', () => {
      it('missing querystring personid', async () => {
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/connect/update-company-representative')
        req.account = user.account
        req.session = user.session
        req.body = TestStripeAccounts.createPostData(TestStripeAccounts.representativeData.US)
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-personid')
      })

      it('invalid querystring personid', async () => {
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/connect/update-company-representative?personid=invalid')
        req.account = user.account
        req.session = user.session
        req.body = TestStripeAccounts.createPostData(TestStripeAccounts.representativeData.US)
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-personid')
      })
    })

    describe('invalid-account', () => {
      it('ineligible accessing account', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'DE',
          type: 'company'
        })
        await TestHelper.createCompanyRepresentative(user, TestStripeAccounts.createPostData(TestStripeAccounts.representativeData.DE), {
          verification_document_back: TestHelper['success_id_scan_back.png'],
          verification_document_front: TestHelper['success_id_scan_front.png']
        })
        const user2 = await TestHelper.createUser()
        const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?personid=${user.representative.id}`)
        req.account = user2.account
        req.session = user2.session
        req.body = TestStripeAccounts.createPostData(TestStripeAccounts.representativeData.DE)
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-account')
      })
    })

    describe('invalid-person', () => {
      it('ineligible querystring person', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'DE',
          type: 'company'
        })
        await TestHelper.createCompanyDirector(user, TestStripeAccounts.createPostData(TestStripeAccounts.representativeData.DE), {
          verification_document_back: TestHelper['success_id_scan_back.png'],
          verification_document_front: TestHelper['success_id_scan_front.png']
        })
        const user2 = await TestHelper.createUser()
        const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?personid=${user.representative.id}`)
        req.account = user2.account
        req.session = user2.session
        req.body = TestStripeAccounts.createPostData(TestStripeAccounts.representativeData.DE)
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-person')
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
      address_kanji_town: 'invalid',
      address_kanji_state: 'invalid',
      address_kanji_postal_code: 'invalid',
      dob_day: '32',
      dob_month: '15',
      dob_year: '2020',
      first_name: false,
      first_name_kana: false,
      first_name_kanji: false,
      gender: 'invalid',
      last_name: false,
      last_name_kana: false,
      last_name_kanji: false,
      email: false,
      phone: false,
      id_number: false,
      relationship_title: false,
      relationship_executive: false,
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
            const user = await TestStripeAccounts.createCompanyWithFailedrepresentativeField(country.id, 'address')
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
          country: 'GB',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          verification_document_back: TestHelper['success_id_scan_back.png'],
          verification_document_front: TestHelper['success_id_scan_front.png']
        }
        req.body = TestHelper.createMultiPart(req, TestStripeAccounts.createPostData(TestStripeAccounts.representativeData.GB))
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
        const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          verification_document_back: TestHelper['success_id_scan_back.png'],
          verification_document_front: TestHelper['success_id_scan_front.png']
        }
        const body = TestStripeAccounts.createPostData(TestStripeAccounts.representativeData.GB)
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
    const fieldMaps = {
      address_line1: 'representative.address',
      address_city: 'representative.address',
      address_state: 'representative.address',
      address_postal_code: 'representative.address',
      address_country: 'representative.address',
      dob_day: 'representative.dob',
      dob_month: 'representative.dob',
      dob_year: 'representative.year',
      verification_document_front: 'representative.document',
      verification_document_back: 'representative.document',
      verification_additional_document_front: 'representative.additional_document',
      verification_additional_document_back: 'representative.additional_document'
    }
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
          const user = await TestStripeAccounts.createCompanyWithFailedrepresentativeField(country.id, fieldMaps[field])
          const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
          req.account = user.account
          req.session = user.session
          req.uploads = {
            verification_document_back: TestHelper['success_id_scan_back.png'],
            verification_document_front: TestHelper['success_id_scan_front.png']
          }
          const body = TestStripeAccounts.createPostData(TestStripeAccounts.representativeData[country.id])
          req.body = TestHelper.createMultiPart(req, body)
          const representative = await req.patch()
          if (field.startsWith('address_kana')) {
            const property = field.substring('address_kana'.length)
            assert.strictEqual(representative.address_kana[property], body[field])
          } else if (field.startsWith('address_kanji')) {
            const property = field.substring('address_kanji'.length)
            assert.strictEqual(representative.address_kanji[property], body[field])
          } else if (field.startsWith('address_')) {
            const property = field.substring('address_'.length)
            assert.strictEqual(representative.address[property], body[field])
          } else if (field.startsWith('dob_')) {
            const property = field.substring('dob_'.length)
            assert.strictEqual(representative.address[property], body[field])
          } else if (field === 'id_number') {
            assert.strictEqual(representative.id_number_provided, true)
          } else if (field === 'ssn_last_4') {
            assert.strictEqual(representative.ssn_last_4, true)
          } else {
            assert.strictEqual(representative[field], body[field])
          }
        })
      }
    }

    const uploadFields = [
      'verification_document_front',
      'verification_document_back'
    ]
    for (const field of uploadFields) {
      it(`optionally-required posted ${field}`, async () => {
        const user = await TestStripeAccounts.createCompanyWithFailedrepresentativeField('FR', fieldMaps[field])
        const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          [field]: TestHelper['success_id_scan_back.png']
        }
        const body = TestStripeAccounts.createPostData(TestStripeAccounts.representativeData.FR)
        body[field] = 'invalid'
        req.body = TestHelper.createMultiPart(req, body)
        const representative = await req.patch()
        assert.strictEqual(representative[field], body[field])
      })
    }
  })

  describe('returns', () => {
    it('object', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'GB',
        type: 'company'
      })
      await TestHelper.createCompanyRepresentative(user, TestStripeAccounts.createPostData(TestStripeAccounts.representativeData.GB), {
        verification_document_back: TestHelper['success_id_scan_back.png'],
        verification_document_front: TestHelper['success_id_scan_front.png']
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?personid=${user.representative.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {}
      req.filename = __filename
      req.saveResponse = true
      const representativeNow = await req.patch()
      assert.strictEqual(representativeNow.object, 'person')
    })
  })

  describe('configuration', () => {
    it('environment STRIPE_JS', async () => {
      global.stripeJS = 3
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'GB',
        type: 'company'
      })
      const person = TestHelper.nextIdentity()
      const req = TestHelper.createRequest(`/account/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
      req.waitOnSubmit = true
      req.account = user.account
      req.session = user.session
      req.uploads = {
        verification_document_back: TestHelper['success_id_scan_back.png'],
        verification_document_front: TestHelper['success_id_scan_front.png']
      }
      req.body = TestStripeAccounts.createPostData(TestStripeAccounts.representativeData.GB, person)
      await req.post()
      const representatives = await global.api.user.connect.Beneficialrepresentatives.get(req)
      const representative = representatives[0]
      const req2 = TestHelper.createRequest(`/account/connect/edit-company-representative?personid=${representative.id}`)
      req2.waitOnSubmit = true
      req2.account = user.account
      req2.session = user.session
      req2.body = TestStripeAccounts.createPostData(TestStripeAccounts.representativeData.GB, person)
      await req2.post()
      const representativeNow = await global.api.user.connect.Beneficialrepresentative.get(req2)
      assert.notStrictEqual(representativeNow.metadata.token, null)
      assert.notStrictEqual(representativeNow.metadata.token, undefined)
    })
  })
})
