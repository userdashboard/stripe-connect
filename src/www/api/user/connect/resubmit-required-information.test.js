// /* eslint-env mocha */
// const assert = require('assert')
// const TestHelper = require('../../../../../test-helper.js')
// const util = require('util')

// const wait = util.promisify(async (callback) => {
//   return setTimeout(callback, 1000)
// })

// describe('/api/user/connect/resubmit-required-information', () => {
//   describe('ResubmitRequiredInformation#patch', () => {
//     it('should reject invalid stripeid', async () => {
//       const user = await TestHelper.createUser()
//       const req = TestHelper.createRequest(`/api/user/connect/resubmit-required-information?stripeid=invalid`)
//       req.account = user.account
//       req.session = user.session
//       req.file = {
//         id: 'fileid'
//       }
//       req.body = {}
//       let errorMessage
//       try {
//         await req.route.api.patch(req)
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
//       const req = TestHelper.createRequest(`/api/user/connect/resubmit-required-information?stripeid=${user.stripeAccount.id}`)
//       req.account = user2.account
//       req.session = user2.session
//       req.file = {
//         id: 'fileid'
//       }
//       req.body = {}
//       let errorMessage
//       try {
//         await req.route.api.patch(req)
//       } catch (error) {
//         errorMessage = error.message
//       }
//       assert.strictEqual(errorMessage, 'invalid-stripe-account')
//     })

//     it('should reject unsubmitted registration', async () => {
//       const user = await TestHelper.createUser()
//       await TestHelper.createStripeAccount(user, { type: 'company', country: 'US' })
//       await TestHelper.createStripeRegistration(user, { business_tax_id: 1, business_name: user.profile.firstName + '\'s company', country: 'US', city: 'New York City', personal_city: 'New York City', postal_code: '10001', personal_id_number: '000000000', line1: 'First Street', day: '1', month: '1', year: '1950', company_city: 'New York City', company_state: 'New York', company_line1: 'First Street', company_postal_code: '10001', ssn_last_4: '0000' })
//       const req = TestHelper.createRequest(`/api/user/connect/resubmit-required-information?stripeid=${user.stripeAccount.id}`)
//       req.account = user.account
//       req.session = user.session
//       req.body = {}
//       let errorMessage
//       try {
//         await req.route.api.patch(req)
//       } catch (error) {
//         errorMessage = error.message
//       }
//       assert.strictEqual(errorMessage, 'invalid-stripe-account')
//     })

//     it('should reject Stripe accounts that don\'t require resubmitted information', async () => {
//       const user = await TestHelper.createUser()
//       await TestHelper.createStripeAccount(user, { type: 'company', country: 'US' })
//       await TestHelper.createStripeRegistration(user, { business_tax_id: 1, business_name: user.profile.firstName + '\'s company', country: 'US', city: 'New York City', personal_city: 'New York City', postal_code: '10001', personal_id_number: '000000000', line1: 'First Street', day: '1', month: '1', year: '1950', company_city: 'New York City', company_state: 'New York', company_line1: 'First Street', company_postal_code: '10001', ssn_last_4: '0000' })
//       await TestHelper.createExternalAccount(user, { currency: 'usd', country: 'US', account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`, account_type: 'individual', account_number: '000123456789', routing_number: '110000000' })
//       const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
//       req.account = user.account
//       req.session = user.session
//       user.stripeAccount = await req.patch()
//       const req2 = TestHelper.createRequest(`/api/user/connect/resubmit-required-information?stripeid=${user.stripeAccount.id}`)
//       req2.account = user.account
//       req2.session = user.session
//       req2.body = {}
//       let errorMessage
//       try {
//         await req2.route.api.patch(req2)
//       } catch (error) {
//         errorMessage = error.message
//       }
//       assert.strictEqual(errorMessage, 'invalid-stripe-account')
//     })
//   })

//   describe('ResubmitRequiredInformation#PATCH', () => {
//     it('should resubmit failed personal id number', async () => {
//       const user = await TestHelper.createUser()
//       await TestHelper.createStripeAccount(user, { type: 'company', country: 'US' })
//       await TestHelper.createStripeRegistration(user, { business_tax_id: 1, business_name: user.profile.firstName + '\'s company', country: 'US', city: 'New York City', personal_city: 'New York City', postal_code: '10001', personal_id_number: '000000000', line1: 'First Street', day: '1', month: '1', year: '1950', company_city: 'New York City', company_state: 'New York', company_line1: 'First Street', company_postal_code: '10001', ssn_last_4: '0000' })
//       await TestHelper.createExternalAccount(user, { currency: 'usd', country: 'US', account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`, account_type: 'individual', account_number: '000123456789', routing_number: '110000000' })
//       const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
//       req.account = user.account
//       req.session = user.session
//       user.stripeAccount = await req.patch()
//       console.log(user.stripeAccount)
//       await TestHelper.triggerVerification(user)
//       const req2 = TestHelper.createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
//       req2.account = req.account
//       req2.session = req.session
//       while (true) {
//         user.stripeAccount = await req2.route.api.get(req2)
//         if (user.stripeAccount.verification.fields_needed.length > 0) {
//           assert.strictEqual(user.stripeAccount.verification.fields_needed.length, 1)
//           const req3 = TestHelper.createRequest(`/api/user/connect/resubmit-required-information?stripeid=${user.stripeAccount.id}`)
//           req3.account = user.account
//           req3.session = user.session
//           req3.body = {}
//           const accountNow = await req3.route.api.patch(req3)
//           assert.strictEqual(accountNow.verification.fields_needed.length, 0)
//           return
//         } else if (new Date().getTime() % 4 === 0) {
//           console.log(user.stripeAccount.id, user.charge.id, user.stripeAccount.verification)
//         }
//         await wait()
//       }
//     })

//     it('should resubmit failed ssn last 4', async () => {
//       const user = await TestHelper.createUser()
//       await TestHelper.createStripeAccount(user, { type: 'company', country: 'US' })
//       await TestHelper.createStripeRegistration(user, { business_tax_id: 1, business_name: user.profile.firstName + '\'s company', country: 'US', city: 'New York City', personal_city: 'New York City', postal_code: '10001', personal_id_number: '000000000', line1: 'First Street', day: '1', month: '1', year: '1950', company_city: 'New York City', company_state: 'New York', company_line1: 'First Street', company_postal_code: '10001', ssn_last_4: '0000' })
//       const req = TestHelper.createRequest(`/api/user/connect/resubmit-required-information?stripeid=${user.stripeAccount.id}`)
//       req.account = user.account
//       req.session = user.session
//       req.file = {
//         id: 'fileid'
//       }
//       req.body = {}
//       const accountNow = await req.patch()
//       const registrationNow = JSON.parse(accountNow.metadata.registration)
//       assert.strictEqual(registrationNow.documentid, req.file.id)
//     })

//     it('should resubmit failed business tax id', async () => {
//       const user = await TestHelper.createUser()
//       await TestHelper.createStripeAccount(user, { type: 'company', country: 'US' })
//       await TestHelper.createStripeRegistration(user, { business_tax_id: 1, business_name: user.profile.firstName + '\'s company', country: 'US', city: 'New York City', personal_city: 'New York City', postal_code: '10001', personal_id_number: '000000000', line1: 'First Street', day: '1', month: '1', year: '1950', company_city: 'New York City', company_state: 'New York', company_line1: 'First Street', company_postal_code: '10001', ssn_last_4: '0000' })
//       await TestHelper.createExternalAccount(user, { currency: 'usd', country: 'US', account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`, account_type: 'individual', account_number: '000123456789', routing_number: '110000000' })
//       const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
//       req.account = user.account
//       req.session = user.session
//       user.stripeAccount = await req.patch()
//       await TestHelper.triggerVerification(user)
//       const req2 = TestHelper.createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
//       req2.account = req.account
//       req2.session = req.session
//       while (true) {
//         user.stripeAccount = await req2.route.api.get(req2)
//         if (user.stripeAccount.verification.fields_needed.length > 0) {
//           console.log(user.stripeAccount)
//           assert.strictEqual(user.stripeAccount.verification.fields_needed.length, 1)
//           const req3 = TestHelper.createRequest(`/api/user/connect/resubmit-required-information?stripeid=${user.stripeAccount.id}`)
//           req3.account = user.account
//           req3.session = user.session
//           req3.body = {}
//           const accountNow = await req3.route.api.patch(req3)
//           assert.strictEqual(accountNow.verification.fields_needed.length, 0)
//           return
//         } else if (new Date().getTime() % 4 === 0) {
//           console.log(user.stripeAccount)
//         }
//         await wait()
//       }
//     })

//     it('should something', async () => {
//       const user = await TestHelper.createUser()
//       await TestHelper.createStripeAccount(user, { type: 'company', country: 'US' })
//       await TestHelper.createStripeRegistration(user, { business_tax_id: 1, business_name: user.profile.firstName + '\'s company', country: 'US', city: 'New York City', personal_city: 'New York City', postal_code: '10001', personal_id_number: '000000000', line1: 'First Street', day: '1', month: '1', year: '1950', company_city: 'New York City', company_state: 'New York', company_line1: 'First Street', company_postal_code: '10001', ssn_last_4: '0000' })
//       await TestHelper.createExternalAccount(user, { currency: 'usd', country: 'US', account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`, account_type: 'individual', account_number: '000123456789', routing_number: '110000000' })
//       const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
//       req.account = user.account
//       req.session = user.session
//       user.stripeAccount = await req.patch()
//       const req2 = TestHelper.createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
//       req2.account = req.account
//       req2.session = req.session
//       console.log(user.stripeAccount)
//       while (true) {
//         user.stripeAccount = await req2.route.api.get(req2)
//         if (user.stripeAccount.verification.fields_needed.length > 0) {
//           console.log(user.stripeAccount)
//           assert.strictEqual(user.stripeAccount.verification.fields_needed.length, 1)
//           const req3 = TestHelper.createRequest(`/api/user/connect/resubmit-required-information?stripeid=${user.stripeAccount.id}`)
//           req3.account = user.account
//           req3.session = user.session
//           req3.body = {}
//           const accountNow = await req3.route.api.patch(req3)
//           assert.strictEqual(accountNow.verification.fields_needed.length, 0)
//           return
//         } else if (new Date().getTime() % 4 === 0) {
//           console.log(user.stripeAccount)
//         }
//         await wait()
//       }
//     })
//   })
// })
