/* eslint-env mocha */
/*
  This route now only supports information specified
  in the requirements.currently_due and eventually_due
  collections.  Testing most fields is disabled until
  they submit data that fails validation and requires
  resubmitting
*/
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')

describe('/api/user/connect/update-beneficial-owner', () => {
  describe('exceptions', () => {
    describe('invalid-personid', () => {
      it('missing querystring personid', async () => {
        const user = await TestHelper.createUser()
        const person = TestHelper.nextIdentity()
        const req = TestHelper.createRequest('/api/user/connect/update-beneficial-owner')
        req.account = user.account
        req.session = user.session
        req.body = {
          address_city: 'London',
          address_country: 'GB',
          address_line1: 'A building',
          address_postal_code: 'EC1A 1AA',
          address_state: 'LND',
          dob_day: '1',
          dob_month: '1',
          dob_year: '1950',
          email: person.email,
          first_name: person.firstName,
          last_name: person.lastName,
          phone: '456-789-0123'
        }
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-personid')
      })

      it('invalid querystring personid', async () => {
        const user = await TestHelper.createUser()
        const person = TestHelper.nextIdentity()
        const req = TestHelper.createRequest('/api/user/connect/update-beneficial-owner?personid=invalid')
        req.account = user.account
        req.session = user.session
        req.body = {
          address_city: 'London',
          address_country: 'GB',
          address_line1: 'A building',
          address_postal_code: 'EC1A 1AA',
          address_state: 'LND',
          dob_day: '1',
          dob_month: '1',
          dob_year: '1950',
          email: person.email,
          first_name: person.firstName,
          last_name: person.lastName,
          phone: '456-789-0123'
        }
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-personid')
      })
    })

    describe('invalid-account', () => {
      it('ineligible accessing account', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'DE',
          type: 'company'
        })
        const person = TestHelper.nextIdentity()
        await TestHelper.createBeneficialOwner(user, {
          address_city: 'London',
          address_country: 'GB',
          address_line1: 'A building',
          address_postal_code: 'EC1A 1AA',
          address_state: 'LND',
          dob_day: '1',
          dob_month: '1',
          dob_year: '1950',
          email: person.email,
          first_name: person.firstName,
          last_name: person.lastName,
          phone: '456 -789-0123'
        }, {
          verification_document_back: TestHelper['success_id_scan_back.png'],
          verification_document_front: TestHelper['success_id_scan_front.png']
        })
        const user2 = await TestHelper.createUser()
        const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?personid=${user.owner.id}`)
        req.account = user2.account
        req.session = user2.session
        req.body = {
          address_city: 'London',
          address_country: 'GB',
          address_line1: 'A building',
          address_postal_code: 'EC1A 1AA',
          address_state: 'LND',
          dob_day: '1',
          dob_month: '1',
          dob_year: '1950',
          email: person.email,
          first_name: person.firstName,
          last_name: person.lastName,
          phone: '456-789-0123'
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
  })

  describe('receives', () => {
    // it('optionally-required posted token', async () => {
    // })

    // it('optionally-required posted file verification_document_front', async () => {
    // })

    // it('optionally-required posted file verification_document_back', async () => {
    // })

    // it('optionally-required posted email', async () => {
    // })

    // it('optionally-required posted first_name', async () => {
    // })

    // it('optionally-required posted last_name', async () => {
    // })

    // it('optionally-required posted address_line1', async () => {
    // })

    // it('optionally-required posted address_line2', async () => {
    // })

    // it('optionally-required posted address_city', async () => {
    // })

    // it('optionally-required posted address_state', async () => {
    // })

    // it('optionally-required posted address_country', async () => {
    // })

    // it('optionally-required posted address_postal_code', async () => {
    // })

    // it('optionally-required posted dob_day', async () => {
    // })

    // it('optionally-required posted dob_month', async () => {
    // })

    // it('optionally-required posted dob_year', async () => {
    // })
  })

  describe('returns', () => {
    it('object', async () => {
      // const user = await TestHelper.createUser()
      // await TestHelper.createStripeAccount(user, {
      //   country: 'GB',
      //   type: 'company'
      // })
      // const person = TestHelper.nextIdentity()
      // await TestHelper.createBeneficialOwner(user, {
      //   address_city: 'London',
      //   address_country: 'GB',
      //   address_line1: 'A building',
      //   address_postal_code: 'EC1A 1AA',
      //   address_state: 'LND',
      //   dob_day: '1',
      //   dob_month: '1',
      //   dob_year: '1950',
      //   email: person.email,
      //   first_name: person.firstName,
      //   last_name: person.lastName
      // }, {
      //   verification_document_back: TestHelper['success_id_scan_back.png'],
      //   verification_document_front: TestHelper['success_id_scan_front.png']
      // })
      // const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?personid=${user.owner.id}`)
      // req.account = user.account
      // req.session = user.session
      // req.body = {}
      // req.filename = __filename
      // req.saveResponse = true
      // const ownerNow = await req.patch()
      // assert.strictEqual(ownerNow.object, 'person')
    })
  })

  describe('configuration', () => {
    it('environment STRIPE_JS', async () => {
      // global.stripeJS = 3
      // const user = await TestHelper.createUser()
      // await TestHelper.createStripeAccount(user, {
      //   country: 'GB',
      //   type: 'company'
      // })
      // const person = TestHelper.nextIdentity()
      // const req = TestHelper.createRequest(`/account/connect/create-beneficial-owner?stripeid=${user.stripeAccount.id}`)
      // req.waitOnSubmit = true
      // req.account = user.account
      // req.session = user.session
      // req.uploads = {
      //   verification_document_back: TestHelper['success_id_scan_back.png'],
      //   verification_document_front: TestHelper['success_id_scan_front.png']
      // }
      // req.body = {
      //   address_city: 'London',
      //   address_country: 'GB',
      //   address_line1: 'A building',
      //   address_postal_code: 'EC1A 1AA',
      //   address_state: 'LND',
      //   dob_day: '1',
      //   dob_month: '1',
      //   dob_year: '1950',
      //   email: person.email,
      //   first_name: person.firstName,
      //   last_name: person.lastName
      // }
      // await req.post()
      // const owners = await global.api.user.connect.BeneficialOwners.get(req)
      // const owner = owners[0]
      // const req2 = TestHelper.createRequest(`/account/connect/edit-beneficial-owner?personid=${owner.id}`)
      // req2.waitOnSubmit = true
      // req2.account = user.account
      // req2.session = user.session
      // req2.body = {
      //   address_city: 'London',
      //   address_country: 'GB',
      //   address_line1: 'A building',
      //   address_postal_code: 'EC1A 1AA',
      //   address_state: 'LND',
      //   dob_day: '1',
      //   dob_month: '1',
      //   dob_year: '1950',
      //   email: person.email,
      //   first_name: 'Modified name',
      //   last_name: person.lastName
      // }
      // await req2.post()
      // const ownerNow = await global.api.user.connect.BeneficialOwner.get(req2)
      // assert.notStrictEqual(ownerNow.metadata.token, null)
      // assert.notStrictEqual(ownerNow.metadata.token, undefined)
    })
  })
})
