// /* eslint-env mocha */
// TODO: Stripe test API currently has a bug failing verifications
// const assert = require('assert')
// const TestHelper = require('../../../../../test-helper.js')
// const util = require('util')

// const wait = util.promisify(async (callback) => {
//   return setTimeout(callback, 2000)
// })

// describe('/api/user/connect/reupload-owner-identity-document', () => {
//   describe('ReuploadOwnerIdentityDocument#patch', () => {
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
//         await req.patch(req)
//       } catch (error) {
//         errorMessage = error.message
//       }
//       assert.strictEqual(errorMessage, 'invalid-ownerid')
//     })

//     it('should reject invalid upload', async () => {
//       const user = await TestHelper.createUser()
//       await TestHelper.createStripeAccount(user, {
//         type: 'company',
//         country: 'DE'
//       })
//       await TestHelper.createStripeRegistration(user, {
//         company_address_city: 'Berlin',
//         company_address_line1: '123 Park Lane',
//         company_address_postal_code: '01067',
//         company_name: 'Company',
//         company_tax_id: '00000000000',
//         relationship_representative_address_city: 'Berlin',
//         relationship_representative_address_line1: '123 Sesame St',
//         relationship_representative_address_postal_code: '01067',
//         relationship_representative_dob_day: '1',
//         relationship_representative_dob_month: '1',
//         relationship_representative_dob_year: '1950',
//         relationship_representative_first_name: user.profile.firstName,
//         relationship_representative_last_name: user.profile.lastName
//       })
//       const owner = await TestHelper.createBeneficialOwner(user)
//       const req = TestHelper.createRequest(`/api/user/connect/reupload-owner-identity-document?ownerid=${owner.ownerid}`)
//       req.account = user.account
//       req.session = user.session
//       let errorMessage
//       try {
//         await req.patch(req)
//       } catch (error) {
//         errorMessage = error.message
//       }
//       assert.strictEqual(errorMessage, 'invalid-upload')
//     })
//   })

//   describe('ReuploadOwnerIdentityDocument#patch', () => {
//     it('should update document', async () => {
//       const user = await TestHelper.createUser()
//       await TestHelper.createStripeAccount(user, {
//         type: 'company',
//         country: 'DE'
//       })
//       await TestHelper.createStripeRegistration(user, {
//         company_address_city: 'Berlin',
//         company_address_line1: '123 Park Lane',
//         company_address_postal_code: '01067',
//         company_name: 'Company',
//         company_tax_id: '00000000000',
//         relationship_representative_address_city: 'Berlin',
//         relationship_representative_address_line1: '123 Sesame St',
//         relationship_representative_address_postal_code: '01067',
//         relationship_representative_dob_day: '1',
//         relationship_representative_dob_month: '1',
//         relationship_representative_dob_year: '1950',
//         relationship_representative_first_name: user.profile.firstName,
//         relationship_representative_last_name: user.profile.lastName
//       })
//       await TestHelper.createExternalAccount(user, {
//         currency: 'eur',
//         country: 'DE',
//         account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
//         account_holder_type: 'individual',
//         iban: 'DE89370400440532013000'
//       })
//       const person = TestHelper.nextIdentity()
//       const owner = await TestHelper.createBeneficialOwner(user, {
//         relationship_owner_first_name: person.firstName,
//         relationship_owner_last_name: person.lastName,
//         relationship_owner_address_country: 'GB',
//         relationship_owner_address_city: 'London',
//         relationship_owner_address_line1: 'A building',
//         relationship_owner_address_postal_code: 'EC1A 1AA',
//         relationship_owner_dob_day: '1',
//         relationship_owner_dob_month: '1',
//         relationship_owner_dob_year: '1950'
//       })
//       const req = TestHelper.createRequest(`/api/user/connect/set-beneficial-owners-submitted?stripeid=${user.stripeAccount.id}`)
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
//         if (user.stripeAccount.legal_entity.additional_owners[0].requirements.status !== 'pending') {
//           const req4 = TestHelper.createRequest(`/api/user/connect/reupload-owner-identity-document?ownerid=${owner.ownerid}`)
//           req4.account = req2.account
//           req4.session = req2.session
//           const accountNow = await req4.route.api.patch(req4)
//           return
//         } else {
//           await wait()
//         }
//       }
//     })
//   })
// })
