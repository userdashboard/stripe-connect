/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')

describe('/api/user/connect/company-director', () => {
  describe('exceptions', () => {
    describe('invalid-directorid', () => {
      it('missing querystring directorid', async () => {
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/connect/company-director')
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.get()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-directorid')
      })

      it('invalid querystring directorid', async () => {
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/connect/company-director?directorid=invalid')
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.get()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-directorid')
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
        await TestHelper.createCompanyDirector(user, {
          relationship_director_first_name: person.firstName,
          relationship_director_last_name: person.lastName,
          relationship_director_dob_day: '1',
          relationship_director_dob_month: '1',
          relationship_director_dob_year: '1950'
        }, {
          relationship_director_verification_document_front: TestHelper['success_id_scan_front.png'],
          relationship_director_verification_document_back: TestHelper['success_id_scan_back.png']
        })
        const user2 = await TestHelper.createUser()
        const req = TestHelper.createRequest(`/api/user/connect/company-director?directorid=${user.director.directorid}`)
        req.account = user2.account
        req.session = user2.session
        let errorMessage
        try {
          await req.get()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-account')
      })
    })
  })

  describe('returns', () => {
    it('object', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'DE'
      })
      const person = TestHelper.nextIdentity()
      await TestHelper.createCompanyDirector(user, {
        relationship_director_first_name: person.firstName,
        relationship_director_last_name: person.lastName,
        relationship_director_dob_day: '1',
        relationship_director_dob_month: '1',
        relationship_director_dob_year: '1950'
      }, {
        relationship_director_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_director_verification_document_back: TestHelper['success_id_scan_back.png']
      })
      const req = TestHelper.createRequest(`/api/user/connect/company-director?directorid=${user.director.directorid}`)
      req.account = user.account
      req.session = user.session
      const director = await req.get()
      assert.strictEqual(director.id, user.director.id)
    })
  })
})
