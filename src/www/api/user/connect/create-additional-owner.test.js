/* eslint-env mocha */
const assert = require('assert')
const connect = require('../../../../../index.js')
const fs = require('fs')
const path = require('path')
const TestHelper = require('../../../../../test-helper.js')
const idscan = fs.readFileSync(path.join(__dirname, '../../../../../test-documentid-success.png'))

describe(`/api/user/connect/create-additional-owner`, async () => {
  describe('CreateAdditionalOwner#BEFORE', () => {
    it('should reject invalid stripeid', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/api/user/connect/create-additional-owner?stripeid=invalid')
      req.account = user.account
      req.session = user.session
      req.body = {
        first_name: 'First name',
        last_name: 'First name',
        country: 'GB',
        city: 'London',
        line1: 'A building',
        postal_code: 'EC1A 1AA',
        day: '1',
        month: '1',
        year: '1950'
      }
      req.uploads = {
        'id_scan.png': { 
          buffer: idscan
        }
      }
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-stripeid')
    })

    it('should reject individual account', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'US' })
      const req = TestHelper.createRequest(`/api/user/connect/create-additional-owner?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        first_name: 'First name',
        last_name: 'First name',
        country: 'GB',
        city: 'London',
        line1: 'A building',
        postal_code: 'EC1A 1AA',
        day: '1',
        month: '1',
        year: '1950'
      }
      req.uploads = {
        'id_scan.png': { buffer: idscan }
      }
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-stripe-account')
    })

    it('should reject company that doesn\'t require owner info', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'US' })
      const req = TestHelper.createRequest(`/api/user/connect/create-additional-owner?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        first_name: 'First name',
        last_name: 'First name',
        country: 'GB',
        city: 'London',
        line1: 'A building',
        postal_code: 'EC1A 1AA',
        day: '1',
        month: '1',
        year: '1950'
      }
      req.uploads = {
        'id_scan.png': { buffer: idscan }
      }
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-stripe-account')
    })

    it('should reject other account\'s Stripe account', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'US' })
      const user2 = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/api/user/connect/create-additional-owner?stripeid=${user.stripeAccount.id}`)
      req.account = user2.account
      req.session = user2.session
      req.body = {
        first_name: 'First name',
        last_name: 'First name',
        country: 'GB',
        city: 'London',
        line1: 'A building',
        postal_code: 'EC1A 1AA',
        day: '1',
        month: '1',
        year: '1950'
      }
      req.uploads = {
        'id_scan.png': { buffer: idscan }
      }
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-account')
    })

    it('should reject fifth 25% owner', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'DE' })
      await TestHelper.createAdditionalOwner(user, { country: 'DE', city: 'Berlin', postal_code: '01067', line1: 'First Street', day: 1, month: 1, year: 1950 })
      await TestHelper.createAdditionalOwner(user, { country: 'DE', city: 'Berlin', postal_code: '01067', line1: 'Second Street', day: 1, month: 1, year: 1950 })
      await TestHelper.createAdditionalOwner(user, { country: 'DE', city: 'Berlin', postal_code: '01067', line1: 'Third Street', day: 1, month: 1, year: 1950 })
      await TestHelper.createAdditionalOwner(user, { country: 'DE', city: 'Berlin', postal_code: '01067', line1: 'Fourth Street', day: 1, month: 1, year: 1950 })
      const req = TestHelper.createRequest(`/api/user/connect/create-additional-owner?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        first_name: 'First name',
        last_name: 'First name',
        country: 'GB',
        city: 'London',
        line1: 'A building',
        postal_code: 'EC1A 1AA',
        day: '1',
        month: '1',
        year: '1950'
      }
      req.uploads = {
        'id_scan.png': { buffer: idscan }
      }
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'maximum-owners')
    })

    it('should reject submitted account', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'DE' })
      await TestHelper.createStripeRegistration(user, { business_tax_id: 1, business_name: user.profile.firstName + '\'s company', country: 'DE', day: '1', month: '1', year: '1950', company_city: 'Berlin', company_line1: 'First Street', company_postal_code: '01067', personal_city: 'Berlin', personal_line1: 'First Street', personal_postal_code: '01067' })
      await TestHelper.createExternalAccount(user, { currency: 'eur', country: 'DE', account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`, account_type: 'individual', iban: 'DE89370400440532013000' })
      await TestHelper.submitAdditionalOwners(user)
      await TestHelper.submitStripeAccount(user)
      const req = TestHelper.createRequest(`/api/user/connect/create-additional-owner?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        first_name: 'First name',
        last_name: 'First name',
        country: 'GB',
        city: 'London',
        line1: 'A building',
        postal_code: 'EC1A 1AA',
        day: '1',
        month: '1',
        year: '1950'
      }
      req.uploads = {
        'id_scan.png': { buffer: idscan }
      }
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-stripe-account')
    })

    it('should reject invalid fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'GB' })
      const req = TestHelper.createRequest(`/api/user/connect/create-additional-owner?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        first_name: 'First name',
        last_name: 'First name',
        country: 'GB',
        city: 'London',
        line1: 'A building',
        postal_code: 'EC1A 1AA',
        day: '1',
        month: '1',
        year: '1950'
      }
      req.uploads = {
        'id_scan.png': { buffer: idscan }
      }
      let errors = 0
      for (const field in req.body) {
        const valueWas = req.body[field]
        req.body[field] = null
        try {
          await req.route.api.before(req)
        } catch (error) {
          assert.strictEqual(error.message, `invalid-${field}`)
          errors++
        }
        req.body[field] = valueWas
      }
      assert.strictEqual(errors, Object.keys(req.body).length)
    })
  })

  describe('CreateAdditionalOwner#POST', () => {
    it('should create authorized additional owner', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'DE' })
      const req = TestHelper.createRequest(`/api/user/connect/create-additional-owner?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      TestHelper.createMultiPart(req, {
        first_name: 'First name',
        last_name: 'First name',
        country: 'GB',
        city: 'London',
        line1: 'A building',
        postal_code: 'EC1A 1AA',
        day: '1',
        month: '1',
        year: '1950'
      })
      await req.post(req)
      const stripeAccountNow = await global.api.user.connect.StripeAccount.get(req)
      const ownersNow = connect.MetaData.parse(stripeAccountNow.metadata, 'owners')
      assert.strictEqual(ownersNow.length, 1)
      assert.strictEqual(ownersNow[0].first_name, 'First name')
    })
  })
})
