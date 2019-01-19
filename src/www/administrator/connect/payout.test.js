// /* eslint-env mocha */
// const assert = require('assert')
// const TestHelper = require('../../../../test-helper.js')

// describe(`/administrator/connect/payout`, () => {
//   describe('Payout#BEFORE', () => {
//     it('should reject invalid payoutid', async () => {
//       const administrator = await TestHelper.createAdministrator()
//       const req = TestHelper.createRequest(`/administrator/connect/payout?payoutid=invalid`)
//       req.account = administrator.account
//       req.session = administrator.session
//       let errorMessage
//       try {
//         await req.route.api.before(req)
//       } catch (error) {
//         errorMessage = error.message
//       }
//       assert.strictEqual(errorMessage, 'invalid-payoutid')
//     })

//     it('should bind payout to req', async () => {
//       const administrator = await TestHelper.createAdministrator()
//       const user = await TestHelper.createUser()
//       await TestHelper.createStripeAccount(user, { type: 'individual', country: 'US' })
//       await TestHelper.createStripeRegistration(user, { city: 'New York City', postal_code: '10001', personal_id_number: '000000000', line1: 'First Street', day: '1', month: '1', year: '1950', state: 'New York', ssn_last_4: '0000' })
//       await TestHelper.createExternalAccount(user, { currency: 'usd', country: 'US', account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`, account_type: 'individual', account_number: '000123456789', routing_number: '110000000' })
//       await TestHelper.submitStripeAccount(user)
//       await TestHelper.createPayout(user)
//       await TestHelper.waitForPayout(user.stripeAccount.id, null)
//       const req = TestHelper.createRequest(`/administrator/connect/payout?payoutid=${user.payout.id}`)
//       req.account = administrator.account
//       req.session = administrator.session
//       await req.route.api.before(req)
//       assert.strictEqual(req.data.payout.id, user.payout.id)
//     })
//   })

//   describe('Payout#GET', () => {
//     it('should have row for payout', async () => {
//       const administrator = await TestHelper.createAdministrator()
//       const user = await TestHelper.createUser()
//       await TestHelper.createStripeAccount(user, { type: 'individual', country: 'US' })
//       await TestHelper.createStripeRegistration(user, { city: 'New York City', postal_code: '10001', personal_id_number: '000000000', line1: 'First Street', day: '1', month: '1', year: '1950', state: 'New York', ssn_last_4: '0000' })
//       await TestHelper.createExternalAccount(user, { currency: 'usd', country: 'US', account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`, account_type: 'individual', account_number: '000123456789', routing_number: '110000000' })
//       await TestHelper.submitStripeAccount(user)
//       await TestHelper.createPayout(user)
//       await TestHelper.waitForPayout(user.stripeAccount.id, null)
//       const req = TestHelper.createRequest(`/administrator/connect/payout?payoutid=${user.payout.id}`)
//       req.account = administrator.account
//       req.session = administrator.session
//       const page = await req.get()
//       const doc = TestHelper.extractDoc(page)
//       const row = doc.getElementById(user.payout.id)
//       assert.strictEqual(row.tag, 'tr')
//     })
//   })
// })
