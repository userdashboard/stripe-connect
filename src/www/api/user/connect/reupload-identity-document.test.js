// /* eslint-env mocha */
// const assert = require('assert')
// const TestHelper = require('../../../../../test-helper.js')
// const util = require('util')

// describe.only('/api/user/connect/reupload-identity-document', () => {
//   describe('exceptions', () => {
//     describe('invalid-stripeid', () => {
//       it('missing querystring stripeid', async () => {
//         const user = await TestHelper.createUser()
//         const req = TestHelper.createRequest('/api/user/connect/reupload-identity-document')
//         req.account = user.account
//         req.session = user.session
//         req.file = {
//           id: 'fileid'
//         }
//         req.body = {}
//         let errorMessage
//         try {
//           await req.route.api.patch(req)
//         } catch (error) {
//           errorMessage = error.message
//         }
//         assert.strictEqual(errorMessage, 'invalid-stripeid')
//       })

//       it('invalid querystring stripeid', async () => {
//         const user = await TestHelper.createUser()
//         const req = TestHelper.createRequest('/api/user/connect/reupload-identity-document?stripeid=invalid')
//         req.account = user.account
//         req.session = user.session
//         req.file = {
//           id: 'fileid'
//         }
//         req.body = {}
//         let errorMessage
//         try {
//           await req.route.api.patch(req)
//         } catch (error) {
//           errorMessage = error.message
//         }
//         assert.strictEqual(errorMessage, 'invalid-stripeid')
//       })
//     })

//     describe('invalid-account', () => {
//       it('ineligible accessing account', async () => {
//         const user = await TestHelper.createUser()
//         await TestHelper.createStripeAccount(user, {
//           type: 'company',
//           country: 'US'
//         })
//         await TestHelper.createStripeRegistration(user, {
//           company_name: 'Company',
//           company_tax_id: '8',
//           company_phone: '456-123-7890',
//           company_address_city: 'New York',
//           company_address_line1: '123 Park Lane',
//           company_address_postal_code: '10001',
//           company_address_state: 'NY',
//           business_profile_mcc: '8931',
//           business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
//           relationship_representative_dob_day: '1',
//           relationship_representative_dob_month: '1',
//           relationship_representative_dob_year: '1950',
//           relationship_representative_first_name: user.profile.firstName,
//           relationship_representative_last_name: user.profile.lastName,
//           relationship_representative_executive: 'true',
//           relationship_representative_title: 'Owner',
//           relationship_representative_email: user.profile.contactEmail,
//           relationship_representative_phone: '456-789-0123',
//           // relationship_representative_id_number: '000000000',
//           relationship_representative_ssn_last_4: '0000',
//           relationship_representative_address_city: 'New York',
//           relationship_representative_address_state: 'NY',
//           relationship_representative_address_line1: '285 Fulton St',
//           relationship_representative_address_postal_code: '10007'
//         })
//         const user2 = await TestHelper.createUser()
//         const req = TestHelper.createRequest(`/api/user/connect/reupload-identity-document?stripeid=${user.stripeAccount.id}`)
//         req.account = user2.account
//         req.session = user2.session
//         req.file = {
//           id: 'fileid'
//         }
//         req.body = {}
//         let errorMessage
//         try {
//           await req.route.api.patch(req)
//         } catch (error) {
//           errorMessage = error.message
//         }
//         assert.strictEqual(errorMessage, 'invalid-account')
//       })
//     })

//     describe('invalid-stripe-account', () => {
//       it('ineligible querystring Stripe account is unsubmitted', async () => {
//         const user = await TestHelper.createUser()
//         await TestHelper.createStripeAccount(user, {
//           type: 'company',
//           country: 'US'
//         })
//         await TestHelper.createStripeRegistration(user, {
//           company_name: 'Company',
//           company_tax_id: '8',
//           company_phone: '456-123-7890',
//           company_address_city: 'New York',
//           company_address_line1: '123 Park Lane',
//           company_address_postal_code: '10001',
//           company_address_state: 'NY',
//           business_profile_mcc: '8931',
//           business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
//           relationship_representative_dob_day: '1',
//           relationship_representative_dob_month: '1',
//           relationship_representative_dob_year: '1950',
//           relationship_representative_first_name: user.profile.firstName,
//           relationship_representative_last_name: user.profile.lastName,
//           relationship_representative_executive: 'true',
//           relationship_representative_title: 'Owner',
//           relationship_representative_email: user.profile.contactEmail,
//           relationship_representative_phone: '456-789-0123',
//           // relationship_representative_id_number: '000000000',
//           relationship_representative_ssn_last_4: '0000',
//           relationship_representative_address_city: 'New York',
//           relationship_representative_address_state: 'NY',
//           relationship_representative_address_line1: '285 Fulton St',
//           relationship_representative_address_postal_code: '10007'
//         })
//         const req = TestHelper.createRequest(`/api/user/connect/reupload-identity-document?stripeid=${user.stripeAccount.id}`)
//         req.account = user.account
//         req.session = user.session
//         req.body = {}
//         let errorMessage
//         try {
//           await req.route.api.patch(req)
//         } catch (error) {
//           errorMessage = error.message
//         }
//         assert.strictEqual(errorMessage, 'invalid-stripe-account')
//       })

//       it('ineligible querystring Stripe account does not require new upload', async () => {
//         const user = await TestHelper.createUser()
//         await TestHelper.createStripeAccount(user, {
//           type: 'company',
//           country: 'US'
//         })
//         await TestHelper.createStripeRegistration(user, {
//           company_name: 'Company',
//           company_tax_id: '8',
//           company_phone: '456-123-7890',
//           company_address_city: 'New York',
//           company_address_line1: '123 Park Lane',
//           company_address_postal_code: '10001',
//           company_address_state: 'NY',
//           business_profile_mcc: '8931',
//           business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
//           relationship_representative_dob_day: '1',
//           relationship_representative_dob_month: '1',
//           relationship_representative_dob_year: '1950',
//           relationship_representative_first_name: user.profile.firstName,
//           relationship_representative_last_name: user.profile.lastName,
//           relationship_representative_executive: 'true',
//           relationship_representative_title: 'Owner',
//           relationship_representative_email: user.profile.contactEmail,
//           relationship_representative_phone: '456-789-0123',
//           // relationship_representative_id_number: '000000000',
//           relationship_representative_ssn_last_4: '0000',
//           relationship_representative_address_city: 'New York',
//           relationship_representative_address_state: 'NY',
//           relationship_representative_address_line1: '285 Fulton St',
//           relationship_representative_address_postal_code: '10007'
//         })
//         const req = TestHelper.createRequest(`/api/user/connect/reupload-identity-document?stripeid=${user.stripeAccount.id}`)
//         req.account = user.account
//         req.session = user.session
//         req.body = {}
//         let errorMessage
//         try {
//           await req.route.api.patch(req)
//         } catch (error) {
//           errorMessage = error.message
//         }
//         assert.strictEqual(errorMessage, 'invalid-stripe-account')
//       })
//     })

//     describe('invalid-upload', () => {
//       it.only('should reject invalid upload', async () => {
//         const user = await TestHelper.createUser()
//         await TestHelper.createStripeAccount(user, {
//           type: 'company',
//           country: 'US'
//         })
//         const req = TestHelper.createRequest(`/api/substitute-failed-document-front?token=file_identity_document_failure`)
//         req.session = user.session
//         req.account = user.account
//         await req.get()
//         await TestHelper.createStripeRegistration(user, {
//           company_name: 'Company',
//           company_tax_id: '8',
//           company_phone: '456-123-7890',
//           company_address_city: 'New York',
//           company_address_line1: '123 Park Lane',
//           company_address_postal_code: '10001',
//           company_address_state: 'NY',
//           business_profile_mcc: '8931',
//           business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
//           relationship_representative_dob_day: '1',
//           relationship_representative_dob_month: '1',
//           relationship_representative_dob_year: '1950',
//           relationship_representative_first_name: user.profile.firstName,
//           relationship_representative_last_name: user.profile.lastName,
//           relationship_representative_executive: 'true',
//           relationship_representative_title: 'Owner',
//           relationship_representative_email: user.profile.contactEmail,
//           relationship_representative_phone: '456-789-0123',
//           // relationship_representative_id_number: '000000000',
//           relationship_representative_ssn_last_4: '0000',
//           relationship_representative_address_city: 'New York',
//           relationship_representative_address_state: 'NY',
//           relationship_representative_address_line1: '285 Fulton St',
//           relationship_representative_address_postal_code: '10007'
//         })
//         await TestHelper.createExternalAccount(user, {
//           currency: 'usd',
//           country: 'US',
//           account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
//           account_holder_type: 'individual',
//           account_number: '000123456789',
//           routing_number: '110000000'
//         })
//         await TestHelper.submitStripeAccount(user)
//         await TestHelper.triggerVerification(user)
//         await TestHelper.waitForVerificationFailure(user.stripeAccount.id)
//         const req2 = TestHelper.createRequest(`/api/user/connect/reupload-identity-document?stripeid=${user.stripeAccount.id}`)
//         req2.account = user.account
//         req2.session = user.session
//         req2.body = {}
//         let errorMessage
//         try {
//           await req2.patch()
//         } catch (error) {
//           errorMessage = error.message
//         }
//         assert.strictEqual(errorMessage, 'invalid-upload')
//       })
//     })
//   })

//   describe('returns', () => {
//     it('object', async () => {
//       const user = await TestHelper.createUser()
//       await TestHelper.createStripeAccount(user, {
//         type: 'company',
//         country: 'US'
//       })
//       await TestHelper.createStripeRegistration(user, {
//         company_name: 'Company',
//         company_tax_id: '8',
//         company_phone: '456-123-7890',
//         company_address_city: 'New York',
//         company_address_line1: '123 Park Lane',
//         company_address_postal_code: '10001',
//         company_address_state: 'NY',
//         business_profile_mcc: '8931',
//         business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
//         relationship_representative_dob_day: '1',
//         relationship_representative_dob_month: '1',
//         relationship_representative_dob_year: '1950',
//         relationship_representative_first_name: user.profile.firstName,
//         relationship_representative_last_name: user.profile.lastName,
//         relationship_representative_executive: 'true',
//         relationship_representative_title: 'Owner',
//         relationship_representative_email: user.profile.contactEmail,
//         relationship_representative_phone: '456-789-0123',
//         // relationship_representative_id_number: '000000000',
//         relationship_representative_ssn_last_4: '0000',
//         relationship_representative_address_city: 'New York',
//         relationship_representative_address_state: 'NY',
//         relationship_representative_address_line1: '285 Fulton St',
//         relationship_representative_address_postal_code: '10007'
//       })
//       await TestHelper.submitStripeAccount(user)
//       await TestHelper.triggerVerification(user)
//       const req = TestHelper.createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
//       req.account = user.account
//       req.session = user.session
//       while (true) {
//         try {
//           user.stripeAccount = await req.get()
//         } catch (error) {
//           await wait()
//           continue
//         }
//         if (user.stripeAccount.requirements.status !== 'pending' &&
//             user.stripeAccount.requirements.status !== 'verified') {
//           const req3 = TestHelper.createRequest(`/api/user/connect/reupload-identity-document?stripeid=${user.stripeAccount.id}`)
//           req3.account = req.account
//           req3.session = req.session
//           const accountNow = await req3.route.api.patch(req3)
//           assert.strictEqual(-1, accountNow.requirements.fields_needed.indexOf('requirements.document'))
//           return
//         } else {
//           await wait()
//         }
//       }
//     })
//   })
// })

// const wait = util.promisify(async (callback) => {
//   return setTimeout(callback, 30000)
// })
