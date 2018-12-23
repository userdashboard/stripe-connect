/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../..//test-helper.js')

describe(`/account/connect/edit-company-registration`, async () => {
  describe('EditCompanyRegistration#BEFORE', () => {
    it('should reject invalid registration', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=invalid`)
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
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'US' })
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
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'US' })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        personal_country: 'invalid'
      }
      await req.route.api.before(req)
      assert.strictEqual(req.error, 'invalid-personal_country')
    })

    it('should reject invalid company address country', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'US' })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_country: 'invalid'
      }
      await req.route.api.before(req)
      assert.strictEqual(req.error, 'invalid-company_country')
    })

    it('should bind application CountrySpec to req', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'AU' })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.applicationCountry.id, 'AU')
    })

    it('should bind personal address country to req', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'AU' })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        personal_country: 'CA'
      }
      await req.route.api.before(req)
      assert.strictEqual(req.data.personalAddressCountry.code, req.body.personal_country)
    })

    it('should bind company address country to req', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'AU' })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_country: 'GB'
      }
      await req.route.api.before(req)
      assert.strictEqual(req.data.companyAddressCountry.code, req.body.company_country)
    })
  })

  describe('EditCompanyRegistration#GET', () => {
    async function testRequiredFieldInputsExist(req, stripeAccount) {
      const req2 = TestHelper.createRequest(`/api/user/connect/country-spec?country=${stripeAccount.country}`)
      req2.account = req.account
      req2.session = req.session
      const country = await req2.get()
      const fieldsNeeded = country.verification_fields.company.minimum.concat(country.verification_fields.company.additional)
      const page = await req.get()
      const doc = TestHelper.extractDoc(page)
      for (const pathAndField of fieldsNeeded) {
        if (pathAndField === 'external_account' ||
          pathAndField === 'legal_entity.additional_owners' ||
          pathAndField === 'legal_entity.type' ||
          pathAndField === 'tos_acceptance.date' ||
          pathAndField === 'tos_acceptance.ip' ||
          pathAndField === 'tos_acceptance.user_agent' ||
          pathAndField === 'legal_entity.verification.document') {
          continue
        }
        const field = pathAndField.split('.').pop()
        let inputName
        switch (pathAndField) {
          case 'legal_entity.address.line1':
          case 'legal_entity.address.line2':
          case 'legal_entity.address.state':
          case 'legal_entity.address.city':
          case 'legal_entity.address.country':
          case 'legal_entity.address.postal_code':
          case 'legal_entity.address_kana.town':
          case 'legal_entity.address_kana.line1':
          case 'legal_entity.address_kana.line2':
          case 'legal_entity.address_kana.state':
          case 'legal_entity.address_kana.city':
          case 'legal_entity.address_kana.country':
          case 'legal_entity.address_kana.postal_code':
          case 'legal_entity.address_kanji.town':
          case 'legal_entity.address_kanji.line1':
          case 'legal_entity.address_kanji.line2':
          case 'legal_entity.address_kanji.state':
          case 'legal_entity.address_kanji.city':
          case 'legal_entity.address_kanji.country':
          case 'legal_entity.address_kanji.postal_code':
            inputName = `company_${field}`
            break
          case 'legal_entity.personal_address.line1':
          case 'legal_entity.personal_address.line2':
          case 'legal_entity.personal_address.state':
          case 'legal_entity.personal_address.city':
          case 'legal_entity.personal_address.country':
          case 'legal_entity.personal_address.postal_code':
          case 'legal_entity.personal_address_kana.town':
          case 'legal_entity.personal_address_kana.line1':
          case 'legal_entity.personal_address_kana.line2':
          case 'legal_entity.personal_address_kana.state':
          case 'legal_entity.personal_address_kana.city':
          case 'legal_entity.personal_address_kana.country':
          case 'legal_entity.personal_address_kana.postal_code':
          case 'legal_entity.personal_address_kanji.town':
          case 'legal_entity.personal_address_kanji.line1':
          case 'legal_entity.personal_address_kanji.line2':
          case 'legal_entity.personal_address_kanji.state':
          case 'legal_entity.personal_address_kanji.city':
          case 'legal_entity.personal_address_kanji.country':
          case 'legal_entity.personal_address_kanji.postal_code':
            inputName = `personal_${field}`
            break
          default:
            inputName = field
            break
        }
        if (country.id === 'JP') {
          if (pathAndField.indexOf('kana') > -1 && !pathAndField.endsWith('_kana')) {
            inputName += '_kana'
          } else if (pathAndField.indexOf('kanji') > -1 && !pathAndField.endsWith('_kanji')) {
            inputName += '_kanji'
          }
        }
        const input = doc.getElementById(inputName)
        if (input.attr.name === 'personal_state' || input.attr.name === 'personal_country' ||
          input.attr.name === 'company_state' || input.attr.name === 'company_country') {
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
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'AU' })
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
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'AT' })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have AU-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'AU' })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have BE-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'BE' })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have CA-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'CA' })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have CH-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'CH' })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have DE-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'DE' })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have DK-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'DK' })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have ES-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'ES' })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have FI-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'FI' })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have FR-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'FR' })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have GB-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'GB' })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have HK-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'HK' })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have IE-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'IE' })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have IT-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'IT' })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have JP-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'JP' })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have LU-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'LU' })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have NL-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'NL' })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have NO-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'NO' })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have NZ-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'NZ' })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have PT-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'PT' })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have SE-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'SE' })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    // these tests only work if your Stripe account is SG
    // it('should have SG-required fields', async () => {
    //   const user = await TestHelper.createUser()
    //   await TestHelper.createStripeAccount(user, { type: 'company', country: 'SG' })
    //   const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
    //   req.account = user.account
    //   req.session = user.session
    //   return testRequiredFieldInputsExist(req, user.stripeAccount)
    // })

    it('should have US-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'US' })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })
  })

  describe('EditCompanyRegistration#POST', () => {
    async function testEachFieldAsNull (req) {
      for (const field in req.body) {
        const value = req.body[field]
        req.body[field] = null
        const page = await req.post()
        req.body[field] = value
        const doc = TestHelper.extractDoc(page)
        const messageContainer = doc.getElementById('message-container')
        const message = messageContainer.child[0]
        assert.strictEqual(message.attr.template, `invalid-${field}`)
      }
    }
    
    it('should refresh and load states for posted company address', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'AU' })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_country: 'AU',
        refresh: 'true'
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
      assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
      const stateField = doc.getElementById('company_state')
      assert.strictEqual(stateField.toString().indexOf('QLD') > -1, true)
    })

    it('should reject AT invalid fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'AT' })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        personal_city: 'Vienna',
        personal_line1: 'Address First Line',
        personal_postal_code: '1020',
        company_city: 'Vienna',
        company_line1: 'Address First Line',
        company_postal_code: '1020',
        business_name: 'Company',
        business_tax_id: '8',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      await testEachFieldAsNull(req)
    })

    it('should update AT information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'AT' })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        personal_country: 'AT',
        personal_city: 'Vienna',
        personal_line1: 'Address First Line',
        personal_postal_code: '1020',
        company_country: 'AT',
        company_city: 'Vienna',
        company_line1: 'Address First Line',
        company_postal_code: '1020',
        business_name: 'Company',
        business_tax_id: '8',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should reject AU invalid fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'AU' })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_city: 'Brisbane',
        company_state: 'QLD',
        company_line1: 'Address First Line',
        company_postal_code: '4000',
        business_name: 'Company',
        business_tax_id: '8',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Australian',
        last_name: 'Person'
      }
      await testEachFieldAsNull(req)
    })

    it('should update AU information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'AU' })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_city: 'Brisbane',
        company_state: 'QLD',
        company_line1: 'Address First Line',
        company_postal_code: '4000',
        business_name: 'Company',
        business_tax_id: '8',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Australian',
        last_name: 'Person'
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should reject BE invalid fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'BE' })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        personal_city: 'Brussels',
        personal_line1: 'Address First Line',
        personal_postal_code: '1020',
        company_city: 'Brussels',
        company_line1: 'Address First Line',
        company_postal_code: '1020',
        business_name: 'Company',
        business_tax_id: '8',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      await testEachFieldAsNull(req)
    })

    it('should update BE information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'BE' })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        personal_city: 'Brussels',
        personal_line1: 'Address First Line',
        personal_postal_code: '1020',
        company_city: 'Brussels',
        company_line1: 'Address First Line',
        company_postal_code: '1020',
        business_name: 'Company',
        business_tax_id: '8',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should reject CA invalid fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'CA' })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_city: 'Vancouver',
        company_state: 'BC',
        company_line1: 'Address First Line',
        company_postal_code: 'V5K 0A1',
        business_name: 'Company',
        business_tax_id: '8',
        personal_id_number: '7',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Canadian',
        last_name: 'Person'
      }
      await testEachFieldAsNull(req)
    })

    it('should update CA information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'CA' })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_city: 'Vancouver',
        company_state: 'BC',
        company_line1: 'Address First Line',
        company_postal_code: 'V5K 0A1',
        business_name: 'Company',
        business_tax_id: '8',
        personal_id_number: '7',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Canadian',
        last_name: 'Person'
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should reject CH invalid fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'CH' })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        personal_city: 'Bern',
        personal_line1: 'Address First Line',
        personal_postal_code: '1020',
        company_city: 'Bern',
        company_line1: 'Address First Line',
        company_postal_code: '1020',
        business_name: 'Company',
        business_tax_id: '8',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      await testEachFieldAsNull(req)
    })

    it('should update CH information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'CH' })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        personal_city: 'Bern',
        personal_line1: 'Address First Line',
        personal_postal_code: '1020',
        company_city: 'Bern',
        company_line1: 'Address First Line',
        company_postal_code: '1020',
        business_name: 'Company',
        business_tax_id: '8',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should reject DE invalid fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'DE' })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        personal_city: 'Berlin',
        personal_line1: 'Address First Line',
        personal_postal_code: '01067',
        company_city: 'Berlin',
        company_line1: 'Address First Line',
        company_postal_code: '01067',
        business_name: 'Company',
        business_tax_id: '8',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      await testEachFieldAsNull(req)
    })

    it('should update DE information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'DE' })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        personal_city: 'Berlin',
        personal_line1: 'Address First Line',
        personal_postal_code: '01067',
        company_city: 'Berlin',
        company_line1: 'Address First Line',
        company_postal_code: '01067',
        business_name: 'Company',
        business_tax_id: '8',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should reject DK invalid fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'DK' })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        personal_city: 'Copenhagen',
        personal_line1: 'Address First Line',
        personal_postal_code: '1000',
        company_city: 'Copenhagen',
        company_line1: 'Address First Line',
        company_postal_code: '1000',
        business_name: 'Company',
        business_tax_id: '8',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      await testEachFieldAsNull(req)
    })

    it('should update DK information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'DK' })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        personal_city: 'Copenhagen',
        personal_line1: 'Address First Line',
        personal_postal_code: '1000',
        company_city: 'Copenhagen',
        company_line1: 'Address First Line',
        company_postal_code: '1000',
        business_name: 'Company',
        business_tax_id: '8',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should reject ES invalid fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'ES' })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        personal_city: 'Madrid',
        personal_line1: 'Address First Line',
        personal_postal_code: '03179',
        company_city: 'Madrid',
        company_line1: 'Address First Line',
        company_postal_code: '03179',
        business_name: 'Company',
        business_tax_id: '8',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      await testEachFieldAsNull(req)
    })

    it('should update ES information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'ES' })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        personal_city: 'Madrid',
        personal_line1: 'Address First Line',
        personal_postal_code: '03179',
        company_city: 'Madrid',
        company_line1: 'Address First Line',
        company_postal_code: '03179',
        business_name: 'Company',
        business_tax_id: '8',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should reject FI invalid fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'FI' })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        personal_city: 'Helsinki',
        personal_line1: 'Address First Line',
        personal_postal_code: '00990',
        company_city: 'Helsinki',
        company_line1: 'Address First Line',
        company_postal_code: '00990',
        business_name: 'Company',
        business_tax_id: '8',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      await testEachFieldAsNull(req)
    })

    it('should update FI information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'FI' })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        personal_city: 'Helsinki',
        personal_line1: 'Address First Line',
        personal_postal_code: '00990',
        company_city: 'Helsinki',
        company_line1: 'Address First Line',
        company_postal_code: '00990',
        business_name: 'Company',
        business_tax_id: '8',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should reject FR invalid fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'FR' })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        personal_city: 'Paris',
        personal_line1: 'Address First Line',
        personal_postal_code: '75001',
        company_city: 'Paris',
        company_line1: 'Address First Line',
        company_postal_code: '75001',
        business_name: 'Company',
        business_tax_id: '8',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      await testEachFieldAsNull(req)
    })

    it('should update FR information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'FR' })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        personal_city: 'Paris',
        personal_line1: 'Address First Line',
        personal_postal_code: '75001',
        company_city: 'Paris',
        company_line1: 'Address First Line',
        company_postal_code: '75001',
        business_name: 'Company',
        business_tax_id: '8',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should reject GB invalid fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'GB' })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        personal_city: 'London',
        personal_line1: 'Address First Line',
        personal_postal_code: 'EC1A 1AA',
        company_city: 'London',
        company_line1: 'Address First Line',
        company_postal_code: 'EC1A 1AA',
        business_name: 'Company',
        business_tax_id: '8',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      await testEachFieldAsNull(req)
    })

    it('should update GB information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'GB' })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        personal_city: 'London',
        personal_line1: 'Address First Line',
        personal_postal_code: 'EC1A 1AA',
        company_city: 'London',
        company_line1: 'Address First Line',
        company_postal_code: 'EC1A 1AA',
        business_name: 'Company',
        business_tax_id: '8',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should reject HK invalid fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'HK' })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        personal_city: 'Hong Kong',
        personal_line1: 'Address First Line',
        company_city: 'Hong Kong',
        company_line1: 'Address First Line',
        business_name: 'Company',
        business_tax_id: '8',
        personal_id_number: '7',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Hongkonger',
        last_name: 'Person'
      }
      await testEachFieldAsNull(req)
    })

    it('should update HK information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'HK' })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        personal_city: 'Hong Kong',
        personal_line1: 'Address First Line',
        company_city: 'Hong Kong',
        company_line1: 'Address First Line',
        business_name: 'Company',
        business_tax_id: '8',
        personal_id_number: '7',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Hongkonger',
        last_name: 'Person'
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should reject IE invalid fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'IE' })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        personal_city: 'Dublin',
        personal_line1: 'Address First Line',
        personal_state: 'Dublin',
        company_city: 'Dublin',
        company_state: 'Dublin',
        company_line1: 'Address First Line',
        business_name: 'Company',
        business_tax_id: '8',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      await testEachFieldAsNull(req)
    })

    it('should update IE information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'IE' })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        personal_city: 'Dublin',
        personal_line1: 'Address First Line',
        personal_state: 'Dublin',
        company_city: 'Dublin',
        company_state: 'Dublin',
        company_line1: 'Address First Line',
        business_name: 'Company',
        business_tax_id: '8',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should reject IT invalid fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'IT' })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        personal_city: 'Rome',
        personal_line1: 'Address First Line',
        personal_postal_code: '00010',
        company_city: 'Rome',
        company_line1: 'Address First Line',
        company_postal_code: '00010',
        business_name: 'Company',
        business_tax_id: '8',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      await testEachFieldAsNull(req)
    })

    it('should update IT information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'IT' })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        personal_city: 'Rome',
        personal_line1: 'Address First Line',
        personal_postal_code: '00010',
        company_city: 'Rome',
        company_line1: 'Address First Line',
        company_postal_code: '00010',
        business_name: 'Company',
        business_tax_id: '8',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should reject JP invalid fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'JP' })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        day: '1',
        month: '1',
        year: '1950',
        gender: 'female',
        first_name_kana: 'ﾄｳｷﾖｳﾄ',
        last_name_kana: 'ﾄｳｷﾖｳﾄ',
        first_name_kanji: '東京都',
        last_name_kanji: '東京都',
        phone_number: '0859-076500',
        business_name: 'Company',
        business_name_kana: 'ﾄｳｷﾖｳﾄ',
        business_name_kanji: '東京都',
        business_tax_id: '8',
        company_postal_code_kana: '1500001',
        company_state_kana: 'ﾄｳｷﾖｳﾄ',
        company_city_kana: 'ｼﾌﾞﾔ',
        company_town_kana: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        company_line1_kana: '27-15',
        company_postal_code_kanji: '１５００００１',
        company_state_kanji: '東京都',
        company_city_kanji: '渋谷区',
        company_town_kanji: '神宮前　３丁目',
        company_line1_kanji: '２７－１５',
        personal_state_kana: 'ﾄｳｷﾖｳﾄ',
        personal_city_kana: 'ｼﾌﾞﾔ',
        personal_town_kana: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        personal_line1_kana: '27-15',
        personal_postal_code_kana: '1500001',
        personal_postal_code_kanji: '１５００００１',
        personal_state_kanji: '東京都',
        personal_city_kanji: '渋谷区',
        personal_town_kanji: '神宮前　３丁目',
        personal_line1_kanji: '２７－１５'
      }
      await testEachFieldAsNull(req)
    })

    it('should update JP information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'JP' })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        day: '1',
        month: '1',
        year: '1950',
        gender: 'female',
        first_name_kana: 'ﾄｳｷﾖｳﾄ',
        last_name_kana: 'ﾄｳｷﾖｳﾄ',
        first_name_kanji: '東京都',
        last_name_kanji: '東京都',
        phone_number: '0859-076500',
        business_name: 'Company',
        business_name_kana: 'ﾄｳｷﾖｳﾄ',
        business_name_kanji: '東京都',
        business_tax_id: '8',
        company_postal_code_kana: '1500001',
        company_state_kana: 'ﾄｳｷﾖｳﾄ',
        company_city_kana: 'ｼﾌﾞﾔ',
        company_town_kana: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        company_line1_kana: '27-15',
        company_postal_code_kanji: '１５００００１',
        company_state_kanji: '東京都',
        company_city_kanji: '渋谷区',
        company_town_kanji: '神宮前　３丁目',
        company_line1_kanji: '２７－１５',
        personal_state_kana: 'ﾄｳｷﾖｳﾄ',
        personal_city_kana: 'ｼﾌﾞﾔ',
        personal_town_kana: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        personal_line1_kana: '27-15',
        personal_postal_code_kana: '1500001',
        personal_postal_code_kanji: '１５００００１',
        personal_state_kanji: '東京都',
        personal_city_kanji: '渋谷区',
        personal_town_kanji: '神宮前　３丁目',
        personal_line1_kanji: '２７－１５'
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should reject LU invalid fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'LU' })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        personal_city: 'Luxemburg',
        personal_line1: 'Address First Line',
        personal_postal_code: '1623',
        company_city: 'Luxemburg',
        company_line1: 'Address First Line',
        company_postal_code: '1623',
        business_name: 'Company',
        business_tax_id: '8',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      await testEachFieldAsNull(req)
    })

    it('should update LU information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'LU' })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        personal_city: 'Luxemburg',
        personal_line1: 'Address First Line',
        personal_postal_code: '1623',
        company_city: 'Luxemburg',
        company_line1: 'Address First Line',
        company_postal_code: '1623',
        business_name: 'Company',
        business_tax_id: '8',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should reject NL invalid fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'NL' })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        personal_city: 'Amsterdam',
        personal_line1: 'Address First Line',
        personal_postal_code: '1071 JA',
        company_city: 'Amsterdam',
        company_line1: 'Address First Line',
        company_postal_code: '1071 JA',
        business_name: 'Company',
        business_tax_id: '8',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      await testEachFieldAsNull(req)
    })

    it('should update NL information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'NL' })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        personal_city: 'Amsterdam',
        personal_line1: 'Address First Line',
        personal_postal_code: '1071 JA',
        company_city: 'Amsterdam',
        company_line1: 'Address First Line',
        company_postal_code: '1071 JA',
        business_name: 'Company',
        business_tax_id: '8',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should reject NO invalid fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'NO' })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        personal_city: 'Oslo',
        personal_line1: 'Address First Line',
        personal_postal_code: '0001',
        company_city: 'Oslo',
        company_line1: 'Address First Line',
        company_postal_code: '0001',
        business_name: 'Company',
        business_tax_id: '8',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      await testEachFieldAsNull(req)
    })

    it('should update NO information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'NO' })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        personal_city: 'Oslo',
        personal_line1: 'Address First Line',
        personal_postal_code: '0001',
        company_city: 'Oslo',
        company_line1: 'Address First Line',
        company_postal_code: '0001',
        business_name: 'Company',
        business_tax_id: '8',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should reject NZ invalid fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'NZ' })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_city: 'Auckland',
        company_line1: 'Address First Line',
        company_postal_code: '6011',
        business_name: 'Company',
        business_tax_id: '8',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      await testEachFieldAsNull(req)
    })

    it('should update NZ information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'NZ' })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        company_city: 'Auckland',
        company_line1: 'Address First Line',
        company_postal_code: '6011',
        business_name: 'Company',
        business_tax_id: '8',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should reject PT invalid fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'PT' })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        personal_city: 'Lisbon',
        personal_line1: 'Address First Line',
        personal_postal_code: '4520',
        company_city: 'Lisbon',
        company_line1: 'Address First Line',
        company_postal_code: '4520',
        business_name: 'Company',
        business_tax_id: '8',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      await testEachFieldAsNull(req)
    })

    it('should update PT information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'PT' })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        personal_city: 'Lisbon',
        personal_line1: 'Address First Line',
        personal_postal_code: '4520',
        company_city: 'Lisbon',
        company_line1: 'Address First Line',
        company_postal_code: '4520',
        business_name: 'Company',
        business_tax_id: '8',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should reject SE invalid fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'SE' })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        personal_city: 'Stockholm',
        personal_line1: 'Address First Line',
        personal_postal_code: '00150',
        company_city: 'Stockholm',
        company_line1: 'Address First Line',
        company_postal_code: '00150',
        business_name: 'Company',
        business_tax_id: '8',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      await testEachFieldAsNull(req)
    })

    it('should update SE information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'SE' })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        personal_city: 'Stockholm',
        personal_line1: 'Address First Line',
        personal_postal_code: '00150',
        company_city: 'Stockholm',
        company_line1: 'Address First Line',
        company_postal_code: '00150',
        business_name: 'Company',
        business_tax_id: '8',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'Person',
        last_name: 'Person'
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    // these tests only work if your Stripe account is SG
    // it('should reject SG invalid fields', async () => {
    //   const user = await TestHelper.createUser()
    //   await TestHelper.createStripeAccount(user, { type: 'company', country: 'SG' })
    //   const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
    //   req.account = user.account
    //   req.session = user.session
    //   req.body = {
    //     personal_line1: 'Address First Line',
    //     personal_postal_code: '339696',
    //     company_line1: 'Address First Line',
    //     company_postal_code: '339696',
    //     business_name: 'Company',
    //     business_tax_id: '8',
    //     personal_id_number: '7',
    //     day: '1',
    //     month: '1',
    //     year: '1950',
    //     first_name: 'Singaporean',
    //     last_name: 'Person'
    //   }
    //   await testEachFieldAsNull(req)
    // })

    // it('should update SG information', async () => {
    //   const user = await TestHelper.createUser()
    //   await TestHelper.createStripeAccount(user, { type: 'company', country: 'SG' })
    //   const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
    //   req.account = user.account
    //   req.session = user.session
    //   req.body = {
    //     personal_line1: 'Address First Line',
    //     personal_postal_code: '339696',
    //     company_line1: 'Address First Line',
    //     company_postal_code: '339696',
    //     business_name: 'Company',
    //     business_tax_id: '8',
    //     personal_id_number: '7',
    //     day: '1',
    //     month: '1',
    //     year: '1950',
    //     first_name: 'Singaporean',
    //     last_name: 'Person'
    //   }
    //   const page = await req.post()
    //   const doc = TestHelper.extractDoc(page)
    //   const messageContainer = doc.getElementById('message-container')
    //   const message = messageContainer.child[0]
    //   assert.strictEqual(message.attr.template, 'success')
    // })

    it('should reject US invalid fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'US' })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        business_name: 'Company',
        business_tax_id: '8',
        company_city: 'New York City',
        company_line1: 'Address First Line',
        company_postal_code: '10001',
        company_state: 'NY',
        personal_id_number: '123451234',
        ssn_last_4: '1234',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'American',
        last_name: 'Person'
      }
      await testEachFieldAsNull(req)
    })

    it('should update US information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'US' })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        business_name: 'Company',
        business_tax_id: '8',
        company_city: 'New York City',
        company_line1: 'Address First Line',
        company_postal_code: '10001',
        company_state: 'NY',
        personal_id_number: '123451234',
        ssn_last_4: '1234',
        day: '1',
        month: '1',
        year: '1950',
        first_name: 'American',
        last_name: 'Person'
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })
  })
})
