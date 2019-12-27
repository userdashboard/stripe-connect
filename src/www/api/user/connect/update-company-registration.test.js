/* eslint-env mocha */
const assert = require('assert')
const connect = require('../../../../../index.js')
const TestHelper = require('../../../../../test-helper.js')

describe('/api/user/connect/update-company-registration', () => {
  describe('exceptions', () => {
    describe('invalid-stripeid', () => {
      it('missing querystring stripeid', async () => {
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/connect/update-company-registration')
        req.account = user.account
        req.session = user.session
        req.body = {}
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
        const req = TestHelper.createRequest('/api/user/connect/update-company-registration?stripeid=invalid')
        req.account = user.account
        req.session = user.session
        req.body = {
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          company_address_city: 'New York',
          company_address_line1: '285 Fulton St',
          company_address_postal_code: '10007',
          company_address_state: 'NY',
          company_name: 'Company',
          company_phone: '456-789-0123',
          company_tax_id: '00000000000'
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

    describe('invalid-stripe-account', () => {
      it('ineligible stripe account for individuals', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'US',
          type: 'individual'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          company_address_city: 'New York',
          company_address_line1: '285 Fulton St',
          company_address_postal_code: '10007',
          company_address_state: 'NY',
          company_name: 'Company',
          company_phone: '456-789-0123',
          company_tax_id: '00000000000'
        }
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-stripe-account')
      })

      it('ineligible stripe account is submitted', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'US',
          type: 'company'
        })
        await TestHelper.createStripeRegistration(user, {
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          company_address_city: 'New York',
          company_address_line1: '123 Park Lane',
          company_address_postal_code: '10001',
          company_address_state: 'NY',
          company_name: 'Company',
          company_phone: '456-789-0123',
          company_tax_id: '00000000000'
        })
        await TestHelper.createCompanyRepresentative(user, {
          relationship_representative_address_city: 'New York',
          relationship_representative_address_country: 'US',
          relationship_representative_address_line1: '285 Fulton St',
          relationship_representative_address_postal_code: '10007',
          relationship_representative_address_state: 'NY',
          relationship_representative_dob_day: '1',
          relationship_representative_dob_month: '1',
          relationship_representative_dob_year: '1950',
          relationship_representative_email: user.profile.contactEmail,
          relationship_representative_first_name: user.profile.firstName,
          relationship_representative_last_name: user.profile.lastName,
          relationship_representative_percent_ownership: '0',
          relationship_representative_phone: '456-789-0123',
          relationship_representative_relationship_executive: 'true',
          relationship_representative_relationship_title: 'Owner',
          relationship_representative_ssn_last_4: '0000'
        }, {
          relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
          relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
        })
        await TestHelper.createExternalAccount(user, {
          account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`,
          account_holder_type: 'individual',
          account_number: '000123456789',
          country: 'US',
          currency: 'usd',
          routing_number: '110000000'
        })
        await TestHelper.submitBeneficialOwners(user)
        await TestHelper.setCompanyRepresentative(user)
        await TestHelper.submitStripeAccount(user)
        const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          company_address_city: 'New York',
          company_address_line1: '285 Fulton St',
          company_address_postal_code: '10007',
          company_address_state: 'NY',
          company_name: 'Company',
          company_phone: '456-789-0123',
          company_tax_id: '00000000000'
        }
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-stripe-account')
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
        const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user2.account
        req.session = user2.session
        req.body = {
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          company_address_city: 'New York',
          company_address_line1: '285 Fulton St',
          company_address_postal_code: '10007',
          company_address_state: 'NY',
          company_name: 'Company',
          company_phone: '456-789-0123',
          company_tax_id: '00000000000'
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

    describe('invalid-company_name', () => {
      it('missing posted company_name', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'AT',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          company_address_city: 'Vienna',
          company_address_line1: '123 Park Lane',
          company_address_postal_code: '1020',
          company_address_state: '1',
          company_name: '',
          company_tax_id: '00000000000'
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-company_name')
      })
    })

    describe('invalid-company_tax_id', () => {
      it('missing posted company_tax_id', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'AT',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          company_address_city: 'Vienna',
          company_address_line1: '123 Park Lane',
          company_address_postal_code: '1020',
          company_address_state: '1',
          company_name: 'Company',
          company_phone: '456-789-0123',
          company_tax_id: ''
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-company_tax_id')
      })
    })

    describe('invalid-company_address_city', () => {
      it('missing posted company_address_line1', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'AT',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          company_address_city: '',
          company_address_line1: '123 Park Lane',
          company_address_postal_code: '1020',
          company_address_state: '1',
          company_name: 'Company',
          company_phone: '456-789-0123',
          company_tax_id: '00000000000'
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-company_address_city')
      })
    })

    describe('invalid-company_address_state', () => {
      it('missing posted company_address_state', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'US',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          company_address_city: 'New York',
          company_address_line1: '285 Fulton St',
          company_address_postal_code: '10007',
          company_address_state: '',
          company_name: 'Company',
          company_phone: '456-789-0123',
          company_tax_id: '00000000000'
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-company_address_state')
      })

      it('invalid posted company_address_state', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'US',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          company_address_city: 'New York',
          company_address_line1: '285 Fulton St',
          company_address_postal_code: '10007',
          company_address_state: 'invalid',
          company_name: 'Company',
          company_phone: '456-789-0123',
          company_tax_id: '00000000000'
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-company_address_state')
      })
    })

    describe('invalid-company_address_line1', () => {
      it('missing posted company_address_line1', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'AT',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          company_address_city: 'Vienna',
          company_address_line1: '',
          company_address_postal_code: '1020',
          company_address_state: '1',
          company_name: 'Company',
          company_phone: '456-789-0123',
          company_tax_id: '00000000000'
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-company_address_line1')
      })
    })

    describe('invalid-company_address_postal_code', () => {
      it('missing posted company_address_postal_code', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'AT',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          business_profile_mcc: '8931',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          company_address_city: 'Vienna',
          company_address_line1: '123 Park Lane',
          company_address_postal_code: '',
          company_address_state: '1',
          company_name: 'Company',
          company_tax_id: '00000000000'
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-company_address_postal_code')
      })
    })

    describe('invalid-business_profile_mcc', () => {
      it('missing posted business_profile_mcc', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'US',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          business_profile_mcc: '',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          company_address_city: 'New York',
          company_address_line1: '285 Fulton St',
          company_address_postal_code: '10007',
          company_address_state: 'NY',
          company_name: 'Company',
          company_phone: '456-789-0123',
          company_tax_id: '00000000000'
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-business_profile_mcc')
      })

      it('invalid posted business_profile_mcc', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'US',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          business_profile_mcc: 'invalid',
          business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
          company_address_city: 'New York',
          company_address_line1: '285 Fulton St',
          company_address_postal_code: '10007',
          company_address_state: 'NY',
          company_name: 'Company',
          company_phone: '456-789-0123',
          company_tax_id: '00000000000'
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-business_profile_mcc')
      })
    })

    describe('invalid-business_profile_url', () => {
      it('missing posted business_profile_url', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'US',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          business_profile_mcc: '8931',
          business_profile_url: '',
          company_address_city: 'New York',
          company_address_line1: '285 Fulton St',
          company_address_postal_code: '10007',
          company_address_state: 'NY',
          company_name: 'Company',
          company_phone: '456-789-0123',
          company_tax_id: '00000000000'
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-business_profile_url')
      })

      it('invalid posted business_profile_url', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'US',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          business_profile_mcc: '8931',
          business_profile_url: 'invalid',
          company_address_city: 'New York',
          company_address_line1: '285 Fulton St',
          company_address_postal_code: '10007',
          company_address_state: 'NY',
          company_name: 'Company',
          company_phone: '456-789-0123',
          company_tax_id: '00000000000'
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-business_profile_url')
      })
    })
  })

  describe('receives', () => {
    it('optionally-required posted token', async () => {
      global.stripeJS = 3
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        company_address_city: 'New York',
        company_address_line1: '285 Fulton St',
        company_address_postal_code: '10007',
        company_address_state: 'NY',
        company_name: 'Company',
        company_phone: '456-789-0123',
        company_tax_id: '00000000000',
        token: 'sample2'
      }
      const companyNow = await req.patch()
      const registrationNow = connect.MetaData.parse(companyNow.metadata, 'registration')
      assert.strictEqual(registrationNow.companyToken, 'sample2')
    })

    it('optionally-required posted file company_verification_document_front', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'BE',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        company_address_city: 'Brussels',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '1020',
        company_address_state: 'BRU',
        company_name: 'Company',
        company_phone: '456-789-0123',
        company_tax_id: '00000000000'
      }
      req.uploads = {
        company_verification_document_back: TestHelper['success_id_scan_back.png'],
        company_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      req.body = TestHelper.createMultiPart(req, req.body)
      const companyNow = await req.patch()
      const registrationNow = connect.MetaData.parse(companyNow.metadata, 'registration')
      assert.notStrictEqual(registrationNow.company_verification_document_front, null)
      assert.notStrictEqual(registrationNow.company_verification_document_front, undefined)
    })

    it('optionally-required posted file company_verification_document_back', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'BE',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        company_address_city: 'Brussels',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '1020',
        company_address_state: 'BRU',
        company_name: 'Company',
        company_phone: '456-789-0123',
        company_tax_id: '00000000000'
      }
      req.uploads = {
        company_verification_document_back: TestHelper['success_id_scan_back.png'],
        company_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      req.body = TestHelper.createMultiPart(req, req.body)
      const companyNow = await req.patch()
      const registrationNow = connect.MetaData.parse(companyNow.metadata, 'registration')
      assert.notStrictEqual(registrationNow.company_verification_document_back, null)
      assert.notStrictEqual(registrationNow.company_verification_document_back, undefined)
    })

    it('required posted business_profile_mcc', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        company_address_city: 'New York',
        company_address_line1: '285 Fulton St',
        company_address_postal_code: '10007',
        company_address_state: 'NY',
        company_name: 'Company',
        company_phone: '456-789-0123',
        company_tax_id: '00000000000'
      }
      const companyNow = await req.patch()
      const registrationNow = connect.MetaData.parse(companyNow.metadata, 'registration')
      assert.strictEqual(registrationNow.business_profile_mcc, '8931')
    })

    it('optionally-required posted business_profile_url', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://updated.com',
        company_address_city: 'New York',
        company_address_line1: '285 Fulton St',
        company_address_postal_code: '10007',
        company_address_state: 'NY',
        company_name: 'Company',
        company_phone: '456-789-0123',
        company_tax_id: '00000000000'
      }
      const companyNow = await req.patch()
      const registrationNow = connect.MetaData.parse(companyNow.metadata, 'registration')
      assert.strictEqual(registrationNow.business_profile_url, 'https://updated.com')
    })

    it('optionally-required posted business_profile_product_description', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        business_profile_mcc: '8931',
        business_profile_product_description: 'thing',
        company_address_city: 'New York',
        company_address_line1: '285 Fulton St',
        company_address_postal_code: '10007',
        company_address_state: 'NY',
        company_name: 'Company',
        company_phone: '456-789-0123',
        company_tax_id: '00000000000'
      }
      const companyNow = await req.patch()
      const registrationNow = connect.MetaData.parse(companyNow.metadata, 'registration')
      assert.strictEqual(registrationNow.business_profile_product_description, 'thing')
    })

    it('required posted company_phone', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        company_address_city: 'New York',
        company_address_line1: '285 Fulton St',
        company_address_postal_code: '10007',
        company_address_state: 'NY',
        company_name: 'Company',
        company_phone: '111-222-3333',
        company_tax_id: '00000000000'
      }
      const companyNow = await req.patch()
      const registrationNow = connect.MetaData.parse(companyNow.metadata, 'registration')
      assert.strictEqual(registrationNow.company_phone, '111-222-3333')
    })

    it('required posted company_name', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'company'
      })

      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        company_address_city: 'New York',
        company_address_line1: '285 Fulton St',
        company_address_postal_code: '10007',
        company_address_state: 'NY',
        company_name: 'Updated name',
        company_phone: '111-222-3333',
        company_tax_id: '00000000000'
      }
      const companyNow = await req.patch()
      const registrationNow = connect.MetaData.parse(companyNow.metadata, 'registration')
      assert.strictEqual(registrationNow.company_name, 'Updated name')
    })

    it('optionally-required posted company_address_postal_code', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        company_address_city: 'New York',
        company_address_line1: '285 Fulton St',
        company_address_postal_code: '10008',
        company_address_state: 'NY',
        company_name: 'Company',
        company_phone: '111-222-3333',
        company_tax_id: '00000000000'
      }
      const companyNow = await req.patch()
      const registrationNow = connect.MetaData.parse(companyNow.metadata, 'registration')
      assert.strictEqual(registrationNow.company_address_postal_code, '10008')
    })

    it('optionally-required posted company_address_city', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        company_address_city: 'Providence',
        company_address_line1: '285 Fulton St',
        company_address_postal_code: '10008',
        company_address_state: 'NY',
        company_name: 'Company',
        company_phone: '111-222-3333',
        company_tax_id: '00000000000'
      }
      const companyNow = await req.patch()
      const registrationNow = connect.MetaData.parse(companyNow.metadata, 'registration')
      assert.strictEqual(registrationNow.company_address_city, 'Providence')
    })

    it('optionally-required posted company_address_state', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        business_profile_mcc: '7623',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        company_address_city: 'New York',
        company_address_line1: '285 Fulton St',
        company_address_postal_code: '10008',
        company_address_state: 'NJ',
        company_name: 'Company',
        company_phone: '111-222-3333',
        company_tax_id: '00000000000'
      }
      const companyNow = await req.patch()
      const registrationNow = connect.MetaData.parse(companyNow.metadata, 'registration')
      assert.strictEqual(registrationNow.company_address_state, 'NJ')
    })

    it('optionally-required posted company_address_line1', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        business_profile_mcc: '7623',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        company_address_city: 'New York',
        company_address_line1: '285 Fulton St',
        company_address_postal_code: '10008',
        company_address_state: 'NJ',
        company_name: 'Company',
        company_phone: '111-222-3333',
        company_tax_id: '00000000000'
      }
      const companyNow = await req.patch()
      const registrationNow = connect.MetaData.parse(companyNow.metadata, 'registration')
      assert.strictEqual(registrationNow.company_address_line1, '285 Fulton St')
    })

    it('optional posted company_address_line2', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        business_profile_mcc: '7623',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        company_address_city: 'New York',
        company_address_line1: '285 Fulton St',
        company_address_line2: 'Optional',
        company_address_postal_code: '10008',
        company_address_state: 'NJ',
        company_name: 'Company',
        company_phone: '111-222-3333',
        company_tax_id: '00000000000'
      }
      const companyNow = await req.patch()
      const registrationNow = connect.MetaData.parse(companyNow.metadata, 'registration')
      assert.strictEqual(registrationNow.company_address_line2, 'Optional')
    })

    it('optionally-required posted company_name_kana', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'JP',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        company_address_kana_city: 'ｼﾌﾞﾔ',
        company_address_kana_line1: '27-15',
        company_address_kana_postal_code: '1500001',
        company_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        company_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        company_address_kanji_city: '渋谷区',
        company_address_kanji_line1: '２７－１５',
        company_address_kanji_postal_code: '1500001',
        company_address_kanji_state: '東京都',
        company_address_kanji_town: '神宮前　３丁目',
        company_name: 'Company',
        company_name_kana: 'ﾄｳｷﾖｳﾄ',
        company_name_kanji: '東京都',
        company_phone: '011-271-6677',
        company_tax_id: '00000000000'
      }
      const stripeAccountNow = await req.patch()
      const registration = connect.MetaData.parse(stripeAccountNow.metadata, 'registration')
      assert.strictEqual(registration.company_name_kana, 'ﾄｳｷﾖｳﾄ')
    })

    it('optionally-required posted company_name_kanji', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'JP',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        company_address_kana_city: 'ｼﾌﾞﾔ',
        company_address_kana_line1: '27-15',
        company_address_kana_postal_code: '1500001',
        company_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        company_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        company_address_kanji_city: '渋谷区',
        company_address_kanji_line1: '２７－１５',
        company_address_kanji_postal_code: '1500001',
        company_address_kanji_state: '東京都',
        company_address_kanji_town: '神宮前　３丁目',
        company_name: 'Company',
        company_name_kana: 'ﾄｳｷﾖｳﾄ',
        company_name_kanji: '東京都',
        company_phone: '011-271-6677',
        company_tax_id: '00000000000'
      }
      const stripeAccountNow = await req.patch()
      const registration = connect.MetaData.parse(stripeAccountNow.metadata, 'registration')
      assert.strictEqual(registration.company_name_kanji, '東京都')
    })

    it('optionally-required posted company_address_kana_postal_code', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'JP',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        company_address_kana_city: 'ｼﾌﾞﾔ',
        company_address_kana_line1: '27-15',
        company_address_kana_postal_code: '1500001',
        company_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        company_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        company_address_kanji_city: '渋谷区',
        company_address_kanji_line1: '２７－１５',
        company_address_kanji_postal_code: '1500001',
        company_address_kanji_state: '東京都',
        company_address_kanji_town: '神宮前　３丁目',
        company_name: 'Company',
        company_name_kana: 'ﾄｳｷﾖｳﾄ',
        company_name_kanji: '東京都',
        company_phone: '011-271-6677',
        company_tax_id: '00000000000'
      }
      const stripeAccountNow = await req.patch()
      const registration = connect.MetaData.parse(stripeAccountNow.metadata, 'registration')
      assert.strictEqual(registration.company_address_kana_postal_code, '1500001')
    })

    it('optionally-required posted company_address_kana_city', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'JP',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        company_address_kana_city: 'ｼﾌﾞﾔ',
        company_address_kana_line1: '27-15',
        company_address_kana_postal_code: '1500001',
        company_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        company_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        company_address_kanji_city: '渋谷区',
        company_address_kanji_line1: '２７－１５',
        company_address_kanji_postal_code: '1500001',
        company_address_kanji_state: '東京都',
        company_address_kanji_town: '神宮前　３丁目',
        company_name: 'Company',
        company_name_kana: 'ﾄｳｷﾖｳﾄ',
        company_name_kanji: '東京都',
        company_phone: '011-271-6677',
        company_tax_id: '00000000000'
      }
      const stripeAccountNow = await req.patch()
      const registration = connect.MetaData.parse(stripeAccountNow.metadata, 'registration')
      assert.strictEqual(registration.company_address_kana_city, 'ｼﾌﾞﾔ')
    })

    it('optionally-required posted company_address_kana_state', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'JP',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        company_address_kana_city: 'ｼﾌﾞﾔ',
        company_address_kana_line1: '27-15',
        company_address_kana_postal_code: '1500001',
        company_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        company_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        company_address_kanji_city: '渋谷区',
        company_address_kanji_line1: '２７－１５',
        company_address_kanji_postal_code: '1500001',
        company_address_kanji_state: '東京都',
        company_address_kanji_town: '神宮前　３丁目',
        company_name: 'Company',
        company_name_kana: 'ﾄｳｷﾖｳﾄ',
        company_name_kanji: '東京都',
        company_phone: '011-271-6677',
        company_tax_id: '00000000000'
      }
      const stripeAccountNow = await req.patch()
      const registration = connect.MetaData.parse(stripeAccountNow.metadata, 'registration')
      assert.strictEqual(registration.company_address_kana_state, 'ﾄｳｷﾖｳﾄ')
    })

    it('optionally-required posted company_address_kana_town', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'JP',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        company_address_kana_city: 'ｼﾌﾞﾔ',
        company_address_kana_line1: '27-15',
        company_address_kana_postal_code: '1500001',
        company_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        company_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        company_address_kanji_city: '渋谷区',
        company_address_kanji_line1: '２７－１５',
        company_address_kanji_postal_code: '1500001',
        company_address_kanji_state: '東京都',
        company_address_kanji_town: '神宮前　３丁目',
        company_name: 'Company',
        company_name_kana: 'ﾄｳｷﾖｳﾄ',
        company_name_kanji: '東京都',
        company_phone: '011-271-6677',
        company_tax_id: '00000000000'
      }
      const stripeAccountNow = await req.patch()
      const registration = connect.MetaData.parse(stripeAccountNow.metadata, 'registration')
      assert.strictEqual(registration.company_address_kana_town, 'ｼﾞﾝｸﾞｳﾏｴ 3-')
    })

    it('optionally-required posted company_address_kana_line1', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'JP',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        company_address_kana_city: 'ｼﾌﾞﾔ',
        company_address_kana_line1: '27-15',
        company_address_kana_postal_code: '1500001',
        company_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        company_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        company_address_kanji_city: '渋谷区',
        company_address_kanji_line1: '２７－１５',
        company_address_kanji_postal_code: '1500001',
        company_address_kanji_state: '東京都',
        company_address_kanji_town: '神宮前　３丁目',
        company_name: 'Company',
        company_name_kana: 'ﾄｳｷﾖｳﾄ',
        company_name_kanji: '東京都',
        company_phone: '011-271-6677',
        company_tax_id: '00000000000'
      }
      const stripeAccountNow = await req.patch()
      const registration = connect.MetaData.parse(stripeAccountNow.metadata, 'registration')
      assert.strictEqual(registration.company_address_kana_line1, '27-15')
    })

    it('optionally-required posted company_address_kanji_postal_code', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'JP',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        company_address_kana_city: 'ｼﾌﾞﾔ',
        company_address_kana_line1: '27-15',
        company_address_kana_postal_code: '1500001',
        company_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        company_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        company_address_kanji_city: '渋谷区',
        company_address_kanji_line1: '２７－１５',
        company_address_kanji_postal_code: '1500001',
        company_address_kanji_state: '東京都',
        company_address_kanji_town: '神宮前　３丁目',
        company_name: 'Company',
        company_name_kana: 'ﾄｳｷﾖｳﾄ',
        company_name_kanji: '東京都',
        company_phone: '011-271-6677',
        company_tax_id: '00000000000'
      }
      const stripeAccountNow = await req.patch()
      const registration = connect.MetaData.parse(stripeAccountNow.metadata, 'registration')
      assert.strictEqual(registration.company_address_kanji_postal_code, '1500001')
    })

    it('optionally-required posted company_address_kanji_city', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'JP',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        company_address_kana_city: 'ｼﾌﾞﾔ',
        company_address_kana_line1: '27-15',
        company_address_kana_postal_code: '1500001',
        company_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        company_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        company_address_kanji_city: '渋谷区',
        company_address_kanji_line1: '２７－１５',
        company_address_kanji_postal_code: '1500001',
        company_address_kanji_state: '東京都',
        company_address_kanji_town: '神宮前　３丁目',
        company_name: 'Company',
        company_name_kana: 'ﾄｳｷﾖｳﾄ',
        company_name_kanji: '東京都',
        company_phone: '011-271-6677',
        company_tax_id: '00000000000'
      }
      const stripeAccountNow = await req.patch()
      const registration = connect.MetaData.parse(stripeAccountNow.metadata, 'registration')
      assert.strictEqual(registration.company_address_kanji_city, '渋谷区')
    })

    it('optionally-required posted company_address_kanji_state', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'JP',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        company_address_kana_city: 'ｼﾌﾞﾔ',
        company_address_kana_line1: '27-15',
        company_address_kana_postal_code: '1500001',
        company_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        company_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        company_address_kanji_city: '渋谷区',
        company_address_kanji_line1: '２７－１５',
        company_address_kanji_postal_code: '1500001',
        company_address_kanji_state: '東京都',
        company_address_kanji_town: '神宮前　３丁目',
        company_name: 'Company',
        company_name_kana: 'ﾄｳｷﾖｳﾄ',
        company_name_kanji: '東京都',
        company_phone: '011-271-6677',
        company_tax_id: '00000000000'
      }
      const stripeAccountNow = await req.patch()
      const registration = connect.MetaData.parse(stripeAccountNow.metadata, 'registration')
      assert.strictEqual(registration.company_address_kanji_state, '東京都')
    })

    it('optionally-required posted company_address_kanji_town', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'JP',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        company_address_kana_city: 'ｼﾌﾞﾔ',
        company_address_kana_line1: '27-15',
        company_address_kana_postal_code: '1500001',
        company_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        company_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        company_address_kanji_city: '渋谷区',
        company_address_kanji_line1: '２７－１５',
        company_address_kanji_postal_code: '1500001',
        company_address_kanji_state: '東京都',
        company_address_kanji_town: '神宮前　３丁目',
        company_name: 'Company',
        company_name_kana: 'ﾄｳｷﾖｳﾄ',
        company_name_kanji: '東京都',
        company_phone: '011-271-6677',
        company_tax_id: '00000000000'
      }
      const stripeAccountNow = await req.patch()
      const registration = connect.MetaData.parse(stripeAccountNow.metadata, 'registration')
      assert.strictEqual(registration.company_address_kanji_town, '神宮前　３丁目')
    })

    it('optionally-required posted company_address_kanji_line1', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'JP',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        company_address_kana_city: 'ｼﾌﾞﾔ',
        company_address_kana_line1: '27-15',
        company_address_kana_postal_code: '1500001',
        company_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        company_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        company_address_kanji_city: '渋谷区',
        company_address_kanji_line1: '２７－１５',
        company_address_kanji_postal_code: '1500001',
        company_address_kanji_state: '東京都',
        company_address_kanji_town: '神宮前　３丁目',
        company_name: 'Company',
        company_name_kana: 'ﾄｳｷﾖｳﾄ',
        company_name_kanji: '東京都',
        company_phone: '011-271-6677',
        company_tax_id: '00000000000'
      }
      const stripeAccountNow = await req.patch()
      const registration = connect.MetaData.parse(stripeAccountNow.metadata, 'registration')
      assert.strictEqual(registration.company_address_kanji_line1, '２７－１５')
    })
  })

  describe('returns', () => {
    for (const country of connect.countrySpecs) {
      it('object (' + country.id + ')', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: country.id,
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-registration?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = postData[country.id] 
        if (connect.kycRequirements[country.id].company.indexOf('company.verification.document.front') > -1) {
          req.uploads = {
            company_verification_document_front: TestHelper['success_id_scan_back.png'],
            company_verification_document_back: TestHelper['success_id_scan_back.png']
          }
        }
        req.body = TestHelper.createMultiPart(req, req.body)
        const page = await req.patch()
        const doc = TestHelper.extractDoc(page)
        const redirectURL = TestHelper.extractRedirectURL(doc)
        assert.strictEqual(redirectURL, `/account/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
      })
    }
  })

  describe('configuration', () => {
    it('environment STRIPE_JS', async () => {
      global.stripeJS = 3
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.waitOnSubmit = true
      req.account = user.account
      req.session = user.session
      req.body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        company_address_city: 'New York',
        company_address_line1: '285 Fulton St',
        company_address_postal_code: '10007',
        company_address_state: 'NY',
        company_name: 'Company',
        company_phone: '456-789-0123',
        company_tax_id: '00000000000'
      }
      await req.post()
      const account = await global.api.user.connect.StripeAccount.get(req)
      const registration = connect.MetaData.parse(account.metadata, 'registration')
      const req2 = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req2.waitOnSubmit = true
      req2.account = user.account
      req2.session = user.session
      req2.body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        company_address_city: 'New York',
        company_address_line1: '285 Fulton St',
        company_address_postal_code: '10007',
        company_address_state: 'NY',
        company_name: 'Company',
        company_phone: '456-789-0123',
        company_tax_id: '00000000000'
      }
      await req2.post()
      const accountNow = await global.api.user.connect.StripeAccount.get(req2)
      const registrationNow = connect.MetaData.parse(accountNow.metadata, 'registration')
      assert.notStrictEqual(registrationNow.companyToken, registration.companyToken)
      assert.notStrictEqual(registrationNow.companyToken, null)
      assert.notStrictEqual(registrationNow.companyToken, undefined)
    })
  })
})

const postData = {
  AT: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    company_address_city: 'Vienna',
    company_address_line1: '123 Park Lane',
    company_address_postal_code: '1020',
    company_address_state: '1',
    company_name: 'Company',
    company_phone: '456-789-0123',
    company_tax_id: '00000000000'
  },
  AU: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    company_address_city: 'Brisbane',
    company_address_line1: '123 Park Lane',
    company_address_postal_code: '4000',
    company_address_state: 'QLD',
    company_name: 'Company',
    company_phone: '456-789-0123',
    company_tax_id: '00000000000'
  },
  BE: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    company_address_city: 'Brussels',
    company_address_line1: '123 Park Lane',
    company_address_postal_code: '1020',
    company_address_state: 'BRU',
    company_name: 'Company',
    company_phone: '456-789-0123',
    company_tax_id: '00000000000'
  },
  CA: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    company_address_city: 'Vancouver',
    company_address_line1: '123 Park Lane',
    company_address_postal_code: 'V5K 0A1',
    company_address_state: 'BC',
    company_name: 'Company',
    company_phone: '456-789-0123',
    company_tax_id: '00000000000'
  },
  CH: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    company_address_city: 'Bern',
    company_address_line1: '123 Park Lane',
    company_address_postal_code: '1020',
    company_address_state: 'BE',
    company_name: 'Company',
    company_phone: '456-789-0123',
    company_tax_id: '00000000000'
  },
  DE: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    company_address_city: 'Berlin',
    company_address_line1: '123 Park Lane',
    company_address_postal_code: '01067',
    company_address_state: 'BE',
    company_name: 'Company',
    company_phone: '456-789-0123',
    company_tax_id: '00000000000'
  },
  DK: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    company_address_city: 'Copenhagen',
    company_address_line1: '123 Park Lane',
    company_address_postal_code: '1000',
    company_address_state: '147',
    company_name: 'Company',
    company_phone: '456-789-0123',
    company_tax_id: '00000000000'
  },
  EE: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    company_address_city: 'Talin',
    company_address_line1: '123 Park Lane',
    company_address_postal_code: '10128',
    company_address_state: '37',
    company_name: 'Company',
    company_phone: '456-789-0123',
    company_tax_id: '00000000000'
  },
  ES: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    company_address_city: 'Madrid',
    company_address_line1: '123 Park Lane',
    company_address_postal_code: '03179',
    company_address_state: 'AN',
    company_name: 'Company',
    company_phone: '456-789-0123',
    company_tax_id: '00000000000'
  },
  FI: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    company_address_city: 'Helsinki',
    company_address_line1: '123 Park Lane',
    company_address_postal_code: '00990',
    company_address_state: 'AL',
    company_name: 'Company',
    company_phone: '456-789-0123',
    company_tax_id: '00000000000'
  },
  FR: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    company_address_city: 'Paris',
    company_address_line1: '123 Park Lane',
    company_address_postal_code: '75001',
    company_address_state: 'A',
    company_name: 'Company',
    company_phone: '456-789-0123',
    company_tax_id: '00000000000'
  },
  GB:{
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    company_address_city: 'London',
    company_address_line1: '123 Park Lane',
    company_address_postal_code: 'EC1A 1AA',
    company_address_state: 'LND',
    company_name: 'Company',
    company_phone: '456-789-0123',
    company_tax_id: '00000000000'
  },
  GR: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    company_address_city: 'Athens',
    company_address_line1: '123 Park Lane',
    company_address_postal_code: '104',
    company_address_state: 'I',
    company_name: 'Company',
    company_phone: '456-789-0123',
    company_tax_id: '00000000000'
  },
  HK: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    company_address_city: 'Hong Kong',
    company_address_line1: '123 Park Lane',
    company_address_postal_code: '00000',
    company_address_state: 'HK',
    company_name: 'Company',
    company_phone: '456-789-0234',
    company_tax_id: '00000000000'
  },
  IE: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    company_address_city: 'Dublin',
    company_address_line1: '123 Park Lane',
    company_address_postal_code: 'Dublin 1',
    company_address_state: 'D',
    company_name: 'Company',
    company_phone: '456-789-0123',
    company_tax_id: '00000000000'
  },
  IT: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    company_address_city: 'Rome',
    company_address_line1: '123 Park Lane',
    company_address_postal_code: '00010',
    company_address_state: '65',
    company_name: 'Company',
    company_phone: '456-789-0123',
    company_tax_id: '00000000000'
  },
  JP: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    company_address_kana_city: 'ｼﾌﾞﾔ',
    company_address_kana_line1: '27-15',
    company_address_kana_postal_code: '1500001',
    company_address_kana_state: 'ﾄｳｷﾖｳﾄ',
    company_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
    company_address_kanji_city: '渋谷区',
    company_address_kanji_line1: '２７－１５',
    company_address_kanji_postal_code: '1500001',
    company_address_kanji_state: '東京都',
    company_address_kanji_town: '神宮前　３丁目',
    company_name: 'Company',
    company_name_kana: 'ﾄｳｷﾖｳﾄ',
    company_name_kanji: '東京都',
    company_phone: '011-271-6677',
    company_tax_id: '00000000000'
  },
  LT: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    company_address_city: 'Vilnius',
    company_address_line1: '123 Sesame St',
    company_address_postal_code: 'LT-00000',
    company_address_state: 'AL',
    company_name: 'Company',
    company_phone: '456-789-0123',
    company_tax_id: '00000000000'
  },
  LU: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    company_address_city: 'Luxemburg',
    company_address_line1: '123 Park Lane',
    company_address_postal_code: '1623',
    company_address_state: 'L',
    company_name: 'Company',
    company_phone: '456-789-0123',
    company_tax_id: '00000000000'
  },
  LV: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    company_address_city: 'Riga',
    company_address_line1: '123 Sesame St',
    company_address_postal_code: 'LV–1073',
    company_address_state: 'AI',
    company_name: 'Company',
    company_phone: '456-789-0123',
    company_tax_id: '00000000000'
  },
  MY: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    company_address_city: 'Kuala Lumpur',
    company_address_line1: '123 Sesame St',
    company_address_postal_code: '50450',
    company_address_state: 'C',
    company_name: 'Company',
    company_phone: '456-789-0123',
    company_tax_id: '00000000000'
  },
  NL: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    company_address_city: 'Amsterdam',
    company_address_line1: '123 Park Lane',
    company_address_postal_code: '1071 JA',
    company_address_state: 'DR',
    company_name: 'Company',
    company_phone: '456-789-0123',
    company_tax_id: '00000000000'
  },
  NO: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    company_address_city: 'Oslo',
    company_address_line1: '123 Park Lane',
    company_address_postal_code: '0001',
    company_address_state: '02',
    company_name: 'Company',
    company_phone: '456-789-0123',
    company_tax_id: '00000000000'
  },
  NZ: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    company_address_city: 'Auckland',
    company_address_line1: '123 Park Lane',
    company_address_postal_code: '6011',
    company_address_state: 'N',
    company_name: 'Company',
    company_phone: '456-789-0123',
    company_tax_id: '00000000000'
  },
  PL: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    company_address_city: 'Krakow',
    company_address_line1: '123 Park Lane',
    company_address_postal_code: '32-400',
    company_address_state: 'KR',
    company_name: 'Company',
    company_phone: '456-789-0123',
    company_tax_id: '00000000000'
  },
  PT: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    company_address_city: 'Lisbon',
    company_address_line1: '123 Park Lane',
    company_address_postal_code: '4520',
    company_address_state: '01',
    company_name: 'Company',
    company_phone: '456-789-0123',
    company_tax_id: '00000000000'
  },
  SE: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    company_address_city: 'Stockholm',
    company_address_line1: '123 Park Lane',
    company_address_postal_code: '00150',
    company_address_state: 'K',
    company_name: 'Company',
    company_phone: '456-789-0123',
    company_tax_id: '00000000000'
  }, 
  SG: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    company_address_city: 'Singapore',
    company_address_line1: '123 Park Lane',
    company_address_postal_code: '339696',
    company_address_state: 'SG',
    company_name: 'Company',
    company_phone: '456-789-0123',
    company_tax_id: '00000000000'
  },
  SI: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    company_address_city: 'Ljubljana',
    company_address_line1: '123 Sesame St',
    company_address_postal_code: '1210',
    company_address_state: '07',
    company_name: 'Company',
    company_phone: '456-789-0123',
    company_tax_id: '00000000000'
  },
  SK: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    company_address_city: 'Slovakia',
    company_address_line1: '123 Sesame St',
    company_address_postal_code: '00102',
    company_address_state: 'BC',
    company_name: 'Company',
    company_phone: '456-789-0123',
    company_tax_id: '00000000000'
  },
  US: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    company_address_city: 'New York',
    company_address_line1: '285 Fulton St',
    company_address_postal_code: '10007',
    company_address_state: 'NY',
    company_name: 'Company',
    company_phone: '456-789-0123',
    company_tax_id: '00000000000'
  }
}