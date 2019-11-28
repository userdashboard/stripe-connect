/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')

describe('/api/user/connect/update-payment-information', () => {
  describe('exceptions', () => {
    describe('invalid-stripeid', () => {
      it('missing querystring stripeid', async () => {
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/connect/update-payment-information')
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
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-stripeid')
      })

      it('invalid querystring stripeid', async () => {
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/connect/update-payment-information?stripeid=invalid')
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
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-stripeid')
      })
    })

    describe('invalid-account', () => {
      it('ineligible accessing account', async () => {
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
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-account')
      })
    })

    describe('invalid-currency', () => {
      it('missing posted currency', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'AT'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          currency: '',
          country: 'AT',
          account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
          account_type: 'company',
          iban: 'AT89370400440532013000'
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-currency')
      })
    })

    describe('invalid-country', () => {
      it('missing posted country', async () => {
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
          country: '',
          account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
          account_type: 'company',
          iban: 'AT89370400440532013000'
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-country')
      })
    })

    describe('invalid-account_holder_name', () => {
      it('missing posted account_holder_name', async () => {
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
          account_holder_name: '',
          account_type: 'company',
          iban: 'AT89370400440532013000'
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-account_holder_name')
      })
    })

    describe('invalid-account_type', () => {
      it('missing posted account_type', async () => {
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
          account_type: '',
          iban: 'AT89370400440532013000'
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-account_type')
      })
    })

    describe('invalid-iban', () => {
      it('missing posted iban', async () => {
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
          iban: ''
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-iban')
      })
    })

    describe('invalid-bsb_number', () => {
      it('missing posted bsb_number', async () => {
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
          bsb_number: ''
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-bsb_number')
      })
    })

    describe('invalid-account_number', () => {
      it('missing posted account_number', async () => {
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
          account_number: '',
          bsb_number: '110000'
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-account_number')
      })
    })

    describe('invalid-institution_number', () => {
      it('missing posted institution_number', async () => {
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
          institution_number: '',
          transit_number: '11000'
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-institution_number')
      })
    })

    describe('invalid-transit_number', () => {
      it('missing posted transit_number', async () => {
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
          transit_number: ''
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-transit_number')
      })
    })

    describe('invalid-sort_code', () => {
      it('missing posted sort_code', async () => {
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
          sort_code: ''
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-sort_code')
      })
    })

    describe('invalid-clearing_code', () => {
      it('missing posted clearing_code', async () => {
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
          clearing_code: '',
          branch_code: '000'
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-clearing_code')
      })
    })

    describe('invalid-branch_code', () => {
      it('missing posted branch_code', async () => {
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
          branch_code: ''
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-branch_code')
      })
    })

    describe('invalid-bank_code', () => {
      it('missing posted bank_code', async () => {
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
          bank_code: '',
          branch_code: '000'
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-bank_code')
      })
    })

    describe('invalid-routing_number', () => {
      it('missing posted routing_number', async () => {
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
          routing_number: ''
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-routing_number')
      })
    })
  })

  describe('returns', () => {
    it('object for AT registration', async () => {
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

    it('object for AU registration', async () => {
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

    it('object for BE registration', async () => {
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

    it('object for CA registration', async () => {
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

    it('object for CH registration', async () => {
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

    it('object for DE registration', async () => {
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

    it('object for DK registration', async () => {
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

    it('object for EE registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'EE'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        currency: 'eur',
        country: 'EE',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'company',
        iban: 'EE89370400440532013000'
      }
      const accountNow = await req.patch()
      assert.strictEqual(accountNow.external_accounts.data.length, 1)
    })

    it('object for ES registration', async () => {
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
    
    it('object for FI registration', async () => {
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

    it('object for FR registration', async () => {
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

    it('object for GB registration (account number, sort code)', async () => {
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

    it('object for GB registration (iban)', async () => {
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

    it('object for HK registration', async () => {
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

    it('object for IE registration', async () => {
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

    it('object for IT registration', async () => {
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

    // it('object for JP registration', async () => {
    //   const user = await TestHelper.createUser()
    //   await TestHelper.createStripeAccount(user, {
    //     type: 'company',
    //     country: 'JP'
    //   })
    //   const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
    //   req.account = user.account
    //   req.session = user.session
    //   req.body = {
    //     currency: 'jpy',
    //     country: 'JP',
    //     account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
    //     account_type: 'individual',
    //     account_number: '00012345',
    //     bank_code: '1100',
    //     branch_code: '000'
    //   }
    //   const accountNow = await req.patch()
    //   assert.strictEqual(accountNow.external_accounts.data.length, 1)
    // })
    
    
    it('object for LT registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'LT'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        currency: 'eur',
        country: 'LT',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'company',
        iban: 'LT89370400440532013000'
      }
      const accountNow = await req.patch()
      assert.strictEqual(accountNow.external_accounts.data.length, 1)
    })


    it('object for LU registration', async () => {
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

    
    it('object for LV registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'LV'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        currency: 'eur',
        country: 'LV',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'company',
        iban: 'LV89370400440532013000'
      }
      const accountNow = await req.patch()
      assert.strictEqual(accountNow.external_accounts.data.length, 1)
    })

    // it.only('object for MX registration', async () => {
    //   const user = await TestHelper.createUser()
    //   await TestHelper.createStripeAccount(user, {
    //     type: 'company',
    //     country: 'MX'
    //   })
    //   const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
    //   req.account = user.account
    //   req.session = user.session
    //   req.body = {
    //     currency: 'eur',
    //     country: 'MX',
    //     account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
    //     account_type: 'company',
    //     iban: 'MX89370400440532013000'
    //   }
    //   const accountNow = await req.patch()
    //   assert.strictEqual(accountNow.external_accounts.data.length, 1)
    // })

    it('object for NL registration', async () => {
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

    it('object for NO registration', async () => {
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

    it('object for NZ registration', async () => {
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

    it('object for PT registration', async () => {
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

    it('object for SE registration', async () => {
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

    it('object for SG registration', async () => {
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

    it('object for SI registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'SI'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        currency: 'eur',
        country: 'SI',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'company',
        iban: 'SI89370400440532013000'
      }
      const accountNow = await req.patch()
      assert.strictEqual(accountNow.external_accounts.data.length, 1)
    })

    it('object for SK registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'SK'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        currency: 'eur',
        country: 'SK',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'company',
        iban: 'SK89370400440532013000'
      }
      const accountNow = await req.patch()
      assert.strictEqual(accountNow.external_accounts.data.length, 1)
    })

    it('object for US registration', async () => {
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
