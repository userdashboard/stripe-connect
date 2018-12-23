/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../..//test-helper.js')

describe(`/account/connect/edit-individual-registration`, async () => {
  describe('EditIndividualRegistration#BEFORE', () => {
    it('should reject invalid registration', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=invalid`)
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

    it('should reject company registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'company', country: 'US' })
      const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
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

    it('should bind application CountrySpec to req', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'AU' })
      const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.applicationCountry.id, 'AU')
    })

    it('should bind address country to req', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'AU' })
      const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.addressCountry.name, 'Australia')
    })
  })

  describe('EditIndividualRegistration#GET', () => {
    async function testRequiredFieldInputsExist (req, stripeAccount) {
      const req2 = TestHelper.createRequest(`/api/user/connect/country-spec?country=${stripeAccount.country}`)
      req2.account = req.account
      req2.session = req.session
      const country = await req2.get()
      const fieldsNeeded = country.verification_fields.individual.minimum.concat(country.verification_fields.individual.additional)
      const page = await req.get()
      const doc = TestHelper.extractDoc(page)
      for (const pathAndField of fieldsNeeded) {
        if (pathAndField === 'external_account' ||
          pathAndField === 'legal_entity.type' ||
          pathAndField === 'tos_acceptance.date' ||
          pathAndField === 'tos_acceptance.ip' ||
          pathAndField === 'tos_acceptance.user_agent' ||
          pathAndField === 'legal_entity.verification.document') {
          continue
        }
        const field = pathAndField.split('.').pop()
        let inputName = field
        if (country.id === 'JP') {
          if (pathAndField.indexOf('kana') > -1 && !pathAndField.endsWith('_kana')) {
            inputName += '_kana'
          } else if (pathAndField.indexOf('kanji') > -1 && !pathAndField.endsWith('_kanji')) {
            inputName += '_kanji'
          }
        }
        const input = doc.getElementById(inputName)
        if (input.attr.name === 'state' || input.attr.name === 'country') {
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
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'AT' })
      const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const page = await req.get()
      const doc = TestHelper.extractDoc(page)
      assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
      assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
    })

    it('should have AT-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'AT' })
      const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have AU-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'AU' })
      const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have BE-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'BE' })
      const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have CA-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'CA' })
      const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have CH-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'CH' })
      const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have DE-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'DE' })
      const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have DK-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'DK' })
      const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })
    it('should have ES-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'ES' })
      const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have FI-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'FI' })
      const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have FR-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'FR' })
      const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have GB-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'GB' })
      const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have HK-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'HK' })
      const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have IE-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'IE' })
      const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have IT-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'IT' })
      const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have JP-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'JP' })
      const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have LU-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'LU' })
      const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have NL-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'NL' })
      const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have NO-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'NO' })
      const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have NZ-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'NZ' })
      const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have PT-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'PT' })
      const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    it('should have SE-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'SE' })
      const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })

    // these tests only work if your Stripe account is SG
    // it('should have SG-required fields', async () => {
    //   const user = await TestHelper.createUser()
    //   await TestHelper.createStripeAccount(user, { type: 'individual', country: 'SG' })
    //   const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
    //   req.account = user.account
    //   req.session = user.session
    //   return testRequiredFieldInputsExist(req, user.stripeAccount)
    // })

    it('should have US-required fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'US' })
      const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      return testRequiredFieldInputsExist(req, user.stripeAccount)
    })
  })

  describe('EditIndividualRegistration#POST', () => {
    async function testEachFieldAsNull(req) {
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

    it('should reject AT invalid fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'AT' })
      const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
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
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'AT' })
      const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
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
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'AU' })
      const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        city: 'Brisbane',
        state: 'QLD',
        line1: 'Address First Line',
        postal_code: '4000',
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
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'AU' })
      const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        city: 'Brisbane',
        state: 'QLD',
        line1: 'Address First Line',
        postal_code: '4000',
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
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'BE' })
      const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
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
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'BE' })
      const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
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
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'CA' })
      const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        city: 'Vancouver',
        state: 'BC',
        line1: 'Address First Line',
        postal_code: 'V5K 0A1',
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
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'CA' })
      const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        city: 'Vancouver',
        state: 'BC',
        line1: 'Address First Line',
        postal_code: 'V5K 0A1',
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
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'CH' })
      const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
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
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'CH' })
      const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
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
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'DE' })
      const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
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
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'DE' })
      const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
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
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'DK' })
      const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
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
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'DK' })
      const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
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
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'ES' })
      const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
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
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'ES' })
      const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
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
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'FI' })
      const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
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
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'FI' })
      const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
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
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'FR' })
      const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
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
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'FR' })
      const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
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
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'GB' })
      const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
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
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'GB' })
      const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
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
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'HK' })
      const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        city: 'Hong Kong',
        line1: 'Address First Line',
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
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'HK' })
      const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        city: 'Hong Kong',
        line1: 'Address First Line',
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
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'IE' })
      const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
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
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'IE' })
      const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
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
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'IT' })
      const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
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
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'IT' })
      const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
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
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'JP' })
      const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
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
        postal_code_kana: '1500001',
        state_kana: 'ﾄｳｷﾖｳﾄ',
        city_kana: 'ｼﾌﾞﾔ',
        town_kana: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        line1_kana: '27-15',
        postal_code_kanji: '１５００００１',
        state_kanji: '東京都',
        city_kanji: '渋谷区',
        town_kanji: '神宮前　３丁目',
        line1_kanji: '２７－１５'
      }
      await testEachFieldAsNull(req)
    })

    it('should update JP information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'JP' })
      const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
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
        postal_code_kana: '1500001',
        state_kana: 'ﾄｳｷﾖｳﾄ',
        city_kana: 'ｼﾌﾞﾔ',
        town_kana: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
        line1_kana: '27-15',
        postal_code_kanji: '１５００００１',
        state_kanji: '東京都',
        city_kanji: '渋谷区',
        town_kanji: '神宮前　３丁目',
        line1_kanji: '２７－１５'
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should reject LU invalid fields', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'LU' })
      const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
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
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'LU' })
      const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
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
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'NL' })
      const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
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
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'NL' })
      const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
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
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'NO' })
      const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
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
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'NO' })
      const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
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
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'NZ' })
      const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        city: 'Auckland',
        line1: 'Address First Line',
        postal_code: '6011',
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
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'NZ' })
      const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        city: 'Auckland',
        line1: 'Address First Line',
        postal_code: '6011',
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
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'PT' })
      const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
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
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'PT' })
      const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
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
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'SE' })
      const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
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
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'SE' })
      const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
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
    //   await TestHelper.createStripeAccount(user, { type: 'individual', country: 'SG' })
    //   const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
    //   req.account = user.account
    //   req.session = user.session
    //   req.body = {
    //     line1: 'Address First Line',
    //     postal_code: '339696',
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
    //   await TestHelper.createStripeAccount(user, { type: 'individual', country: 'SG' })
    //   const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
    //   req.account = user.account
    //   req.session = user.session
    //   req.body = {
    //     line1: 'Address First Line',
    //     postal_code: '339696',
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
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'US' })
      const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        city: 'New York City',
        line1: 'Address First Line',
        postal_code: '10001',
        personal_id_number: '000000000',
        state: 'NY',
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
      await TestHelper.createStripeAccount(user, { type: 'individual', country: 'US' })
      const req = TestHelper.createRequest(`/account/connect/edit-individual-registration?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        city: 'New York City',
        line1: 'Address First Line',
        postal_code: '10001',
        personal_id_number: '000000000',
        state: 'NY',
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
