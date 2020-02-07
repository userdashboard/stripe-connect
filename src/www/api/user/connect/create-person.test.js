/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')

describe('/api/user/connect/create-person', () => {
  describe('exceptions', () => {
    describe('invalid-stripeid', () => {
      it('missing querystring stripeid', async () => {
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/connect/create-person')
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.post(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-stripeid')
      })

      it('invalid querystring stripeid', async () => {
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/connect/create-person?stripeid=invalid')
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.post(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-stripeid')
      })
    })

    describe('invalid-stripe-account', () => {
      it('ineligible stripe account for individuals', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'US',
          type: 'individual'
        })
        const req = TestHelper.createRequest(`/api/user/connect/create-person?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.post(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-stripe-account')
      })

      it('ineligible stripe account does not require directors', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'US',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/create-person?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          relationship_director: 'true',
          relationship_title: 'Chairperson',
          relationship_percent_ownership: '0.1'
        }
        let errorMessage
        try {
          await req.post(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-stripe-account')
      })

      it('ineligible stripe account does not require owners', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'HK',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/create-person?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          relationship_owner: 'true',
          relationship_title: 'Chairperson',
          relationship_percent_ownership: '0.1'
        }
        let errorMessage
        try {
          await req.post(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-stripe-account')
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
        const req = TestHelper.createRequest(`/api/user/connect/create-person?stripeid=${user.stripeAccount.id}`)
        req.account = user2.account
        req.session = user2.session
        let errorMessage
        try {
          await req.post(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-account')
      })
    })

    describe('invalid-relationship_percent_ownership', () => {
      it('missing posted relationship_percent_ownership', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'US',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/create-person?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          relationship_representative: 'true',
          relationship_executive: 'true',
          relationship_title: 'Chairperson',
          relationship_percent_ownership: ''
        }
        let errorMessage
        try {
          await req.post(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_percent_ownership')
      })

      it('invalid posted relationship_percent_ownership', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'US',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/create-person?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          relationship_representative: 'true',
          relationship_executive: 'true',
          relationship_title: 'Chairperson',
          relationship_percent_ownership: 'invalid'
        }
        let errorMessage
        try {
          await req.post(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_percent_ownership')
      })
    })

    describe('invalid-relationship_title', () => {
      it('missing posted relationship_title', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'US',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/create-person?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          relationship_representative: 'true',
          relationship_executive: 'true',
          relationship_title: '',
          relationship_percent_ownership: '0.1'
        }
        let errorMessage
        try {
          await req.post(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_title')
      })

      it('invalid posted relationship_title', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'US',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/create-person?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          relationship_representative: 'true',
          relationship_executive: 'true',
          relationship_title: '',
          relationship_percent_ownership: '0.1'
        }
        // TODO: the 5000 character limit is from Stripe
        // they'll probably change it so monitor this
        while (req.body.relationship_title.length < 5001) {
          req.body.relationship_title += '-'
        }
        let errorMessage
        try {
          await req.post(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_title')
      })
    })

    describe('invalid-relationship_executive', async () => {
      it('invalid representative must be an executive', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'US',
          type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/create-person?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          relationship_representative: 'true',
          relationship_title: 'Chairperson',
          relationship_percent_ownership: '0.1'
        }
        let errorMessage
        try {
          await req.post(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_executive')
      })
    })
  })

  describe('receives', () => {
    it('optional posted relationship_representative', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/create-person?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_representative: 'true',
        relationship_executive: 'true',
        relationship_title: 'Chairperson',
        relationship_percent_ownership: '0.1'
      }
      const person = await req.post()
      assert.strictEqual(person.relationship.representative, true)
    })

    it('optionally-required posted relationship_executive', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/create-person?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_representative: 'true',
        relationship_executive: 'true',
        relationship_title: 'Chairperson',
        relationship_percent_ownership: '0.1'
      }
      const person = await req.post()
      assert.strictEqual(person.relationship.executive, true)
    })

    it('optional posted relationship_director', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'GB',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/create-person?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_director: 'true',
        relationship_title: 'Chairperson',
        relationship_percent_ownership: '0.1'
      }
      const person = await req.post()
      assert.strictEqual(person.relationship.director, true)    
    })

    it('optional posted relationship_owner', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'GB',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/create-person?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_owner: 'true',
        relationship_title: 'Chairperson',
        relationship_percent_ownership: '0.1'
      }
      const person = await req.post()
      assert.strictEqual(person.relationship.owner, true)  
    })

    it('required posted relationship_percent_ownership', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'GB',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/create-person?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_director: 'true',
        relationship_title: 'Chairperson',
        relationship_percent_ownership: '0.1'
      }
      const person = await req.post()
      assert.strictEqual(person.relationship.percent_ownership, 0.1)
    })

    it('required posted relationship_title', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'GB',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/create-person?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_director: 'true',
        relationship_title: 'Chairperson',
        relationship_percent_ownership: '0.1'
      }
      const person = await req.post()
      assert.strictEqual(person.relationship.title, 'Chairperson')
    })
  })

  describe('returns', () => {
    it('object', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/create-person?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_representative: 'true',
        relationship_executive: 'true',
        relationship_title: 'Chairperson',
        relationship_percent_ownership: '0.1'
      }
      req.filename = __filename
      req.saveResponse = true
      const person = await req.post()
      assert.strictEqual(person.object, 'person')
    })
  })
})
