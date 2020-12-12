/* eslint-env mocha */
const assert = require('assert')
// const connect = require('../../../../../index.js')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')
// const DashboardTestHelper = require('@userdashboard/dashboard/test-helper.js')

describe('/api/user/connect/update-person', function () {
  after(TestHelper.deleteOldWebhooks)
  before(TestHelper.setupWebhook)
  // TODO: requirements do not correctly show up in
  // the Stripe account.requirements or person.requirements

  // Note:  this test requires about a half-hour
  //   // const updateResponses = {}
  // const fields = [
  //   'address_city',
  //   'address_line1',
  //   'address_postal_code',
  //   'dob_day',
  //   'dob_month',
  //   'dob_year',
  //   'phone',
  //   'first_name',
  //   'last_name',
  //   'email',
  //   'address_state',
  //   'address_kana_city',
  //   'address_kana_line1',
  //   'address_kana_postal_code',
  //   'address_kana_state',
  //   'address_kana_town',
  //   'address_kanji_city',
  //   'address_kanji_line1',
  //   'address_kanji_postal_code',
  //   'address_kanji_state',
  //   'address_kanji_town',
  //   'first_name_kana',
  //   'first_name_kanji',
  //   'gender',
  //   'last_name_kana',
  //   'last_name_kanji',
  //   'id_number',
  //   'ssn_last_4'
  // ]
  // const uploadFields = [
  //   'verification_document_front',
  //   'verification_document_back',
  //   'verification_additional_document_front',
  //   'verification_additional_document_back'
  // ]
  // const testedMissingFields = [
  //   'relationship_title',
  //   'relationship_director',
  //   'relationship_executive',
  //   'relationship_representative',
  //   'relationship_owner'
  // ]
  // // TODO: invalid values marked as 'false' are skipped until they can be verified
  // const invalidValues = {
  //   address_line1: false,
  //   address_city: false,
  //   address_state: 'invalid',
  //   address_country: 'invalid',
  //   address_postal_code: false,
  //   address_kana_line1: false,
  //   address_kana_city: false,
  //   address_kana_town: 'invalid',
  //   address_kana_state: 'invalid',
  //   address_kana_postal_code: 'invalid',
  //   address_kanji_line1: false,
  //   address_kanji_city: false,
  //   // TODO: submitting an invalid kanji town
  //   // doesn't work because Stripe takes the kana
  //   // value and applies that to the kanji field
  //   // while ignoring the invalid value
  //   address_kanji_town: false,
  //   address_kanji_state: 'invalid',
  //   // TODO: submitting an invalid kanji postal code
  //   // doesn't work because Stripe takes the kana
  //   // value and applies that to the kanji field
  //   // while ignoring the invalid value
  //   address_kanji_postal_code: false,
  //   dob_day: '32',
  //   dob_month: '15',
  //   dob_year: new Date().getFullYear() - 17,
  //   first_name: false,
  //   first_name_kana: false,
  //   first_name_kanji: false,
  //   gender: 'invalid',
  //   last_name: false,
  //   last_name_kana: false,
  //   last_name_kanji: false,
  //   email: false,
  //   phone: false,
  //   id_number: false,
  //   relationship_title: false,
  //   relationship_director: 'false',
  //   relationship_executive: false,
  //   relationship_representative: false,
  //   relationship_owner: 'false',
  //   ssn_last_4: 'invalid'
  // }
  // const missingMessages = {}
  // const errorMessages = {}
  // const users = {}
  // before(async () => {
  //   await DashboardTestHelper.setupBeforeEach()
  //   await TestHelper.setupBeforeEach()
  //   for (const country of connect.countrySpecs) {
  //     const payload = TestStripeAccounts.createPostData(TestStripeAccounts.representativeData[country.id])
  //     if (payload === false) {
  //       continue
  //     }
  //     for (const field in payload) {
  //       if (testedMissingFields.indexOf(field) > -1) {
  //         continue
  //       }
  //       testedMissingFields.push(field)
  //       let user = users[country.id]
  //       if (!user) {
  //         user = users[country.id] = await TestHelper.createUser()
  //         await TestHelper.createStripeAccount(user, {
  //           country: country.id,
  //           type: 'company'
  //         })
  //         await TestHelper.createPerson(user, {
  //           relationship_representative: 'true',
  //           relationship_executive: 'true',
  //           relationship_title: 'SVP Testing',
  //           relationship_percent_ownership: '0'
  //         })
  //       }
  //       let property = field.replace('address_kana_', 'address_kana.')
  //         .replace('address_kanji_', 'address_kanji.')
  //         .replace('dob_', 'dob.')
  //         .replace('relationship_', 'relationship.')
  //       if (property.indexOf('address_') > -1) {
  //         if (property.indexOf('_ka') === -1) {
  //           property = property.replace('address_', 'address.')
  //           property = property.substring(0, property.indexOf('.'))
  //         } else {
  //           property = property.substring(0, property.indexOf('_'))
  //         }
  //       }
  //       // await TestHelper.waitForAccountRequirement(user, `${user.representative.id}.${property}`)
  //       // await TestHelper.waitForPersonRequirement(user, user.representative.id, property)
  //       const req = TestHelper.createRequest(`/api/user/connect/update-person?personid=${user.representative.id}`)
  //       req.account = user.account
  //       req.session = user.session
  //       const body = TestStripeAccounts.createPostData(TestStripeAccounts.representativeData[country.id])
  //       delete (body[field])
  //       req.body = TestHelper.createMultiPart(req, body, {
  //         verification_document_back: TestHelper['success_id_scan_back.png'],
  //         verification_document_front: TestHelper['success_id_scan_front.png']
  //       })
  //       try {
  //         await req.patch()
  //       } catch (error) {
  //         errorMessages[field] = error.message
  //       }
  //       body[field] = invalidValues[field]
  //       req.body = TestHelper.createMultiPart(req, body, {
  //         verification_document_back: TestHelper['success_id_scan_back.png'],
  //         verification_document_front: TestHelper['success_id_scan_front.png']
  //       })
  //       try {
  //         await req.patch()
  //       } catch (error) {
  //         errorMessages[field] = error.message
  //       }
  //     }
  //     if (!users[country.id]) {
  //       continue
  //     }
  //     const user = users[country.id]
  //     const req = TestHelper.createRequest(`/api/user/connect/update-person?personid=${user.representative.id}`)
  //     req.account = user.account
  //     req.session = user.session
  //     req.body = TestHelper.createMultiPart(req, payload, {
  //       verification_document_back: TestHelper['success_id_scan_back.png'],
  //       verification_document_front: TestHelper['success_id_scan_front.png']
  //     })
  //     const response = await req.patch()
  //     for (const field in payload) {
  //       updateResponses[field] = response
  //     }
  //   }
  //   const user = await TestHelper.createUser()
  //   await TestHelper.createStripeAccount(user, {
  //     country: 'GB',
  //     type: 'company'
  //   })
  //   await TestHelper.createPerson(user, {
  //     relationship_representative: 'true',
  //     relationship_executive: 'true',
  //     relationship_title: 'SVP Testing',
  //     relationship_percent_ownership: '0'
  //   })
  //   const req = TestHelper.createRequest(`/api/user/connect/update-person?personid=${user.representative.id}`)
  //   req.account = user.account
  //   req.session = user.session
  //   req.body = TestHelper.createMultiPart(req, TestStripeAccounts.createPostData(TestStripeAccounts.representativeData.GB), {
  //     verification_document_back: TestHelper['success_id_scan_back.png'],
  //     verification_document_front: TestHelper['success_id_scan_front.png']
  //   })
  //   global.stripeJS = 3
  //   try {
  //     await req.patch()
  //   } catch (error) {
  //     missingMessages['invalid-token'] = error.message
  //   }
  //   req.body.token = 'invalid'
  //   try {
  //     await req.patch()
  //   } catch (error) {
  //     errorMessages['invalid-token'] = error.message
  //   }
  //   global.stripeJS = false
  //   upload fields
  //   const uploader1 = await TestHelper.createUser()
  //   await TestHelper.createStripeAccount(uploader1, {
  //     country: 'AT',
  //     type: 'company'
  //   })
  //   await TestHelper.createPerson(uploader1, {
  //     relationship_representative: 'true',
  //     relationship_executive: 'true',
  //     relationship_title: 'SVP Testing',
  //     relationship_percent_ownership: '0'
  //   })
  //   await TestHelper.updatePerson(uploader1, uploader1.representative, TestStripeAccounts.createPostData(TestStripeAccounts.representativeData.AT))
  //   const uploader2 = await TestHelper.createUser()
  //   await TestHelper.createStripeAccount(uploader2, {
  //     country: 'AT',
  //     type: 'company'
  //   })
  //   await TestHelper.createPerson(uploader2, {
  //     relationship_representative: 'true',
  //     relationship_executive: 'true',
  //     relationship_title: 'SVP Testing',
  //     relationship_percent_ownership: '0'
  //   })
  //   await TestHelper.updatePerson(uploader2, uploader2.representative, TestStripeAccounts.createPostData(TestStripeAccounts.representativeData.AT), {
  //     verification_document_front: TestHelper['success_id_scan_back.png'],
  //     verification_document_back: TestHelper['success_id_scan_back.png']
  //   })
  //   for (const field of uploadFields) {
  //     const user = await TestHelper.createUser()
  //     await TestHelper.createStripeAccount(user, {
  //       country: 'AT',
  //       type: 'company'
  //     })
  //     await TestHelper.createPerson(user, {
  //       relationship_representative: 'true',
  //       relationship_executive: 'true',
  //       relationship_title: 'SVP Testing',
  //       relationship_percent_ownership: '0'
  //     })
  //     await TestHelper.updatePerson(user, user.representative, TestStripeAccounts.createPostData(TestStripeAccounts.representativeData.AT))
  //     const property = field.replace('verification_', 'verification.').replace('_front', '').replace('_back', '')
  //     await TestHelper.waitForAccountRequirement(user, `${user.representative.id}.${property}`)
  //     await TestHelper.waitForPersonRequirement(user, user.representative.id, property)
  //     const req = TestHelper.createRequest(`/api/user/connect/update-person?personid=${user.representative.id}`)
  //     req.account = user.account
  //     req.session = user.session
  //     req.body = TestHelper.createMultiPart(req, {}, {
  //       [field]: TestHelper['success_id_scan_back.png']
  //     })
  //     updateResponses[field] = await req.patch()
  //   }
  // })
  describe('exceptions', () => {
    describe('invalid-personid', () => {
      it('missing querystring personid', async () => {
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/connect/update-person')
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
        const req = TestHelper.createRequest('/api/user/connect/update-person?personid=invalid')
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
        const user = await TestStripeAccounts.createCompanyWithRepresentative('DE')
        const user2 = await TestHelper.createUser()
        const req = TestHelper.createRequest(`/api/user/connect/update-person?personid=${user.representative.id}`)
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
      it('ineligible querystring person has no required information', async () => {
        const user = await TestStripeAccounts.createSubmittedCompany('DE')
        const req = TestHelper.createRequest(`/api/user/connect/update-person?personid=${user.representative.id}`)
        req.account = user.account
        req.session = user.session
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
  //   for (const field of fields) {
  //     describe(`invalid-${field}`, async () => {
  //       it(`missing posted ${field}`, async () => {
  //         const errorMessage = missingMessages[field]
  //         assert.strictEqual(errorMessage, `invalid-${field}`)
  //       })
  //       it(`invalid posted ${field}`, async () => {
  //         const errorMessage = errorMessages[field]
  //         assert.strictEqual(errorMessage, `invalid-${field}`)
  //       })
  //     })
  //   }
  //   describe('invalid-token', () => {
  //     it('missing posted token', async () => {
  //       const errorMessage = missingMessages['invalid-token']
  //       assert.strictEqual(errorMessage, 'invalid-token')
  //     })
  //     it('invalid posted token', async () => {
  //       const errorMessage = errorMessages['invalid-token']
  //       assert.strictEqual(errorMessage, 'invalid-token')
  //     })
  //   })
  // })
  // describe('receives', async () => {
  //   const testedRequiredFields = [
  //     'relationship_title',
  //     'relationship_director',
  //     'relationship_executive',
  //     'relationship_representative',
  //     'relationship_owner'
  //   ]
  //   for (const country of connect.countrySpecs) {
  //     const payload = TestStripeAccounts.createPostData(TestStripeAccounts.representativeData[country.id])
  //     if (payload === false) {
  //       continue
  //     }
  //     for (const field in payload) {
  //       if (testedRequiredFields.indexOf(field) > -1) {
  //         continue
  //       }
  //       testedRequiredFields.push(field)
  //       it(`optionally-required posted ${field}`, async () => {
  //         const representative = updateResponses[field]
  //         if (field.startsWith('address_kana')) {
  //           const property = field.substring('address_kana_'.length)
  //           assert.strictEqual(representative.address_kana[property], payload[field])
  //         } else if (field.startsWith('address_kanji')) {
  //           const property = field.substring('address_kanji_'.length)
  //           // TODO: Stripe applies the submitted kana postal code value
  //           // and when it returns it is transformed from 1500001 to
  //           // １５００００１ with a different charset so this is just wrong
  //           if (property === 'postal_code') {
  //             assert.strictEqual(representative.address_kanji[property], '１５００００１')
  //           } else {
  //             assert.strictEqual(representative.address_kanji[property], payload[field])
  //           }
  //         } else if (field.startsWith('address_')) {
  //           const property = field.substring('address_'.length)
  //           assert.strictEqual(representative.address[property], payload[field])
  //         } else if (field.startsWith('dob_')) {
  //           const property = field.substring('dob_'.length)
  //           assert.strictEqual(representative.dob[property], parseInt(payload[field], 10))
  //         } else if (field.startsWith('relationship_')) {
  //           const property = field.substring('relationship_'.length)
  //           if (payload[field] === 'true') {
  //             assert.strictEqual(representative.relationship[property], true)
  //           } else {
  //             assert.strictEqual(representative.relationship[property], payload[field])
  //           }
  //         } else if (field === 'id_number') {
  //           assert.strictEqual(representative.id_number_provided, true)
  //         } else if (field === 'ssn_last_4') {
  //           assert.strictEqual(representative.ssn_last_4_provided, true)
  //         } else {
  //           // TODO: Stripe may or may not transform the phone number
  //           // by removing hyphons and adding the country dial code
  //           // but submitting in that format is not allowed too
  //           if (field === 'phone') {
  //             if (representative[field] === payload[field]) {
  //               assert.strictEqual(representative[field], payload[field])
  //             } else {
  //               const withCountryCode = `+1${payload[field]}`
  //               assert.strictEqual(representative[field], withCountryCode)
  //             }
  //           } else {
  //             assert.strictEqual(representative[field], payload[field])
  //           }
  //         }
  //       })
  //     }
  //   }
  //   for (const field of uploadFields) {
  //     it(`optionally-required posted upload ${field}`, async () => {
  //       const representative = updateResponses[field]
  //       if (field.indexOf('additional_document') > -1) {
  //         if (field === 'verification_additional_document_front') {
  //           assert.notStrictEqual(representative.verification.additional_document.front, undefined)
  //           assert.notStrictEqual(representative.verification.additional_document.front, null)
  //         } else {
  //           assert.notStrictEqual(representative.verification.additional_document.back, undefined)
  //           assert.notStrictEqual(representative.verification.additional_document.back, null)
  //         }
  //       } else {
  //         if (field === 'verification_document_front') {
  //           assert.notStrictEqual(representative.verification.document.front, undefined)
  //           assert.notStrictEqual(representative.verification.document.front, null)
  //         } else {
  //           assert.notStrictEqual(representative.verification.document.back, undefined)
  //           assert.notStrictEqual(representative.verification.document.back, null)
  //         }
  //       }
  //     })
  //   }
  })

  describe('returns', () => {
    it('object', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'GB',
        type: 'company'
      })
      await TestHelper.createPerson(user, {
        relationship_representative: 'true',
        relationship_executive: 'true',
        relationship_title: 'SVP Testing',
        relationship_percent_ownership: '0'
      })
      await TestHelper.waitForAccountRequirement(user, `${user.representative.id}.first_name`)
      await TestHelper.waitForPersonRequirement(user, user.representative.id, 'first_name')
      const req = TestHelper.createRequest(`/api/user/connect/update-person?personid=${user.representative.id}`)
      req.account = user.account
      req.session = user.session
      req.body = TestStripeAccounts.createPostData(TestStripeAccounts.representativeData.GB)
      req.filename = __filename
      req.saveResponse = true
      const personNow = await req.patch()
      assert.strictEqual(personNow.object, 'person')
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
      const identity = TestHelper.nextIdentity()
      const req = TestHelper.createRequest(`/account/connect/create-person?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_representative: 'true',
        relationship_executive: 'true',
        relationship_title: 'SVP Testing',
        relationship_percent_ownership: '0'
      }
      req.uploads = {
        verification_document_back: TestHelper['success_id_scan_back.png'],
        verification_document_front: TestHelper['success_id_scan_front.png']
      }
      await req.post()
      const representatives = await global.api.user.connect.Persons.get(req)
      const representative = representatives[0]
      await TestHelper.waitForAccountRequirement(user, `${representative.id}.first_name`)
      await TestHelper.waitForPersonRequirement(user, representative.id, 'first_name')
      const req2 = TestHelper.createRequest(`/account/connect/edit-person?personid=${representative.id}`)
      req2.account = user.account
      req2.session = user.session
      req2.body = TestStripeAccounts.createPostData(TestStripeAccounts.representativeData.GB, identity)
      req2.uploads = {
        verification_document_back: TestHelper['success_id_scan_back.png'],
        verification_document_front: TestHelper['success_id_scan_front.png']
      }
      await req2.post()
      // TODO: verifying information was submitted by token is not possible
      // so for now when objects are created/updated without a token they
      // have a metadata.token = false flag set
      const personNow = await global.api.user.connect.Person.get(req2)
      assert.strictEqual(personNow.metadata.token, undefined)
    })
  })
})
