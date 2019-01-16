// /* eslint-env mocha */
// const assert = require('assert')
// const TestHelper = require('../../../../test-helper.js')

// describe(`/administrator/connect/payouts`, () => {
//   describe('Payouts#BEFORE', () => {
//     it('should bind payouts to req', async () => {
//       const administrator = await TestHelper.createAdministrator()
//       const user = await TestHelper.createUser()
//       await TestHelper.createStripeAccount(user, { type: 'individual', country: 'US' })
//       await TestHelper.createStripeRegistration(user, { city: 'New York City', postal_code: '10001', personal_id_number: '000000000', line1: 'First Street', day: '1', month: '1', year: '1950', state: 'New York', ssn_last_4: '0000' })
//       await TestHelper.createExternalAccount(user, { currency: 'usd', country: 'US', account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`, account_type: 'individual', account_number: '000123456789', routing_number: '110000000' })
//       await TestHelper.submitStripeAccount(user)
//       const payout1 = await TestHelper.createPayout(user)
//       await TestHelper.waitForPayout(user.stripeAccount.id, null)
//       const user2 = await TestHelper.createUser()
//       await TestHelper.createStripeAccount(user2, { type: 'individual', country: 'US', city: 'New York City', postal_code: '10001', state: 'NY', personal_id_number: '000000000', ssn_last_4: '0000', line1: 'First Street', day: '1', month: '1', year: '1950' })
//       await TestHelper.createExternalAccount(user2, { currency: 'usd', country: 'US', account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`, account_type: 'individual', account_number: '000123456789', routing_number: '110000000' })
//       await TestHelper.submitStripeAccount(user2)
//       const payout2 = await TestHelper.createPayout(user2)
//       await TestHelper.waitForPayout(user2.stripeAccount.id, null)
//       const req = TestHelper.createRequest(`/administrator/connect/payouts`)
//       req.account = administrator.account
//       req.session = administrator.session
//       await req.route.api.before(req)
//       assert.strictEqual(req.data.payouts[0].id, payout2.id)
//       assert.strictEqual(req.data.payouts[1].id, payout1.id)
//     })
//   })

//   describe('Payouts#GET', () => {
//     it('should have row for each payout', async () => {
//       const administrator = await TestHelper.createAdministrator()
//       const user = await TestHelper.createUser()
//       await TestHelper.createStripeAccount(user, { type: 'individual', country: 'US' })
//       await TestHelper.createStripeRegistration(user, { city: 'New York City', postal_code: '10001', personal_id_number: '000000000', line1: 'First Street', day: '1', month: '1', year: '1950', state: 'New York', ssn_last_4: '0000' })
//       await TestHelper.createExternalAccount(user, { currency: 'usd', country: 'US', account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`, account_type: 'individual', account_number: '000123456789', routing_number: '110000000' })
//       await TestHelper.submitStripeAccount(user)
//       const payout1 = await TestHelper.createPayout(user)
//       await TestHelper.waitForPayout(user.stripeAccount.id, null)
//       const user2 = await TestHelper.createUser()
//       await TestHelper.createStripeAccount(user2, { type: 'individual', country: 'US', city: 'New York City', postal_code: '10001', state: 'NY', personal_id_number: '000000000', ssn_last_4: '0000', line1: 'First Street', day: '1', month: '1', year: '1950' })
//       await TestHelper.createExternalAccount(user2, { currency: 'usd', country: 'US', account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`, account_type: 'individual', account_number: '000123456789', routing_number: '110000000' })
//       await TestHelper.submitStripeAccount(user2)
//       const payout2 = await TestHelper.createPayout(user2)
//       await TestHelper.waitForPayout(user2.stripeAccount.id, null)
//       const req = TestHelper.createRequest(`/administrator/connect/payouts`)
//       req.account = administrator.account
//       req.session = administrator.session
//       const page = await req.get()
//       const doc = TestHelper.extractDoc(page)
//       const payout1Row = doc.getElementById(payout1.id)
//       const payout2Row = doc.getElementById(payout2.id)
//       assert.strictEqual(payout1Row.tag, 'tr')
//       assert.strictEqual(payout2Row.tag, 'tr')
//     })
//   })
// })
