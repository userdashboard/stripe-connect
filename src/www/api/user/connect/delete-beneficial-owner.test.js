/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')

describe('/api/user/connect/delete-beneficial-owner', () => {
  describe('exceptions', () => {
    describe('invalid-personid', () => {
      it('missing querystring ownerid', async () => {
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/connect/delete-beneficial-owner')
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.delete()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-personid')
      })

      it('invalid querystring ownerid', async () => {
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/connect/delete-beneficial-owner?personid=invalid')
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.delete()
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
          last_name: person.lastName
        }, {
          verification_document_back: TestHelper['success_id_scan_back.png'],
          verification_document_front: TestHelper['success_id_scan_front.png']
        })
        const user2 = await TestHelper.createUser()
        const req = TestHelper.createRequest(`/api/user/connect/delete-beneficial-owner?personid=${person.id}`)
        req.account = user2.account
        req.session = user2.session
        let errorMessage
        try {
          await req.delete()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-account')
      })
    })
  })

  describe('returns', () => {
    it('boolean', async () => {
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
        last_name: person.lastName
      }, {
        verification_document_back: TestHelper['success_id_scan_back.png'],
        verification_document_front: TestHelper['success_id_scan_front.png']
      })
      const req = TestHelper.createRequest(`/api/user/connect/delete-beneficial-owner?personid=${person.id}`)
      req.account = user.account
      req.session = user.session
      const deleted = await req.delete()
      assert.strictEqual(deleted, true)
    })
  })
})
