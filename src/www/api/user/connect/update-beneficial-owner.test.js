/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')

describe('/api/user/connect/update-beneficial-owner', () => {
  describe('exceptions', () => {
    describe('invalid-ownerid', () => {
      it('missing querystring ownerid', async () => {
        const user = await TestHelper.createUser()
        const person = TestHelper.nextIdentity()
        const req = TestHelper.createRequest('/api/user/connect/update-beneficial-owner')
        req.account = user.account
        req.session = user.session
        req.body = {
          relationship_owner_email: person.email,
          relationship_owner_first_name: person.firstName,
          relationship_owner_last_name: person.lastName,
          relationship_owner_address_country: 'GB',
          relationship_owner_address_city: 'London',
          relationship_owner_address_state: 'LND',
          relationship_owner_address_line1: 'A building',
          relationship_owner_address_postal_code: 'EC1A 1AA',
          relationship_owner_dob_day: '1',
          relationship_owner_dob_month: '1',
          relationship_owner_dob_year: '1950'
        }
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-ownerid')
      })

      it('invalid querystring ownerid', async () => {
        const user = await TestHelper.createUser()
        const person = TestHelper.nextIdentity()
        const req = TestHelper.createRequest('/api/user/connect/update-beneficial-owner?ownerid=invalid')
        req.account = user.account
        req.session = user.session
        req.body = {
          relationship_owner_email: person.email,
          relationship_owner_first_name: person.firstName,
          relationship_owner_last_name: person.lastName,
          relationship_owner_address_country: 'GB',
          relationship_owner_address_city: 'London',
          relationship_owner_address_state: 'LND',
          relationship_owner_address_line1: 'A building',
          relationship_owner_address_postal_code: 'EC1A 1AA',
          relationship_owner_dob_day: '1',
          relationship_owner_dob_month: '1',
          relationship_owner_dob_year: '1950'
        }
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-ownerid')
      })
    })

    describe('invalid-account', () => {
      it('ineligible accessing account', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'DE'
        })
        const person = TestHelper.nextIdentity()
        const owner = await TestHelper.createBeneficialOwner(user, {
          relationship_owner_email: person.email,
          relationship_owner_first_name: person.firstName,
          relationship_owner_last_name: person.lastName,
          relationship_owner_address_country: 'GB',
          relationship_owner_address_city: 'London',
          relationship_owner_address_state: 'LND',
          relationship_owner_address_line1: 'A building',
          relationship_owner_address_postal_code: 'EC1A 1AA',
          relationship_owner_dob_day: '1',
          relationship_owner_dob_month: '1',
          relationship_owner_dob_year: '1950'
        }, {
          relationship_owner_verification_document_front: TestHelper['success_id_scan_front.png'],
          relationship_owner_verification_document_back: TestHelper['success_id_scan_back.png']
        })
        const user2 = await TestHelper.createUser()
        const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?ownerid=${owner.ownerid}`)
        req.account = user2.account
        req.session = user2.session
        req.body = {
          relationship_owner_email: person.email,
          relationship_owner_first_name: person.firstName,
          relationship_owner_last_name: person.lastName,
          relationship_owner_address_country: 'GB',
          relationship_owner_address_city: 'London',
          relationship_owner_address_state: 'LND',
          relationship_owner_address_line1: 'A building',
          relationship_owner_address_postal_code: 'EC1A 1AA',
          relationship_owner_dob_day: '1',
          relationship_owner_dob_month: '1',
          relationship_owner_dob_year: '1950'
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

    describe('invalid-relationship_owner_first_name', () => {
      it('missing posted relationship_owner_first_name', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'GB'
        })
        const person = TestHelper.nextIdentity()
        const owner = await TestHelper.createBeneficialOwner(user, {
          relationship_owner_email: person.email,
          relationship_owner_first_name: person.firstName,
          relationship_owner_last_name: person.lastName,
          relationship_owner_address_country: 'GB',
          relationship_owner_address_city: 'London',
          relationship_owner_address_state: 'LND',
          relationship_owner_address_line1: 'A building',
          relationship_owner_address_postal_code: 'EC1A 1AA',
          relationship_owner_dob_day: '1',
          relationship_owner_dob_month: '1',
          relationship_owner_dob_year: '1950'
        }, {
          relationship_owner_verification_document_front: TestHelper['success_id_scan_front.png'],
          relationship_owner_verification_document_back: TestHelper['success_id_scan_back.png']
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?ownerid=${owner.ownerid}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          relationship_owner_email: person.email,
          relationship_owner_first_name: '',
          relationship_owner_last_name: person.lastName,
          relationship_owner_address_country: 'GB',
          relationship_owner_address_city: 'London',
          relationship_owner_address_state: 'LND',
          relationship_owner_address_line1: 'A building',
          relationship_owner_address_postal_code: 'EC1A 1AA',
          relationship_owner_dob_day: '1',
          relationship_owner_dob_month: '1',
          relationship_owner_dob_year: '1950'
        }
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_owner_first_name')
      })
    })

    describe('invalid-relationship_owner_last_name', () => {
      it('missing posted relationship_owner_last_name', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'GB'
        })
        const person = TestHelper.nextIdentity()
        const owner = await TestHelper.createBeneficialOwner(user, {
          relationship_owner_email: person.email,
          relationship_owner_first_name: person.firstName,
          relationship_owner_last_name: person.lastName,
          relationship_owner_address_country: 'GB',
          relationship_owner_address_city: 'London',
          relationship_owner_address_state: 'LND',
          relationship_owner_address_line1: 'A building',
          relationship_owner_address_postal_code: 'EC1A 1AA',
          relationship_owner_dob_day: '1',
          relationship_owner_dob_month: '1',
          relationship_owner_dob_year: '1950'
        }, {
          relationship_owner_verification_document_front: TestHelper['success_id_scan_front.png'],
          relationship_owner_verification_document_back: TestHelper['success_id_scan_back.png']
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?ownerid=${owner.ownerid}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          relationship_owner_email: person.email,
          relationship_owner_first_name: person.firstName,
          relationship_owner_last_name: '',
          relationship_owner_address_country: 'GB',
          relationship_owner_address_city: 'London',
          relationship_owner_address_state: 'LND',
          relationship_owner_address_line1: 'A building',
          relationship_owner_address_postal_code: 'EC1A 1AA',
          relationship_owner_dob_day: '1',
          relationship_owner_dob_month: '1',
          relationship_owner_dob_year: '1950'
        }
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_owner_last_name')
      })
    })

    describe('invalid-relationship_owner_address_country', () => {
      it('missing posted relationship_owner_address_country', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'GB'
        })
        const person = TestHelper.nextIdentity()
        const owner = await TestHelper.createBeneficialOwner(user, {
          relationship_owner_email: person.email,
          relationship_owner_first_name: person.firstName,
          relationship_owner_last_name: person.lastName,
          relationship_owner_address_country: 'GB',
          relationship_owner_address_city: 'London',
          relationship_owner_address_state: 'LND',
          relationship_owner_address_line1: 'A building',
          relationship_owner_address_postal_code: 'EC1A 1AA',
          relationship_owner_dob_day: '1',
          relationship_owner_dob_month: '1',
          relationship_owner_dob_year: '1950'
        }, {
          relationship_owner_verification_document_front: TestHelper['success_id_scan_front.png'],
          relationship_owner_verification_document_back: TestHelper['success_id_scan_back.png']
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?ownerid=${owner.ownerid}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          relationship_owner_email: person.email,
          relationship_owner_first_name: person.firstName,
          relationship_owner_last_name: person.lastName,
          relationship_owner_address_country: '',
          relationship_owner_address_city: 'London',
          relationship_owner_address_state: 'LND',
          relationship_owner_address_line1: 'A building',
          relationship_owner_address_postal_code: 'EC1A 1AA',
          relationship_owner_dob_day: '1',
          relationship_owner_dob_month: '1',
          relationship_owner_dob_year: '1950'
        }
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_owner_address_country')
      })

      it('invalid posted relationship_owner_address_country', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'GB'
        })
        const person = TestHelper.nextIdentity()
        const owner = await TestHelper.createBeneficialOwner(user, {
          relationship_owner_email: person.email,
          relationship_owner_first_name: person.firstName,
          relationship_owner_last_name: person.lastName,
          relationship_owner_address_country: 'GB',
          relationship_owner_address_city: 'London',
          relationship_owner_address_state: 'LND',
          relationship_owner_address_line1: 'A building',
          relationship_owner_address_postal_code: 'EC1A 1AA',
          relationship_owner_dob_day: '1',
          relationship_owner_dob_month: '1',
          relationship_owner_dob_year: '1950'
        }, {
          relationship_owner_verification_document_front: TestHelper['success_id_scan_front.png'],
          relationship_owner_verification_document_back: TestHelper['success_id_scan_back.png']
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?ownerid=${owner.ownerid}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          relationship_owner_email: person.email,
          relationship_owner_first_name: person.firstName,
          relationship_owner_last_name: person.lastName,
          relationship_owner_address_country: 'invalid',
          relationship_owner_address_city: 'London',
          relationship_owner_address_state: 'LND',
          relationship_owner_address_line1: 'A building',
          relationship_owner_address_postal_code: 'EC1A 1AA',
          relationship_owner_dob_day: '1',
          relationship_owner_dob_month: '1',
          relationship_owner_dob_year: '1950'
        }
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_owner_address_country')
      })
    })

    describe('invalid-relationship_owner_address_state', () => {
      it('missing posted relationship_owner_address_state', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'GB'
        })
        const person = TestHelper.nextIdentity()
        const owner = await TestHelper.createBeneficialOwner(user, {
          relationship_owner_email: person.email,
          relationship_owner_first_name: person.firstName,
          relationship_owner_last_name: person.lastName,
          relationship_owner_address_country: 'GB',
          relationship_owner_address_city: 'London',
          relationship_owner_address_state: 'LND',
          relationship_owner_address_line1: 'A building',
          relationship_owner_address_postal_code: 'EC1A 1AA',
          relationship_owner_dob_day: '1',
          relationship_owner_dob_month: '1',
          relationship_owner_dob_year: '1950'
        }, {
          relationship_owner_verification_document_front: TestHelper['success_id_scan_front.png'],
          relationship_owner_verification_document_back: TestHelper['success_id_scan_back.png']
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?ownerid=${owner.ownerid}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          relationship_owner_email: person.email,
          relationship_owner_first_name: person.firstName,
          relationship_owner_last_name: person.lastName,
          relationship_owner_address_country: 'GB',
          relationship_owner_address_city: 'London',
          relationship_owner_address_state: '',
          relationship_owner_address_line1: 'A building',
          relationship_owner_address_postal_code: 'EC1A 1AA',
          relationship_owner_dob_day: '1',
          relationship_owner_dob_month: '1',
          relationship_owner_dob_year: '1950'
        }
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_owner_address_state')
      })

      it('invalid posted relationship_owner_address_state', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'GB'
        })
        const person = TestHelper.nextIdentity()
        const owner = await TestHelper.createBeneficialOwner(user, {
          relationship_owner_email: person.email,
          relationship_owner_first_name: person.firstName,
          relationship_owner_last_name: person.lastName,
          relationship_owner_address_country: 'GB',
          relationship_owner_address_city: 'London',
          relationship_owner_address_state: 'LND',
          relationship_owner_address_line1: 'A building',
          relationship_owner_address_postal_code: 'EC1A 1AA',
          relationship_owner_dob_day: '1',
          relationship_owner_dob_month: '1',
          relationship_owner_dob_year: '1950'
        }, {
          relationship_owner_verification_document_front: TestHelper['success_id_scan_front.png'],
          relationship_owner_verification_document_back: TestHelper['success_id_scan_back.png']
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?ownerid=${owner.ownerid}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          relationship_owner_email: person.email,
          relationship_owner_first_name: person.firstName,
          relationship_owner_last_name: person.lastName,
          relationship_owner_address_country: 'GB',
          relationship_owner_address_city: 'London',
          relationship_owner_address_state: 'invalid',
          relationship_owner_address_line1: 'A building',
          relationship_owner_address_postal_code: 'EC1A 1AA',
          relationship_owner_dob_day: '1',
          relationship_owner_dob_month: '1',
          relationship_owner_dob_year: '1950'
        }
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_owner_address_state')
      })
    })

    describe('invalid-relationship_owner_address_city', () => {
      it('missing posted relationship_owner_address_city', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'GB'
        })
        const person = TestHelper.nextIdentity()
        const owner = await TestHelper.createBeneficialOwner(user, {
          relationship_owner_email: person.email,
          relationship_owner_first_name: person.firstName,
          relationship_owner_last_name: person.lastName,
          relationship_owner_address_country: 'GB',
          relationship_owner_address_city: 'London',
          relationship_owner_address_state: 'LND',
          relationship_owner_address_line1: 'A building',
          relationship_owner_address_postal_code: 'EC1A 1AA',
          relationship_owner_dob_day: '1',
          relationship_owner_dob_month: '1',
          relationship_owner_dob_year: '1950'
        }, {
          relationship_owner_verification_document_front: TestHelper['success_id_scan_front.png'],
          relationship_owner_verification_document_back: TestHelper['success_id_scan_back.png']
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?ownerid=${owner.ownerid}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          relationship_owner_email: person.email,
          relationship_owner_first_name: person.firstName,
          relationship_owner_last_name: person.lastName,
          relationship_owner_address_country: 'GB',
          relationship_owner_address_city: '',
          relationship_owner_address_state: 'LND',
          relationship_owner_address_line1: 'A building',
          relationship_owner_address_postal_code: 'EC1A 1AA',
          relationship_owner_dob_day: '1',
          relationship_owner_dob_month: '1',
          relationship_owner_dob_year: '1950'
        }
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_owner_address_city')
      })
    })

    describe('invalid-relationship_owner_address_postal_code', () => {
      it('missing posted relationship_owner_address_postal_code', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'GB'
        })
        const person = TestHelper.nextIdentity()
        const owner = await TestHelper.createBeneficialOwner(user, {
          relationship_owner_email: person.email,
          relationship_owner_first_name: person.firstName,
          relationship_owner_last_name: person.lastName,
          relationship_owner_address_country: 'GB',
          relationship_owner_address_city: 'London',
          relationship_owner_address_state: 'LND',
          relationship_owner_address_line1: 'A building',
          relationship_owner_address_postal_code: 'EC1A 1AA',
          relationship_owner_dob_day: '1',
          relationship_owner_dob_month: '1',
          relationship_owner_dob_year: '1950'
        }, {
          relationship_owner_verification_document_front: TestHelper['success_id_scan_front.png'],
          relationship_owner_verification_document_back: TestHelper['success_id_scan_back.png']
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?ownerid=${owner.ownerid}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          relationship_owner_email: person.email,
          relationship_owner_first_name: person.firstName,
          relationship_owner_last_name: person.lastName,
          relationship_owner_address_country: 'GB',
          relationship_owner_address_city: 'London',
          relationship_owner_address_state: 'LND',
          relationship_owner_address_line1: 'A building',
          relationship_owner_address_postal_code: '',
          relationship_owner_dob_day: '1',
          relationship_owner_dob_month: '1',
          relationship_owner_dob_year: '1950'
        }
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_owner_address_postal_code')
      })
    })

    describe('invalid-relationship_owner_address_line1', () => {
      it('missing posted relationship_owner_address_line1', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'GB'
        })
        const person = TestHelper.nextIdentity()
        const owner = await TestHelper.createBeneficialOwner(user, {
          relationship_owner_email: person.email,
          relationship_owner_first_name: person.firstName,
          relationship_owner_last_name: person.lastName,
          relationship_owner_address_country: 'GB',
          relationship_owner_address_city: 'London',
          relationship_owner_address_state: 'LND',
          relationship_owner_address_line1: 'A building',
          relationship_owner_address_postal_code: 'EC1A 1AA',
          relationship_owner_dob_day: '1',
          relationship_owner_dob_month: '1',
          relationship_owner_dob_year: '1950'
        }, {
          relationship_owner_verification_document_front: TestHelper['success_id_scan_front.png'],
          relationship_owner_verification_document_back: TestHelper['success_id_scan_back.png']
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?ownerid=${owner.ownerid}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          relationship_owner_email: person.email,
          relationship_owner_first_name: person.firstName,
          relationship_owner_last_name: person.lastName,
          relationship_owner_address_country: 'GB',
          relationship_owner_address_city: 'London',
          relationship_owner_address_state: 'LND',
          relationship_owner_address_line1: '',
          relationship_owner_address_postal_code: 'EC1A 1AA',
          relationship_owner_dob_day: '1',
          relationship_owner_dob_month: '1',
          relationship_owner_dob_year: '1950'
        }
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_owner_address_line1')
      })
    })

    describe('invalid-relationship_owner_dob_day', () => {
      it('missing posted relationship_owner_dob_day', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'GB'
        })
        const person = TestHelper.nextIdentity()
        const owner = await TestHelper.createBeneficialOwner(user, {
          relationship_owner_email: person.email,
          relationship_owner_first_name: person.firstName,
          relationship_owner_last_name: person.lastName,
          relationship_owner_address_country: 'GB',
          relationship_owner_address_city: 'London',
          relationship_owner_address_state: 'LND',
          relationship_owner_address_line1: 'A building',
          relationship_owner_address_postal_code: 'EC1A 1AA',
          relationship_owner_dob_day: '1',
          relationship_owner_dob_month: '1',
          relationship_owner_dob_year: '1950'
        }, {
          relationship_owner_verification_document_front: TestHelper['success_id_scan_front.png'],
          relationship_owner_verification_document_back: TestHelper['success_id_scan_back.png']
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?ownerid=${owner.ownerid}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          relationship_owner_email: person.email,
          relationship_owner_first_name: person.firstName,
          relationship_owner_last_name: person.lastName,
          relationship_owner_address_country: 'GB',
          relationship_owner_address_city: 'London',
          relationship_owner_address_state: 'LND',
          relationship_owner_address_line1: 'A building',
          relationship_owner_address_postal_code: 'EC1A 1AA',
          relationship_owner_dob_day: '',
          relationship_owner_dob_month: '1',
          relationship_owner_dob_year: '1950'
        }
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_owner_dob_day')
      })

      it('invalid posted relationship_owner_dob_day', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'GB'
        })
        const person = TestHelper.nextIdentity()
        const owner = await TestHelper.createBeneficialOwner(user, {
          relationship_owner_email: person.email,
          relationship_owner_first_name: person.firstName,
          relationship_owner_last_name: person.lastName,
          relationship_owner_address_country: 'GB',
          relationship_owner_address_city: 'London',
          relationship_owner_address_state: 'LND',
          relationship_owner_address_line1: 'A building',
          relationship_owner_address_postal_code: 'EC1A 1AA',
          relationship_owner_dob_day: '1',
          relationship_owner_dob_month: '1',
          relationship_owner_dob_year: '1950'
        }, {
          relationship_owner_verification_document_front: TestHelper['success_id_scan_front.png'],
          relationship_owner_verification_document_back: TestHelper['success_id_scan_back.png']
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?ownerid=${owner.ownerid}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          relationship_owner_email: person.email,
          relationship_owner_first_name: person.firstName,
          relationship_owner_last_name: person.lastName,
          relationship_owner_address_country: 'GB',
          relationship_owner_address_city: 'London',
          relationship_owner_address_state: 'LND',
          relationship_owner_address_line1: 'A building',
          relationship_owner_address_postal_code: 'EC1A 1AA',
          relationship_owner_dob_day: 'invalid',
          relationship_owner_dob_month: '1',
          relationship_owner_dob_year: '1950'
        }
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_owner_dob_day')
      })
    })

    describe('invalid-relationship_owner_dob_month', () => {
      it('missing posted relationship_owner_dob_month', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'GB'
        })
        const person = TestHelper.nextIdentity()
        const owner = await TestHelper.createBeneficialOwner(user, {
          relationship_owner_email: person.email,
          relationship_owner_first_name: person.firstName,
          relationship_owner_last_name: person.lastName,
          relationship_owner_address_country: 'GB',
          relationship_owner_address_city: 'London',
          relationship_owner_address_state: 'LND',
          relationship_owner_address_line1: 'A building',
          relationship_owner_address_postal_code: 'EC1A 1AA',
          relationship_owner_dob_day: '1',
          relationship_owner_dob_month: '1',
          relationship_owner_dob_year: '1950'
        }, {
          relationship_owner_verification_document_front: TestHelper['success_id_scan_front.png'],
          relationship_owner_verification_document_back: TestHelper['success_id_scan_back.png']
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?ownerid=${owner.ownerid}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          relationship_owner_email: person.email,
          relationship_owner_first_name: person.firstName,
          relationship_owner_last_name: person.lastName,
          relationship_owner_address_country: 'GB',
          relationship_owner_address_city: 'London',
          relationship_owner_address_state: 'LND',
          relationship_owner_address_line1: 'A building',
          relationship_owner_address_postal_code: 'EC1A 1AA',
          relationship_owner_dob_day: '1',
          relationship_owner_dob_month: '',
          relationship_owner_dob_year: '1950'
        }
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_owner_dob_month')
      })

      it('invalid posted relationship_owner_dob_month', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'GB'
        })
        const person = TestHelper.nextIdentity()
        const owner = await TestHelper.createBeneficialOwner(user, {
          relationship_owner_email: person.email,
          relationship_owner_first_name: person.firstName,
          relationship_owner_last_name: person.lastName,
          relationship_owner_address_country: 'GB',
          relationship_owner_address_city: 'London',
          relationship_owner_address_state: 'LND',
          relationship_owner_address_line1: 'A building',
          relationship_owner_address_postal_code: 'EC1A 1AA',
          relationship_owner_dob_day: '1',
          relationship_owner_dob_month: '1',
          relationship_owner_dob_year: '1950'
        }, {
          relationship_owner_verification_document_front: TestHelper['success_id_scan_front.png'],
          relationship_owner_verification_document_back: TestHelper['success_id_scan_back.png']
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?ownerid=${owner.ownerid}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          relationship_owner_email: person.email,
          relationship_owner_first_name: person.firstName,
          relationship_owner_last_name: person.lastName,
          relationship_owner_address_country: 'GB',
          relationship_owner_address_city: 'London',
          relationship_owner_address_state: 'LND',
          relationship_owner_address_line1: 'A building',
          relationship_owner_address_postal_code: 'EC1A 1AA',
          relationship_owner_dob_day: '1',
          relationship_owner_dob_month: 'invalid',
          relationship_owner_dob_year: '1950'
        }
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_owner_dob_month')
      })
    })

    describe('invalid-relationship_owner_dob_year', () => {
      it('missing posted relationship_owner_dob_year', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'GB'
        })
        const person = TestHelper.nextIdentity()
        const owner = await TestHelper.createBeneficialOwner(user, {
          relationship_owner_email: person.email,
          relationship_owner_first_name: person.firstName,
          relationship_owner_last_name: person.lastName,
          relationship_owner_address_country: 'GB',
          relationship_owner_address_city: 'London',
          relationship_owner_address_state: 'LND',
          relationship_owner_address_line1: 'A building',
          relationship_owner_address_postal_code: 'EC1A 1AA',
          relationship_owner_dob_day: '1',
          relationship_owner_dob_month: '1',
          relationship_owner_dob_year: '1950'
        }, {
          relationship_owner_verification_document_front: TestHelper['success_id_scan_front.png'],
          relationship_owner_verification_document_back: TestHelper['success_id_scan_back.png']
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?ownerid=${owner.ownerid}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          relationship_owner_email: person.email,
          relationship_owner_first_name: person.firstName,
          relationship_owner_last_name: person.lastName,
          relationship_owner_address_country: 'GB',
          relationship_owner_address_city: 'London',
          relationship_owner_address_state: 'LND',
          relationship_owner_address_line1: 'A building',
          relationship_owner_address_postal_code: 'EC1A 1AA',
          relationship_owner_dob_day: '1',
          relationship_owner_dob_month: '1',
          relationship_owner_dob_year: ''
        }
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_owner_dob_year')
      })

      it('invalid posted relationship_owner_dob_year', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'GB'
        })
        const person = TestHelper.nextIdentity()
        const owner = await TestHelper.createBeneficialOwner(user, {
          relationship_owner_email: person.email,
          relationship_owner_first_name: person.firstName,
          relationship_owner_last_name: person.lastName,
          relationship_owner_address_country: 'GB',
          relationship_owner_address_city: 'London',
          relationship_owner_address_state: 'LND',
          relationship_owner_address_line1: 'A building',
          relationship_owner_address_postal_code: 'EC1A 1AA',
          relationship_owner_dob_day: '1',
          relationship_owner_dob_month: '1',
          relationship_owner_dob_year: '1950'
        }, {
          relationship_owner_verification_document_front: TestHelper['success_id_scan_front.png'],
          relationship_owner_verification_document_back: TestHelper['success_id_scan_back.png']
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?ownerid=${owner.ownerid}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          relationship_owner_email: person.email,
          relationship_owner_first_name: person.firstName,
          relationship_owner_last_name: person.lastName,
          relationship_owner_address_country: 'GB',
          relationship_owner_address_city: 'London',
          relationship_owner_address_state: 'LND',
          relationship_owner_address_line1: 'A building',
          relationship_owner_address_postal_code: 'EC1A 1AA',
          relationship_owner_dob_day: '1',
          relationship_owner_dob_month: '1',
          relationship_owner_dob_year: 'invalid'
        }
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_owner_dob_year')
      })
    })
  })

  describe('receives', () => {
    it('optionally-required posted token', async () => {
      global.stripeJS = 3
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'GB'
      })
      const person = TestHelper.nextIdentity()
      const owner = await TestHelper.createBeneficialOwner(user, {
        relationship_owner_email: person.email,
        relationship_owner_first_name: person.firstName,
        relationship_owner_last_name: person.lastName,
        relationship_owner_address_country: 'GB',
        relationship_owner_address_city: 'London',
        relationship_owner_address_state: 'LND',
        relationship_owner_address_line1: 'A building',
        relationship_owner_address_postal_code: 'EC1A 1AA',
        relationship_owner_dob_day: '1',
        relationship_owner_dob_month: '1',
        relationship_owner_dob_year: '1950',
        token: 'sample1'
      }, {
        relationship_owner_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_owner_verification_document_back: TestHelper['success_id_scan_back.png']
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?ownerid=${owner.ownerid}`)
      req.account = user.account
      req.session = user.session
      const body = {
        relationship_owner_email: person.email,
        relationship_owner_first_name: 'Modified name',
        relationship_owner_last_name: person.lastName,
        relationship_owner_address_country: 'GB',
        relationship_owner_address_state: 'LND',
        relationship_owner_address_city: 'London',
        relationship_owner_address_line1: 'A building',
        relationship_owner_address_postal_code: 'EC1A 1AA',
        relationship_owner_dob_day: '1',
        relationship_owner_dob_month: '1',
        relationship_owner_dob_year: '1950',
        token: 'sample2'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const ownerNow = await req.patch()
      assert.notStrictEqual(ownerNow.token, owner.token)
      assert.notStrictEqual(ownerNow.token, null)
      assert.notStrictEqual(ownerNow.token, undefined)
    })

    it('optional posted file relationship_owner_verification_document_front', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'GB'
      })
      const person = TestHelper.nextIdentity()
      const owner = await TestHelper.createBeneficialOwner(user, {
        relationship_owner_email: person.email,
        relationship_owner_first_name: person.firstName,
        relationship_owner_last_name: person.lastName,
        relationship_owner_address_country: 'GB',
        relationship_owner_address_city: 'London',
        relationship_owner_address_state: 'LND',
        relationship_owner_address_line1: 'A building',
        relationship_owner_address_postal_code: 'EC1A 1AA',
        relationship_owner_dob_day: '1',
        relationship_owner_dob_month: '1',
        relationship_owner_dob_year: '1950'
      }, {
        relationship_owner_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_owner_verification_document_back: TestHelper['success_id_scan_back.png']
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?ownerid=${owner.ownerid}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_owner_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const body = {
        relationship_owner_email: person.email,
        relationship_owner_first_name: 'Modified name',
        relationship_owner_last_name: person.lastName,
        relationship_owner_address_country: 'GB',
        relationship_owner_address_state: 'LND',
        relationship_owner_address_city: 'London',
        relationship_owner_address_line1: 'A building',
        relationship_owner_address_postal_code: 'EC1A 1AA',
        relationship_owner_dob_day: '1',
        relationship_owner_dob_month: '1',
        relationship_owner_dob_year: '1950'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const ownerNow = await req.patch()
      assert.notStrictEqual(ownerNow.relationship_owner_verification_document_front, owner.relationship_owner_verification_document_front)
      assert.notStrictEqual(ownerNow.relationship_owner_verification_document_front, null)
      assert.notStrictEqual(ownerNow.relationship_owner_verification_document_front, undefined)
    })

    it('optional posted file relationship_owner_verification_document_back', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'GB'
      })
      const person = TestHelper.nextIdentity()
      const owner = await TestHelper.createBeneficialOwner(user, {
        relationship_owner_email: person.email,
        relationship_owner_first_name: person.firstName,
        relationship_owner_last_name: person.lastName,
        relationship_owner_address_country: 'GB',
        relationship_owner_address_city: 'London',
        relationship_owner_address_state: 'LND',
        relationship_owner_address_line1: 'A building',
        relationship_owner_address_postal_code: 'EC1A 1AA',
        relationship_owner_dob_day: '1',
        relationship_owner_dob_month: '1',
        relationship_owner_dob_year: '1950'
      }, {
        relationship_owner_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_owner_verification_document_back: TestHelper['success_id_scan_back.png']
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?ownerid=${owner.ownerid}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_owner_verification_document_back: TestHelper['success_id_scan_front.png']
      }
      const body = {
        relationship_owner_email: person.email,
        relationship_owner_first_name: 'Modified name',
        relationship_owner_last_name: person.lastName,
        relationship_owner_address_country: 'GB',
        relationship_owner_address_state: 'LND',
        relationship_owner_address_city: 'London',
        relationship_owner_address_line1: 'A building',
        relationship_owner_address_postal_code: 'EC1A 1AA',
        relationship_owner_dob_day: '1',
        relationship_owner_dob_month: '1',
        relationship_owner_dob_year: '1950'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const ownerNow = await req.patch()
      assert.notStrictEqual(ownerNow.relationship_owner_verification_document_back, owner.relationship_owner_verification_document_back)
      assert.notStrictEqual(ownerNow.relationship_owner_verification_document_back, null)
      assert.notStrictEqual(ownerNow.relationship_owner_verification_document_back, undefined)
    })

    it('required posted relationship_owner_email', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'GB'
      })
      const person = TestHelper.nextIdentity()
      const owner = await TestHelper.createBeneficialOwner(user, {
        relationship_owner_email: 'random@email.com',
        relationship_owner_first_name: person.firstName,
        relationship_owner_last_name: person.lastName,
        relationship_owner_address_country: 'GB',
        relationship_owner_address_city: 'London',
        relationship_owner_address_state: 'LND',
        relationship_owner_address_line1: 'A building',
        relationship_owner_address_postal_code: 'EC1A 1AA',
        relationship_owner_dob_day: '1',
        relationship_owner_dob_month: '1',
        relationship_owner_dob_year: '1950'
      }, {
        relationship_owner_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_owner_verification_document_back: TestHelper['success_id_scan_back.png']
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?ownerid=${owner.ownerid}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_owner_email: person.email,
        relationship_owner_first_name: person.firstName,
        relationship_owner_last_name: person.lastName,
        relationship_owner_address_country: 'GB',
        relationship_owner_address_city: 'London',
        relationship_owner_address_state: 'LND',
        relationship_owner_address_line1: 'A building',
        relationship_owner_address_postal_code: 'EC1A 1AA',
        relationship_owner_dob_day: '1',
        relationship_owner_dob_month: '1',
        relationship_owner_dob_year: '1950'
      }
      const ownerNow = await req.patch()
      assert.strictEqual(ownerNow.relationship_owner_email, person.email)
    })

    it('required posted relationship_owner_first_name', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'GB'
      })
      const person = TestHelper.nextIdentity()
      const owner = await TestHelper.createBeneficialOwner(user, {
        relationship_owner_email: person.email,
        relationship_owner_first_name: 'Something',
        relationship_owner_last_name: person.lastName,
        relationship_owner_address_country: 'GB',
        relationship_owner_address_city: 'London',
        relationship_owner_address_state: 'LND',
        relationship_owner_address_line1: 'A building',
        relationship_owner_address_postal_code: 'EC1A 1AA',
        relationship_owner_dob_day: '1',
        relationship_owner_dob_month: '1',
        relationship_owner_dob_year: '1950'
      }, {
        relationship_owner_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_owner_verification_document_back: TestHelper['success_id_scan_back.png']
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?ownerid=${owner.ownerid}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_owner_email: person.email,
        relationship_owner_first_name: person.firstName,
        relationship_owner_last_name: person.lastName,
        relationship_owner_address_country: 'GB',
        relationship_owner_address_city: 'London',
        relationship_owner_address_state: 'LND',
        relationship_owner_address_line1: 'A building',
        relationship_owner_address_postal_code: 'EC1A 1AA',
        relationship_owner_dob_day: '1',
        relationship_owner_dob_month: '1',
        relationship_owner_dob_year: '1950'
      }
      const ownerNow = await req.patch()
      assert.strictEqual(ownerNow.relationship_owner_first_name, person.firstName)
    })

    it('required posted relationship_owner_last_name', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'GB'
      })
      const person = TestHelper.nextIdentity()
      const owner = await TestHelper.createBeneficialOwner(user, {
        relationship_owner_email: person.email,
        relationship_owner_first_name: person.firstName,
        relationship_owner_last_name: 'Something',
        relationship_owner_address_country: 'GB',
        relationship_owner_address_city: 'London',
        relationship_owner_address_state: 'LND',
        relationship_owner_address_line1: 'A building',
        relationship_owner_address_postal_code: 'EC1A 1AA',
        relationship_owner_dob_day: '1',
        relationship_owner_dob_month: '1',
        relationship_owner_dob_year: '1950'
      }, {
        relationship_owner_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_owner_verification_document_back: TestHelper['success_id_scan_back.png']
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?ownerid=${owner.ownerid}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_owner_email: person.email,
        relationship_owner_first_name: person.firstName,
        relationship_owner_last_name: person.lastName,
        relationship_owner_address_country: 'GB',
        relationship_owner_address_city: 'London',
        relationship_owner_address_state: 'LND',
        relationship_owner_address_line1: 'A building',
        relationship_owner_address_postal_code: 'EC1A 1AA',
        relationship_owner_dob_day: '1',
        relationship_owner_dob_month: '1',
        relationship_owner_dob_year: '1950'
      }
      const ownerNow = await req.patch()
      assert.strictEqual(ownerNow.relationship_owner_last_name, person.lastName)
    })

    it('required posted relationship_owner_address_line1', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'GB'
      })
      const person = TestHelper.nextIdentity()
      const owner = await TestHelper.createBeneficialOwner(user, {
        relationship_owner_email: person.email,
        relationship_owner_first_name: person.firstName,
        relationship_owner_last_name: person.lastName,
        relationship_owner_address_country: 'GB',
        relationship_owner_address_city: 'London',
        relationship_owner_address_state: 'LND',
        relationship_owner_address_line1: 'A building',
        relationship_owner_address_postal_code: 'EC1A 1AA',
        relationship_owner_dob_day: '1',
        relationship_owner_dob_month: '1',
        relationship_owner_dob_year: '1950'
      }, {
        relationship_owner_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_owner_verification_document_back: TestHelper['success_id_scan_back.png']
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?ownerid=${owner.ownerid}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_owner_email: person.email,
        relationship_owner_first_name: 'Modified name',
        relationship_owner_last_name: person.lastName,
        relationship_owner_address_country: 'GB',
        relationship_owner_address_city: 'London',
        relationship_owner_address_state: 'LND',
        relationship_owner_address_line1: '123 Sesame St',
        relationship_owner_address_postal_code: 'EC1A 1AA',
        relationship_owner_dob_day: '1',
        relationship_owner_dob_month: '1',
        relationship_owner_dob_year: '1950'
      }
      const ownerNow = await req.patch()
      assert.strictEqual(ownerNow.relationship_owner_address_line1, '123 Sesame St')
    })

    it('optional posted relationship_owner_address_line2', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'GB'
      })
      const person = TestHelper.nextIdentity()
      const owner = await TestHelper.createBeneficialOwner(user, {
        relationship_owner_email: person.email,
        relationship_owner_first_name: person.firstName,
        relationship_owner_last_name: person.lastName,
        relationship_owner_address_country: 'GB',
        relationship_owner_address_city: 'London',
        relationship_owner_address_state: 'LND',
        relationship_owner_address_line1: 'A building',
        relationship_owner_address_line2: 'More info',
        relationship_owner_address_postal_code: 'EC1A 1AA',
        relationship_owner_dob_day: '1',
        relationship_owner_dob_month: '1',
        relationship_owner_dob_year: '1950'
      }, {
        relationship_owner_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_owner_verification_document_back: TestHelper['success_id_scan_back.png']
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?ownerid=${owner.ownerid}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_owner_email: person.email,
        relationship_owner_first_name: 'Modified name',
        relationship_owner_last_name: person.lastName,
        relationship_owner_address_country: 'GB',
        relationship_owner_address_city: 'London',
        relationship_owner_address_state: 'LND',
        relationship_owner_address_line1: 'A building',
        relationship_owner_address_line2: 'New info',
        relationship_owner_address_postal_code: 'EC1A 1AA',
        relationship_owner_dob_day: '1',
        relationship_owner_dob_month: '1',
        relationship_owner_dob_year: '1950'
      }
      const ownerNow = await req.patch()
      assert.strictEqual(ownerNow.relationship_owner_address_line2, 'New info')
    })

    it('required posted relationship_owner_address_city', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'GB'
      })
      const person = TestHelper.nextIdentity()
      const owner = await TestHelper.createBeneficialOwner(user, {
        relationship_owner_email: person.email,
        relationship_owner_first_name: person.firstName,
        relationship_owner_last_name: person.lastName,
        relationship_owner_address_country: 'GB',
        relationship_owner_address_city: 'Manchester',
        relationship_owner_address_state: 'LND',
        relationship_owner_address_line1: 'A building',
        relationship_owner_address_postal_code: 'EC1A 1AA',
        relationship_owner_dob_day: '1',
        relationship_owner_dob_month: '1',
        relationship_owner_dob_year: '1950'
      }, {
        relationship_owner_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_owner_verification_document_back: TestHelper['success_id_scan_back.png']
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?ownerid=${owner.ownerid}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_owner_email: person.email,
        relationship_owner_first_name: 'Modified name',
        relationship_owner_last_name: person.lastName,
        relationship_owner_address_country: 'GB',
        relationship_owner_address_city: 'London',
        relationship_owner_address_state: 'LND',
        relationship_owner_address_line1: 'A building',
        relationship_owner_address_postal_code: 'EC1A 1AA',
        relationship_owner_dob_day: '1',
        relationship_owner_dob_month: '1',
        relationship_owner_dob_year: '1950'
      }
      const ownerNow = await req.patch()
      assert.strictEqual(ownerNow.relationship_owner_address_city, 'London')
    })

    it('required posted relationship_owner_address_state', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'GB'
      })
      const person = TestHelper.nextIdentity()
      const owner = await TestHelper.createBeneficialOwner(user, {
        relationship_owner_email: person.email,
        relationship_owner_first_name: person.firstName,
        relationship_owner_last_name: person.lastName,
        relationship_owner_address_country: 'GB',
        relationship_owner_address_city: 'London',
        relationship_owner_address_state: 'LUT',
        relationship_owner_address_line1: 'A building',
        relationship_owner_address_postal_code: 'EC1A 1AA',
        relationship_owner_dob_day: '1',
        relationship_owner_dob_month: '1',
        relationship_owner_dob_year: '1950'
      }, {
        relationship_owner_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_owner_verification_document_back: TestHelper['success_id_scan_back.png']
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?ownerid=${owner.ownerid}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_owner_email: person.email,
        relationship_owner_first_name: 'Modified name',
        relationship_owner_last_name: person.lastName,
        relationship_owner_address_country: 'GB',
        relationship_owner_address_city: 'London',
        relationship_owner_address_state: 'LND',
        relationship_owner_address_line1: 'A building',
        relationship_owner_address_postal_code: 'EC1A 1AA',
        relationship_owner_dob_day: '1',
        relationship_owner_dob_month: '1',
        relationship_owner_dob_year: '1950'
      }
      const ownerNow = await req.patch()
      assert.strictEqual(ownerNow.relationship_owner_address_state, 'LND')
    })

    it('required posted relationship_owner_address_country', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'GB'
      })
      const person = TestHelper.nextIdentity()
      const owner = await TestHelper.createBeneficialOwner(user, {
        relationship_owner_email: person.email,
        relationship_owner_first_name: person.firstName,
        relationship_owner_last_name: person.lastName,
        relationship_owner_address_country: 'GB',
        relationship_owner_address_city: 'London',
        relationship_owner_address_state: 'LND',
        relationship_owner_address_line1: 'A building',
        relationship_owner_address_postal_code: 'EC1A 1AA',
        relationship_owner_dob_day: '1',
        relationship_owner_dob_month: '1',
        relationship_owner_dob_year: '1950'
      }, {
        relationship_owner_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_owner_verification_document_back: TestHelper['success_id_scan_back.png']
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?ownerid=${owner.ownerid}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_owner_email: person.email,
        relationship_owner_first_name: 'Modified name',
        relationship_owner_last_name: person.lastName,
        relationship_owner_address_country: 'IE',
        relationship_owner_address_city: 'Dublin',
        relationship_owner_address_state: 'LM',
        relationship_owner_address_line1: 'A building',
        relationship_owner_address_postal_code: 'Dublin 1',
        relationship_owner_dob_day: '1',
        relationship_owner_dob_month: '1',
        relationship_owner_dob_year: '1950'
      }
      const ownerNow = await req.patch()
      assert.strictEqual(ownerNow.relationship_owner_address_country, 'IE')
    })

    it('required posted relationship_owner_address_postal_code', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'GB'
      })
      const person = TestHelper.nextIdentity()
      const owner = await TestHelper.createBeneficialOwner(user, {
        relationship_owner_email: person.email,
        relationship_owner_first_name: person.firstName,
        relationship_owner_last_name: person.lastName,
        relationship_owner_address_country: 'GB',
        relationship_owner_address_city: 'London',
        relationship_owner_address_state: 'LND',
        relationship_owner_address_line1: 'A building',
        relationship_owner_address_postal_code: 'EC1A 1AA',
        relationship_owner_dob_day: '1',
        relationship_owner_dob_month: '1',
        relationship_owner_dob_year: '1950'
      }, {
        relationship_owner_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_owner_verification_document_back: TestHelper['success_id_scan_back.png']
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?ownerid=${owner.ownerid}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_owner_email: person.email,
        relationship_owner_first_name: 'Modified name',
        relationship_owner_last_name: person.lastName,
        relationship_owner_address_country: 'GB',
        relationship_owner_address_city: 'London',
        relationship_owner_address_state: 'LND',
        relationship_owner_address_line1: 'A building',
        relationship_owner_address_postal_code: 'EC1A 1AB',
        relationship_owner_dob_day: '1',
        relationship_owner_dob_month: '1',
        relationship_owner_dob_year: '1950'
      }
      const ownerNow = await req.patch()
      assert.strictEqual(ownerNow.relationship_owner_address_postal_code, 'EC1A 1AB')
    })

    it('required posted relationship_owner_dob_day', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'GB'
      })
      const person = TestHelper.nextIdentity()
      const owner = await TestHelper.createBeneficialOwner(user, {
        relationship_owner_email: person.email,
        relationship_owner_first_name: person.firstName,
        relationship_owner_last_name: person.lastName,
        relationship_owner_address_country: 'GB',
        relationship_owner_address_city: 'London',
        relationship_owner_address_state: 'LND',
        relationship_owner_address_line1: 'A building',
        relationship_owner_address_postal_code: 'EC1A 1AA',
        relationship_owner_dob_day: '1',
        relationship_owner_dob_month: '1',
        relationship_owner_dob_year: '1950'
      }, {
        relationship_owner_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_owner_verification_document_back: TestHelper['success_id_scan_back.png']
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?ownerid=${owner.ownerid}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_owner_email: person.email,
        relationship_owner_first_name: 'Modified name',
        relationship_owner_last_name: person.lastName,
        relationship_owner_address_country: 'GB',
        relationship_owner_address_city: 'London',
        relationship_owner_address_state: 'LND',
        relationship_owner_address_line1: 'A building',
        relationship_owner_address_postal_code: 'EC1A 1AA',
        relationship_owner_dob_day: '1',
        relationship_owner_dob_month: '2',
        relationship_owner_dob_year: '1950'
      }
      const ownerNow = await req.patch()
      assert.strictEqual(ownerNow.relationship_owner_dob_day, '1')
    })

    it('required posted relationship_owner_dob_month', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'GB'
      })
      const person = TestHelper.nextIdentity()
      const owner = await TestHelper.createBeneficialOwner(user, {
        relationship_owner_email: person.email,
        relationship_owner_first_name: person.firstName,
        relationship_owner_last_name: person.lastName,
        relationship_owner_address_country: 'GB',
        relationship_owner_address_city: 'London',
        relationship_owner_address_state: 'LND',
        relationship_owner_address_line1: 'A building',
        relationship_owner_address_postal_code: 'EC1A 1AA',
        relationship_owner_dob_day: '1',
        relationship_owner_dob_month: '1',
        relationship_owner_dob_year: '1950'
      }, {
        relationship_owner_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_owner_verification_document_back: TestHelper['success_id_scan_back.png']
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?ownerid=${owner.ownerid}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_owner_email: person.email,
        relationship_owner_first_name: 'Modified name',
        relationship_owner_last_name: person.lastName,
        relationship_owner_address_country: 'GB',
        relationship_owner_address_city: 'London',
        relationship_owner_address_state: 'LND',
        relationship_owner_address_line1: 'A building',
        relationship_owner_address_postal_code: 'EC1A 1AA',
        relationship_owner_dob_day: '1',
        relationship_owner_dob_month: '2',
        relationship_owner_dob_year: '1950'
      }
      const ownerNow = await req.patch()
      assert.strictEqual(ownerNow.relationship_owner_dob_month, '2')
    })

    it('required posted relationship_owner_dob_year', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'GB'
      })
      const person = TestHelper.nextIdentity()
      const owner = await TestHelper.createBeneficialOwner(user, {
        relationship_owner_email: person.email,
        relationship_owner_first_name: person.firstName,
        relationship_owner_last_name: person.lastName,
        relationship_owner_address_country: 'GB',
        relationship_owner_address_city: 'London',
        relationship_owner_address_state: 'LND',
        relationship_owner_address_line1: 'A building',
        relationship_owner_address_postal_code: 'EC1A 1AA',
        relationship_owner_dob_day: '1',
        relationship_owner_dob_month: '1',
        relationship_owner_dob_year: '1950'
      }, {
        relationship_owner_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_owner_verification_document_back: TestHelper['success_id_scan_back.png']
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?ownerid=${owner.ownerid}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_owner_email: person.email,
        relationship_owner_first_name: 'Modified name',
        relationship_owner_last_name: person.lastName,
        relationship_owner_address_country: 'GB',
        relationship_owner_address_city: 'London',
        relationship_owner_address_state: 'LND',
        relationship_owner_address_line1: 'A building',
        relationship_owner_address_postal_code: 'EC1A 1AA',
        relationship_owner_dob_day: '1',
        relationship_owner_dob_month: '1',
        relationship_owner_dob_year: '1950'
      }
      const ownerNow = await req.patch()
      assert.strictEqual(ownerNow.relationship_owner_dob_year, '1950')
    })
  })

  describe('returns', () => {
    it('object', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'GB'
      })
      const person = TestHelper.nextIdentity()
      const owner = await TestHelper.createBeneficialOwner(user, {
        relationship_owner_email: person.email,
        relationship_owner_first_name: person.firstName,
        relationship_owner_last_name: person.lastName,
        relationship_owner_address_country: 'GB',
        relationship_owner_address_state: 'LND',
        relationship_owner_address_city: 'London',
        relationship_owner_address_line1: 'A building',
        relationship_owner_address_postal_code: 'EC1A 1AA',
        relationship_owner_dob_day: '1',
        relationship_owner_dob_month: '1',
        relationship_owner_dob_year: '1950'
      }, {
        relationship_owner_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_owner_verification_document_back: TestHelper['success_id_scan_back.png']
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?ownerid=${owner.ownerid}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_owner_email: person.email,
        relationship_owner_first_name: 'Modified name',
        relationship_owner_last_name: person.lastName,
        relationship_owner_address_country: 'GB',
        relationship_owner_address_state: 'LND',
        relationship_owner_address_city: 'London',
        relationship_owner_address_line1: 'A building',
        relationship_owner_address_postal_code: 'EC1A 1AA',
        relationship_owner_dob_day: '1',
        relationship_owner_dob_month: '1',
        relationship_owner_dob_year: '1950'
      }
      const ownerNow = await req.patch()
      assert.strictEqual(ownerNow.relationship_owner_first_name, 'Modified name')
    })
  })

  describe('configuration', () => {
    it('environment STRIPE_JS', async () => {
      global.stripeJS = 3
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'GB'
      })
      const person = TestHelper.nextIdentity()
      const req = TestHelper.createRequest(`/account/connect/create-beneficial-owner?stripeid=${user.stripeAccount.id}`)
      req.waitOnSubmit = true
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_owner_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_owner_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      req.body = {
        relationship_owner_email: person.email,
        relationship_owner_first_name: person.firstName,
        relationship_owner_last_name: person.lastName,
        relationship_owner_address_country: 'GB',
        relationship_owner_address_city: 'London',
        relationship_owner_address_state: 'LND',
        relationship_owner_address_line1: 'A building',
        relationship_owner_address_postal_code: 'EC1A 1AA',
        relationship_owner_dob_day: '1',
        relationship_owner_dob_month: '1',
        relationship_owner_dob_year: '1950'
      }
      await req.post()
      const owners = await global.api.user.connect.BeneficialOwners.get(req)
      const owner = owners[0]
      const req2 = TestHelper.createRequest(`/account/connect/edit-beneficial-owner?ownerid=${owner.ownerid}`)
      req2.waitOnSubmit = true
      req2.account = user.account
      req2.session = user.session
      req2.body = {
        relationship_owner_email: person.email,
        relationship_owner_first_name: 'Modified name',
        relationship_owner_last_name: person.lastName,
        relationship_owner_address_country: 'GB',
        relationship_owner_address_state: 'LND',
        relationship_owner_address_city: 'London',
        relationship_owner_address_line1: 'A building',
        relationship_owner_address_postal_code: 'EC1A 1AA',
        relationship_owner_dob_day: '1',
        relationship_owner_dob_month: '1',
        relationship_owner_dob_year: '1950'
      }
      await req2.post()
      const ownerNow = await global.api.user.connect.BeneficialOwner.get(req2)
      assert.notStrictEqual(ownerNow.token, owner.token)
      assert.notStrictEqual(ownerNow.token, null)
      assert.notStrictEqual(ownerNow.token, undefined)
    })
  })
})
