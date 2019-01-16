// /* eslint-env mocha */
// const assert = require('assert')
// const TestHelper = require('../../../../../test-helper.js')

// describe(`/api/user/connect/stripe-account-payouts`, () => {
//   describe('StripeAccountPayouts#GET', () => {
//     it('should return all payouts on Stripe account', async () => {
//       const user = await TestHelper.createUser()
//       await TestHelper.createStripeAccount(user, { type: 'individual', country: 'US' })
//       await TestHelper.createStripeRegistration(user, { city: 'New York City', postal_code: '10001', personal_id_number: '000000000', line1: 'First Street', day: '1', month: '1', year: '1950', state: 'New York', ssn_last_4: '0000' })
//       await TestHelper.createExternalAccount(user, { currency: 'usd', country: 'US', account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`, account_type: 'individual', account_number: '000123456789', routing_number: '110000000' })
//       await TestHelper.submitStripeAccount(user)
//       const payout1 = await TestHelper.createPayout(user)
//       await TestHelper.waitForPayout(user.stripeAccount.id, null)
//       const req = TestHelper.createRequest(`/api/user/connect/stripe-account-payouts?stripeid=${user.stripeAccount.id}`)
//       req.account = user.account
//       req.session = user.session
//       const payouts = await req.get()
//       assert.strictEqual(payouts.length, 1)
//       assert.strictEqual(payouts[0].id, payout1.id)
//     })
//   })
// })
