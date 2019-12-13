/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')

describe.only('/api/user/connect/update-company-director', () => {
  describe('exceptions', () => {
    describe('invalid-directorid', () => {
      it('missing querystring directorid', async () => {
        const user = await TestHelper.createUser()
        const person = TestHelper.nextIdentity()
        const req = TestHelper.createRequest('/api/user/connect/update-company-director')
        req.account = user.account
        req.session = user.session
        req.body = {
          relationship_director_first_name: person.firstName,
          relationship_director_last_name: person.lastName,
          relationship_director_dob_day: '1',
          relationship_director_dob_month: '1',
          relationship_director_dob_year: '1950'
        }
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-directorid')
      })

      it('invalid querystring directorid', async () => {
        const user = await TestHelper.createUser()
        const person = TestHelper.nextIdentity()
        const req = TestHelper.createRequest('/api/user/connect/update-company-director?directorid=invalid')
        req.account = user.account
        req.session = user.session
        req.body = {
          relationship_director_first_name: person.firstName,
          relationship_director_last_name: person.lastName,
          relationship_director_dob_day: '1',
          relationship_director_dob_month: '1',
          relationship_director_dob_year: '1950'
        }
        let errorMessage
        try {
          await req.patch(req)
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
        const director = await TestHelper.createCompanyDirector(user, {
          relationship_director_first_name: person.firstName,
          relationship_director_last_name: person.lastName,
          relationship_director_dob_day: '1',
          relationship_director_dob_month: '1',
          relationship_director_dob_year: '1950'
        })
        const user2 = await TestHelper.createUser()
        const req = TestHelper.createRequest(`/api/user/connect/update-company-director?directorid=${director.directorid}`)
        req.account = user2.account
        req.session = user2.session
        req.body = {
          relationship_director_first_name: person.firstName,
          relationship_director_last_name: person.lastName,
          relationship_director_dob_day: '1',
          relationship_director_dob_month: '1',
          relationship_director_dob_year: '1950'
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

    describe('invalid-relationship_director_first_name', () => {
      it('missing posted relationship_director_first_name', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'GB'
        })
        const person = TestHelper.nextIdentity()
        const director = await TestHelper.createCompanyDirector(user, {
          relationship_director_first_name: person.firstName,
          relationship_director_last_name: person.lastName,
          relationship_director_dob_day: '1',
          relationship_director_dob_month: '1',
          relationship_director_dob_year: '1950'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-director?directorid=${director.directorid}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          relationship_director_first_name: '',
          relationship_director_last_name: person.lastName,
          relationship_director_dob_day: '1',
          relationship_director_dob_month: '1',
          relationship_director_dob_year: '1950'
        }
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_director_first_name')
      })
    })

    describe('invalid-relationship_director_last_name', () => {
      it('missing posted relationship_director_last_name', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'GB'
        })
        const person = TestHelper.nextIdentity()
        const director = await TestHelper.createCompanyDirector(user, {
          relationship_director_first_name: person.firstName,
          relationship_director_last_name: person.lastName,
          relationship_director_dob_day: '1',
          relationship_director_dob_month: '1',
          relationship_director_dob_year: '1950'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-director?directorid=${director.directorid}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          relationship_director_first_name: person.firstName,
          relationship_director_last_name: '',
          relationship_director_dob_day: '1',
          relationship_director_dob_month: '1',
          relationship_director_dob_year: '1950'
        }
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_director_last_name')
      })
    })

    describe('invalid relationship_director_dob_day', () => {
      it('missing posted relationship_director_dob_day', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'GB'
        })
        const person = TestHelper.nextIdentity()
        const director = await TestHelper.createCompanyDirector(user, {
          relationship_director_first_name: person.firstName,
          relationship_director_last_name: person.lastName,
          relationship_director_dob_day: '1',
          relationship_director_dob_month: '1',
          relationship_director_dob_year: '1950'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-director?directorid=${director.directorid}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          relationship_director_first_name: person.firstName,
          relationship_director_last_name: person.lastName,
          relationship_director_dob_day: '',
          relationship_director_dob_month: '1',
          relationship_director_dob_year: '1950'
        }
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_director_dob_day')
      })

      it('invalid posted relationship_director_dob_day', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'GB'
        })
        const person = TestHelper.nextIdentity()
        const director = await TestHelper.createCompanyDirector(user, {
          relationship_director_first_name: person.firstName,
          relationship_director_last_name: person.lastName,
          relationship_director_dob_day: '1',
          relationship_director_dob_month: '1',
          relationship_director_dob_year: '1950'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-director?directorid=${director.directorid}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          relationship_director_first_name: person.firstName,
          relationship_director_last_name: person.lastName,
          relationship_director_dob_day: '46',
          relationship_director_dob_month: '1',
          relationship_director_dob_year: '1950'
        }
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_director_dob_day')
      })
    })

    describe('invalid-relationship_director_dob_month', () => {
      it('missing posted relationship_director_dob_month', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'GB'
        })
        const person = TestHelper.nextIdentity()
        const director = await TestHelper.createCompanyDirector(user, {
          relationship_director_first_name: person.firstName,
          relationship_director_last_name: person.lastName,
          relationship_director_dob_day: '1',
          relationship_director_dob_month: '1',
          relationship_director_dob_year: '1950'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-director?directorid=${director.directorid}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          relationship_director_first_name: person.firstName,
          relationship_director_last_name: person.lastName,
          relationship_director_dob_day: '1',
          relationship_director_dob_month: '',
          relationship_director_dob_year: '1950'
        }
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_director_dob_month')
      })

      it('invalid posted relationship_director_dob_month', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'GB'
        })
        const person = TestHelper.nextIdentity()
        const director = await TestHelper.createCompanyDirector(user, {
          relationship_director_first_name: person.firstName,
          relationship_director_last_name: person.lastName,
          relationship_director_dob_day: '1',
          relationship_director_dob_month: '1',
          relationship_director_dob_year: '1950'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-director?directorid=${director.directorid}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          relationship_director_first_name: person.firstName,
          relationship_director_last_name: person.lastName,
          relationship_director_dob_day: '1',
          relationship_director_dob_month: '15',
          relationship_director_dob_year: '1950'
        }
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_director_dob_month')
      })
    })

    describe('invalid-relationship_director_dob_year', () => {
      it('missing posted relationship_director_dob_year', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'GB'
        })
        const person = TestHelper.nextIdentity()
        const director = await TestHelper.createCompanyDirector(user, {
          relationship_director_first_name: person.firstName,
          relationship_director_last_name: person.lastName,
          relationship_director_dob_day: '1',
          relationship_director_dob_month: '1',
          relationship_director_dob_year: '1950'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-director?directorid=${director.directorid}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          relationship_director_first_name: person.firstName,
          relationship_director_last_name: person.lastName,
          relationship_director_dob_day: '1',
          relationship_director_dob_month: '1',
          relationship_director_dob_year: ''
        }
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_director_dob_year')
      })

      it('invalid posted relationship_director_dob_year', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          type: 'company',
          country: 'GB'
        })
        const person = TestHelper.nextIdentity()
        const director = await TestHelper.createCompanyDirector(user, {
          relationship_director_first_name: person.firstName,
          relationship_director_last_name: person.lastName,
          relationship_director_dob_day: '1',
          relationship_director_dob_month: '1',
          relationship_director_dob_year: '1950'
        })
        const req = TestHelper.createRequest(`/api/user/connect/update-company-director?directorid=${director.directorid}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          relationship_director_first_name: person.firstName,
          relationship_director_last_name: person.lastName,
          relationship_director_dob_day: '1',
          relationship_director_dob_month: '1',
          relationship_director_dob_year: 'invalid'
        }
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_director_dob_year')
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
      const director = await TestHelper.createCompanyDirector(user, {
        relationship_director_first_name: person.firstName,
        relationship_director_last_name: person.lastName,
        relationship_director_dob_day: '1',
        relationship_director_dob_month: '1',
        relationship_director_dob_year: '1950',
        token: 'sample1'
      }, {
        relationship_director_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_director_verification_document_back: TestHelper['success_id_scan_back.png']
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-director?directorid=${director.directorid}`)
      req.account = user.account
      req.session = user.session
      const body = {
        relationship_director_first_name: 'Modified name',
        relationship_director_last_name: person.lastName,
        relationship_director_dob_day: '1',
        relationship_director_dob_month: '1',
        relationship_director_dob_year: '1950',
        token: 'sample2'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const directorNow = await req.patch()
      assert.notStrictEqual(directorNow.token, director.token)
    })

    it('optional posted file relationship_director_verification_document_front', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'GB'
      })
      const person = TestHelper.nextIdentity()
      const director = await TestHelper.createCompanyDirector(user, {
        relationship_director_first_name: person.firstName,
        relationship_director_last_name: person.lastName,
        relationship_director_dob_day: '1',
        relationship_director_dob_month: '1',
        relationship_director_dob_year: '1950'
      }, {
        relationship_director_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_director_verification_document_back: TestHelper['success_id_scan_back.png']
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-director?directorid=${director.directorid}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_director_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      const body = {
        relationship_director_first_name: 'Modified name',
        relationship_director_last_name: person.lastName,
        relationship_director_dob_day: '1',
        relationship_director_dob_month: '1',
        relationship_director_dob_year: '1950'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const directorNow = await req.patch()
      assert.notStrictEqual(directorNow.relationship_director_verification_document_front, director.relationship_director_verification_document_front)
    })

    it('optional posted file relationship_director_verification_document_back', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'GB'
      })
      const person = TestHelper.nextIdentity()
      const director = await TestHelper.createCompanyDirector(user, {
        relationship_director_first_name: person.firstName,
        relationship_director_last_name: person.lastName,
        relationship_director_dob_day: '1',
        relationship_director_dob_month: '1',
        relationship_director_dob_year: '1950'
      }, {
        relationship_director_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_director_verification_document_back: TestHelper['success_id_scan_back.png']
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-director?directorid=${director.directorid}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_director_verification_document_back: TestHelper['success_id_scan_front.png']
      }
      const body = {
        relationship_director_first_name: 'Modified name',
        relationship_director_last_name: person.lastName,
        relationship_director_dob_day: '1',
        relationship_director_dob_month: '1',
        relationship_director_dob_year: '1950'
      }
      req.body = TestHelper.createMultiPart(req, body)
      const directorNow = await req.patch()
      assert.notStrictEqual(directorNow.relationship_director_verification_document_back, director.relationship_director_verification_document_back)
    })

    it('required posted relationship_director_first_name', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'GB'
      })
      const person = TestHelper.nextIdentity()
      const director = await TestHelper.createCompanyDirector(user, {
        relationship_director_first_name: person.firstName,
        relationship_director_last_name: person.lastName,
        relationship_director_dob_day: '1',
        relationship_director_dob_month: '1',
        relationship_director_dob_year: '1950'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-director?directorid=${director.directorid}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_director_first_name: '',
        relationship_director_last_name: person.lastName,
        relationship_director_dob_day: '1',
        relationship_director_dob_month: '1',
        relationship_director_dob_year: '1950'
      }
      let errorMessage
      try {
        await req.patch(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-relationship_director_first_name')
    })

    it('required posted relationship_director_last_name', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'GB'
      })
      const person = TestHelper.nextIdentity()
      const director = await TestHelper.createCompanyDirector(user, {
        relationship_director_first_name: person.firstName,
        relationship_director_last_name: person.lastName,
        relationship_director_dob_day: '1',
        relationship_director_dob_month: '1',
        relationship_director_dob_year: '1950'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-director?directorid=${director.directorid}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_director_first_name: person.firstName,
        relationship_director_last_name: '',
        relationship_director_dob_day: '1',
        relationship_director_dob_month: '1',
        relationship_director_dob_year: '1950'
      }
      let errorMessage
      try {
        await req.patch(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-relationship_director_last_name')
    })

    it('required posted relationship_director_dob_day', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'GB'
      })
      const person = TestHelper.nextIdentity()
      const director = await TestHelper.createCompanyDirector(user, {
        relationship_director_first_name: person.firstName,
        relationship_director_last_name: person.lastName,
        relationship_director_dob_day: '1',
        relationship_director_dob_month: '1',
        relationship_director_dob_year: '1950'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-director?directorid=${director.directorid}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_director_first_name: person.firstName,
        relationship_director_last_name: person.lastName,
        relationship_director_dob_day: '',
        relationship_director_dob_month: '1',
        relationship_director_dob_year: '1950'
      }
      let errorMessage
      try {
        await req.patch(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-relationship_director_dob_day')
    })

    it('required posted relationship_director_dob_month', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'GB'
      })
      const person = TestHelper.nextIdentity()
      const director = await TestHelper.createCompanyDirector(user, {
        relationship_director_first_name: person.firstName,
        relationship_director_last_name: person.lastName,
        relationship_director_dob_day: '1',
        relationship_director_dob_month: '1',
        relationship_director_dob_year: '1950'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-director?directorid=${director.directorid}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_director_first_name: person.firstName,
        relationship_director_last_name: person.lastName,
        relationship_director_dob_day: '1',
        relationship_director_dob_month: '',
        relationship_director_dob_year: '1950'
      }
      let errorMessage
      try {
        await req.patch(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-relationship_director_dob_month')
    })

    it('required posted relationship_director_dob_year', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        type: 'company',
        country: 'GB'
      })
      const person = TestHelper.nextIdentity()
      const director = await TestHelper.createCompanyDirector(user, {
        relationship_director_first_name: person.firstName,
        relationship_director_last_name: person.lastName,
        relationship_director_dob_day: '1',
        relationship_director_dob_month: '1',
        relationship_director_dob_year: '1950'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-director?directorid=${director.directorid}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_director_first_name: person.firstName,
        relationship_director_last_name: person.lastName,
        relationship_director_dob_day: '1',
        relationship_director_dob_month: '1',
        relationship_director_dob_year: ''
      }
      let errorMessage
      try {
        await req.patch(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-relationship_director_dob_year')
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
      const director = await TestHelper.createCompanyDirector(user, {
        relationship_director_first_name: person.firstName,
        relationship_director_last_name: person.lastName,
        relationship_director_dob_day: '1',
        relationship_director_dob_month: '1',
        relationship_director_dob_year: '1950'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-company-director?directorid=${director.directorid}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_director_first_name: 'Modified name',
        relationship_director_last_name: person.lastName,
        relationship_director_dob_day: '1',
        relationship_director_dob_month: '1',
        relationship_director_dob_year: '1950'
      }
      const directorNow = await req.patch()
      assert.strictEqual(directorNow.relationship_director_first_name, 'Modified name')
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
      const req = TestHelper.createRequest(`/account/connect/create-company-director?stripeid=${user.stripeAccount.id}`)
      req.waitOnSubmit = true
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_director_verification_document_front: TestHelper['success_id_scan_front.png'],
        relationship_director_verification_document_back: TestHelper['success_id_scan_back.png']
      }
      req.body = {
        relationship_director_first_name: person.firstName,
        relationship_director_last_name: person.lastName,
        relationship_director_dob_day: '1',
        relationship_director_dob_month: '1',
        relationship_director_dob_year: '1950'
      }
      await req.post()
      const directors = await global.api.user.connect.CompanyDirectors.get(req)
      const director = directors[0]
      const req2 = TestHelper.createRequest(`/account/connect/edit-company-director?directorid=${director.directorid}`)
      req2.waitOnSubmit = true
      req2.account = user.account
      req2.session = user.session
      req2.body = {
        relationship_director_first_name: person.firstName,
        relationship_director_last_name: person.lastName,
        relationship_director_dob_day: '1',
        relationship_director_dob_month: '1',
        relationship_director_dob_year: '1950'
      }
      await req2.post()
      const directorNow = await global.api.user.connect.CompanyDirector.get(req2)
      assert.notStrictEqual(directorNow.token, director.token)
      assert.notStrictEqual(directorNow.token, null)
      assert.notStrictEqual(directorNow.token, undefined)
    })
  })
})
