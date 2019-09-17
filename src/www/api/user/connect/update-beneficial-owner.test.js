/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')

describe('/api/user/connect/update-beneficial-owner', async () => {
  describe('exceptions', () => {
    describe('invalid-ownerid', () => {
      it('missing querystring ownerid', async () => {
        const user = await TestHelper.createUser()
        const person = TestHelper.nextIdentity()
        const req = TestHelper.createRequest('/api/user/connect/update-beneficial-owner')
        req.account = user.account
        req.session = user.session
        req.body = {
          relationship_owner_first_name: person.firstName,
          relationship_owner_last_name: person.lastName,
          relationship_owner_address_country: 'GB',
          relationship_owner_address_city: 'London',
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
          relationship_owner_first_name: person.firstName,
          relationship_owner_last_name: person.lastName,
          relationship_owner_address_country: 'GB',
          relationship_owner_address_city: 'London',
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
          relationship_owner_first_name: person.firstName,
          relationship_owner_last_name: person.lastName,
          relationship_owner_address_country: 'GB',
          relationship_owner_address_city: 'London',
          relationship_owner_address_line1: 'A building',
          relationship_owner_address_postal_code: 'EC1A 1AA',
          relationship_owner_dob_day: '1',
          relationship_owner_dob_month: '1',
          relationship_owner_dob_year: '1950'
        })
        const user2 = await TestHelper.createUser()
        const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?ownerid=${owner.ownerid}`)
        req.account = user2.account
        req.session = user2.session
        req.body = {
          relationship_owner_first_name: person.firstName,
          relationship_owner_last_name: person.lastName,
          relationship_owner_address_country: 'GB',
          relationship_owner_address_city: 'London',
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
          relationship_owner_first_name: person.firstName,
          relationship_owner_last_name: person.lastName,
          relationship_owner_address_country: 'GB',
          relationship_owner_address_city: 'London',
          relationship_owner_address_line1: 'A building',
          relationship_owner_address_postal_code: 'EC1A 1AA',
          relationship_owner_dob_day: '1',
          relationship_owner_dob_month: '1',
          relationship_owner_dob_year: '1950'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?ownerid=${owner.ownerid}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          relationship_owner_first_name: '',
          relationship_owner_last_name: person.lastName,
          relationship_owner_address_country: 'GB',
          relationship_owner_address_city: 'London',
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
          relationship_owner_first_name: person.firstName,
          relationship_owner_last_name: person.lastName,
          relationship_owner_address_country: 'GB',
          relationship_owner_address_city: 'London',
          relationship_owner_address_line1: 'A building',
          relationship_owner_address_postal_code: 'EC1A 1AA',
          relationship_owner_dob_day: '1',
          relationship_owner_dob_month: '1',
          relationship_owner_dob_year: '1950'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?ownerid=${owner.ownerid}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          relationship_owner_first_name: person.firstName,
          relationship_owner_last_name: '',
          relationship_owner_address_country: 'GB',
          relationship_owner_address_city: 'London',
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
          relationship_owner_first_name: person.firstName,
          relationship_owner_last_name: person.lastName,
          relationship_owner_address_country: 'GB',
          relationship_owner_address_city: 'London',
          relationship_owner_address_line1: 'A building',
          relationship_owner_address_postal_code: 'EC1A 1AA',
          relationship_owner_dob_day: '1',
          relationship_owner_dob_month: '1',
          relationship_owner_dob_year: '1950'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?ownerid=${owner.ownerid}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          relationship_owner_first_name: person.firstName,
          relationship_owner_last_name: person.lastName,
          relationship_owner_address_country: '',
          relationship_owner_address_city: 'London',
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

    describe('invalid-relationship_owner_address_city', () => {
      it('missing posted relationship_owner_address_city', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'GB'
        })
        const person = TestHelper.nextIdentity()
        const owner = await TestHelper.createBeneficialOwner(user, {
          relationship_owner_first_name: person.firstName,
          relationship_owner_last_name: person.lastName,
          relationship_owner_address_country: 'GB',
          relationship_owner_address_city: 'London',
          relationship_owner_address_line1: 'A building',
          relationship_owner_address_postal_code: 'EC1A 1AA',
          relationship_owner_dob_day: '1',
          relationship_owner_dob_month: '1',
          relationship_owner_dob_year: '1950'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?ownerid=${owner.ownerid}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          relationship_owner_first_name: person.firstName,
          relationship_owner_last_name: person.lastName,
          relationship_owner_address_country: 'GB',
          relationship_owner_address_city: '',
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
          relationship_owner_first_name: person.firstName,
          relationship_owner_last_name: person.lastName,
          relationship_owner_address_country: 'GB',
          relationship_owner_address_city: 'London',
          relationship_owner_address_line1: 'A building',
          relationship_owner_address_postal_code: 'EC1A 1AA',
          relationship_owner_dob_day: '1',
          relationship_owner_dob_month: '1',
          relationship_owner_dob_year: '1950'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?ownerid=${owner.ownerid}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          relationship_owner_first_name: person.firstName,
          relationship_owner_last_name: person.lastName,
          relationship_owner_address_country: 'GB',
          relationship_owner_address_city: 'London',
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
          relationship_owner_first_name: person.firstName,
          relationship_owner_last_name: person.lastName,
          relationship_owner_address_country: 'GB',
          relationship_owner_address_city: 'London',
          relationship_owner_address_line1: 'A building',
          relationship_owner_address_postal_code: 'EC1A 1AA',
          relationship_owner_dob_day: '1',
          relationship_owner_dob_month: '1',
          relationship_owner_dob_year: '1950'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?ownerid=${owner.ownerid}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          relationship_owner_first_name: person.firstName,
          relationship_owner_last_name: person.lastName,
          relationship_owner_address_country: 'GB',
          relationship_owner_address_city: 'London',
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
          relationship_owner_first_name: person.firstName,
          relationship_owner_last_name: person.lastName,
          relationship_owner_address_country: 'GB',
          relationship_owner_address_city: 'London',
          relationship_owner_address_line1: 'A building',
          relationship_owner_address_postal_code: 'EC1A 1AA',
          relationship_owner_dob_day: '1',
          relationship_owner_dob_month: '1',
          relationship_owner_dob_year: '1950'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?ownerid=${owner.ownerid}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          relationship_owner_first_name: person.firstName,
          relationship_owner_last_name: person.lastName,
          relationship_owner_address_country: 'GB',
          relationship_owner_address_city: 'London',
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
          relationship_owner_first_name: person.firstName,
          relationship_owner_last_name: person.lastName,
          relationship_owner_address_country: 'GB',
          relationship_owner_address_city: 'London',
          relationship_owner_address_line1: 'A building',
          relationship_owner_address_postal_code: 'EC1A 1AA',
          relationship_owner_dob_day: '1',
          relationship_owner_dob_month: '1',
          relationship_owner_dob_year: '1950'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?ownerid=${owner.ownerid}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          relationship_owner_first_name: person.firstName,
          relationship_owner_last_name: person.lastName,
          relationship_owner_address_country: 'GB',
          relationship_owner_address_city: 'London',
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
          relationship_owner_first_name: person.firstName,
          relationship_owner_last_name: person.lastName,
          relationship_owner_address_country: 'GB',
          relationship_owner_address_city: 'London',
          relationship_owner_address_line1: 'A building',
          relationship_owner_address_postal_code: 'EC1A 1AA',
          relationship_owner_dob_day: '1',
          relationship_owner_dob_month: '1',
          relationship_owner_dob_year: '1950'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?ownerid=${owner.ownerid}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          relationship_owner_first_name: person.firstName,
          relationship_owner_last_name: person.lastName,
          relationship_owner_address_country: 'GB',
          relationship_owner_address_city: 'London',
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
        relationship_owner_first_name: person.firstName,
        relationship_owner_last_name: person.lastName,
        relationship_owner_address_country: 'GB',
        relationship_owner_address_city: 'London',
        relationship_owner_address_line1: 'A building',
        relationship_owner_address_postal_code: 'EC1A 1AA',
        relationship_owner_dob_day: '1',
        relationship_owner_dob_month: '1',
        relationship_owner_dob_year: '1950'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?ownerid=${owner.ownerid}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_owner_first_name: 'Modified name',
        relationship_owner_last_name: person.lastName,
        relationship_owner_address_country: 'GB',
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
})
