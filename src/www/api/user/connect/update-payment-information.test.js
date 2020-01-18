/* eslint-env mocha */
const assert = require('assert')
const connect = require('../../../../../index.js')
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
          account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
          account_holder_type: 'individual',
          account_number: '00012345',
          country: 'GB',
          currency: 'gbp',
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
          account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
          account_holder_type: 'individual',
          account_number: '00012345',
          country: 'GB',
          currency: 'gbp',
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
          country: 'US',
          type: 'company'
        })
        const user2 = await TestHelper.createUser()
        const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
        req.account = user2.account
        req.session = user2.session
        req.body = {
          account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
          account_holder_type: 'individual',
          account_number: '00012345',
          country: 'GB',
          currency: 'gbp',
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
          country: 'AT',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
          account_holder_type: 'company',
          country: 'AT',
          currency: '',
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

      it('invalid posted currency', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'AT',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
          account_holder_type: 'company',
          country: 'AT',
          currency: 'invalid',
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
          country: 'AT',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
          account_holder_type: 'company',
          country: '',
          currency: 'eur',
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

      it('invalid posted country', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'AT',
          type: 'individual'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
          account_holder_type: 'company',
          country: 'invalid',
          currency: 'eur',
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
          country: 'AT',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          account_holder_name: '',
          account_holder_type: 'company',
          country: 'AT',
          currency: 'eur',
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

    describe('invalid-account_holder_type', () => {
      it('missing posted account_holder_type', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'AT',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
          account_holder_type: '',
          country: 'AT',
          currency: 'eur',
          iban: 'AT89370400440532013000'
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-account_holder_type')
      })

      it('invalid posted account_holder_type', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'AT',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
          account_holder_type: 'invalid',
          country: 'AT',
          currency: 'eur',
          iban: 'AT89370400440532013000'
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-account_holder_type')
      })
    })

    describe('invalid-iban', () => {
      it('missing posted iban', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'AT',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
          account_holder_type: 'company',
          country: 'AT',
          currency: 'eur',
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

      it('invalid posted iban', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'AT',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
          account_holder_type: 'company',
          country: 'AT',
          currency: 'eur',
          iban: 'invalid'
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
          country: 'AU',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
          account_holder_type: 'individual',
          account_number: '000123456',
          bsb_number: '',
          country: 'AU',
          currency: 'aud'
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-bsb_number')
      })

      it('invalid posted bsb_number', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'AU',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
          account_holder_type: 'individual',
          account_number: '000123456',
          bsb_number: 'invalid',
          country: 'AU',
          currency: 'aud'
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
          country: 'AU',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
          account_holder_type: 'individual',
          account_number: '',
          bsb_number: '110000',
          country: 'AU',
          currency: 'aud'
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-account_number')
      })

      it('invalid posted account_number', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'AU',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
          account_holder_type: 'individual',
          account_number: 'invalid',
          bsb_number: '110000',
          country: 'AU',
          currency: 'aud'
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
          country: 'CA',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
          account_holder_type: 'individual',
          account_number: '000123456789',
          country: 'CA',
          currency: 'cad',
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

      it('invalid posted institution_number', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'CA',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
          account_holder_type: 'individual',
          account_number: '000123456789',
          country: 'CA',
          currency: 'cad',
          institution_number: 'invalid',
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
          country: 'CA',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
          account_holder_type: 'individual',
          account_number: '000123456789',
          country: 'CA',
          currency: 'cad',
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

      it('invalid posted transit_number', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'CA',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
          account_holder_type: 'individual',
          account_number: '000123456789',
          country: 'CA',
          currency: 'cad',
          institution_number: '000',
          transit_number: 'invalid'
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
          country: 'GB',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
          account_holder_type: 'individual',
          account_number: '00012345',
          country: 'GB',
          currency: 'gbp',
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

      it('invalid posted sort_code', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'GB',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
          account_holder_type: 'individual',
          account_number: '00012345',
          country: 'GB',
          currency: 'gbp',
          sort_code: 'invalid'
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
          country: 'HK',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
          account_holder_type: 'individual',
          account_number: '000123456',
          branch_code: '000',
          clearing_code: '',
          country: 'HK',
          currency: 'hkd'
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-clearing_code')
      })

      it('missing posted clearing_code', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'HK',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
          account_holder_type: 'individual',
          account_number: '000123456',
          branch_code: '000',
          clearing_code: 'invalid',
          country: 'HK',
          currency: 'hkd'
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
          country: 'HK',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
          account_holder_type: 'individual',
          account_number: '000123456',
          branch_code: '',
          clearing_code: '110',
          country: 'HK',
          currency: 'hkd'
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-branch_code')
      })

      it('invalid posted branch_code', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'HK',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
          account_holder_type: 'individual',
          account_number: '000123456',
          branch_code: 'invalid',
          clearing_code: '110',
          country: 'HK',
          currency: 'hkd'
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
          country: 'JP',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
          account_holder_type: 'individual',
          account_number: '00012345',
          bank_code: '',
          branch_code: '000',
          country: 'JP',
          currency: 'jpy'
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-bank_code')
      })

      it('invalid posted bank_code', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'JP',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
          account_holder_type: 'individual',
          account_number: '00012345',
          bank_code: 'invalid',
          branch_code: '000',
          country: 'JP',
          currency: 'jpy'
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
          country: 'NZ',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
          account_holder_type: 'individual',
          account_number: '000123456',
          country: 'NZ',
          currency: 'nzd',
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

      it('invalid posted routing_number', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'NZ',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
          account_holder_type: 'individual',
          account_number: '000123456',
          country: 'NZ',
          currency: 'nzd',
          routing_number: 'invalid'
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

  describe('receives', () => {
    it('required posted currency', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'AU',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_holder_type: 'individual',
        account_number: '000123456',
        bsb_number: '110000',
        country: 'AU',
        currency: 'aud'
      }
      const accountNow = await req.patch()
      assert.strictEqual(accountNow.external_accounts.data[0].currency, 'aud')
    })

    it('required posted account_holder_type', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'AU',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_holder_type: 'individual',
        account_number: '000123456',
        bsb_number: '110000',
        country: 'AU',
        currency: 'aud'
      }
      const accountNow = await req.patch()
      assert.strictEqual(accountNow.external_accounts.data[0].account_holder_type, 'individual')
    })

    it('required posted account_holder_name', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'AU',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_holder_type: 'individual',
        account_number: '000123456',
        bsb_number: '110000',
        country: 'AU',
        currency: 'aud'
      }
      const accountNow = await req.patch()
      assert.strictEqual(accountNow.external_accounts.data[0].account_holder_name, `${user.profile.firstName} ${user.profile.lastName}`)
    })

    it('required posted country', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'AU',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_holder_type: 'individual',
        account_number: '000123456',
        bsb_number: '110000',
        country: 'AU',
        currency: 'aud'
      }
      const accountNow = await req.patch()
      assert.strictEqual(accountNow.external_accounts.data[0].country, 'AU')
    })

    it('optionally-required posted iban', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'EE',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_holder_type: 'company',
        country: 'EE',
        currency: 'eur',
        iban: 'EE89370400440532013000'
      }
      const accountNow = await req.patch()
      assert.strictEqual(accountNow.external_accounts.data[0].last4, '3000')
    })

    it('optionally-required posted sort_code', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'GB',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_holder_type: 'individual',
        account_number: '00012345',
        country: 'GB',
        currency: 'gbp',
        sort_code: '108800'
      }
      const accountNow = await req.patch()
      assert.strictEqual(accountNow.external_accounts.data[0].routing_number, '10-88-00')
    })

    it('optionally-required posted bank_code', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'SG',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_holder_type: 'individual',
        account_number: '000123456',
        bank_code: '1100',
        branch_code: '000',
        country: 'SG',
        currency: 'sgd'
      }
      const accountNow = await req.patch()
      assert.strictEqual(accountNow.external_accounts.data[0].routing_number, '1100-000')
    })

    it('optionally-required posted routing_number', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'NZ',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_holder_type: 'individual',
        account_number: '0000000010',
        country: 'NZ',
        currency: 'nzd',
        routing_number: '110000'
      }
      const accountNow = await req.patch()
      assert.strictEqual(accountNow.external_accounts.data[0].routing_number, '110000')
    })

    it('optionally-required posted branch_code', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'SG',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_holder_type: 'individual',
        account_number: '000123456',
        bank_code: '1100',
        branch_code: '000',
        country: 'SG',
        currency: 'sgd'
      }
      const accountNow = await req.patch()
      assert.strictEqual(accountNow.external_accounts.data.length, 1)
    })

    it('optionally-required posted bsb_number', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'AU',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_holder_type: 'individual',
        account_number: '000123456',
        bsb_number: '110000',
        country: 'AU',
        currency: 'aud'
      }
      const accountNow = await req.patch()
      assert.strictEqual(accountNow.external_accounts.data[0].routing_number, '11 0000')
    })

    it('optionally-required posted transit_number', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'CA',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_holder_type: 'individual',
        account_number: '000123456789',
        country: 'CA',
        currency: 'cad',
        institution_number: '000',
        transit_number: '11000'
      }
      const accountNow = await req.patch()
      assert.strictEqual(accountNow.external_accounts.data[0].routing_number, '11000-000')
    })

    it('optionally-required posted institution_number', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'CA',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_holder_type: 'individual',
        account_number: '000123456789',
        country: 'CA',
        currency: 'cad',
        institution_number: '000',
        transit_number: '11000'
      }
      const accountNow = await req.patch()
      assert.strictEqual(accountNow.external_accounts.data[0].routing_number, '11000-000')
    })

    it('optionally-required posted account_number', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'CA',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_holder_type: 'individual',
        account_number: '000123456789',
        country: 'CA',
        currency: 'cad',
        institution_number: '000',
        transit_number: '11000'
      }
      const accountNow = await req.patch()
      assert.strictEqual(accountNow.external_accounts.data[0].last4, '6789')
    })
  })

  describe('returns', () => {
    for (const country of connect.countrySpecs) {
      it('object (' + country.id + ')', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: country.id,
          type: 'individual'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        if (postData[country.id].length) {
          for (const format of postData[country.id]) {
            req.body = format
            req.body.country = country.id
            req.body.account_holder_type = 'company'
            req.body.account_holder_name = `${user.profile.firstName} ${user.profile.lastName}`
            const accountNow = await req.post()
            assert.strictEqual(accountNow.object, 'account')
          }
          return
        }
        req.body = postData[country.id]
        req.body.country = country.id
        req.body.account_holder_type = 'individual'
        req.body.account_holder_name = `${user.profile.firstName} ${user.profile.lastName}`
        req.filename = __filename
        req.saveResponse = true
        const accountNow = await req.patch()
        assert.strictEqual(accountNow.object, 'account')
      })
    }
  })
})

const postData = {
  AT: {
    currency: 'eur',
    iban: 'AT89370400440532013000'
  },
  AU: {
    account_number: '000123456',
    bsb_number: '110000',
    currency: 'aud'
  },
  BE: {
    currency: 'eur',
    iban: 'BE89370400440532013000'
  },
  CA: {
    account_number: '000123456789',
    currency: 'cad',
    institution_number: '000',
    transit_number: '11000'
  },
  CH: {
    currency: 'eur',
    iban: 'CH89370400440532013000'
  },
  DE: {
    currency: 'eur',
    iban: 'DE89370400440532013000'
  },
  DK: {
    currency: 'eur',
    iban: 'DK89370400440532013000'
  },
  EE: {
    currency: 'eur',
    iban: 'EE89370400440532013000'
  },
  ES: {
    currency: 'eur',
    iban: 'ES89370400440532013000'
  },
  FI: {
    currency: 'eur',
    iban: 'FI89370400440532013000'
  },
  FR: {
    currency: 'eur',
    iban: 'FR89370400440532013000'
  },
  GB: [{
    account_number: '00012345',
    currency: 'gbp',
    sort_code: '108800'
  }, {
    currency: 'eur',
    iban: 'GB89370400440532013000'
  }],
  GR: {
    currency: 'eur',
    iban: 'GR89370400440532013000'
  },
  HK: {
    account_number: '000123456',
    branch_code: '000',
    clearing_code: '110',
    currency: 'hkd'
  },
  IE: {
    currency: 'eur',
    iban: 'IE89370400440532013000'
  },
  IT: {
    currency: 'eur',
    iban: 'IT89370400440532013000'
  },
  JP: {
    account_number: '0001234',
    bank_code: '1100',
    branch_code: '000',
    currency: 'jpy'
  },
  LT: {
    currency: 'eur',
    iban: 'LT89370400440532013000'
  },
  LU: {
    currency: 'eur',
    iban: 'LU89370400440532013000'
  },
  LV: {
    currency: 'eur',
    iban: 'LV89370400440532013000'
  },
  MY: {
    currency: 'myr',
    routing_number: 'TESTMYKL',
    account_number: '000123456000'
  },
  NL: {
    currency: 'eur',
    iban: 'NL89370400440532013000'
  },
  NO: {
    currency: 'eur',
    iban: 'NO89370400440532013000'
  },
  NZ: {
    account_number: '0000000010',
    currency: 'nzd',
    routing_number: '110000'
  },
  PL: {
    currency: 'eur',
    iban: 'PL89370400440532013000'
  },
  PT: {
    currency: 'eur',
    iban: 'PT89370400440532013000'
  },
  SE: {
    currency: 'eur',
    iban: 'SE89370400440532013000'
  },
  SG: {
    account_number: '000123456',
    bank_code: '1100',
    branch_code: '000',
    currency: 'sgd'
  },
  SI: {
    currency: 'eur',
    iban: 'SI89370400440532013000'
  },
  SK: {
    currency: 'eur',
    iban: 'SK89370400440532013000'
  },
  US: {
    account_number: '000123456789',
    currency: 'usd',
    routing_number: '110000000'
  }
}
