/* eslint-env mocha */
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
          last_name: person.lastName
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
          last_name: person.lastName
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
          last_name: person.lastName
        }, {
          verification_document_back: TestHelper['success_id_scan_back.png'],
          verification_document_front: TestHelper['success_id_scan_front.png']
        })
        const user2 = await TestHelper.createUser()
        const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?personid=${person.id}`)
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
          last_name: person.lastName
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

    describe('invalid-first_name', () => {
      it('missing posted first_name', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'GB',
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
        const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?personid=${person.id}`)
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
          first_name: '',
          last_name: person.lastName
        }
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-first_name')
      })
    })

    describe('invalid-last_name', () => {
      it('missing posted last_name', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'GB',
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
        const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?personid=${person.id}`)
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
          last_name: ''
        }
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-last_name')
      })
    })

    describe('invalid-address_country', () => {
      it('missing posted address_country', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'GB',
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
        const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?personid=${person.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          address_city: 'London',
          address_country: '',
          address_line1: 'A building',
          address_postal_code: 'EC1A 1AA',
          address_state: 'LND',
          dob_day: '1',
          dob_month: '1',
          dob_year: '1950',
          email: person.email,
          first_name: person.firstName,
          last_name: person.lastName
        }
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-address_country')
      })

      it('invalid posted address_country', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'GB',
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
        const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?personid=${person.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          address_city: 'London',
          address_country: 'invalid',
          address_line1: 'A building',
          address_postal_code: 'EC1A 1AA',
          address_state: 'LND',
          dob_day: '1',
          dob_month: '1',
          dob_year: '1950',
          email: person.email,
          first_name: person.firstName,
          last_name: person.lastName
        }
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-address_country')
      })
    })

    describe('invalid-address_state', () => {
      it('missing posted address_state', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'GB',
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
        const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?personid=${person.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          address_city: 'London',
          address_country: 'GB',
          address_line1: 'A building',
          address_postal_code: 'EC1A 1AA',
          address_state: '',
          dob_day: '1',
          dob_month: '1',
          dob_year: '1950',
          email: person.email,
          first_name: person.firstName,
          last_name: person.lastName
        }
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-address_state')
      })

      it('invalid posted address_state', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'GB',
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
        const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?personid=${person.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          address_city: 'London',
          address_country: 'GB',
          address_line1: 'A building',
          address_postal_code: 'EC1A 1AA',
          address_state: 'invalid',
          dob_day: '1',
          dob_month: '1',
          dob_year: '1950',
          email: person.email,
          first_name: person.firstName,
          last_name: person.lastName
        }
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-address_state')
      })
    })

    describe('invalid-address_city', () => {
      it('missing posted address_city', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'GB',
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
        const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?personid=${person.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          address_city: '',
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
        }
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-address_city')
      })
    })

    describe('invalid-address_postal_code', () => {
      it('missing posted address_postal_code', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'GB',
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
        const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?personid=${person.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          address_city: 'London',
          address_country: 'GB',
          address_line1: 'A building',
          address_postal_code: '',
          address_state: 'LND',
          dob_day: '1',
          dob_month: '1',
          dob_year: '1950',
          email: person.email,
          first_name: person.firstName,
          last_name: person.lastName
        }
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-address_postal_code')
      })
    })

    describe('invalid-address_line1', () => {
      it('missing posted address_line1', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'GB',
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
        const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?personid=${person.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          address_city: 'London',
          address_country: 'GB',
          address_line1: '',
          address_postal_code: 'EC1A 1AA',
          address_state: 'LND',
          dob_day: '1',
          dob_month: '1',
          dob_year: '1950',
          email: person.email,
          first_name: person.firstName,
          last_name: person.lastName
        }
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-address_line1')
      })
    })

    describe('invalid-dob_day', () => {
      it('missing posted dob_day', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'GB',
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
        const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?personid=${person.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          address_city: 'London',
          address_country: 'GB',
          address_line1: 'A building',
          address_postal_code: 'EC1A 1AA',
          address_state: 'LND',
          dob_day: '',
          dob_month: '1',
          dob_year: '1950',
          email: person.email,
          first_name: person.firstName,
          last_name: person.lastName
        }
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-dob_day')
      })

      it('invalid posted dob_day', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'GB',
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
        const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?personid=${person.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          address_city: 'London',
          address_country: 'GB',
          address_line1: 'A building',
          address_postal_code: 'EC1A 1AA',
          address_state: 'LND',
          dob_day: 'invalid',
          dob_month: '1',
          dob_year: '1950',
          email: person.email,
          first_name: person.firstName,
          last_name: person.lastName
        }
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-dob_day')
      })
    })

    describe('invalid-dob_month', () => {
      it('missing posted dob_month', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'GB',
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
        const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?personid=${person.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          address_city: 'London',
          address_country: 'GB',
          address_line1: 'A building',
          address_postal_code: 'EC1A 1AA',
          address_state: 'LND',
          dob_day: '1',
          dob_month: '',
          dob_year: '1950',
          email: person.email,
          first_name: person.firstName,
          last_name: person.lastName
        }
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-dob_month')
      })

      it('invalid posted dob_month', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'GB',
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
        const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?personid=${person.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          address_city: 'London',
          address_country: 'GB',
          address_line1: 'A building',
          address_postal_code: 'EC1A 1AA',
          address_state: 'LND',
          dob_day: '1',
          dob_month: 'invalid',
          dob_year: '1950',
          email: person.email,
          first_name: person.firstName,
          last_name: person.lastName
        }
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-dob_month')
      })
    })

    describe('invalid-dob_year', () => {
      it('missing posted dob_year', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'GB',
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
        const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?personid=${person.id}`)
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
          dob_year: '',
          email: person.email,
          first_name: person.firstName,
          last_name: person.lastName
        }
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-dob_year')
      })

      it('invalid posted dob_year', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'GB',
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
        const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?personid=${person.id}`)
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
          dob_year: 'invalid',
          email: person.email,
          first_name: person.firstName,
          last_name: person.lastName
        }
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-dob_year')
      })
    })
  })

  describe('receives', () => {
    it('optionally-required posted token', async () => {
      global.stripeJS = 3
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'GB',
        type: 'company'
      })
      const person = TestHelper.nextIdentity()
      const owner = await TestHelper.createBeneficialOwner(user, {
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
        token: 'sample1'
      }, {
        verification_document_back: TestHelper['success_id_scan_back.png'],
        verification_document_front: TestHelper['success_id_scan_front.png']
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?personid=${person.id}`)
      req.account = user.account
      req.session = user.session
      const body = {
        address_city: 'London',
        address_country: 'GB',
        address_line1: 'A building',
        address_postal_code: 'EC1A 1AA',
        address_state: 'LND',
        dob_day: '1',
        dob_month: '1',
        dob_year: '1950',
        email: person.email,
        first_name: 'Modified name',
        last_name: person.lastName,
        token: 'sample2'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const ownerNow = await req.patch()
      assert.notStrictEqual(ownerNow.token, owner.token)
      assert.notStrictEqual(ownerNow.token, null)
      assert.notStrictEqual(ownerNow.token, undefined)
    })

    it('optional posted file verification_document_front', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'GB',
        type: 'company'
      })
      const person = TestHelper.nextIdentity()
      const owner = await TestHelper.createBeneficialOwner(user, {
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
      const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?personid=${person.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const body = {
        address_city: 'London',
        address_country: 'GB',
        address_line1: 'A building',
        address_postal_code: 'EC1A 1AA',
        address_state: 'LND',
        dob_day: '1',
        dob_month: '1',
        dob_year: '1950',
        email: person.email,
        first_name: 'Modified name',
        last_name: person.lastName
      }
      req.body = TestHelper.createMultiPart(req, body)
      const ownerNow = await req.patch()
      assert.notStrictEqual(ownerNow.verification_document_front, owner.verification_document_front)
      assert.notStrictEqual(ownerNow.verification_document_front, null)
      assert.notStrictEqual(ownerNow.verification_document_front, undefined)
    })

    it('optional posted file verification_document_back', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'GB',
        type: 'company'
      })
      const person = TestHelper.nextIdentity()
      const owner = await TestHelper.createBeneficialOwner(user, {
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
      const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?personid=${person.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        verification_document_back: TestHelper['success_id_scan_front.png']
      }
      const body = {
        address_city: 'London',
        address_country: 'GB',
        address_line1: 'A building',
        address_postal_code: 'EC1A 1AA',
        address_state: 'LND',
        dob_day: '1',
        dob_month: '1',
        dob_year: '1950',
        email: person.email,
        first_name: 'Modified name',
        last_name: person.lastName
      }
      req.body = TestHelper.createMultiPart(req, body)
      const ownerNow = await req.patch()
      assert.notStrictEqual(ownerNow.verification_document_back, owner.verification_document_back)
      assert.notStrictEqual(ownerNow.verification_document_back, null)
      assert.notStrictEqual(ownerNow.verification_document_back, undefined)
    })

    it('required posted email', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'GB',
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
        email: 'random@email.com',
        first_name: person.firstName,
        last_name: person.lastName
      }, {
        verification_document_back: TestHelper['success_id_scan_back.png'],
        verification_document_front: TestHelper['success_id_scan_front.png']
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?personid=${person.id}`)
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
        last_name: person.lastName
      }
      const ownerNow = await req.patch()
      assert.strictEqual(ownerNow.email, person.email)
    })

    it('required posted first_name', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'GB',
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
        first_name: 'Something',
        last_name: person.lastName
      }, {
        verification_document_back: TestHelper['success_id_scan_back.png'],
        verification_document_front: TestHelper['success_id_scan_front.png']
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?personid=${person.id}`)
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
        last_name: person.lastName
      }
      const ownerNow = await req.patch()
      assert.strictEqual(ownerNow.first_name, person.firstName)
    })

    it('required posted last_name', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'GB',
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
        last_name: 'Something'
      }, {
        verification_document_back: TestHelper['success_id_scan_back.png'],
        verification_document_front: TestHelper['success_id_scan_front.png']
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?personid=${person.id}`)
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
        last_name: person.lastName
      }
      const ownerNow = await req.patch()
      assert.strictEqual(ownerNow.last_name, person.lastName)
    })

    it('required posted address_line1', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'GB',
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
      const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?personid=${person.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        address_city: 'London',
        address_country: 'GB',
        address_line1: '123 Sesame St',
        address_postal_code: 'EC1A 1AA',
        address_state: 'LND',
        dob_day: '1',
        dob_month: '1',
        dob_year: '1950',
        email: person.email,
        first_name: 'Modified name',
        last_name: person.lastName
      }
      const ownerNow = await req.patch()
      assert.strictEqual(ownerNow.address_line1, '123 Sesame St')
    })

    it('optional posted address_line2', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'GB',
        type: 'company'
      })
      const person = TestHelper.nextIdentity()
      await TestHelper.createBeneficialOwner(user, {
        address_city: 'London',
        address_country: 'GB',
        address_line1: 'A building',
        address_line2: 'More info',
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
      const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?personid=${person.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        address_city: 'London',
        address_country: 'GB',
        address_line1: 'A building',
        address_line2: 'New info',
        address_postal_code: 'EC1A 1AA',
        address_state: 'LND',
        dob_day: '1',
        dob_month: '1',
        dob_year: '1950',
        email: person.email,
        first_name: 'Modified name',
        last_name: person.lastName
      }
      const ownerNow = await req.patch()
      assert.strictEqual(ownerNow.address_line2, 'New info')
    })

    it('required posted address_city', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'GB',
        type: 'company'
      })
      const person = TestHelper.nextIdentity()
      await TestHelper.createBeneficialOwner(user, {
        address_city: 'Manchester',
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
      const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?personid=${person.id}`)
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
        first_name: 'Modified name',
        last_name: person.lastName
      }
      const ownerNow = await req.patch()
      assert.strictEqual(ownerNow.address_city, 'London')
    })

    it('required posted address_state', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'GB',
        type: 'company'
      })
      const person = TestHelper.nextIdentity()
      await TestHelper.createBeneficialOwner(user, {
        address_city: 'London',
        address_country: 'GB',
        address_line1: 'A building',
        address_postal_code: 'EC1A 1AA',
        address_state: 'LUT',
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
      const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?personid=${person.id}`)
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
        first_name: 'Modified name',
        last_name: person.lastName
      }
      const ownerNow = await req.patch()
      assert.strictEqual(ownerNow.address_state, 'LND')
    })

    it('required posted address_country', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'GB',
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
      const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?personid=${person.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        address_city: 'Dublin',
        address_country: 'IE',
        address_line1: 'A building',
        address_postal_code: 'Dublin 1',
        address_state: 'LM',
        dob_day: '1',
        dob_month: '1',
        dob_year: '1950',
        email: person.email,
        first_name: 'Modified name',
        last_name: person.lastName
      }
      const ownerNow = await req.patch()
      assert.strictEqual(ownerNow.address_country, 'IE')
    })

    it('required posted address_postal_code', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'GB',
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
      const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?personid=${person.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        address_city: 'London',
        address_country: 'GB',
        address_line1: 'A building',
        address_postal_code: 'EC1A 1AB',
        address_state: 'LND',
        dob_day: '1',
        dob_month: '1',
        dob_year: '1950',
        email: person.email,
        first_name: 'Modified name',
        last_name: person.lastName
      }
      const ownerNow = await req.patch()
      assert.strictEqual(ownerNow.address_postal_code, 'EC1A 1AB')
    })

    it('required posted dob_day', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'GB',
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
      const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?personid=${person.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        address_city: 'London',
        address_country: 'GB',
        address_line1: 'A building',
        address_postal_code: 'EC1A 1AA',
        address_state: 'LND',
        dob_day: '1',
        dob_month: '2',
        dob_year: '1950',
        email: person.email,
        first_name: 'Modified name',
        last_name: person.lastName
      }
      const ownerNow = await req.patch()
      assert.strictEqual(ownerNow.dob_day, '01')
    })

    it('required posted dob_month', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'GB',
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
      const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?personid=${person.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        address_city: 'London',
        address_country: 'GB',
        address_line1: 'A building',
        address_postal_code: 'EC1A 1AA',
        address_state: 'LND',
        dob_day: '1',
        dob_month: '2',
        dob_year: '1950',
        email: person.email,
        first_name: 'Modified name',
        last_name: person.lastName
      }
      const ownerNow = await req.patch()
      assert.strictEqual(ownerNow.dob_month, '02')
    })

    it('required posted dob_year', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'GB',
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
      const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?personid=${person.id}`)
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
        first_name: 'Modified name',
        last_name: person.lastName
      }
      const ownerNow = await req.patch()
      assert.strictEqual(ownerNow.dob_year, '1950')
    })
  })

  describe('returns', () => {
    it('object', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'GB',
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
      const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?personid=${person.id}`)
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
        first_name: 'Modified name',
        last_name: person.lastName
      }
      const ownerNow = await req.patch()
      assert.strictEqual(ownerNow.first_name, 'Modified name')
    })
  })

  describe('configuration', () => {
    it('environment STRIPE_JS', async () => {
      global.stripeJS = 3
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'GB',
        type: 'company'
      })
      const person = TestHelper.nextIdentity()
      const req = TestHelper.createRequest(`/account/connect/create-beneficial-owner?stripeid=${user.stripeAccount.id}`)
      req.waitOnSubmit = true
      req.account = user.account
      req.session = user.session
      req.uploads = {
        verification_document_back: TestHelper['success_id_scan_back.png'],
        verification_document_front: TestHelper['success_id_scan_front.png']
      }
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
        last_name: person.lastName
      }
      await req.post()
      const owners = await global.api.user.connect.BeneficialOwners.get(req)
      const owner = owners[0]
      const req2 = TestHelper.createRequest(`/account/connect/edit-beneficial-owner?personid=${person.id}`)
      req2.waitOnSubmit = true
      req2.account = user.account
      req2.session = user.session
      req2.body = {
        address_city: 'London',
        address_country: 'GB',
        address_line1: 'A building',
        address_postal_code: 'EC1A 1AA',
        address_state: 'LND',
        dob_day: '1',
        dob_month: '1',
        dob_year: '1950',
        email: person.email,
        first_name: 'Modified name',
        last_name: person.lastName
      }
      await req2.post()
      const ownerNow = await global.api.user.connect.BeneficialOwner.get(req2)
      assert.notStrictEqual(ownerNow.token, owner.token)
      assert.notStrictEqual(ownerNow.token, null)
      assert.notStrictEqual(ownerNow.token, undefined)
    })
  })
})
