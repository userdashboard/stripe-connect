/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')

async function testEachFieldAsNull (req) {
  let errors = 0
  for (const field in req.body) {
    const valueWas = req.body[field]
    req.body[field] = null
    try {
      await req.route.api.patch(req)
    } catch (error) {
      assert.strictEqual(error.message, `invalid-${field}`)
      errors++
    }
    req.body[field] = valueWas
  }
  assert.strictEqual(errors, Object.keys(req.body).length)
}

describe('/api/user/connect/update-payment-information', () => {
  describe('UpdatePaymentInformation#PATCH', () => {
    it('should reject invalid stripeid', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=invalid`)
      req.account = user.account
      req.session = user.session
      req.body = {
        currency: 'gbp',
        country: 'GB',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        account_number: '00012345',
        sort_code: '108800'
      }
      let errorMessage
      try {
        await req.route.api.patch(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-stripeid')
    })

    it('should reject other account\'s Stripe account', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'US'
      })
      const user2 = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
      req.account = user2.account
      req.session = user2.session
      req.body = {
        currency: 'gbp',
        country: 'GB',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        account_number: '00012345',
        sort_code: '108800'
      }
      let errorMessage
      try {
        await req.route.api.patch(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-account')
    })

    it(`should reject AT invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'AT'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        currency: 'eur',
        country: 'AT',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'company',
        iban: 'AT89370400440532013000'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject AU invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'AU'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        currency: 'aud',
        country: 'AU',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        account_number: '000123456',
        bsb_number: '110000'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject BE invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'BE'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        currency: 'eur',
        country: 'BE',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'company',
        iban: 'BE89370400440532013000'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject CA invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'CA'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        currency: 'cad',
        country: 'CA',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        account_number: '000123456789',
        institution_number: '000',
        transit_number: '11000'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject CH invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'CH'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        currency: 'eur',
        country: 'CH',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        iban: 'CH89370400440532013000'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject DE invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'DE'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        currency: 'eur',
        country: 'DE',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        iban: 'DE89370400440532013000'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject DK invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'DK'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        currency: 'eur',
        country: 'DK',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        iban: 'DK89370400440532013000'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject ES invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'ES'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        currency: 'eur',
        country: 'ES',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        iban: 'ES89370400440532013000'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject FI invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'FI'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        currency: 'eur',
        country: 'FI',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        iban: 'FI89370400440532013000'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject FR invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'FR'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        currency: 'eur',
        country: 'FR',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        iban: 'FR89370400440532013000'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject GB invalid fields (account number, sort code)`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'GB'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        currency: 'gbp',
        country: 'GB',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        account_number: '00012345',
        sort_code: '108800'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject GB invalid fields (iban)`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'GB'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        currency: 'eur',
        country: 'GB',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        iban: 'GB89370400440532013000'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject HK invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'HK'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        currency: 'hkd',
        country: 'HK',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        account_number: '000123-456',
        clearing_code: '110',
        branch_code: '000'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject IE invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'IE'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        currency: 'eur',
        country: 'IE',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        iban: 'IE89370400440532013000'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject IT invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'IT'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        currency: 'eur',
        country: 'IE',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        iban: 'IT89370400440532013000'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject JP invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'JP'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        currency: 'jpy',
        country: 'JP',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        account_number: '00012345',
        bank_code: '1100',
        branch_code: '000'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject LU invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'LU'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        currency: 'eur',
        country: 'LU',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        iban: 'LU89370400440532013000'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject NL invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'NL'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        currency: 'eur',
        country: 'NL',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        iban: 'NL89370400440532013000'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject NO invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'NO'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        currency: 'eur',
        country: 'NO',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        iban: 'NO89370400440532013000'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject NZ invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'NZ'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        currency: 'nzd',
        country: 'NZ',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        account_number: '000123456',
        routing_number: '1234'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject PT invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'PT'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        currency: 'eur',
        country: 'PT',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        iban: 'PT89370400440532013000'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject SE invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'SE'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        currency: 'eur',
        country: 'IE',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        iban: 'SE89370400440532013000'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject SG invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'SG'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        currency: 'sgd',
        country: 'SG',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        account_number: '000123456',
        bank_code: '1100',
        branch_code: '000'
      }
      await testEachFieldAsNull(req)
    })

    it(`should reject US invalid fields`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'US'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        currency: 'usd',
        country: 'US',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        account_number: '000123456789',
        routing_number: '110000000'
      }
      await testEachFieldAsNull(req)
    })

    it(`should update AT information`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'AT'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        currency: 'eur',
        country: 'AT',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'company',
        iban: 'AT89370400440532013000'
      }
      const accountNow = await req.patch()
      assert.strictEqual(accountNow.external_accounts.data.length, 1)
    })

    it(`should update AU information`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'AU'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        currency: 'aud',
        country: 'AU',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        account_number: '000123456',
        bsb_number: '110000'
      }
      const accountNow = await req.patch()
      assert.strictEqual(accountNow.external_accounts.data.length, 1)
    })


    it(`should update BE information`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'BE'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        currency: 'eur',
        country: 'BE',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'company',
        iban: 'BE89370400440532013000'
      }
      const accountNow = await req.patch()
      assert.strictEqual(accountNow.external_accounts.data.length, 1)
    })

    it(`should update CA information`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'CA'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        currency: 'cad',
        country: 'CA',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        account_number: '000123456789',
        institution_number: '000',
        transit_number: '11000'
      }
      const accountNow = await req.patch()
      assert.strictEqual(accountNow.external_accounts.data.length, 1)
    })

    it(`should update CH information`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'CH'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        currency: 'eur',
        country: 'CH',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'company',
        iban: 'CH89370400440532013000'
      }
      const accountNow = await req.patch()
      assert.strictEqual(accountNow.external_accounts.data.length, 1)
    })

    it(`should update DE information`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'DE'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        currency: 'eur',
        country: 'DE',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'company',
        iban: 'DE89370400440532013000'
      }
      const accountNow = await req.patch()
      assert.strictEqual(accountNow.external_accounts.data.length, 1)
    })

    it(`should update DK information`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'DK'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        currency: 'eur',
        country: 'DK',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'company',
        iban: 'DK89370400440532013000'
      }
      const accountNow = await req.patch()
      assert.strictEqual(accountNow.external_accounts.data.length, 1)
    })

    it(`should update ES information`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'ES'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        currency: 'eur',
        country: 'ES',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'company',
        iban: 'ES89370400440532013000'
      }
      const accountNow = await req.patch()
      assert.strictEqual(accountNow.external_accounts.data.length, 1)
    })

    it(`should update FI information`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'FI'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        currency: 'eur',
        country: 'FI',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'company',
        iban: 'FI89370400440532013000'
      }
      const accountNow = await req.patch()
      assert.strictEqual(accountNow.external_accounts.data.length, 1)
    })

    it(`should update FR information`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'FR'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        currency: 'eur',
        country: 'FR',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'company',
        iban: 'FR89370400440532013000'
      }
      const accountNow = await req.patch()
      assert.strictEqual(accountNow.external_accounts.data.length, 1)
    })

    it(`should update GB information (account number, sort code)`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'GB'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        currency: 'gbp',
        country: 'GB',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        account_number: '00012345',
        sort_code: '108800'
      }
      const accountNow = await req.patch()
      assert.strictEqual(accountNow.external_accounts.data.length, 1)
    })

    it(`should update GB information (iban)`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'GB'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        currency: 'eur',
        country: 'GB',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        iban: 'GB89370400440532013000'
      }
      const accountNow = await req.patch()
      assert.strictEqual(accountNow.external_accounts.data.length, 1)
    })

    it(`should update HK information`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'HK'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        currency: 'hkd',
        country: 'HK',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        account_number: '000123-456',
        clearing_code: '110',
        branch_code: '000'
      }
      const accountNow = await req.patch()
      assert.strictEqual(accountNow.external_accounts.data.length, 1)
    })

    it(`should update IE information`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'IE'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        currency: 'eur',
        country: 'IE',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'company',
        iban: 'IE89370400440532013000'
      }
      const accountNow = await req.patch()
      assert.strictEqual(accountNow.external_accounts.data.length, 1)
    })

    it(`should update IT information`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'IT'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        currency: 'eur',
        country: 'IT',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'company',
        iban: 'IT89370400440532013000'
      }
      const accountNow = await req.patch()
      assert.strictEqual(accountNow.external_accounts.data.length, 1)
    })

    it(`should update JP information`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'JP'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        currency: 'jpy',
        country: 'JP',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        account_number: '00012345',
        bank_code: '1100',
        branch_code: '000'
      }
      const accountNow = await req.patch()
      assert.strictEqual(accountNow.external_accounts.data.length, 1)
    })
    it(`should update LU information`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'LU'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        currency: 'eur',
        country: 'LU',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'company',
        iban: 'LU89370400440532013000'
      }
      const accountNow = await req.patch()
      assert.strictEqual(accountNow.external_accounts.data.length, 1)
    })

    it(`should update NL information`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'NL'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        currency: 'eur',
        country: 'NL',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'company',
        iban: 'NL89370400440532013000'
      }
      const accountNow = await req.patch()
      assert.strictEqual(accountNow.external_accounts.data.length, 1)
    })

    it(`should update NO information`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'NO'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        currency: 'eur',
        country: 'NO',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'company',
        iban: 'NO89370400440532013000'
      }
      const accountNow = await req.patch()
      assert.strictEqual(accountNow.external_accounts.data.length, 1)
    })

    it(`should update NZ information`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'NZ'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        currency: 'nzd',
        country: 'NZ',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        account_number: '0000000010',
        routing_number: '110000'
      }
      const accountNow = await req.patch()
      assert.strictEqual(accountNow.external_accounts.data.length, 1)
    })

    it(`should update PT information`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'PT'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        currency: 'eur',
        country: 'PT',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'company',
        iban: 'PT89370400440532013000'
      }
      const accountNow = await req.patch()
      assert.strictEqual(accountNow.external_accounts.data.length, 1)
    })

    it(`should update SE information`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'SE'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        currency: 'eur',
        country: 'SE',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'company',
        iban: 'SE89370400440532013000'
      }
      const accountNow = await req.patch()
      assert.strictEqual(accountNow.external_accounts.data.length, 1)
    })

    it(`should update SG information`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'SG'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        currency: 'sgd',
        country: 'SG',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        account_number: '000123456',
        bank_code: '1100',
        branch_code: '000'
      }
      const accountNow = await req.patch()
      assert.strictEqual(accountNow.external_accounts.data.length, 1)
    })

    it(`should update US information`, async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'US'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        currency: 'usd',
        country: 'US',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        account_number: '000123456789',
        routing_number: '110000000'
      }
      const accountNow = await req.patch()
      assert.strictEqual(accountNow.external_accounts.data.length, 1)
    })
  })
})
