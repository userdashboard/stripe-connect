/* eslint-env mocha */
const assert = require('assert')
const connect = require('../../../../index.js')
const TestHelper = require('../../../../test-helper.js')

describe('/account/connect/edit-company-representative', () => {
  describe('EditCompanyRepresentative#BEFORE', () => {
    it('should reject invalid registration', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/account/connect/edit-company-representative?stripeid=invalid')
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
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
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

  describe('EditCompanyRepresentative#GET', () => {
    async function testRequiredFieldInputsExist (req, stripeAccount) {
      const fieldsNeeded = connect.kycRequirements[stripeAccount.country].companyRepresentative
      const page = await req.get()
      const doc = TestHelper.extractDoc(page)
      for (const field of fieldsNeeded) {
        if (field === 'relationship.representative.gender') {
          const female = doc.getElementById('female')
          assert.notStrictEqual(female.tag, undefined)
          assert.notStrictEqual(female.tag, null)
          const male = doc.getElementById('male')
          assert.notStrictEqual(male.tag, undefined)
          assert.notStrictEqual(male.tag, null)
          continue
        }
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
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
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
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
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
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
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
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
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
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
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
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
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
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
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
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
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
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
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
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
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
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
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
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
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
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
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
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
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
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
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
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
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
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
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
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
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
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
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
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
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
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
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
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
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
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
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
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })
  })

  describe('EditCompanyRepresentative#POST', () => {
    async function testEachFieldAsNull (req) {
      const body = req.body
      const uploads = req.uploads
      let fields = Object.keys(body)
      if (uploads) {
        fields = fields.concat(Object.keys(uploads))
      }
      for (const field of fields) {
        if (field.endsWith('_executive') ||
            field.endsWith('_director') ||
            field.endsWith('_title')) {
          continue
        }
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

    it('should refresh and load states for posted personal address', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'NZ',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_representative_address_country: 'AU'
      }

      req.button = 'Reload states'
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      assert.strictEqual(doc.toString().indexOf('QLD') > -1, true)
    })

    it('should reject AT invalid fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'AT',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_representative_address_city: 'Vienna',
        relationship_representative_address_country: 'AT',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: '1020',
        relationship_representative_address_state: '1',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }
      req.uploads = {
        relationship_representative_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      await testEachFieldAsNull(req)
    })

    it('should update AT information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'AT',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_representative_address_city: 'Vienna',
        relationship_representative_address_country: 'AT',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: '1020',
        relationship_representative_address_state: '1',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }
      req.uploads = {
        relationship_representative_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      req.filename = __filename
      req.screenshots = [
        { hover: '#account-menu-container' },
        { click: '/account/stripe-connect' },
        { click: '/account/stripe-connect/stripe-accounts' },
        { click: `/account/stripe-connect/stripe-account?stripeid=${user.stripeAccount.id}` },
        { click: `/account/stripe-connect/edit-company-representative?stripeid=${user.stripeAccount.id}` },
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
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_representative_address_city: 'Brisbane',
        relationship_representative_address_country: 'AU',
        relationship_representative_address_line1: '845 Oxford St',
        relationship_representative_address_postal_code: '4000',
        relationship_representative_address_state: 'QLD',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }
      req.uploads = {
        relationship_representative_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      await testEachFieldAsNull(req)
    })

    it('should update AU information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'AU',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_representative_address_city: 'Brisbane',
        relationship_representative_address_country: 'AU',
        relationship_representative_address_line1: '845 Oxford St',
        relationship_representative_address_postal_code: '4000',
        relationship_representative_address_state: 'QLD',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }
      req.uploads = {
        relationship_representative_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
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
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_representative_address_city: 'Brussels',
        relationship_representative_address_country: 'BE',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: '1020',
        relationship_representative_address_state: 'BRU',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }
      req.uploads = {
        relationship_representative_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      await testEachFieldAsNull(req)
    })

    it('should update BE information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'BE',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_representative_address_city: 'Brussels',
        relationship_representative_address_country: 'BE',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: '1020',
        relationship_representative_address_state: 'BRU',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }
      req.uploads = {
        relationship_representative_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
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
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_representative_address_city: 'Vancouver',
        relationship_representative_address_country: 'CA',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: 'V5K 0A1',
        relationship_representative_address_state: 'BC',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_id_number: '000000000',
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }
      req.uploads = {
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      await testEachFieldAsNull(req)
    })

    it('should update CA information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'CA',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_representative_address_city: 'Vancouver',
        relationship_representative_address_country: 'CA',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: 'V5K 0A1',
        relationship_representative_address_state: 'BC',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_id_number: '000000000',
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_percent_ownership: '0',
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }
      req.uploads = {
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
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
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_representative_address_city: 'Bern',
        relationship_representative_address_country: 'CH',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: '1020',
        relationship_representative_address_state: 'BE',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }
      req.uploads = {
        relationship_representative_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      await testEachFieldAsNull(req)
    })

    it('should update CH information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'CH',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_representative_address_city: 'Bern',
        relationship_representative_address_country: 'CH',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: '1020',
        relationship_representative_address_state: 'BE',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }
      req.uploads = {
        relationship_representative_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
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
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_representative_address_city: 'Berlin',
        relationship_representative_address_country: 'DE',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: '01067',
        relationship_representative_address_state: 'BE',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }
      req.uploads = {
        relationship_representative_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      await testEachFieldAsNull(req)
    })

    it('should update DE information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'DE',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_representative_address_city: 'Berlin',
        relationship_representative_address_country: 'DE',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: '01067',
        relationship_representative_address_state: 'BE',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }
      req.uploads = {
        relationship_representative_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
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
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_representative_address_city: 'Copenhagen',
        relationship_representative_address_country: 'DK',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: '1000',
        relationship_representative_address_state: '147',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }
      req.uploads = {
        relationship_representative_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      await testEachFieldAsNull(req)
    })

    it('should update DK information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'DK',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_representative_address_city: 'Copenhagen',
        relationship_representative_address_country: 'DK',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: '1000',
        relationship_representative_address_state: '147',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }
      req.uploads = {
        relationship_representative_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const redirectURL = TestHelper.extractRedirectURL(doc)
      assert.strictEqual(redirectURL, `/account/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
    })

    it('should reject EE invalid fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'EE',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_representative_address_city: 'Tallinn',
        relationship_representative_address_country: 'EE',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: '10128',
        relationship_representative_address_state: '37',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }
      req.uploads = {
        relationship_representative_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      await testEachFieldAsNull(req)
    })

    it('should update EE information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'EE',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_representative_address_city: 'Tallinn',
        relationship_representative_address_country: 'EE',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: '10128',
        relationship_representative_address_state: '37',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }
      req.uploads = {
        relationship_representative_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
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
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_representative_address_city: 'Madrid',
        relationship_representative_address_country: 'ES',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: '03179',
        relationship_representative_address_state: 'AN',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }
      req.uploads = {
        relationship_representative_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      await testEachFieldAsNull(req)
    })

    it('should update ES information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'ES',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_representative_address_city: 'Madrid',
        relationship_representative_address_country: 'ES',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: '03179',
        relationship_representative_address_state: 'AN',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }
      req.uploads = {
        relationship_representative_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
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
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_representative_address_city: 'Helsinki',
        relationship_representative_address_country: 'FI',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: '00990',
        relationship_representative_address_state: 'AL',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }
      req.uploads = {
        relationship_representative_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      await testEachFieldAsNull(req)
    })

    it('should update FI information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'FI',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_representative_address_city: 'Helsinki',
        relationship_representative_address_country: 'FI',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: '00990',
        relationship_representative_address_state: 'AL',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }
      req.uploads = {
        relationship_representative_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
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
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_representative_address_city: 'Paris',
        relationship_representative_address_country: 'FR',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: '75001',
        relationship_representative_address_state: 'A',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }
      req.uploads = {
        relationship_representative_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      await testEachFieldAsNull(req)
    })

    it('should update FR information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'FR',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_representative_address_city: 'Paris',
        relationship_representative_address_country: 'FR',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: '75001',
        relationship_representative_address_state: 'A',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }
      req.uploads = {
        relationship_representative_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
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
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_representative_address_city: 'London',
        relationship_representative_address_country: 'GB',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: 'EC1A 1AA',
        relationship_representative_address_state: 'LND',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }
      req.uploads = {
        relationship_representative_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      await testEachFieldAsNull(req)
    })

    it('should update GB information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'GB',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_representative_address_city: 'London',
        relationship_representative_address_country: 'GB',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: 'EC1A 1AA',
        relationship_representative_address_state: 'LND',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }
      req.uploads = {
        relationship_representative_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
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
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_representative_address_city: 'Hong Kong',
        relationship_representative_address_country: 'HK',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: '999077',
        relationship_representative_address_state: 'HK',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_id_number: '000000000',
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }
      req.uploads = {
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      await testEachFieldAsNull(req)
    })

    it('should update HK information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'HK',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_representative_address_city: 'Hong Kong',
        relationship_representative_address_country: 'HK',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: '999077',
        relationship_representative_address_state: 'HK',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_id_number: '000000000',
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_percent_ownership: '0',
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }
      req.uploads = {
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
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
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_representative_address_city: 'Dublin',
        relationship_representative_address_country: 'IE',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: 'Dublin 1',
        relationship_representative_address_state: 'D',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }
      await testEachFieldAsNull(req)
    })

    it('should update IE information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'IE',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_representative_address_city: 'Dublin',
        relationship_representative_address_country: 'IE',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: 'Dublin 1',
        relationship_representative_address_state: 'D',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }
      req.uploads = {
        relationship_representative_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
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
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_representative_address_city: 'Rome',
        relationship_representative_address_country: 'IT',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: '00010',
        relationship_representative_address_state: '65',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }
      req.uploads = {
        relationship_representative_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      await testEachFieldAsNull(req)
    })

    it('should update IT information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'IT',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_representative_address_city: 'Rome',
        relationship_representative_address_country: 'IT',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: '00010',
        relationship_representative_address_state: '65',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }
      req.uploads = {
        relationship_representative_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
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
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_representative_address_kana_city: 'ｼﾌﾞﾔ',
        relationship_representative_address_kana_line1: '27-15',
        relationship_representative_address_kana_postal_code: '1500001',
        relationship_representative_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        relationship_representative_address_kanji_city: '渋谷区',
        relationship_representative_address_kanji_line1: '２７－１５',
        relationship_representative_address_kanji_postal_code: '1500001',
        relationship_representative_address_kanji_state: '東京都',
        relationship_representative_address_kanji_town: '神宮前　３丁目',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_first_name_kana: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_first_name_kanji: '東京都',
        relationship_representative_gender: 'female',
        relationship_representative_last_name_kana: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_last_name_kanji: '東京都',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }
      req.uploads = {
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      await testEachFieldAsNull(req)
    })

    it('should update JP information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'JP',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_representative_address_kana_city: 'ｼﾌﾞﾔ',
        relationship_representative_address_kana_line1: '27-15',
        relationship_representative_address_kana_postal_code: '1500001',
        relationship_representative_address_kana_state: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        relationship_representative_address_kanji_city: '渋谷区',
        relationship_representative_address_kanji_line1: '２７－１５',
        relationship_representative_address_kanji_postal_code: '1500001',
        relationship_representative_address_kanji_state: '東京都',
        relationship_representative_address_kanji_town: '神宮前　３丁目',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name_kana: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_first_name_kanji: '東京都',
        relationship_representative_gender: 'female',
        relationship_representative_last_name_kana: 'ﾄｳｷﾖｳﾄ',
        relationship_representative_last_name_kanji: '東京都',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }
      req.uploads = {
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const redirectURL = TestHelper.extractRedirectURL(doc)
      assert.strictEqual(redirectURL, `/account/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
    })

    it('should reject LT invalid fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'LT',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_representative_address_city: 'Vilnius',
        relationship_representative_address_country: 'LT',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: 'LT-00000',
        relationship_representative_address_state: 'AL',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }
      req.uploads = {
        relationship_representative_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      await testEachFieldAsNull(req)
    })

    it('should update LT information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'LT',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_representative_address_city: 'Vilnius',
        relationship_representative_address_country: 'LT',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: 'LT-00000',
        relationship_representative_address_state: 'AL',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }
      req.uploads = {
        relationship_representative_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
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
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_representative_address_city: 'Luxemburg',
        relationship_representative_address_country: 'LU',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: '1623',
        relationship_representative_address_state: 'L',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }
      req.uploads = {
        relationship_representative_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      await testEachFieldAsNull(req)
    })

    it('should update LU information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'LU',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_representative_address_city: 'Luxemburg',
        relationship_representative_address_country: 'LU',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: '1623',
        relationship_representative_address_state: 'L',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }
      req.uploads = {
        relationship_representative_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const redirectURL = TestHelper.extractRedirectURL(doc)
      assert.strictEqual(redirectURL, `/account/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
    })

    it('should reject LV invalid fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'LV',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_representative_address_city: 'Riga',
        relationship_representative_address_country: 'LV',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: 'LV–1073',
        relationship_representative_address_state: 'AI',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }
      req.uploads = {
        relationship_representative_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      await testEachFieldAsNull(req)
    })

    it('should update LV information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'LV',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_representative_address_city: 'Riga',
        relationship_representative_address_country: 'LV',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: 'LV–1073',
        relationship_representative_address_state: 'AI',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }
      req.uploads = {
        relationship_representative_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
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
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_representative_address_city: 'Amsterdam',
        relationship_representative_address_country: 'NL',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: '1071 JA',
        relationship_representative_address_state: 'DR',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }
      req.uploads = {
        relationship_representative_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      await testEachFieldAsNull(req)
    })

    it('should update NL information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'NL',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_representative_address_city: 'Amsterdam',
        relationship_representative_address_country: 'NL',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: '1071 JA',
        relationship_representative_address_state: 'DR',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }
      req.uploads = {
        relationship_representative_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
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
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_representative_address_city: 'Oslo',
        relationship_representative_address_country: 'NO',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: '0001',
        relationship_representative_address_state: '02',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }
      req.uploads = {
        relationship_representative_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      await testEachFieldAsNull(req)
    })

    it('should update NO information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'NO',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_representative_address_city: 'Oslo',
        relationship_representative_address_country: 'NO',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: '0001',
        relationship_representative_address_state: '02',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }
      req.uploads = {
        relationship_representative_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
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
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_representative_address_city: 'Auckland',
        relationship_representative_address_country: 'NZ',
        relationship_representative_address_line1: '844 Fleet Street',
        relationship_representative_address_postal_code: '6011',
        relationship_representative_address_state: 'N',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }
      req.uploads = {
        relationship_representative_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      await testEachFieldAsNull(req)
    })

    it('should update NZ information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'NZ',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_representative_address_city: 'Auckland',
        relationship_representative_address_country: 'NZ',
        relationship_representative_address_line1: '844 Fleet Street',
        relationship_representative_address_postal_code: '6011',
        relationship_representative_address_state: 'N',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }
      req.uploads = {
        relationship_representative_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
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
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_representative_address_city: 'Lisbon',
        relationship_representative_address_country: 'PT',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: '4520',
        relationship_representative_address_state: '01',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }
      req.uploads = {
        relationship_representative_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      await testEachFieldAsNull(req)
    })

    it('should update PT information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'PT',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_representative_address_city: 'Lisbon',
        relationship_representative_address_country: 'PT',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: '4520',
        relationship_representative_address_state: '01',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }
      req.uploads = {
        relationship_representative_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
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
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_representative_address_city: 'Stockholm',
        relationship_representative_address_country: 'SE',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: '00150',
        relationship_representative_address_state: 'K',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }
      req.uploads = {
        relationship_representative_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      await testEachFieldAsNull(req)
    })

    it('should update SE information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'SE',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_representative_address_city: 'Stockholm',
        relationship_representative_address_country: 'SE',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: '00150',
        relationship_representative_address_state: 'K',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }
      req.uploads = {
        relationship_representative_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
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
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_representative_address_city: 'Singapore',
        relationship_representative_address_country: 'SG',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: '339696',
        relationship_representative_address_state: 'SG',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_id_number: '000000000',
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }
      req.uploads = {
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      await testEachFieldAsNull(req)
    })

    it('should update SG information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'SG',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_representative_address_city: 'Singapore',
        relationship_representative_address_country: 'SG',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: '339696',
        relationship_representative_address_state: 'SG',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_id_number: '000000000',
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_percent_ownership: '0',
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }
      req.uploads = {
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const redirectURL = TestHelper.extractRedirectURL(doc)
      assert.strictEqual(redirectURL, `/account/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
    })

    it('should reject SK invalid fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'SK',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_representative_address_city: 'Slovakia',
        relationship_representative_address_country: 'SK',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: '00102',
        relationship_representative_address_state: 'BC',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }
      req.uploads = {
        relationship_representative_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      await testEachFieldAsNull(req)
    })

    it('should update SK information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'SK',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_representative_address_city: 'Slovakia',
        relationship_representative_address_country: 'SK',
        relationship_representative_address_line1: '123 Sesame St',
        relationship_representative_address_postal_code: '00102',
        relationship_representative_address_state: 'BC',
        relationship_representative_dob_day: '1',
        relationship_representative_dob_month: '1',
        relationship_representative_dob_year: '1950',
        relationship_representative_email: user.profile.contactEmail,
        relationship_representative_first_name: user.profile.firstName,
        relationship_representative_last_name: user.profile.lastName,
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner'
      }
      req.uploads = {
        relationship_representative_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
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
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      req.body = {
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
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner',
        relationship_representative_ssn_last_4: '0000'
      }
      await testEachFieldAsNull(req)
    })

    it('should update US information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-company-representative?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      req.body = {
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
        relationship_representative_phone: '456-789-0123',
        relationship_representative_relationship_executive: 'true',
        relationship_representative_relationship_title: 'Owner',
        relationship_representative_ssn_last_4: '0000'
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const redirectURL = TestHelper.extractRedirectURL(doc)
      assert.strictEqual(redirectURL, `/account/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
    })
  })
})
