/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')

describe('/api/user/connect/create-company-director', () => {
  describe('exceptions', () => {
    describe('invalid-stripeid', () => {
      it('missing querystring stripeid', async () => {
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/connect/create-company-director')
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-stripeid')
      })

      it('invalid querystring stripeid', async () => {
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/connect/create-company-director?stripeid=invalid')
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-stripeid')
      })
    })

    describe('invalid-account', () => {
      it('ineligible accessing account', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'US',
          type: 'company'
        })
        const user2 = await TestHelper.createUser()
        const req = TestHelper.createRequest(`/api/user/connect/create-company-director?stripeid=${user.stripeAccount.id}`)
        req.account = user2.account
        req.session = user2.session
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-account')
      })
    })

    describe('invalid-stripe-account', () => {
      it('ineligible stripe account for individual', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'US',
          type: 'individual'
        })
        const req = TestHelper.createRequest(`/api/user/connect/create-company-director?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-stripe-account')
      })
    })

    describe('invalid-relationship_director_first_name', () => {
      it('missing posted relationship_director_first_name', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'DE',
          type: 'company'
        })
        const person = TestHelper.nextIdentity()
        const req = TestHelper.createRequest(`/api/user/connect/create-company-director?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          relationship_director_verification_document_back: TestHelper['success_id_scan_back.png'],
          relationship_director_verification_document_front: TestHelper['success_id_scan_front.png']
        }
        req.body = TestHelper.createMultiPart(req, {
          relationship_director_dob_day: '1',
          relationship_director_dob_month: '1',
          relationship_director_dob_year: '1950',
          relationship_director_first_name: '',
          relationship_director_last_name: person.lastName
        })
        let errorMessage
        try {
          await req.post()
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
          country: 'DE',
          type: 'company'
        })
        const person = TestHelper.nextIdentity()
        const req = TestHelper.createRequest(`/api/user/connect/create-company-director?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          relationship_director_verification_document_back: TestHelper['success_id_scan_back.png'],
          relationship_director_verification_document_front: TestHelper['success_id_scan_front.png']
        }
        req.body = TestHelper.createMultiPart(req, {
          relationship_director_dob_day: '1',
          relationship_director_dob_month: '1',
          relationship_director_dob_year: '1950',
          relationship_director_first_name: person.firstName,
          relationship_director_last_name: ''
        })
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_director_last_name')
      })
    })

    describe('invalid-relationship_director_email', () => {
      it('missing posted relationship_director_email', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'DE',
          type: 'company'
        })
        const person = TestHelper.nextIdentity()
        const req = TestHelper.createRequest(`/api/user/connect/create-company-director?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          relationship_director_verification_document_back: TestHelper['success_id_scan_back.png'],
          relationship_director_verification_document_front: TestHelper['success_id_scan_front.png']
        }
        req.body = TestHelper.createMultiPart(req, {
          relationship_director_dob_day: '1',
          relationship_director_dob_month: '1',
          relationship_director_dob_year: '1950',
          relationship_director_first_name: person.firstName,
          relationship_director_last_name: ''
        })
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_director_last_name')
      })
    })

    describe('invalid-relationship_director_dob_day', () => {
      it('missing posted relationship_director_dob_day', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'DE',
          type: 'company'
        })
        const person = TestHelper.nextIdentity()
        const req = TestHelper.createRequest(`/api/user/connect/create-company-director?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          relationship_director_verification_document_back: TestHelper['success_id_scan_back.png'],
          relationship_director_verification_document_front: TestHelper['success_id_scan_front.png']
        }
        req.body = TestHelper.createMultiPart(req, {
          relationship_director_dob_day: '',
          relationship_director_dob_month: '1',
          relationship_director_dob_year: '1950',
          relationship_director_email: person.email,
          relationship_director_first_name: person.firstName,
          relationship_director_last_name: person.lastName
        })
        let errorMessage
        try {
          await req.post()
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
          country: 'DE',
          type: 'company'
        })
        const person = TestHelper.nextIdentity()
        const req = TestHelper.createRequest(`/api/user/connect/create-company-director?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          relationship_director_verification_document_back: TestHelper['success_id_scan_back.png'],
          relationship_director_verification_document_front: TestHelper['success_id_scan_front.png']
        }
        req.body = TestHelper.createMultiPart(req, {
          relationship_director_dob_day: '1',
          relationship_director_dob_month: '',
          relationship_director_dob_year: '1950',
          relationship_director_email: person.email,
          relationship_director_first_name: person.firstName,
          relationship_director_last_name: person.lastName
        })
        let errorMessage
        try {
          await req.post()
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
          country: 'DE',
          type: 'company'
        })
        const person = TestHelper.nextIdentity()
        const req = TestHelper.createRequest(`/api/user/connect/create-company-director?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          relationship_director_verification_document_back: TestHelper['success_id_scan_back.png'],
          relationship_director_verification_document_front: TestHelper['success_id_scan_front.png']
        }
        req.body = TestHelper.createMultiPart(req, {
          relationship_director_dob_day: '1',
          relationship_director_dob_month: '1',
          relationship_director_dob_year: '',
          relationship_director_email: person.email,
          relationship_director_first_name: person.firstName,
          relationship_director_last_name: person.lastName
        })
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_director_dob_year')
      })
    })

    describe('invalid-relationship_director_verification_document_front', () => {
      it('missing posted file relationship_director_verification_document_front', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'DE',
          type: 'company'
        })
        const person = TestHelper.nextIdentity()
        const req = TestHelper.createRequest(`/api/user/connect/create-company-director?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          relationship_director_verification_document_back: TestHelper['success_id_scan_back.png']
        }
        req.body = TestHelper.createMultiPart(req, {
          relationship_director_dob_day: '1',
          relationship_director_dob_month: '1',
          relationship_director_dob_year: '1950',
          relationship_director_email: person.email,
          relationship_director_first_name: person.firstName,
          relationship_director_last_name: person.lastName
        })
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_director_verification_document_front')
      })
    })

    describe('invalid-relationship_director_verification_document_back', () => {
      it('missing posted file relationship_director_verification_document_back', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'DE',
          type: 'company'
        })
        const person = TestHelper.nextIdentity()
        const req = TestHelper.createRequest(`/api/user/connect/create-company-director?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          relationship_director_verification_document_front: TestHelper['success_id_scan_front.png']
        }
        req.body = TestHelper.createMultiPart(req, {
          relationship_director_dob_day: '1',
          relationship_director_dob_month: '1',
          relationship_director_dob_year: '1950',
          relationship_director_email: person.email,
          relationship_director_first_name: person.firstName,
          relationship_director_last_name: person.lastName
        })
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_director_verification_document_back')
      })
    })
  })

  describe('receives', () => {
    it('required posted relationship_director_first_name', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'DE',
        type: 'company'
      })
      const person = TestHelper.nextIdentity()
      const req = TestHelper.createRequest(`/api/user/connect/create-company-director?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_director_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_director_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      req.body = TestHelper.createMultiPart(req, {
        relationship_director_dob_day: '1',
        relationship_director_dob_month: '1',
        relationship_director_dob_year: '1950',
        relationship_director_first_name: person.firstName,
        relationship_director_last_name: person.lastName
      })
      const owner = await req.post()
      assert.strictEqual(owner.relationship_director_first_name, person.firstName)
    })

    it('required posted relationship_director_last_name', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'DE',
        type: 'company'
      })
      const person = TestHelper.nextIdentity()
      const req = TestHelper.createRequest(`/api/user/connect/create-company-director?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_director_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_director_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      req.body = TestHelper.createMultiPart(req, {
        relationship_director_dob_day: '1',
        relationship_director_dob_month: '1',
        relationship_director_dob_year: '1950',
        relationship_director_first_name: person.firstName,
        relationship_director_last_name: person.lastName
      })
      const owner = await req.post()
      assert.strictEqual(owner.relationship_director_last_name, person.lastName)
    })

    it('optionally-required posted relationship_director_email', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'AU',
        type: 'company'
      })
      const person = TestHelper.nextIdentity()
      const req = TestHelper.createRequest(`/api/user/connect/create-company-director?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_director_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_director_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      req.body = TestHelper.createMultiPart(req, {
        relationship_director_dob_day: '1',
        relationship_director_dob_month: '1',
        relationship_director_dob_year: '1950',
        relationship_director_email: person.email,
        relationship_director_first_name: person.firstName,
        relationship_director_last_name: person.lastName,
        relationship_director_relationship_title: 'XXX'
      })
      const owner = await req.post()
      assert.strictEqual(owner.relationship_director_email, person.email)
    })

    it('optionally-required posted relationship_director_relationship_title', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'AU',
        type: 'company'
      })
      const person = TestHelper.nextIdentity()
      const req = TestHelper.createRequest(`/api/user/connect/create-company-director?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_director_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_director_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      req.body = TestHelper.createMultiPart(req, {
        relationship_director_dob_day: '1',
        relationship_director_dob_month: '1',
        relationship_director_dob_year: '1950',
        relationship_director_email: person.email,
        relationship_director_first_name: person.firstName,
        relationship_director_last_name: person.lastName,
        relationship_director_relationship_title: 'SVP Sales'
      })
      const owner = await req.post()
      assert.strictEqual(owner.relationship_director_relationship_title, 'SVP Sales')
    })

    it('required posted relationship_director_dob_day', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'DE',
        type: 'company'
      })
      const person = TestHelper.nextIdentity()
      const req = TestHelper.createRequest(`/api/user/connect/create-company-director?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_director_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_director_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      req.body = TestHelper.createMultiPart(req, {
        relationship_director_dob_day: '1',
        relationship_director_dob_month: '1',
        relationship_director_dob_year: '1950',
        relationship_director_first_name: person.firstName,
        relationship_director_last_name: person.lastName
      })
      const owner = await req.post()
      assert.strictEqual(owner.relationship_director_dob_day, '01')
    })

    it('required posted relationship_director_dob_month', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'DE',
        type: 'company'
      })
      const person = TestHelper.nextIdentity()
      const req = TestHelper.createRequest(`/api/user/connect/create-company-director?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_director_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_director_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      req.body = TestHelper.createMultiPart(req, {
        relationship_director_dob_day: '1',
        relationship_director_dob_month: '2',
        relationship_director_dob_year: '1950',
        relationship_director_first_name: person.firstName,
        relationship_director_last_name: person.lastName
      })
      const owner = await req.post()
      assert.strictEqual(owner.relationship_director_dob_month, '02')
    })

    it('required posted relationship_director_dob_year', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'DE',
        type: 'company'
      })
      const person = TestHelper.nextIdentity()
      const req = TestHelper.createRequest(`/api/user/connect/create-company-director?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_director_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_director_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      req.body = TestHelper.createMultiPart(req, {
        relationship_director_dob_day: '1',
        relationship_director_dob_month: '1',
        relationship_director_dob_year: '1950',
        relationship_director_first_name: person.firstName,
        relationship_director_last_name: person.lastName
      })
      const owner = await req.post()
      assert.strictEqual(owner.relationship_director_dob_year, '1950')
    })

    it('required posted file relationship_director_verification_document_front', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'DE',
        type: 'company'
      })
      const person = TestHelper.nextIdentity()
      const req = TestHelper.createRequest(`/api/user/connect/create-company-director?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_director_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_director_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      req.body = TestHelper.createMultiPart(req, {
        relationship_director_dob_day: '1',
        relationship_director_dob_month: '1',
        relationship_director_dob_year: '1950',
        relationship_director_email: person.email,
        relationship_director_first_name: person.firstName,
        relationship_director_last_name: person.lastName
      })
      const owner = await req.post()
      assert.notStrictEqual(owner.relationship_director_verification_document_front, null)
      assert.notStrictEqual(owner.relationship_director_verification_document_front, undefined)
    })

    it('required posted file relationship_director_verification_document_back', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'DE',
        type: 'company'
      })
      const person = TestHelper.nextIdentity()
      const req = TestHelper.createRequest(`/api/user/connect/create-company-director?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_director_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_director_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      req.body = TestHelper.createMultiPart(req, {
        relationship_director_dob_day: '1',
        relationship_director_dob_month: '1',
        relationship_director_dob_year: '1950',
        relationship_director_email: person.email,
        relationship_director_first_name: person.firstName,
        relationship_director_last_name: person.lastName
      })
      const owner = await req.post()
      assert.notStrictEqual(owner.relationship_director_verification_document_back, null)
      assert.notStrictEqual(owner.relationship_director_verification_document_back, undefined)
    })
  })

  describe('returns', () => {
    it('object', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'DE',
        type: 'company'
      })
      const person = TestHelper.nextIdentity()
      const req = TestHelper.createRequest(`/api/user/connect/create-company-director?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_director_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_director_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      req.body = TestHelper.createMultiPart(req, {
        relationship_director_dob_day: '1',
        relationship_director_dob_month: '1',
        relationship_director_dob_year: '1950',
        relationship_director_first_name: person.firstName,
        relationship_director_last_name: person.lastName
      })
      await req.post()
      const stripeAccountNow = await global.api.user.connect.StripeAccount.get(req)
      const directorsNow = JSON.parse(stripeAccountNow.metadata.directors)
      assert.strictEqual(directorsNow.length, 1)
      assert.strictEqual(directorsNow[0].relationship_director_first_name, person.firstName)
    })
  })

  describe('configuration', () => {
    it('environment STRIPE_JS', async () => {
      global.stripeJS = 3
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'DE',
        type: 'company'
      })
      const person = TestHelper.nextIdentity()
      const req = TestHelper.createRequest(`/account/connect/create-company-director?stripeid=${user.stripeAccount.id}`)
      req.waitOnSubmit = true
      req.account = user.account
      req.session = user.session
      req.uploads = {
        relationship_director_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_director_verification_document_front: TestHelper['success_id_scan_front.png']
      }
      req.body = {
        relationship_director_dob_day: '1',
        relationship_director_dob_month: '1',
        relationship_director_dob_year: '1950',
        relationship_director_first_name: person.firstName,
        relationship_director_last_name: person.lastName
      }
      await req.post()
      const stripeAccountNow = await global.api.user.connect.StripeAccount.get(req)
      const directorsNow = JSON.parse(stripeAccountNow.metadata.directors)
      assert.strictEqual(directorsNow.length, 1)
      assert.notStrictEqual(directorsNow[0].token, null)
      assert.notStrictEqual(directorsNow[0].token, undefined)
    })
  })
})
