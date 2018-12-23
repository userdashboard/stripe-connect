// /* eslint-env mocha */
// const assert = require('assert')
// const TestHelper = require('../../../../../test-helper.js')
// const util = require('util')

// const wait = util.promisify(async (callback) => {
//   return setTimeout(callback, 2000)
// })

// describe('/api/user/connect/reupload-owner-identity-document', () => {
//   describe('ReuploadOwnerIdentityDocument#BEFORE', () => {
//     it('should reject invalid ownerid', async () => {
//       const user = await TestHelper.createUser()
//       const req = TestHelper.createRequest(`/api/user/connect/reupload-owner-identity-document?ownerid=invalid`)
//       req.account = user.account
//       req.session = user.session
//       req.file = {
//         id: 'fileid'
//       }
//       let errorMessage
//       try {
//         await req.route.api.before(req)
//       } catch (error) {
//         errorMessage = error.message
//       }
//       assert.strictEqual(errorMessage, 'invalid-ownerid')
//     })

//     it('should reject invalid upload', async () => {
//       const user = await TestHelper.createUser()
//       await TestHelper.createStripeAccount(user, { type: 'company', country: 'DE' })
//       await TestHelper.createStripeRegistration(user, { business_tax_id: 1, business_name: user.profile.firstName + '\'s company', country: 'DE', day: '1', month: '1', year: '1950', company_city: 'Berlin', company_line1: 'First Street', company_postal_code: '01067', personal_city: 'Berlin', personal_line1: 'First Street', personal_postal_code: '01067' })
//       const owner = await TestHelper.createAdditionalOwner(user)
//       const req = TestHelper.createRequest(`/api/user/connect/reupload-owner-identity-document?ownerid=${owner.ownerid}`)
//       req.account = user.account
//       req.session = user.session
//       let errorMessage
//       try {
//         await req.route.api.before(req)
//       } catch (error) {
//         errorMessage = error.message
//       }
//       assert.strictEqual(errorMessage, 'invalid-upload')
//     })
//   })

//   describe('ReuploadOwnerIdentityDocument#BEFORE', () => {
//     it('should update authorized document', async () => {
//       const user = await TestHelper.createUser()
//       await TestHelper.createStripeAccount(user, { type: 'company', country: 'DE' })
//       await TestHelper.createStripeRegistration(user, { business_tax_id: 1, business_name: user.profile.firstName + '\'s company', country: 'DE', day: '1', month: '1', year: '1950', company_city: 'Berlin', company_line1: 'First Street', company_postal_code: '01067', personal_city: 'Berlin', personal_line1: 'First Street', personal_postal_code: '01067' })
//       await TestHelper.createExternalAccount(user, { currency: 'eur', country: 'DE', account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`, account_type: 'individual', iban: 'DE89370400440532013000' })
//       const owner = await TestHelper.createAdditionalOwner(user, {
//         first_name: 'First name',
//         last_name: 'First name',
//         country: 'GB',
//         city: 'London',
//         line1: 'A building',
//         postal_code: 'EC1A 1AA',
//         day: '1',
//         month: '1',
//         year: '1950',
//         documentid: ownerUpload.id
//       })
//       const req = TestHelper.createRequest(`/api/user/connect/set-additional-owners-submitted?stripeid=${user.stripeAccount.id}`)
//       req.account = user.account
//       req.session = user.session
//       user.stripeAccount = await req.patch()
//       const req2 = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
//       req2.account = req.account
//       req2.session = req.session
//       user.stripeAccount = await req2.route.api.patch(req2)
//       await TestHelper.triggerVerification(user)
//       const req3 = TestHelper.createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
//       req3.account = req.account
//       req3.session = req.session
//       while (true) {
//         user.stripeAccount = await req3.route.api.get(req3)
//         if (user.stripeAccount.legal_entity.additional_owners[0].verification.status !== 'pending') {
//           const req4 = TestHelper.createRequest(`/api/user/connect/reupload-owner-identity-document?ownerid=${owner.ownerid}`)
//           req4.account = req2.account
//           req4.session = req2.session
//           const accountNow = await req4.route.api.patch(req4)
//           console.log(accountNow.legal_entity.additional_owners)
//           return
//         } else {
//           console.log(user.stripeAccount.id, user.stripeAccount.verification, user.stripeAccount.legal_entity.additional_owners[0].verification.status)
//           await wait()
//         }
//       }
//     })
//   })
// })
