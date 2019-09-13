// /* eslint-env mocha */
// TODO: Stripe test API currently has a bug failing verifications
// const assert = require('assert')
// const TestHelper = require('../../../../../test-helper.js')
// const util = require('util')

// describe('/api/user/connect/reupload-identity-document', () => {
//   describe('ReuploadIdentityDocument#BEFORE', () => {
//     it('should reject invalid stripeid', async () => {
//       const user = await TestHelper.createUser()
//       const req = TestHelper.createRequest(`/api/user/connect/reupload-identity-document?stripeid=invalid`)
//       req.account = user.account
//       req.session = user.session
//       req.file = {
//         id: 'fileid'
//       }
//       req.body = {}
//       let errorMessage
//       try {
//         await req.route.api.before(req)
//       } catch (error) {
//         errorMessage = error.message
//       }
//       assert.strictEqual(errorMessage, 'invalid-stripeid')
//     })

//     it('should reject other account\'s Stripe account', async () => {
//       const user = await TestHelper.createUser()
//       await TestHelper.createStripeAccount(user, {
//         type: 'company',
//         country: 'US'
//       })
//       await TestHelper.createStripeRegistration(user, {
//         company_tax_id: '00000000',
//         company_name: user.profile.firstName + '\'s company',
//         company_address_country: 'US',
//         city: 'New York',
//         individual_address_city: 'New York',
//         postal_'secret-code': '10001',
//         individual_address_id_number: '000000000',
//        individual_address_line1: 'First Street',
//         relationship_account_opener_first_name: user.profile.firstName,
//         relationship_account_opener_last_name: user.profile.lastName,
//         relationship_account_opener_email: user.profile.contactEmail,
//         relationship_account_opener_phone: '456-789-0123',
//         relationship_account_opener_dob_day: '1',
//         relationship_account_opener_dob_month: '1',
//         relationship_account_opener_dob_year: '1950',
//         company_address_city: 'New York',
//         company_state: 'New York',
//         company_address_line1: 'First Street',
//         company_address_postal_'secret-code': '10001',
//         ssn_last_4: '0000'
//       })
//       const user2 = await TestHelper.createUser()
//       const req = TestHelper.createRequest(`/api/user/connect/reupload-identity-document?stripeid=${user.stripeAccount.id}`)
//       req.account = user2.account
//       req.session = user2.session
//       req.file = {
//         id: 'fileid'
//       }
//       req.body = {}
//       let errorMessage
//       try {
//         await req.route.api.before(req)
//       } catch (error) {
//         errorMessage = error.message
//       }
//       assert.strictEqual(errorMessage, 'invalid-stripe-account')
//     })

//     it('should reject unsubmitted registration', async () => {
//       const user = await TestHelper.createUser()
//       await TestHelper.createStripeAccount(user, {
//         type: 'company',
//         country: 'US'
//       })
//       await TestHelper.createStripeRegistration(user, {
//         company_tax_id: '00000000',
//         company_name: user.profile.firstName + '\'s company',
//         company_address_country: 'US',
//         city: 'New York',
//         individual_address_city: 'New York',
//         postal_'secret-code': '10001',
//         individual_address_id_number: '000000000',
//        individual_address_line1: 'First Street',
//         relationship_account_opener_first_name: user.profile.firstName,
//         relationship_account_opener_last_name: user.profile.lastName,
//         relationship_account_opener_email: user.profile.contactEmail,
//         relationship_account_opener_phone: '456-789-0123',
//         relationship_account_opener_dob_day: '1',
//         relationship_account_opener_dob_month: '1',
//         relationship_account_opener_dob_year: '1950',
//         company_address_city: 'New York',
//         company_state: 'New York',
//         company_address_line1: 'First Street',
//         company_address_postal_'secret-code': '10001',
//         ssn_last_4: '0000'
//       })
//       const req = TestHelper.createRequest(`/api/user/connect/reupload-identity-document?stripeid=${user.stripeAccount.id}`)
//       req.account = user.account
//       req.session = user.session
//       req.body = {}
//       let errorMessage
//       try {
//         await req.route.api.before(req)
//       } catch (error) {
//         errorMessage = error.message
//       }
//       assert.strictEqual(errorMessage, 'invalid-upload')
//     })

//     it('should reject Stripe accounts that don\'t require reuploading', async () => {
//       const user = await TestHelper.createUser()
//       await TestHelper.createStripeAccount(user, {
//         type: 'company',
//         country: 'US'
//       })
//       await TestHelper.createStripeRegistration(user, {
//         company_tax_id: '00000000',
//         company_name: user.profile.firstName + '\'s company',
//         company_address_country: 'US',
//         city: 'New York',
//         individual_address_city: 'New York',
//         postal_'secret-code': '10001',
//         relationship_account_opener_address_id_number: '000000000',
//         relationship_account_opener_address_line1: 'First Street',
//         relationship_account_opener_first_name: user.profile.firstName,
//         relationship_account_opener_last_name: user.profile.lastName,
//         relationship_account_opener_email: user.profile.contactEmail,
//         relationship_account_opener_phone: '456-789-0123',
//         relationship_account_opener_dob_day: '1',
//         relationship_account_opener_dob_month: '1',
//         relationship_account_opener_dob_year: '1950',
//         company_address_city: 'New York',
//         company_state: 'New York',
//         company_address_line1: 'First Street',
//         company_address_postal_'secret-code': '10001',
//         ssn_last_4: '0000'
//       })
//       const req = TestHelper.createRequest(`/api/user/connect/reupload-identity-document?stripeid=${user.stripeAccount.id}`)
//       req.account = user.account
//       req.session = user.session
//       req.body = {}
//       let errorMessage
//       try {
//         await req.route.api.before(req)
//       } catch (error) {
//         errorMessage = error.message
//       }
//       assert.strictEqual(errorMessage, 'invalid-upload')
//     })

//     it('should reject invalid upload', async () => {
//       const user = await TestHelper.createUser()
//       await TestHelper.createStripeAccount(user, {
//         type: 'company',
//         country: 'US'
//       })
//       await TestHelper.createStripeRegistration(user, {
//         company_tax_id: '00000000',
//         company_name: user.profile.firstName + '\'s company',
//         company_address_country: 'US',
//         city: 'New York',
//         individual_address_city: 'New York',
//         postal_'secret-code': '10001',
//         individual_address_id_number: '000000000',
//        individual_address_line1: 'First Street',
//         relationship_account_opener_first_name: user.profile.firstName,
//         relationship_account_opener_last_name: user.profile.lastName,
//         relationship_account_opener_email: user.profile.contactEmail,
//         relationship_account_opener_phone: '456-789-0123',
//         relationship_account_opener_dob_day: '1',
//         relationship_account_opener_dob_month: '1',
//         relationship_account_opener_dob_year: '1950',
//         company_address_city: 'New York',
//         company_state: 'New York',
//         company_address_line1: 'First Street',
//         company_address_postal_'secret-code': '10001',
//         ssn_last_4: '0000'
//       })
//       const req = TestHelper.createRequest(`/api/user/connect/reupload-identity-document?stripeid=${user.stripeAccount.id}`)
//       req.account = user.account
//       req.session = user.session
//       req.body = {}
//       let errorMessage
//       try {
//         await req.route.api.before(req)
//       } catch (error) {
//         errorMessage = error.message
//       }
//       assert.strictEqual(errorMessage, 'invalid-upload')
//     })
//   })

//   describe('ReuploadIdentityDocument#PATCH', () => {
//     it('should update the identity document', async () => {
//       const user = await TestHelper.createUser()
//       await TestHelper.createStripeAccount(user, {
//         type: 'individual',
//         country: 'US'
//       })
//       await TestHelper.createStripeRegistration(user, {
//         city: 'New York',
//         postal_'secret-code': '10001',
//         individual_address_id_number: '000000000',
//        individual_address_line1: 'First Street',
//         individual_dob_day: '1',
//         individual_dob_month: '1',
//         individual_dob_year: '1950',
//         state: 'New York', ssn_last_4: '0000'
//       })
//       await TestHelper.createExternalAccount(user, {
//         currency: 'usd',
//         country: 'US',
//         account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
//         account_type: 'individual',
//         account_number: '000123456789',
//         routing_number: '110000000'
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
//         if (user.stripeAccount.legal_entity.requirements.status !== 'pending' &&
//             user.stripeAccount.legal_entity.requirements.status !== 'verified') {
//           const req3 = TestHelper.createRequest(`/api/user/connect/reupload-identity-document?stripeid=${user.stripeAccount.id}`)
//           req3.account = req.account
//           req3.session = req.session
//           const accountNow = await req3.route.api.patch(req3)
//           assert.strictEqual(-1, accountNow.requirements.fields_needed.indexOf('legal_entity.requirements.document'))
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
