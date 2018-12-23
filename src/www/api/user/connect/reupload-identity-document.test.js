// /* eslint-env mocha */
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
//       await TestHelper.createStripeAccount(user, { type: 'company', country: 'US' })
//       await TestHelper.createStripeRegistration(user, { business_tax_id: 1, business_name: user.profile.firstName + '\'s company', country: 'US', city: 'New York City', personal_city: 'New York City', postal_code: '10001', personal_id_number: '000000000', line1: 'First Street', day: '1', month: '1', year: '1950', company_city: 'New York City', company_state: 'New York', company_line1: 'First Street', company_postal_code: '10001', ssn_last_4: '0000' })
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
//       await TestHelper.createStripeAccount(user, { type: 'company', country: 'US' })
//       await TestHelper.createStripeRegistration(user, { business_tax_id: 1, business_name: user.profile.firstName + '\'s company', country: 'US', city: 'New York City', personal_city: 'New York City', postal_code: '10001', personal_id_number: '000000000', line1: 'First Street', day: '1', month: '1', year: '1950', company_city: 'New York City', company_state: 'New York', company_line1: 'First Street', company_postal_code: '10001', ssn_last_4: '0000' })
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
//       await TestHelper.createStripeAccount(user, { type: 'company', country: 'US' })
//       await TestHelper.createStripeRegistration(user, { business_tax_id: 1, business_name: user.profile.firstName + '\'s company', country: 'US', city: 'New York City', personal_city: 'New York City', postal_code: '10001', personal_id_number: '000000000', line1: 'First Street', day: '1', month: '1', year: '1950', company_city: 'New York City', company_state: 'New York', company_line1: 'First Street', company_postal_code: '10001', ssn_last_4: '0000' })
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
//       await TestHelper.createStripeAccount(user, { type: 'company', country: 'US' })
//       await TestHelper.createStripeRegistration(user, { business_tax_id: 1, business_name: user.profile.firstName + '\'s company', country: 'US', city: 'New York City', personal_city: 'New York City', postal_code: '10001', personal_id_number: '000000000', line1: 'First Street', day: '1', month: '1', year: '1950', company_city: 'New York City', company_state: 'New York', company_line1: 'First Street', company_postal_code: '10001', ssn_last_4: '0000' })
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
//       await TestHelper.createStripeAccount(user, { type: 'individual', country: 'US' })
//       await TestHelper.createStripeRegistration(user, { city: 'New York City', postal_code: '10001', personal_id_number: '000000000', line1: 'First Street', day: '1', month: '1', year: '1950', state: 'New York', ssn_last_4: '0000' })
//       await TestHelper.createExternalAccount(user, { currency: 'usd', country: 'US', account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`, account_type: 'individual', account_number: '000123456789', routing_number: '110000000' })
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
//         console.log(user.stripeAccount.legal_entity.verification)
//         if (user.stripeAccount.legal_entity.verification.status !== 'pending' &&
//             user.stripeAccount.legal_entity.verification.status !== 'verified') {
//           const req3 = TestHelper.createRequest(`/api/user/connect/reupload-identity-document?stripeid=${user.stripeAccount.id}`)
//           req3.account = req.account
//           req3.session = req.session
//           const accountNow = await req3.route.api.patch(req3)
//           assert.strictEqual(-1, accountNow.verification.fields_needed.indexOf('legal_entity.verification.document'))
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
