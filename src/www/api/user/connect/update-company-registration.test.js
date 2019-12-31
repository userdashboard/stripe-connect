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
          address_city: 'New York',
          address_line1: '285 Fulton St',
          address_postal_code: '10007',
          address_state: 'NY',
          name: 'Company',
          phone: '456-789-0123',
          tax_id: '00000000000'
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
          address_city: 'New York',
          address_line1: '285 Fulton St',
          address_postal_code: '10007',
          address_state: 'NY',
          name: 'Company',
          phone: '456-789-0123',
          tax_id: '00000000000'
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
          address_city: 'New York',
          address_line1: '123 Park Lane',
          address_postal_code: '10001',
          address_state: 'NY',
          name: 'Company',
          phone: '456-789-0123',
          tax_id: '00000000000'
        })
        await TestHelper.createCompanyRepresentative(user, {
          address_city: 'New York',
          address_country: 'US',
          address_line1: '285 Fulton St',
          address_postal_code: '10007',
          address_state: 'NY',
          dob_day: '1',
          dob_month: '1',
          dob_year: '1950',
          email: user.profile.contactEmail,
          first_name: user.profile.firstName,
          last_name: user.profile.lastName,
          relationship_percent_ownership: '0',
          phone: '456-789-0123',
          relationship_executive: 'true',
          relationship_title: 'Owner',
          ssn_last_4: '0000'
        }, {
          verification_document_back: TestHelper['success_id_scan_back.png'],
          verification_document_front: TestHelper['success_id_scan_front.png']
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
          address_city: 'New York',
          address_line1: '285 Fulton St',
          address_postal_code: '10007',
          address_state: 'NY',
          name: 'Company',
          phone: '456-789-0123',
          tax_id: '00000000000'
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
          address_city: 'New York',
          address_line1: '285 Fulton St',
          address_postal_code: '10007',
          address_state: 'NY',
          name: 'Company',
          phone: '456-789-0123',
          tax_id: '00000000000'
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

    describe('invalid-name', () => {
      it('missing posted name', async () => {
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
          address_city: 'Vienna',
          address_line1: '123 Park Lane',
          address_postal_code: '1020',
          address_state: '1',
          name: '',
          tax_id: '00000000000'
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-name')
      })
    })

    describe('invalid-tax_id', () => {
      it('missing posted tax_id', async () => {
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
          address_city: 'Vienna',
          address_line1: '123 Park Lane',
          address_postal_code: '1020',
          address_state: '1',
          name: 'Company',
          phone: '456-789-0123',
          tax_id: ''
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-tax_id')
      })
    })

    describe('invalid-address_city', () => {
      it('missing posted address_line1', async () => {
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
          address_city: '',
          address_line1: '123 Park Lane',
          address_postal_code: '1020',
          address_state: '1',
          name: 'Company',
          phone: '456-789-0123',
          tax_id: '00000000000'
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-address_city')
      })
    })

    describe('invalid-address_state', () => {
      it('missing posted address_state', async () => {
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
          address_city: 'New York',
          address_line1: '285 Fulton St',
          address_postal_code: '10007',
          address_state: '',
          name: 'Company',
          phone: '456-789-0123',
          tax_id: '00000000000'
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-address_state')
      })

      it('invalid posted address_state', async () => {
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
          address_city: 'New York',
          address_line1: '285 Fulton St',
          address_postal_code: '10007',
          address_state: 'invalid',
          name: 'Company',
          phone: '456-789-0123',
          tax_id: '00000000000'
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-address_state')
      })
    })

    describe('invalid-address_line1', () => {
      it('missing posted address_line1', async () => {
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
          address_city: 'Vienna',
          address_line1: '',
          address_postal_code: '1020',
          address_state: '1',
          name: 'Company',
          phone: '456-789-0123',
          tax_id: '00000000000'
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-address_line1')
      })
    })

    describe('invalid-address_postal_code', () => {
      it('missing posted address_postal_code', async () => {
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
          address_city: 'Vienna',
          address_line1: '123 Park Lane',
          address_postal_code: '',
          address_state: '1',
          name: 'Company',
          tax_id: '00000000000'
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-address_postal_code')
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
          address_city: 'New York',
          address_line1: '285 Fulton St',
          address_postal_code: '10007',
          address_state: 'NY',
          name: 'Company',
          phone: '456-789-0123',
          tax_id: '00000000000'
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
          address_city: 'New York',
          address_line1: '285 Fulton St',
          address_postal_code: '10007',
          address_state: 'NY',
          name: 'Company',
          phone: '456-789-0123',
          tax_id: '00000000000'
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
          address_city: 'New York',
          address_line1: '285 Fulton St',
          address_postal_code: '10007',
          address_state: 'NY',
          name: 'Company',
          phone: '456-789-0123',
          tax_id: '00000000000'
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
          address_city: 'New York',
          address_line1: '285 Fulton St',
          address_postal_code: '10007',
          address_state: 'NY',
          name: 'Company',
          phone: '456-789-0123',
          tax_id: '00000000000'
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
        address_city: 'New York',
        address_line1: '285 Fulton St',
        address_postal_code: '10007',
        address_state: 'NY',
        name: 'Company',
        phone: '456-789-0123',
        tax_id: '00000000000',
        token: 'sample2'
      }
      const companyNow = await req.patch()
      const registrationNow = connect.MetaData.parse(companyNow.metadata, 'registration')
      assert.strictEqual(registrationNow.companyToken, 'sample2')
    })

    it('optionally-required posted file verification_document_front', async () => {
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
        address_city: 'Brussels',
        address_line1: '123 Park Lane',
        address_postal_code: '1020',
        address_state: 'BRU',
        name: 'Company',
        phone: '456-789-0123',
        tax_id: '00000000000'
      }
      req.uploads = {
        verification_document_back: TestHelper['success_id_scan_back.png'],
        verification_document_front: TestHelper['success_id_scan_front.png']
      }
      req.body = TestHelper.createMultiPart(req, req.body)
      const companyNow = await req.patch()
      const registrationNow = connect.MetaData.parse(companyNow.metadata, 'registration')
      assert.notStrictEqual(registrationNow.verification_document_front, null)
      assert.notStrictEqual(registrationNow.verification_document_front, undefined)
    })

    it('optionally-required posted file verification_document_back', async () => {
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
        address_city: 'Brussels',
        address_line1: '123 Park Lane',
        address_postal_code: '1020',
        address_state: 'BRU',
        name: 'Company',
        phone: '456-789-0123',
        tax_id: '00000000000'
      }
      req.uploads = {
        verification_document_back: TestHelper['success_id_scan_back.png'],
        verification_document_front: TestHelper['success_id_scan_front.png']
      }
      req.body = TestHelper.createMultiPart(req, req.body)
      const companyNow = await req.patch()
      const registrationNow = connect.MetaData.parse(companyNow.metadata, 'registration')
      assert.notStrictEqual(registrationNow.verification_document_back, null)
      assert.notStrictEqual(registrationNow.verification_document_back, undefined)
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
        address_city: 'New York',
        address_line1: '285 Fulton St',
        address_postal_code: '10007',
        address_state: 'NY',
        name: 'Company',
        phone: '456-789-0123',
        tax_id: '00000000000'
      }
      const companyNow = await req.patch()
      const registrationNow = connect.MetaData.parse(companyNow.metadata, 'registration')
      assert.strictEqual(registrationNow.business_profile.mcc, '8931')
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
        address_city: 'New York',
        address_line1: '285 Fulton St',
        address_postal_code: '10007',
        address_state: 'NY',
        name: 'Company',
        phone: '456-789-0123',
        tax_id: '00000000000'
      }
      const companyNow = await req.patch()
      const registrationNow = connect.MetaData.parse(companyNow.metadata, 'registration')
      assert.strictEqual(registrationNow.business_profile.url, 'https://updated.com')
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
        address_city: 'New York',
        address_line1: '285 Fulton St',
        address_postal_code: '10007',
        address_state: 'NY',
        name: 'Company',
        phone: '456-789-0123',
        tax_id: '00000000000'
      }
      const companyNow = await req.patch()
      const registrationNow = connect.MetaData.parse(companyNow.metadata, 'registration')
      assert.strictEqual(registrationNow.business_profile.product_description, 'thing')
    })

    it('required posted phone', async () => {
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
        address_city: 'New York',
        address_line1: '285 Fulton St',
        address_postal_code: '10007',
        address_state: 'NY',
        name: 'Company',
        phone: '111-222-3333',
        tax_id: '00000000000'
      }
      const companyNow = await req.patch()
      const registrationNow = connect.MetaData.parse(companyNow.metadata, 'registration')
      assert.strictEqual(registrationNow.phone, '111-222-3333')
    })

    it('required posted name', async () => {
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
        address_city: 'New York',
        address_line1: '285 Fulton St',
        address_postal_code: '10007',
        address_state: 'NY',
        name: 'Updated name',
        phone: '111-222-3333',
        tax_id: '00000000000'
      }
      const companyNow = await req.patch()
      const registrationNow = connect.MetaData.parse(companyNow.metadata, 'registration')
      assert.strictEqual(registrationNow.name, 'Updated name')
    })

    it('optionally-required posted address_postal_code', async () => {
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
        address_city: 'New York',
        address_line1: '285 Fulton St',
        address_postal_code: '10008',
        address_state: 'NY',
        name: 'Company',
        phone: '111-222-3333',
        tax_id: '00000000000'
      }
      const companyNow = await req.patch()
      const registrationNow = connect.MetaData.parse(companyNow.metadata, 'registration')
      assert.strictEqual(registrationNow.address.postal_code, '10008')
    })

    it('optionally-required posted address_city', async () => {
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
        address_city: 'Providence',
        address_line1: '285 Fulton St',
        address_postal_code: '10008',
        address_state: 'NY',
        name: 'Company',
        phone: '111-222-3333',
        tax_id: '00000000000'
      }
      const companyNow = await req.patch()
      const registrationNow = connect.MetaData.parse(companyNow.metadata, 'registration')
      assert.strictEqual(registrationNow.address.city, 'Providence')
    })

    it('optionally-required posted address_state', async () => {
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
        address_city: 'New York',
        address_line1: '285 Fulton St',
        address_postal_code: '10008',
        address_state: 'NJ',
        name: 'Company',
        phone: '111-222-3333',
        tax_id: '00000000000'
      }
      const companyNow = await req.patch()
      const registrationNow = connect.MetaData.parse(companyNow.metadata, 'registration')
      assert.strictEqual(registrationNow.address.state, 'NJ')
    })

    it('optionally-required posted address_line1', async () => {
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
        address_city: 'New York',
        address_line1: '285 Fulton St',
        address_postal_code: '10008',
        address_state: 'NJ',
        name: 'Company',
        phone: '111-222-3333',
        tax_id: '00000000000'
      }
      const companyNow = await req.patch()
      const registrationNow = connect.MetaData.parse(companyNow.metadata, 'registration')
      assert.strictEqual(registrationNow.address.line1, '285 Fulton St')
    })

    it('optional posted address_line2', async () => {
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
        address_city: 'New York',
        address_line1: '285 Fulton St',
        address_line2: 'Optional',
        address_postal_code: '10008',
        address_state: 'NJ',
        name: 'Company',
        phone: '111-222-3333',
        tax_id: '00000000000'
      }
      const companyNow = await req.patch()
      const registrationNow = connect.MetaData.parse(companyNow.metadata, 'registration')
      assert.strictEqual(registrationNow.address.line2, 'Optional')
    })

    it('optionally-required posted name_kana', async () => {
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
        address_kana_city: 'ｼﾌﾞﾔ',
        address_kana_line1: '27-15',
        address_kana_postal_code: '1500001',
        address_kana_state: 'ﾄｳｷﾖｳﾄ',
        address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        address_kanji_city: '渋谷区',
        address_kanji_line1: '２７－１５',
        address_kanji_postal_code: '1500001',
        address_kanji_state: '東京都',
        address_kanji_town: '神宮前　３丁目',
        name: 'Company',
        name_kana: 'ﾄｳｷﾖｳﾄ',
        name_kanji: '東京都',
        phone: '011-271-6677',
        tax_id: '00000000000'
      }
      const stripeAccountNow = await req.patch()
      const registration = connect.MetaData.parse(stripeAccountNow.metadata, 'registration')
      assert.strictEqual(registration.name_kana, 'ﾄｳｷﾖｳﾄ')
    })

    it('optionally-required posted name_kanji', async () => {
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
        address_kana_city: 'ｼﾌﾞﾔ',
        address_kana_line1: '27-15',
        address_kana_postal_code: '1500001',
        address_kana_state: 'ﾄｳｷﾖｳﾄ',
        address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        address_kanji_city: '渋谷区',
        address_kanji_line1: '２７－１５',
        address_kanji_postal_code: '1500001',
        address_kanji_state: '東京都',
        address_kanji_town: '神宮前　３丁目',
        name: 'Company',
        name_kana: 'ﾄｳｷﾖｳﾄ',
        name_kanji: '東京都',
        phone: '011-271-6677',
        tax_id: '00000000000'
      }
      const stripeAccountNow = await req.patch()
      const registration = connect.MetaData.parse(stripeAccountNow.metadata, 'registration')
      assert.strictEqual(registration.name_kanji, '東京都')
    })

    it('optionally-required posted address_kana_postal_code', async () => {
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
        address_kana_city: 'ｼﾌﾞﾔ',
        address_kana_line1: '27-15',
        address_kana_postal_code: '1500001',
        address_kana_state: 'ﾄｳｷﾖｳﾄ',
        address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        address_kanji_city: '渋谷区',
        address_kanji_line1: '２７－１５',
        address_kanji_postal_code: '1500001',
        address_kanji_state: '東京都',
        address_kanji_town: '神宮前　３丁目',
        name: 'Company',
        name_kana: 'ﾄｳｷﾖｳﾄ',
        name_kanji: '東京都',
        phone: '011-271-6677',
        tax_id: '00000000000'
      }
      const stripeAccountNow = await req.patch()
      const registration = connect.MetaData.parse(stripeAccountNow.metadata, 'registration')
      assert.strictEqual(registration.address.kana_postal_code, '1500001')
    })

    it('optionally-required posted address_kana_city', async () => {
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
        address_kana_city: 'ｼﾌﾞﾔ',
        address_kana_line1: '27-15',
        address_kana_postal_code: '1500001',
        address_kana_state: 'ﾄｳｷﾖｳﾄ',
        address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        address_kanji_city: '渋谷区',
        address_kanji_line1: '２７－１５',
        address_kanji_postal_code: '1500001',
        address_kanji_state: '東京都',
        address_kanji_town: '神宮前　３丁目',
        name: 'Company',
        name_kana: 'ﾄｳｷﾖｳﾄ',
        name_kanji: '東京都',
        phone: '011-271-6677',
        tax_id: '00000000000'
      }
      const stripeAccountNow = await req.patch()
      const registration = connect.MetaData.parse(stripeAccountNow.metadata, 'registration')
      assert.strictEqual(registration.address.kana_city, 'ｼﾌﾞﾔ')
    })

    it('optionally-required posted address_kana_state', async () => {
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
        address_kana_city: 'ｼﾌﾞﾔ',
        address_kana_line1: '27-15',
        address_kana_postal_code: '1500001',
        address_kana_state: 'ﾄｳｷﾖｳﾄ',
        address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        address_kanji_city: '渋谷区',
        address_kanji_line1: '２７－１５',
        address_kanji_postal_code: '1500001',
        address_kanji_state: '東京都',
        address_kanji_town: '神宮前　３丁目',
        name: 'Company',
        name_kana: 'ﾄｳｷﾖｳﾄ',
        name_kanji: '東京都',
        phone: '011-271-6677',
        tax_id: '00000000000'
      }
      const stripeAccountNow = await req.patch()
      const registration = connect.MetaData.parse(stripeAccountNow.metadata, 'registration')
      assert.strictEqual(registration.address.kana_state, 'ﾄｳｷﾖｳﾄ')
    })

    it('optionally-required posted address_kana_town', async () => {
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
        address_kana_city: 'ｼﾌﾞﾔ',
        address_kana_line1: '27-15',
        address_kana_postal_code: '1500001',
        address_kana_state: 'ﾄｳｷﾖｳﾄ',
        address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        address_kanji_city: '渋谷区',
        address_kanji_line1: '２７－１５',
        address_kanji_postal_code: '1500001',
        address_kanji_state: '東京都',
        address_kanji_town: '神宮前　３丁目',
        name: 'Company',
        name_kana: 'ﾄｳｷﾖｳﾄ',
        name_kanji: '東京都',
        phone: '011-271-6677',
        tax_id: '00000000000'
      }
      const stripeAccountNow = await req.patch()
      const registration = connect.MetaData.parse(stripeAccountNow.metadata, 'registration')
      assert.strictEqual(registration.address.kana_town, 'ｼﾞﾝｸﾞｳﾏｴ 3-')
    })

    it('optionally-required posted address_kana_line1', async () => {
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
        address_kana_city: 'ｼﾌﾞﾔ',
        address_kana_line1: '27-15',
        address_kana_postal_code: '1500001',
        address_kana_state: 'ﾄｳｷﾖｳﾄ',
        address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        address_kanji_city: '渋谷区',
        address_kanji_line1: '２７－１５',
        address_kanji_postal_code: '1500001',
        address_kanji_state: '東京都',
        address_kanji_town: '神宮前　３丁目',
        name: 'Company',
        name_kana: 'ﾄｳｷﾖｳﾄ',
        name_kanji: '東京都',
        phone: '011-271-6677',
        tax_id: '00000000000'
      }
      const stripeAccountNow = await req.patch()
      const registration = connect.MetaData.parse(stripeAccountNow.metadata, 'registration')
      assert.strictEqual(registration.address.kana_line1, '27-15')
    })

    it('optionally-required posted address_kanji_postal_code', async () => {
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
        address_kana_city: 'ｼﾌﾞﾔ',
        address_kana_line1: '27-15',
        address_kana_postal_code: '1500001',
        address_kana_state: 'ﾄｳｷﾖｳﾄ',
        address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        address_kanji_city: '渋谷区',
        address_kanji_line1: '２７－１５',
        address_kanji_postal_code: '1500001',
        address_kanji_state: '東京都',
        address_kanji_town: '神宮前　３丁目',
        name: 'Company',
        name_kana: 'ﾄｳｷﾖｳﾄ',
        name_kanji: '東京都',
        phone: '011-271-6677',
        tax_id: '00000000000'
      }
      const stripeAccountNow = await req.patch()
      const registration = connect.MetaData.parse(stripeAccountNow.metadata, 'registration')
      assert.strictEqual(registration.address.kanji_postal_code, '1500001')
    })

    it('optionally-required posted address_kanji_city', async () => {
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
        address_kana_city: 'ｼﾌﾞﾔ',
        address_kana_line1: '27-15',
        address_kana_postal_code: '1500001',
        address_kana_state: 'ﾄｳｷﾖｳﾄ',
        address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        address_kanji_city: '渋谷区',
        address_kanji_line1: '２７－１５',
        address_kanji_postal_code: '1500001',
        address_kanji_state: '東京都',
        address_kanji_town: '神宮前　３丁目',
        name: 'Company',
        name_kana: 'ﾄｳｷﾖｳﾄ',
        name_kanji: '東京都',
        phone: '011-271-6677',
        tax_id: '00000000000'
      }
      const stripeAccountNow = await req.patch()
      const registration = connect.MetaData.parse(stripeAccountNow.metadata, 'registration')
      assert.strictEqual(registration.address.kanji_city, '渋谷区')
    })

    it('optionally-required posted address_kanji_state', async () => {
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
        address_kana_city: 'ｼﾌﾞﾔ',
        address_kana_line1: '27-15',
        address_kana_postal_code: '1500001',
        address_kana_state: 'ﾄｳｷﾖｳﾄ',
        address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        address_kanji_city: '渋谷区',
        address_kanji_line1: '２７－１５',
        address_kanji_postal_code: '1500001',
        address_kanji_state: '東京都',
        address_kanji_town: '神宮前　３丁目',
        name: 'Company',
        name_kana: 'ﾄｳｷﾖｳﾄ',
        name_kanji: '東京都',
        phone: '011-271-6677',
        tax_id: '00000000000'
      }
      const stripeAccountNow = await req.patch()
      const registration = connect.MetaData.parse(stripeAccountNow.metadata, 'registration')
      assert.strictEqual(registration.address.kanji_state, '東京都')
    })

    it('optionally-required posted address_kanji_town', async () => {
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
        address_kana_city: 'ｼﾌﾞﾔ',
        address_kana_line1: '27-15',
        address_kana_postal_code: '1500001',
        address_kana_state: 'ﾄｳｷﾖｳﾄ',
        address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        address_kanji_city: '渋谷区',
        address_kanji_line1: '２７－１５',
        address_kanji_postal_code: '1500001',
        address_kanji_state: '東京都',
        address_kanji_town: '神宮前　３丁目',
        name: 'Company',
        name_kana: 'ﾄｳｷﾖｳﾄ',
        name_kanji: '東京都',
        phone: '011-271-6677',
        tax_id: '00000000000'
      }
      const stripeAccountNow = await req.patch()
      const registration = connect.MetaData.parse(stripeAccountNow.metadata, 'registration')
      assert.strictEqual(registration.address.kanji_town, '神宮前　３丁目')
    })

    it('optionally-required posted address_kanji_line1', async () => {
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
        address_kana_city: 'ｼﾌﾞﾔ',
        address_kana_line1: '27-15',
        address_kana_postal_code: '1500001',
        address_kana_state: 'ﾄｳｷﾖｳﾄ',
        address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        address_kanji_city: '渋谷区',
        address_kanji_line1: '２７－１５',
        address_kanji_postal_code: '1500001',
        address_kanji_state: '東京都',
        address_kanji_town: '神宮前　３丁目',
        name: 'Company',
        name_kana: 'ﾄｳｷﾖｳﾄ',
        name_kanji: '東京都',
        phone: '011-271-6677',
        tax_id: '00000000000'
      }
      const stripeAccountNow = await req.patch()
      const registration = connect.MetaData.parse(stripeAccountNow.metadata, 'registration')
      assert.strictEqual(registration.address.kanji_line1, '２７－１５')
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
            verification_document_front: TestHelper['success_id_scan_back.png'],
            verification_document_back: TestHelper['success_id_scan_back.png']
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
        address_city: 'New York',
        address_line1: '285 Fulton St',
        address_postal_code: '10007',
        address_state: 'NY',
        name: 'Company',
        phone: '456-789-0123',
        tax_id: '00000000000'
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
        address_city: 'New York',
        address_line1: '285 Fulton St',
        address_postal_code: '10007',
        address_state: 'NY',
        name: 'Company',
        phone: '456-789-0123',
        tax_id: '00000000000'
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
    address_city: 'Vienna',
    address_line1: '123 Park Lane',
    address_postal_code: '1020',
    address_state: '1',
    name: 'Company',
    phone: '456-789-0123',
    tax_id: '00000000000'
  },
  AU: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Brisbane',
    address_line1: '123 Park Lane',
    address_postal_code: '4000',
    address_state: 'QLD',
    name: 'Company',
    phone: '456-789-0123',
    tax_id: '00000000000'
  },
  BE: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Brussels',
    address_line1: '123 Park Lane',
    address_postal_code: '1020',
    address_state: 'BRU',
    name: 'Company',
    phone: '456-789-0123',
    tax_id: '00000000000'
  },
  CA: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Vancouver',
    address_line1: '123 Park Lane',
    address_postal_code: 'V5K 0A1',
    address_state: 'BC',
    name: 'Company',
    phone: '456-789-0123',
    tax_id: '00000000000'
  },
  CH: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Bern',
    address_line1: '123 Park Lane',
    address_postal_code: '1020',
    address_state: 'BE',
    name: 'Company',
    phone: '456-789-0123',
    tax_id: '00000000000'
  },
  DE: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Berlin',
    address_line1: '123 Park Lane',
    address_postal_code: '01067',
    address_state: 'BE',
    name: 'Company',
    phone: '456-789-0123',
    tax_id: '00000000000'
  },
  DK: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Copenhagen',
    address_line1: '123 Park Lane',
    address_postal_code: '1000',
    address_state: '147',
    name: 'Company',
    phone: '456-789-0123',
    tax_id: '00000000000'
  },
  EE: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Talin',
    address_line1: '123 Park Lane',
    address_postal_code: '10128',
    address_state: '37',
    name: 'Company',
    phone: '456-789-0123',
    tax_id: '00000000000'
  },
  ES: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Madrid',
    address_line1: '123 Park Lane',
    address_postal_code: '03179',
    address_state: 'AN',
    name: 'Company',
    phone: '456-789-0123',
    tax_id: '00000000000'
  },
  FI: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Helsinki',
    address_line1: '123 Park Lane',
    address_postal_code: '00990',
    address_state: 'AL',
    name: 'Company',
    phone: '456-789-0123',
    tax_id: '00000000000'
  },
  FR: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Paris',
    address_line1: '123 Park Lane',
    address_postal_code: '75001',
    address_state: 'A',
    name: 'Company',
    phone: '456-789-0123',
    tax_id: '00000000000'
  },
  GB: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'London',
    address_line1: '123 Park Lane',
    address_postal_code: 'EC1A 1AA',
    address_state: 'LND',
    name: 'Company',
    phone: '456-789-0123',
    tax_id: '00000000000'
  },
  GR: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Athens',
    address_line1: '123 Park Lane',
    address_postal_code: '104',
    address_state: 'I',
    name: 'Company',
    phone: '456-789-0123',
    tax_id: '00000000000'
  },
  HK: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Hong Kong',
    address_line1: '123 Park Lane',
    address_postal_code: '00000',
    address_state: 'HK',
    name: 'Company',
    phone: '456-789-0234',
    tax_id: '00000000000'
  },
  IE: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Dublin',
    address_line1: '123 Park Lane',
    address_postal_code: 'Dublin 1',
    address_state: 'D',
    name: 'Company',
    phone: '456-789-0123',
    tax_id: '00000000000'
  },
  IT: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Rome',
    address_line1: '123 Park Lane',
    address_postal_code: '00010',
    address_state: '65',
    name: 'Company',
    phone: '456-789-0123',
    tax_id: '00000000000'
  },
  JP: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_kana_city: 'ｼﾌﾞﾔ',
    address_kana_line1: '27-15',
    address_kana_postal_code: '1500001',
    address_kana_state: 'ﾄｳｷﾖｳﾄ',
    address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
    address_kanji_city: '渋谷区',
    address_kanji_line1: '２７－１５',
    address_kanji_postal_code: '1500001',
    address_kanji_state: '東京都',
    address_kanji_town: '神宮前　３丁目',
    name: 'Company',
    name_kana: 'ﾄｳｷﾖｳﾄ',
    name_kanji: '東京都',
    phone: '011-271-6677',
    tax_id: '00000000000'
  },
  LT: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Vilnius',
    address_line1: '123 Sesame St',
    address_postal_code: 'LT-00000',
    address_state: 'AL',
    name: 'Company',
    phone: '456-789-0123',
    tax_id: '00000000000'
  },
  LU: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Luxemburg',
    address_line1: '123 Park Lane',
    address_postal_code: '1623',
    address_state: 'L',
    name: 'Company',
    phone: '456-789-0123',
    tax_id: '00000000000'
  },
  LV: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Riga',
    address_line1: '123 Sesame St',
    address_postal_code: 'LV–1073',
    address_state: 'AI',
    name: 'Company',
    phone: '456-789-0123',
    tax_id: '00000000000'
  },
  MY: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Kuala Lumpur',
    address_line1: '123 Sesame St',
    address_postal_code: '50450',
    address_state: 'C',
    name: 'Company',
    phone: '456-789-0123',
    tax_id: '00000000000'
  },
  NL: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Amsterdam',
    address_line1: '123 Park Lane',
    address_postal_code: '1071 JA',
    address_state: 'DR',
    name: 'Company',
    phone: '456-789-0123',
    tax_id: '00000000000'
  },
  NO: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Oslo',
    address_line1: '123 Park Lane',
    address_postal_code: '0001',
    address_state: '02',
    name: 'Company',
    phone: '456-789-0123',
    tax_id: '00000000000'
  },
  NZ: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Auckland',
    address_line1: '123 Park Lane',
    address_postal_code: '6011',
    address_state: 'N',
    name: 'Company',
    phone: '456-789-0123',
    tax_id: '00000000000'
  },
  PL: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Krakow',
    address_line1: '123 Park Lane',
    address_postal_code: '32-400',
    address_state: 'KR',
    name: 'Company',
    phone: '456-789-0123',
    tax_id: '00000000000'
  },
  PT: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Lisbon',
    address_line1: '123 Park Lane',
    address_postal_code: '4520',
    address_state: '01',
    name: 'Company',
    phone: '456-789-0123',
    tax_id: '00000000000'
  },
  SE: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Stockholm',
    address_line1: '123 Park Lane',
    address_postal_code: '00150',
    address_state: 'K',
    name: 'Company',
    phone: '456-789-0123',
    tax_id: '00000000000'
  },
  SG: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Singapore',
    address_line1: '123 Park Lane',
    address_postal_code: '339696',
    address_state: 'SG',
    name: 'Company',
    phone: '456-789-0123',
    tax_id: '00000000000'
  },
  SI: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Ljubljana',
    address_line1: '123 Sesame St',
    address_postal_code: '1210',
    address_state: '07',
    name: 'Company',
    phone: '456-789-0123',
    tax_id: '00000000000'
  },
  SK: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Slovakia',
    address_line1: '123 Sesame St',
    address_postal_code: '00102',
    address_state: 'BC',
    name: 'Company',
    phone: '456-789-0123',
    tax_id: '00000000000'
  },
  US: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'New York',
    address_line1: '285 Fulton St',
    address_postal_code: '10007',
    address_state: 'NY',
    name: 'Company',
    phone: '456-789-0123',
    tax_id: '00000000000'
  }
}
