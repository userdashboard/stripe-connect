// /* eslint-env mocha */
// TODO: Stripe test API currently has a bug failing verifications

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
//         await req.patch(req)
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
//         company_name: 'Company',
//         company_tax_id: '8',
//         company_phone: '456-123-7890',
//         company_address_city: 'New York',
//         company_address_line1: '285 Fulton St',
//         company_address_postal_code: '10007',
//         company_address_state: 'NY',
//         business_profile_mcc: '8931',
//         business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
//         relationship_representative_dob_day: '1',
//         relationship_representative_dob_month: '1',
//         relationship_representative_dob_year: '1950',
//         relationship_representative_ssn_last_4: '0000',
//         relationship_representative_first_name: user.profile.firstName,
//         relationship_representative_last_name: user.profile.lastName,
//         relationship_representative_email: user.profile.contactEmail,
//         relationship_representative_phone: '456-789-0123',
//         relationship_representative_address_city: 'New York',
//         relationship_representative_address_state: 'NY',
//         relationship_representative_address_line1: '285 Fulton St',
//         relationship_representative_address_postal_code: '10007'
//       })
//       await TestHelper.createExternalAccount(user, {
//         currency: 'usd',
//         country: 'US',
//         account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
//         account_holder_type: 'individual',
//         account_number: '000123456789',
//         routing_number: '110000000'
//       })
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
//         await req.patch(req)
//       } catch (error) {
//         errorMessage = error.message
//       }
//       assert.strictEqual(errorMessage, 'invalid-account')
//     })

//     it('should reject unsubmitted registration', async () => {
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
//         company_address_line1: '285 Fulton St',
//         company_address_postal_code: '10007',
//         company_address_state: 'NY',
//         business_profile_mcc: '8931',
//         business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
//         relationship_representative_dob_day: '1',
//         relationship_representative_dob_month: '1',
//         relationship_representative_dob_year: '1950',
//         relationship_representative_ssn_last_4: '0000',
//         relationship_representative_first_name: user.profile.firstName,
//         relationship_representative_last_name: user.profile.lastName,
//         relationship_representative_email: user.profile.contactEmail,
//         relationship_representative_phone: '456-789-0123',
//         relationship_representative_address_city: 'New York',
//         relationship_representative_address_state: 'NY',
//         relationship_representative_address_line1: '285 Fulton St',
//         relationship_representative_address_postal_code: '10007'
//       })
//       await TestHelper.createExternalAccount(user, {
//         currency: 'usd',
//         country: 'US',
//         account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
//         account_holder_type: 'individual',
//         account_number: '000123456789',
//         routing_number: '110000000'
//       })
//       const req = TestHelper.createRequest(`/api/user/connect/resubmit-required-information?stripeid=${user.stripeAccount.id}`)
//       req.account = user.account
//       req.session = user.session
//       req.body = {}
//       let errorMessage
//       try {
//         await req.patch(req)
//       } catch (error) {
//         errorMessage = error.message
//       }
//       assert.strictEqual(errorMessage, 'invalid-stripe-account')
//     })

//     it('should reject Stripe accounts that don\'t require resubmitted information', async () => {
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
//         company_address_line1: '285 Fulton St',
//         company_address_postal_code: '10007',
//         company_address_state: 'NY',
//         business_profile_mcc: '8931',
//         business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
//         relationship_representative_dob_day: '1',
//         relationship_representative_dob_month: '1',
//         relationship_representative_dob_year: '1950',
//         relationship_representative_ssn_last_4: '0000',
//         relationship_representative_first_name: user.profile.firstName,
//         relationship_representative_last_name: user.profile.lastName,
//         relationship_representative_email: user.profile.contactEmail,
//         relationship_representative_phone: '456-789-0123',
//         relationship_representative_address_city: 'New York',
//         relationship_representative_address_state: 'NY',
//         relationship_representative_address_line1: '285 Fulton St',
//         relationship_representative_address_postal_code: '10007'
//       })
//       await TestHelper.createExternalAccount(user, {
//         currency: 'usd',
//         country: 'US',
//         account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
//         account_holder_type: 'individual',
//         account_number: '000123456789',
//         routing_number: '110000000'
//       })
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
//       await TestHelper.createStripeAccount(user, {
//         type: 'individual',
//         country: 'CA'
//       })
//       await TestHelper.createStripeRegistration(user, {
//         individual_address_city: 'Vancouver',
//         individual_address_state: 'BC',
//         individual_address_line1: '123 Sesame St',
//         individual_address_postal_code: 'V5K 0A1',
//         individual_id_number: '111111111',
//         individual_dob_day: '1',
//         individual_dob_month: '1',
//         individual_dob_year: '1950',
//         individual_first_name: user.profile.firstName,
//         individual_last_name: user.profile.lastName
//       })
//       await TestHelper.createExternalAccount(user, {
//         currency: 'cad',
//         country: 'CA',
//         account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
//         account_holder_type: 'individual',
//         account_number: '000123456789',
//         transit_number: '11000',
//         institution_number: '000'
//       })
//       // console.log('submitting account')
//       await TestHelper.submitStripeAccount(user)
//       // console.log('waiting for verification')
//       await TestHelper.waitForVerification(user.stripeAccount.id)
//       // console.log('triggering verifification')
//       await TestHelper.triggerVerification(user)
//       // console.log('waiting for unverification')
//       user.stripeAccount = await TestHelper.waitForVerificationFailure(user.stripeAccount.id)
//       // console.log('account is unverified', user.stripeAccount)
//       const req = TestHelper.createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
//       req.account = user.account
//       req.session = user.session
//       while (true) {
//         user.stripeAccount = await req.get()
//         if (user.stripeAccount.requirements.fields_needed.length > 0) {
//           assert.strictEqual(user.stripeAccount.requirements.fields_needed.length, 1)
//           const req2 = TestHelper.createRequest(`/api/user/connect/resubmit-required-information?stripeid=${user.stripeAccount.id}`)
//           req2.account = user.account
//           req2.session = user.session
//           req2.body = {}
//           const accountNow = await req2.route.api.patch(req2)
//           assert.strictEqual(accountNow.requirements.fields_needed.length, 0)
//           return
//         } else if (new Date().getTime() % 4 === 0) {
//           // console.log(user.stripeAccount.id, user.charge.id, user.stripeAccount.verification)
//         }
//         await wait()
//       }
//     })

//     it('should resubmit failed ssn last 4', async () => {
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
//         company_address_line1: '285 Fulton St',
//         company_address_postal_code: '10007',
//         company_address_state: 'NY',
//         business_profile_mcc: '8931',
//         business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
//         relationship_representative_dob_day: '1',
//         relationship_representative_dob_month: '1',
//         relationship_representative_dob_year: '1950',
//         relationship_representative_ssn_last_4: '0000',
//         relationship_representative_first_name: user.profile.firstName,
//         relationship_representative_last_name: user.profile.lastName,
//         relationship_representative_email: user.profile.contactEmail,
//         relationship_representative_phone: '456-789-0123',
//         relationship_representative_address_city: 'New York',
//         relationship_representative_address_state: 'NY',
//         relationship_representative_address_line1: '285 Fulton St',
//         relationship_representative_address_postal_code: '10007'
//       })
//       await TestHelper.createExternalAccount(user, {
//         currency: 'usd',
//         country: 'US',
//         account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
//         account_holder_type: 'individual',
//         account_number: '000123456789',
//         routing_number: '110000000'
//       })
//       const req = TestHelper.createRequest(`/api/user/connect/resubmit-required-information?stripeid=${user.stripeAccount.id}`)
//       req.account = user.account
//       req.session = user.session
//       req.file = {
//         id: 'fileid'
//       }
//       req.body = {}
//       const accountNow = await req.patch()
//       const registrationNow = JSON.parse(accountNow.metadata.registration + (accountNow.metadata.registration2 || ''))
//       assert.strictEqual(registrationNow.documentid, req.file.id)
//     })

//     it('should resubmit failed business tax id', async () => {
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
//         company_address_line1: '285 Fulton St',
//         company_address_postal_code: '10007',
//         company_address_state: 'NY',
//         business_profile_mcc: '8931',
//         business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
//         relationship_representative_dob_day: '1',
//         relationship_representative_dob_month: '1',
//         relationship_representative_dob_year: '1950',
//         relationship_representative_ssn_last_4: '0000',
//         relationship_representative_first_name: user.profile.firstName,
//         relationship_representative_last_name: user.profile.lastName,
//         relationship_representative_email: user.profile.contactEmail,
//         relationship_representative_phone: '456-789-0123',
//         relationship_representative_address_city: 'New York',
//         relationship_representative_address_state: 'NY',
//         relationship_representative_address_line1: '285 Fulton St',
//         relationship_representative_address_postal_code: '10007'
//       })
//       await TestHelper.createExternalAccount(user, {
//         currency: 'usd',
//         country: 'US',
//         account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
//         account_holder_type: 'individual',
//         account_number: '000123456789',
//         routing_number: '110000000'
//       })
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
//         if (user.stripeAccount.requirements.fields_needed.length > 0) {
//           // console.log(user.stripeAccount)
//           assert.strictEqual(user.stripeAccount.requirements.fields_needed.length, 1)
//           const req3 = TestHelper.createRequest(`/api/user/connect/resubmit-required-information?stripeid=${user.stripeAccount.id}`)
//           req3.account = user.account
//           req3.session = user.session
//           req3.body = {}
//           const accountNow = await req3.route.api.patch(req3)
//           assert.strictEqual(accountNow.requirements.fields_needed.length, 0)
//           return
//         } else if (new Date().getTime() % 4 === 0) {
//           // console.log(user.stripeAccount)
//         }
//         await wait()
//       }
//     })

//     it('should something', async () => {
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
//         company_address_line1: '285 Fulton St',
//         company_address_postal_code: '10007',
//         company_address_state: 'NY',
//         business_profile_mcc: '8931',
//         business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
//         relationship_representative_dob_day: '1',
//         relationship_representative_dob_month: '1',
//         relationship_representative_dob_year: '1950',
//         relationship_representative_ssn_last_4: '0000',
//         relationship_representative_first_name: user.profile.firstName,
//         relationship_representative_last_name: user.profile.lastName,
//         relationship_representative_email: user.profile.contactEmail,
//         relationship_representative_phone: '456-789-0123',
//         relationship_representative_address_city: 'New York',
//         relationship_representative_address_state: 'NY',
//         relationship_representative_address_line1: '285 Fulton St',
//         relationship_representative_address_postal_code: '10007'
//       })
//       await TestHelper.createExternalAccount(user, {
//         currency: 'usd',
//         country: 'US',
//         account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
//         account_holder_type: 'individual',
//         account_number: '000123456789',
//         routing_number: '110000000'
//       })
//       const req = TestHelper.createRequest(`/api/user/connect/set-company-registration-submitted?stripeid=${user.stripeAccount.id}`)
//       req.account = user.account
//       req.session = user.session
//       user.stripeAccount = await req.patch()
//       const req2 = TestHelper.createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
//       req2.account = req.account
//       req2.session = req.session
//       while (true) {
//         user.stripeAccount = await req2.route.api.get(req2)
//         if (user.stripeAccount.requirements.fields_needed.length > 0) {
//           assert.strictEqual(user.stripeAccount.requirements.fields_needed.length, 1)
//           const req3 = TestHelper.createRequest(`/api/user/connect/resubmit-required-information?stripeid=${user.stripeAccount.id}`)
//           req3.account = user.account
//           req3.session = user.session
//           req3.body = {}
//           const accountNow = await req3.route.api.patch(req3)
//           assert.strictEqual(accountNow.requirements.fields_needed.length, 0)
//           return
//         } else if (new Date().getTime() % 4 === 0) {
//           // console.log(user.stripeAccount)
//         }
//         await wait()
//       }
//     })
//   })
// })
