/* eslint-env mocha */
const assert = require('assert')
const connect = require('../../../../../index.js')
const TestHelper = require('../../../../../test-helper.js')

describe('/api/user/connect/create-beneficial-owner', async () => {
  describe('CreateBeneficialOwner#POST', () => {
    it('should reject invalid stripeid', async () => {
      const user = await TestHelper.createUser()
      const person = TestHelper.nextIdentity()
      const req = TestHelper.createRequest('/api/user/connect/create-beneficial-owner?stripeid=invalid')
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_owner_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_owner_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      req.body = {
        relationship_owner_first_name: person.firstName,
        relationship_owner_last_name: person.lastName,
        relationship_owner_address_country: 'GB',
        relationship_owner_address_city: 'London',
        relationship_owner_address_line1: 'A building',
        relationship_owner_address_postal_code: 'EC1A 1AA',
        relationship_owner_dob_day: '1',
        relationship_owner_dob_month: '1',
        relationship_owner_dob_year: '1950'
      }
      let errorMessage
      try {
        await req.post()
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-stripeid')
    })

    it('should reject individual account', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'US'
      })
      const person = TestHelper.nextIdentity()
      const req = TestHelper.createRequest(`/api/user/connect/create-beneficial-owner?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_owner_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_owner_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      req.body = {
        relationship_owner_first_name: person.firstName,
        relationship_owner_last_name: person.lastName,
        relationship_owner_address_country: 'GB',
        relationship_owner_address_city: 'London',
        relationship_owner_address_line1: 'A building',
        relationship_owner_address_postal_code: 'EC1A 1AA',
        relationship_owner_dob_day: '1',
        relationship_owner_dob_month: '1',
        relationship_owner_dob_year: '1950'
      }
      let errorMessage
      try {
        await req.post()
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-stripe-account')
    })

    it('should reject other account\'s Stripe account', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'US'
      })
      const person = TestHelper.nextIdentity()
      const user2 = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/api/user/connect/create-beneficial-owner?stripeid=${user.stripeAccount.id}`)
      req.account = user2.account
      req.session = user2.session
      req.uploads = {
        relationship_owner_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_owner_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      req.body = {
        relationship_owner_first_name: person.firstName,
        relationship_owner_last_name: person.lastName,
        relationship_owner_address_country: 'GB',
        relationship_owner_address_city: 'London',
        relationship_owner_address_line1: 'A building',
        relationship_owner_address_postal_code: 'EC1A 1AA',
        relationship_owner_dob_day: '1',
        relationship_owner_dob_month: '1',
        relationship_owner_dob_year: '1950'
      }
      let errorMessage
      try {
        await req.post()
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-account')
    })

    it('should reject submitted account', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'DE'
      })
      await TestHelper.createStripeRegistration(user, {
        company_tax_id: '00000000',
        company_name: user.profile.firstName + '\'s company',
        company_address_country: 'DE',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        company_address_city: 'Berlin',
        company_address_line1: 'First Street',
        company_address_postal_code: '01067',
        relationship_account_opener_address_city: 'Berlin',
        relationship_account_opener_address_line1: 'First Street',
        relationship_account_opener_address_postal_code: '01067'
      })
      await TestHelper.createExternalAccount(user, {
        currency: 'eur',
        country: 'DE',
        account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
        account_type: 'individual',
        iban: 'DE89370400440532013000'
      })
      await TestHelper.submitStripeAccount(user)
      const person = TestHelper.nextIdentity()
      const req = TestHelper.createRequest(`/api/user/connect/create-beneficial-owner?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_owner_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_owner_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      req.body = {
        relationship_owner_first_name: person.firstName,
        relationship_owner_last_name: person.lastName,
        relationship_owner_address_country: 'GB',
        relationship_owner_address_city: 'London',
        relationship_owner_address_line1: 'A building',
        relationship_owner_address_postal_code: 'EC1A 1AA',
        relationship_owner_dob_day: '1',
        relationship_owner_dob_month: '1',
        relationship_owner_dob_year: '1950'
      }
      let errorMessage
      try {
        await req.post()
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-stripe-account')
    })

    it('should reject invalid fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'GB'
      })
      const person = TestHelper.nextIdentity()
      const req = TestHelper.createRequest(`/api/user/connect/create-beneficial-owner?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_owner_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_owner_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      req.body = {
        relationship_owner_first_name: person.firstName,
        relationship_owner_last_name: person.lastName,
        relationship_owner_address_city: 'London',
        relationship_owner_address_line1: 'A building',
        relationship_owner_address_postal_code: 'EC1A 1AA',
        relationship_owner_dob_day: '1',
        relationship_owner_dob_month: '1',
        relationship_owner_dob_year: '1950'
      }
      let errors = 0
      for (const field in req.body) {
        const valueWas = req.body[field]
        req.body[field] = null
        try {
          await req.post()
        } catch (error) {
          assert.strictEqual(error.message, `invalid-${field}`)
          errors++
        }
        req.body[field] = valueWas
      }
      assert.strictEqual(errors, Object.keys(req.body).length)
    })

    it('should create beneficial owner', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'DE'
      })
      const person = TestHelper.nextIdentity()
      const req = TestHelper.createRequest(`/api/user/connect/create-beneficial-owner?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_owner_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_owner_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      req.body = TestHelper.createMultiPart(req, {
        relationship_owner_first_name: person.firstName,
        relationship_owner_last_name: person.lastName,
        relationship_owner_address_country: 'GB',
        relationship_owner_address_city: 'London',
        relationship_owner_address_line1: 'A building',
        relationship_owner_address_postal_code: 'EC1A 1AA',
        relationship_owner_dob_day: '1',
        relationship_owner_dob_month: '1',
        relationship_owner_dob_year: '1950'
      })
      await req.post()
      const stripeAccountNow = await global.api.user.connect.StripeAccount.get(req)
      const ownersNow = connect.MetaData.parse(stripeAccountNow.metadata, 'owners')
      assert.strictEqual(ownersNow.length, 1)
      assert.strictEqual(ownersNow[0].relationship_owner_first_name, person.firstName)
    })
  })
})
