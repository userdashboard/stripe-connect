/* eslint-env mocha */
const assert = require('assert')
const connect = require('../../../../index.js')
const TestHelper = require('../../../../test-helper.js')

describe('/account/connect/edit-company-registration', () => {
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
        country: 'US',
        type: 'individual'
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
  })

  describe('EditCompanyRegistration#GET', () => {
    async function testRequiredFieldInputsExist (req, stripeAccount) {
      const fieldsNeeded = connect.kycRequirements[stripeAccount.country].company
      const page = await req.get()
      const doc = TestHelper.extractDoc(page)
      for (const field of fieldsNeeded) {
        const input = doc.getElementById(field.split('.').join('_'))
        assert.notStrictEqual(input.tag, undefined)
        assert.notStrictEqual(input.tag, null)
      }
    }

    it('should present the form', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'AU',
        type: 'company'
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
        country: 'AT',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have AU-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'AU',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have BE-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'BE',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have CA-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'CA',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have CH-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'CH',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have DE-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'DE',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have DK-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'DK',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have ES-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'ES',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have FI-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'FI',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have FR-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'FR',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have GB-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'GB',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have HK-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'HK',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have IE-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'IE',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have IT-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'IT',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have JP-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'JP',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have LU-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'LU',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have NL-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'NL',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have NO-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'NO',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have NZ-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'NZ',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have PT-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'PT',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have SE-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'SE',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have SG-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'SG',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have US-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })
  })

  describe('EditCompanyRegistration#POST', () => {
    async function testEachFieldAsNull (req) {
      const body = req.body
      const uploads = req.uploads
      let fields = Object.keys(body)
      if (uploads) {
        fields = fields.concat(Object.keys(uploads))
      }
      for (const field of fields) {
        if (uploads) {
          req.uploads = {}
          for (const file in uploads) {
            req.uploads[file] = uploads[file]
          }
        }
        req.body = JSON.parse(JSON.stringify(body))
        if (req.body[field]) {
          req.body[field] = ''
        }
        if (req.uploads && req.uploads[field]) {
          delete (req.uploads[field])
        }
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
        country: 'AU',
        type: 'company'
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
        country: 'AT',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
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
        company_tax_id: '00000000000'
      }
      await testEachFieldAsNull(req)
    })

    it('should update AT information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'AT',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
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
        company_tax_id: '00000000000'
      }
      req.filename = __filename
      req.screenshots = [
        { hover: '#account-menu-container' },
        { click: '/account/stripe-connect' },
        { click: '/account/stripe-connect/stripe-accounts' },
        { click: `/account/stripe-connect/stripe-account?stripeid=${user.stripeAccount.id}` },
        { click: `/account/stripe-connect/edit-company-registration?stripeid=${user.stripeAccount.id}` },
        { fill: '#submit-form' }
      ]
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const redirectURL = TestHelper.extractRedirectURL(doc)
      assert.strictEqual(redirectURL, `/account/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
    })

    it('should reject AU invalid fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'AU',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        company_address_city: 'Brisbane',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '4000',
        company_address_state: 'QLD',
        company_name: 'Company',
        company_phone: '456-789-0123',
        company_tax_id: '00000000000'
      }
      await testEachFieldAsNull(req)
    })

    it('should update AU information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'AU',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        company_address_city: 'Brisbane',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '4000',
        company_address_state: 'QLD',
        company_name: 'Company',
        company_phone: '456-789-0123',
        company_tax_id: '00000000000'
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const redirectURL = TestHelper.extractRedirectURL(doc)
      assert.strictEqual(redirectURL, `/account/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
    })

    it('should reject BE invalid fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'BE',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
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
      await testEachFieldAsNull(req)
    })

    it('should update BE information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'BE',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
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
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const redirectURL = TestHelper.extractRedirectURL(doc)
      assert.strictEqual(redirectURL, `/account/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
    })

    it('should reject CA invalid fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'CA',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        company_address_city: 'Vancouver',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: 'V5K 0A1',
        company_address_state: 'BC',
        company_name: 'Company',
        company_phone: '456-789-0123',
        company_tax_id: '00000000000'
      }
      await testEachFieldAsNull(req)
    })

    it('should update CA information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'CA',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        company_address_city: 'Vancouver',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: 'V5K 0A1',
        company_address_state: 'BC',
        company_name: 'Company',
        company_phone: '456-789-0123',
        company_tax_id: '00000000000'
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const redirectURL = TestHelper.extractRedirectURL(doc)
      assert.strictEqual(redirectURL, `/account/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
    })

    it('should reject CH invalid fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'CH',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        company_address_city: 'Bern',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '1020',
        company_address_state: 'BE',
        company_name: 'Company',
        company_phone: '456-789-0123',
        company_tax_id: '00000000000'
      }
      await testEachFieldAsNull(req)
    })

    it('should update CH information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'CH',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        company_address_city: 'Bern',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '1020',
        company_address_state: 'BE',
        company_name: 'Company',
        company_phone: '456-789-0123',
        company_tax_id: '00000000000'
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const redirectURL = TestHelper.extractRedirectURL(doc)
      assert.strictEqual(redirectURL, `/account/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
    })

    it('should reject DE invalid fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'DE',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        company_address_city: 'Berlin',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '01067',
        company_address_state: 'BE',
        company_name: 'Company',
        company_phone: '456-789-0123',
        company_tax_id: '00000000000'
      }
      await testEachFieldAsNull(req)
    })

    it('should update DE information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'DE',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        company_address_city: 'Berlin',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '01067',
        company_address_state: 'BE',
        company_name: 'Company',
        company_phone: '456-789-0123',
        company_tax_id: '00000000000'
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const redirectURL = TestHelper.extractRedirectURL(doc)
      assert.strictEqual(redirectURL, `/account/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
    })

    it('should reject DK invalid fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'DK',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        company_address_city: 'Copenhagen',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '1000',
        company_address_state: '147',
        company_name: 'Company',
        company_phone: '456-789-0123',
        company_tax_id: '00000000000'
      }
      await testEachFieldAsNull(req)
    })

    it('should update DK information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'DK',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        company_address_city: 'Copenhagen',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '1000',
        company_address_state: '147',
        company_name: 'Company',
        company_phone: '456-789-0123',
        company_tax_id: '00000000000'
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const redirectURL = TestHelper.extractRedirectURL(doc)
      assert.strictEqual(redirectURL, `/account/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
    })

    it('should reject ES invalid fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'ES',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        company_address_city: 'Madrid',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '03179',
        company_address_state: 'AN',
        company_name: 'Company',
        company_phone: '456-789-0123',
        company_tax_id: '00000000000'
      }
      await testEachFieldAsNull(req)
    })

    it('should update ES information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'ES',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        company_address_city: 'Madrid',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '03179',
        company_address_state: 'AN',
        company_name: 'Company',
        company_phone: '456-789-0123',
        company_tax_id: '00000000000'
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const redirectURL = TestHelper.extractRedirectURL(doc)
      assert.strictEqual(redirectURL, `/account/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
    })

    it('should reject FI invalid fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'FI',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        company_address_city: 'Helsinki',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '00990',
        company_address_state: 'AL',
        company_name: 'Company',
        company_phone: '456-789-0123',
        company_tax_id: '00000000000'
      }
      await testEachFieldAsNull(req)
    })

    it('should update FI information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'FI',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        company_address_city: 'Helsinki',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '00990',
        company_address_state: 'AL',
        company_name: 'Company',
        company_phone: '456-789-0123',
        company_tax_id: '00000000000'
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const redirectURL = TestHelper.extractRedirectURL(doc)
      assert.strictEqual(redirectURL, `/account/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
    })

    it('should reject FR invalid fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'FR',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        company_address_city: 'Paris',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '75001',
        company_address_state: 'A',
        company_name: 'Company',
        company_phone: '456-789-0123',
        company_tax_id: '00000000000'
      }
      await testEachFieldAsNull(req)
    })

    it('should update FR information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'FR',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        company_address_city: 'Paris',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '75001',
        company_address_state: 'A',
        company_name: 'Company',
        company_phone: '456-789-0123',
        company_tax_id: '00000000000'
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const redirectURL = TestHelper.extractRedirectURL(doc)
      assert.strictEqual(redirectURL, `/account/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
    })

    it('should reject GB invalid fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'GB',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        company_address_city: 'London',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: 'EC1A 1AA',
        company_address_state: 'LND',
        company_name: 'Company',
        company_phone: '456-789-0123',
        company_tax_id: '00000000000'
      }
      req.uploads = {
        company_verification_document_back: TestHelper['success_id_scan_back.png'],
        company_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      await testEachFieldAsNull(req)
    })

    it('should update GB information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'GB',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        company_address_city: 'London',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: 'EC1A 1AA',
        company_address_state: 'LND',
        company_name: 'Company',
        company_phone: '456-789-0123',
        company_tax_id: '00000000000'
      }
      req.uploads = {
        company_verification_document_back: TestHelper['success_id_scan_back.png'],
        company_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const redirectURL = TestHelper.extractRedirectURL(doc)
      assert.strictEqual(redirectURL, `/account/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
    })

    it('should reject HK invalid fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'HK',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        company_address_city: 'Hong Kong',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '00000',
        company_address_state: 'HK',
        company_name: 'Company',
        company_phone: '456-789-0234',
        company_tax_id: '00000000000'
      }
      await testEachFieldAsNull(req)
    })

    it('should update HK information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'HK',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        company_address_city: 'Hong Kong',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '00000',
        company_address_state: 'HK',
        company_name: 'Company',
        company_phone: '456-789-0234',
        company_tax_id: '00000000000'
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const redirectURL = TestHelper.extractRedirectURL(doc)
      assert.strictEqual(redirectURL, `/account/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
    })

    it('should reject IE invalid fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'IE',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        company_address_city: 'Dublin',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: 'Dublin 1',
        company_address_state: 'D',
        company_name: 'Company',
        company_phone: '456-789-0123',
        company_tax_id: '00000000000'
      }
      await testEachFieldAsNull(req)
    })

    it('should update IE information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'IE',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        company_address_city: 'Dublin',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: 'Dublin 1',
        company_address_state: 'D',
        company_name: 'Company',
        company_phone: '456-789-0123',
        company_tax_id: '00000000000'
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const redirectURL = TestHelper.extractRedirectURL(doc)
      assert.strictEqual(redirectURL, `/account/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
    })

    it('should reject IT invalid fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'IT',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        company_address_city: 'Rome',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '00010',
        company_address_state: '65',
        company_name: 'Company',
        company_phone: '456-789-0123',
        company_tax_id: '00000000000'
      }
      await testEachFieldAsNull(req)
    })

    it('should update IT information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'IT',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        company_address_city: 'Rome',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '00010',
        company_address_state: '65',
        company_name: 'Company',
        company_phone: '456-789-0123',
        company_tax_id: '00000000000'
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const redirectURL = TestHelper.extractRedirectURL(doc)
      assert.strictEqual(redirectURL, `/account/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
    })

    it('should reject JP invalid fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'JP',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
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
      await testEachFieldAsNull(req)
    })

    it('should update JP information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'JP',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
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
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const redirectURL = TestHelper.extractRedirectURL(doc)
      assert.strictEqual(redirectURL, `/account/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
    })

    it('should reject LU invalid fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'LU',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        company_address_city: 'Luxemburg',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '1623',
        company_address_state: 'L',
        company_name: 'Company',
        company_phone: '456-789-0123',
        company_tax_id: '00000000000'
      }
      await testEachFieldAsNull(req)
    })

    it('should update LU information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'LU',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        company_address_city: 'Luxemburg',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '1623',
        company_address_state: 'L',
        company_name: 'Company',
        company_phone: '456-789-0123',
        company_tax_id: '00000000000'
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const redirectURL = TestHelper.extractRedirectURL(doc)
      assert.strictEqual(redirectURL, `/account/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
    })

    it('should reject NL invalid fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'NL',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        company_address_city: 'Amsterdam',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '1071 JA',
        company_address_state: 'DR',
        company_name: 'Company',
        company_phone: '456-789-0123',
        company_tax_id: '00000000000'
      }
      await testEachFieldAsNull(req)
    })

    it('should update NL information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'NL',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        company_address_city: 'Amsterdam',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '1071 JA',
        company_address_state: 'DR',
        company_name: 'Company',
        company_phone: '456-789-0123',
        company_tax_id: '00000000000'
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const redirectURL = TestHelper.extractRedirectURL(doc)
      assert.strictEqual(redirectURL, `/account/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
    })

    it('should reject NO invalid fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'NO',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        company_address_city: 'Oslo',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '0001',
        company_address_state: '02',
        company_name: 'Company',
        company_phone: '456-789-0123',
        company_tax_id: '00000000000'
      }
      await testEachFieldAsNull(req)
    })

    it('should update NO information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'NO',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        company_address_city: 'Oslo',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '0001',
        company_address_state: '02',
        company_name: 'Company',
        company_phone: '456-789-0123',
        company_tax_id: '00000000000'
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const redirectURL = TestHelper.extractRedirectURL(doc)
      assert.strictEqual(redirectURL, `/account/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
    })

    it('should reject NZ invalid fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'NZ',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        company_address_city: 'Auckland',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '6011',
        company_address_state: 'N',
        company_name: 'Company',
        company_phone: '456-789-0123',
        company_tax_id: '00000000000'
      }
      req.uploads = {
        company_verification_document_back: TestHelper['success_id_scan_back.png'],
        company_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      await testEachFieldAsNull(req)
    })

    it('should update NZ information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'NZ',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        company_address_city: 'Auckland',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '6011',
        company_address_state: 'N',
        company_name: 'Company',
        company_phone: '456-789-0123',
        company_tax_id: '00000000000'
      }
      req.uploads = {
        company_verification_document_back: TestHelper['success_id_scan_back.png'],
        company_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const redirectURL = TestHelper.extractRedirectURL(doc)
      assert.strictEqual(redirectURL, `/account/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
    })

    it('should reject PT invalid fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'PT',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        company_address_city: 'Lisbon',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '4520',
        company_address_state: '01',
        company_name: 'Company',
        company_phone: '456-789-0123',
        company_tax_id: '00000000000'
      }
      await testEachFieldAsNull(req)
    })

    it('should update PT information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'PT',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        company_address_city: 'Lisbon',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '4520',
        company_address_state: '01',
        company_name: 'Company',
        company_phone: '456-789-0123',
        company_tax_id: '00000000000'
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const redirectURL = TestHelper.extractRedirectURL(doc)
      assert.strictEqual(redirectURL, `/account/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
    })

    it('should reject SE invalid fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'SE',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        company_address_city: 'Stockholm',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '00150',
        company_address_state: 'K',
        company_name: 'Company',
        company_phone: '456-789-0123',
        company_tax_id: '00000000000'
      }
      await testEachFieldAsNull(req)
    })

    it('should update SE information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'SE',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        company_address_city: 'Stockholm',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '00150',
        company_address_state: 'K',
        company_name: 'Company',
        company_phone: '456-789-0123',
        company_tax_id: '00000000000'
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const redirectURL = TestHelper.extractRedirectURL(doc)
      assert.strictEqual(redirectURL, `/account/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
    })

    it('should reject SG invalid fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'SG',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        company_address_city: 'Singapore',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '339696',
        company_address_state: 'SG',
        company_name: 'Company',
        company_phone: '456-789-0123',
        company_tax_id: '00000000000'
      }
      await testEachFieldAsNull(req)
    })

    it('should update SG information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'SG',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        business_profile_mcc: '8931',
        business_profile_url: 'https://' + user.profile.contactEmail.split('@')[1],
        company_address_city: 'Singapore',
        company_address_line1: '123 Park Lane',
        company_address_postal_code: '339696',
        company_address_state: 'SG',
        company_name: 'Company',
        company_phone: '456-789-0123',
        company_tax_id: '00000000000'
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const redirectURL = TestHelper.extractRedirectURL(doc)
      assert.strictEqual(redirectURL, `/account/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
    })

    it('should reject US invalid fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
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
      await testEachFieldAsNull(req)
    })

    it('should update US information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-registration?stripeid=${user.stripeAccount.id}`)
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
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const redirectURL = TestHelper.extractRedirectURL(doc)
      assert.strictEqual(redirectURL, `/account/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
    })
  })
})
