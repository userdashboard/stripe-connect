/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')

describe('/account/connect/edit-company-registration', async () => {
  describe('EditCompanyRegistration#BEFORE', () => {
    it('should reject invalid registration', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/account/connect/edit-company-registration?stripeid=invalid')
      req.account = user.account
      req.session = user.session
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-stripeid')
    })

    it('should reject individual registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'individual',
        country: 'US'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-stripe-account')
    })

    it('should reject invalid personal address country', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'US'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_account_opener_address_country: 'invalid'
      }
      await req.route.api.before(req)
      assert.strictEqual(req.error, 'invalid-relationship_account_opener_address_country')
    })

    it('should reject invalid company address country', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'US'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_country: 'invalid'
      }
      await req.route.api.before(req)
      assert.strictEqual(req.error, 'invalid-company_address_country')
    })

    it('should bind application CountrySpec to req', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'AU'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.applicationCountry.id, 'AU')
    })

    it('should bind personal address country to req', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'AU'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.personalAddress.code, 'AU')
    })

    it('should bind posted personal address country to req', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'AU'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_account_opener_address_country: 'CA'
      }
      await req.route.api.before(req)
      assert.strictEqual(req.data.personalAddress.code, 'CA')
    })

    it('should bind company address country to req', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'AU'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.companyAddressCountry.code, 'AU')
    })

    it('should bind posted company address country to req', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'AU'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_country: 'GB'
      }
      await req.route.api.before(req)
      assert.strictEqual(req.data.companyAddressCountry.code, 'GB')
    })
  })

  describe('EditCompanyRegistration#GET', () => {
    async function testRequiredFieldInputsExist (req, stripeAccount) {
      const req2 = TestHelper.createRequest(`/api/user/connect/country-spec?country=${stripeAccount.country}`)
      req2.account = req.account
      req2.session = req.session
      const country = await req2.get()
      const fieldsNeeded = country.verification_fields.company.minimum.concat(country.verification_fields.company.additional)
      const page = await req.get()
      const doc = TestHelper.extractDoc(page)
      for (const field of fieldsNeeded) {
        if (field === 'external_account' ||
          field === 'relationship.owner' ||
          field === 'relationship.account_opener' ||
          field === 'business_type' ||
          field === 'tos_acceptance.date' ||
          field === 'tos_acceptance.ip' ||
          field === 'tos_acceptance.user_agent' ||
          field === 'company.requirements.document') {
          continue
        }
        const input = doc.getElementById(field.split('.').join('_'))
        if (input.attr.name === 'relationship_account_opener_address_state' || input.attr.name === 'relationship_account_opener_address_country' ||
          input.attr.name === 'company_address_state' || input.attr.name === 'company_address_country' ||
          input.attr.name === 'business_profile_mcc') {
          assert.strictEqual(input.tag, 'select')
        } else if (input.attr.id === 'gender') {
          assert.strictEqual(input.tag, 'div')
        } else {
          assert.strictEqual(input.tag, 'input')
        }
      }
    }

    it('should present the form', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'AU'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const page = await req.get()
      const doc = TestHelper.extractDoc(page)
      assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
      assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
    })

    it('should have AT-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'AT'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have AU-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'AU'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have BE-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'BE'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have CA-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'CA'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have CH-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'CH'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have DE-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'DE'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have DK-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'DK'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have ES-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'ES'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have FI-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'FI'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have FR-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'FR'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have GB-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'GB'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have HK-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'HK'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have IE-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'IE'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have IT-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'IT'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have JP-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'JP'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have LU-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'LU'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have NL-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'NL'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have NO-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'NO'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have NZ-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'NZ'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have PT-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'PT'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have SE-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'SE'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have SG-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'SG'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have US-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'US'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })
  })

  describe('EditCompanyRegistration#POST', () => {
    async function testEachFieldAsNull (req) {
      const body = JSON.stringify(req.body)
      const fields = Object.keys(req.body)
      for (const field of fields) {
        req.body = JSON.parse(body)
        req.body[field] = ''
        const page = await req.post()
        const doc = TestHelper.extractDoc(page)
        const messageContainer = doc.getElementById('message-container')
        const message = messageContainer.child[0]
        assert.strictEqual(message.attr.template, `invalid-${field}`)
      }
    }

    it('should refresh and load states for posted company address', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'AU'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_country: 'AU'
      }
      req.button = 'Reload states'
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
      assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
      const stateField = doc.getElementById('company_address_state')
      assert.strictEqual(stateField.toString().indexOf('QLD') > -1, true)
    })

    it('should reject AT invalid fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'AT'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '1020',
        company_name: 'Company',
        company_tax_id: '8',
        company_address_city: 'Vienna',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123',
        relationship_account_opener_address_city: 'Vienna',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_code: '1020'
      }
      await testEachFieldAsNull(req)
    })

    it('should update AT information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'AT'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_country: 'AT',
        company_address_city: 'Vienna',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '1020',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123',
        relationship_account_opener_address_country: 'AT',
        relationship_account_opener_address_city: 'Vienna',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_code: '1020'
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should reject AU invalid fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'AU'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Brisbane',
        company_address_state: 'QLD',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '4000',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123',
        relationship_account_opener_address_city: 'Brisbane',
        relationship_account_opener_address_line1: '845 Oxford St',
        relationship_account_opener_address_postal_code: '4000'
      }
      await testEachFieldAsNull(req)
    })

    it('should update AU information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'AU'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Brisbane',
        company_address_state: 'QLD',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '4000',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123',
        relationship_account_opener_address_city: 'Brisbane',
        relationship_account_opener_address_line1: '845 Oxford St',
        relationship_account_opener_address_postal_code: '4000'
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should reject BE invalid fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'BE'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Brussels',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '1020',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Brussels',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_code: '1020',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      }
      await testEachFieldAsNull(req)
    })

    it('should update BE information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'BE'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Brussels',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '1020',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Brussels',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_code: '1020',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should reject CA invalid fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'CA'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Vancouver',
        company_address_state: 'BC',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: 'V5K 0A1',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123',
        relationship_account_opener_address_city: 'Vancouver',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_code: 'V5K 0A1'
      }
      await testEachFieldAsNull(req)
    })

    it('should update CA information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'CA'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Vancouver',
        company_address_state: 'BC',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: 'V5K 0A1',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_id_number: '7',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123',
        relationship_account_opener_address_city: 'Vancouver',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_code: 'V5K 0A1'
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should reject CH invalid fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'CH'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Bern',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '1020',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Bern',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_code: '1020',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      }
      await testEachFieldAsNull(req)
    })

    it('should update CH information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'CH'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Bern',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '1020',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Bern',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_code: '1020',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should reject DE invalid fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'DE'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Berlin',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '01067',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Berlin',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_code: '01067',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      }
      await testEachFieldAsNull(req)
    })

    it('should update DE information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'DE'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Berlin',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '01067',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Berlin',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_code: '01067',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should reject DK invalid fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'DK'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Copenhagen',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '1000',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Copenhagen',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_code: '1000',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      }
      await testEachFieldAsNull(req)
    })

    it('should update DK information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'DK'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Copenhagen',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '1000',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Copenhagen',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_code: '1000',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should reject ES invalid fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'ES'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Madrid',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '03179',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Madrid',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_code: '03179',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      }
      await testEachFieldAsNull(req)
    })

    it('should update ES information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'ES'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Madrid',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '03179',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Madrid',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_code: '03179',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should reject FI invalid fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'FI'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Helsinki',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '00990',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Helsinki',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_code: '00990',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      }
      await testEachFieldAsNull(req)
    })

    it('should update FI information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'FI'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Helsinki',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '00990',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Helsinki',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_code: '00990',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should reject FR invalid fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'FR'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Paris',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '75001',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Paris',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_code: '75001',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      }
      await testEachFieldAsNull(req)
    })

    it('should update FR information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'FR'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Paris',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '75001',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Paris',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_code: '75001',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should reject GB invalid fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'GB'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'London',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: 'EC1A 1AA',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'London',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_code: 'EC1A 1AA',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      }
      await testEachFieldAsNull(req)
    })

    it('should update GB information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'GB'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'London',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: 'EC1A 1AA',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'London',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_code: 'EC1A 1AA',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should reject HK invalid fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'HK'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Hong Kong',
        company_address_line1: '123 Park Lane',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123',
        relationship_account_opener_address_city: 'Hong Kong',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_code: '999077'
      }
      await testEachFieldAsNull(req)
    })

    it('should update HK information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'HK'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Hong Kong',
        company_address_line1: '123 Park Lane',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123',
        relationship_account_opener_address_city: 'Hong Kong',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_code: '999077'
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should reject IE invalid fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'IE'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Dublin',
        company_address_state: 'Dublin',
        company_address_line1: '123 Park Lane',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Dublin',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123',
        relationship_account_opener_address_postal_code: 'Dublin 1'
      }
      await testEachFieldAsNull(req)
    })

    it('should update IE information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'IE'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Dublin',
        company_address_state: 'Dublin',
        company_address_line1: '123 Park Lane',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Dublin',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123',
        relationship_account_opener_address_postal_code: 'Dublin 1'
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should reject IT invalid fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'IT'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Rome',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '00010',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Rome',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_code: '00010',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      }
      await testEachFieldAsNull(req)
    })

    it('should update IT information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'IT'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Rome',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '00010',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Rome',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_code: '00010',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should reject JP invalid fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'JP'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_tax_id: '8',
        company_name: 'Company',
        company_phone: '011-271-6677',
        company_business_name_kana: 'ﾄｳｷﾖｳﾄ',
        company_business_name_kanji: '東京都',
        company_address_kana_postal_code: '1500001',
        company_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        company_address_kana_city: 'ｼﾌﾞﾔ',
        company_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        company_address_kana_line1: '27-15',
        company_address_kanji_postal_code: '1500001',
        company_address_kanji_state: '東京都',
        company_address_kanji_city: '渋谷区',
        company_address_kanji_town: '神宮前　３丁目',
        company_address_kanji_line1: '２７－１５',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123',
        relationship_account_opener_gender: 'female',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name_kana: 'ﾄｳｷﾖｳﾄ',
        relationship_account_opener_last_name_kana: 'ﾄｳｷﾖｳﾄ',
        relationship_account_opener_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        relationship_account_opener_address_kana_city: 'ｼﾌﾞﾔ',
        relationship_account_opener_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        relationship_account_opener_address_kana_line1: '27-15',
        relationship_account_opener_address_kana_postal_code: '1500001',
        relationship_account_opener_first_name_kanji: '東京都',
        relationship_account_opener_last_name_kanji: '東京都',
        relationship_account_opener_address_kanji_postal_code: '1500001',
        relationship_account_opener_address_kanji_state: '東京都',
        relationship_account_opener_address_kanji_city: '渋谷区',
        relationship_account_opener_address_kanji_town: '神宮前　３丁目',
        relationship_account_opener_address_kanji_line1: '２７－１５'
      }
      await testEachFieldAsNull(req)
    })

    it('should update JP information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'JP'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_tax_id: '8',
        company_name: 'Company',
        company_phone: '011-271-6677',
        company_business_name_kana: 'ﾄｳｷﾖｳﾄ',
        company_business_name_kanji: '東京都',
        company_address_kana_postal_code: '1500001',
        company_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        company_address_kana_city: 'ｼﾌﾞﾔ',
        company_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        company_address_kana_line1: '27-15',
        company_address_kanji_postal_code: '1500001',
        company_address_kanji_state: '東京都',
        company_address_kanji_city: '渋谷区',
        company_address_kanji_town: '神宮前　３丁目',
        company_address_kanji_line1: '２７－１５',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123',
        relationship_account_opener_gender: 'female',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name_kana: 'ﾄｳｷﾖｳﾄ',
        relationship_account_opener_last_name_kana: 'ﾄｳｷﾖｳﾄ',
        relationship_account_opener_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        relationship_account_opener_address_kana_city: 'ｼﾌﾞﾔ',
        relationship_account_opener_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        relationship_account_opener_address_kana_line1: '27-15',
        relationship_account_opener_address_kana_postal_code: '1500001',
        relationship_account_opener_first_name_kanji: '東京都',
        relationship_account_opener_last_name_kanji: '東京都',
        relationship_account_opener_address_kanji_postal_code: '1500001',
        relationship_account_opener_address_kanji_state: '東京都',
        relationship_account_opener_address_kanji_city: '渋谷区',
        relationship_account_opener_address_kanji_town: '神宮前　３丁目',
        relationship_account_opener_address_kanji_line1: '２７－１５'
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should reject LU invalid fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'LU'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Luxemburg',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '1623',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Luxemburg',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_code: '1623',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      }
      await testEachFieldAsNull(req)
    })

    it('should update LU information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'LU'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Luxemburg',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '1623',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Luxemburg',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_code: '1623',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should reject NL invalid fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'NL'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Amsterdam',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '1071 JA',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Amsterdam',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_code: '1071 JA',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      }
      await testEachFieldAsNull(req)
    })

    it('should update NL information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'NL'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Amsterdam',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '1071 JA',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Amsterdam',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_code: '1071 JA',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should reject NO invalid fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'NO'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Oslo',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '0001',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Oslo',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_code: '0001',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      }
      await testEachFieldAsNull(req)
    })

    it('should update NO information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'NO'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Oslo',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '0001',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Oslo',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_code: '0001',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should reject NZ invalid fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'NZ'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Auckland',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '6011',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123',
        relationship_account_opener_address_city: 'Auckland',
        relationship_account_opener_address_postal_code: '6011',
        relationship_account_opener_address_line1: '844 Fleet Street'
      }
      await testEachFieldAsNull(req)
    })

    it('should update NZ information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'NZ'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Auckland',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '6011',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123',
        relationship_account_opener_address_city: 'Auckland',
        relationship_account_opener_address_postal_code: '6011',
        relationship_account_opener_address_line1: '844 Fleet Street'
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should reject PT invalid fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'PT'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Lisbon',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '4520',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Lisbon',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_code: '4520',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      }
      await testEachFieldAsNull(req)
    })

    it('should update PT information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'PT'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Lisbon',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '4520',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Lisbon',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_code: '4520',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should reject SE invalid fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'SE'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Stockholm',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '00150',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Stockholm',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_code: '00150',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      }
      await testEachFieldAsNull(req)
    })

    it('should update SE information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'SE'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_city: 'Stockholm',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '00150',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_address_city: 'Stockholm',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_code: '00150',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123'
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should reject SG invalid fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'SG'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '339696',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_code: '339696',
        relationship_account_opener_address_city: 'Singapore'
      }
      await testEachFieldAsNull(req)
    })

    it('should update SG information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'SG'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '339696',
        company_name: 'Company',
        company_tax_id: '8',
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123',
        relationship_account_opener_address_line1: '123 Sesame St',
        relationship_account_opener_address_postal_code: '339696',
        relationship_account_opener_address_city: 'Singapore'
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should reject US invalid fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'US'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_name: 'Company',
        company_tax_id: '8',
        company_phone: '456-123-7890',
        company_address_city: 'New York',
        company_address_line1: '285 Fulton St',
        company_address_postal_code: '10007',
        company_address_state: 'NY',
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123',
        relationship_account_opener_ssn_last_4: '0000',
        relationship_account_opener_address_city: 'New York',
        relationship_account_opener_address_line1: '285 Fulton St',
        relationship_account_opener_address_postal_code: '10007'
      }
      await testEachFieldAsNull(req)
    })

    it('should update US information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'US'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_name: 'Company',
        company_tax_id: '8',
        company_phone: '456-123-7890',
        company_address_city: 'New York',
        company_address_line1: '285 Fulton St',
        company_address_postal_code: '10007',
        company_address_state: 'NY',
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        relationship_account_opener_dob_day: '1',
        relationship_account_opener_dob_month: '1',
        relationship_account_opener_dob_year: '1950',
        relationship_account_opener_first_name: user.profile.firstName,
        relationship_account_opener_last_name: user.profile.lastName,
        relationship_account_opener_email: user.profile.contactEmail,
        relationship_account_opener_phone: '456-789-0123',
        relationship_account_opener_ssn_last_4: '0000',
        relationship_account_opener_address_city: 'New York',
        relationship_account_opener_address_line1: '285 Fulton St',
        relationship_account_opener_address_postal_code: '10007'
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })
  })
})
