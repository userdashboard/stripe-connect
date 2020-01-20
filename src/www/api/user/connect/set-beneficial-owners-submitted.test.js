/* eslint-env mocha */
const assert = require('assert')
const connect = require('../../../../../index.js')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')

describe('/api/user/connect/set-beneficial-owners-submitted', () => {
  describe('exceptions', () => {
    describe('invalid-stripeid', () => {
      it('missing querystring stripeid', async () => {
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/connect/set-beneficial-owners-submitted')
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-stripeid')
      })

      it('invalid querystring stripeid', async () => {
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/connect/set-beneficial-owners-submitted?stripeid=invalid')
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-stripeid')
      })
    })

    describe('invalid-stripe-account', () => {
      it('ineligible stripe account for individual', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'US',
          type: 'individual'
        })
        const req = TestHelper.createRequest(`/api/user/connect/set-beneficial-owners-submitted?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-stripe-account')
      })

      it('ineligible beneficial owners are submitted', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'US',
          type: 'company'
        })
        await TestHelper.submitBeneficialOwners(user)
        const req = TestHelper.createRequest(`/api/user/connect/set-beneficial-owners-submitted?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.patch(req)
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
          country: 'DE',
          type: 'company'
        })
        const user2 = await TestHelper.createUser()
        const req = TestHelper.createRequest(`/api/user/connect/set-beneficial-owners-submitted?stripeid=${user.stripeAccount.id}`)
        req.account = user2.account
        req.session = user2.session
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

  describe('returns', () => {
    for (const country of connect.countrySpecs) {
      if (TestStripeAccounts.beneficialOwnerData[country.id] === false) {
        continue
      }
      it('object (' + country.id + ')', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: country.id,
          type: 'company'
        })
        const person = TestHelper.nextIdentity()
        const owner = JSON.parse(JSON.stringify(TestStripeAccounts.beneficialOwnerData[country.id]))
        owner.email = person.email,
        owner.first_name = person.firstName
        owner.last_name = person.lastName
        await TestHelper.createBeneficialOwner(user, owner, {
          verification_document_back: TestHelper['success_id_scan_back.png'],
          verification_document_front: TestHelper['success_id_scan_front.png']
        })
        await TestHelper.updateBeneficialOwner(user, owner, {
          verification_additional_document_back: TestHelper['success_id_scan_back.png'],
          verification_additional_document_front: TestHelper['success_id_scan_front.png']
        })
        const req = TestHelper.createRequest(`/api/user/connect/set-beneficial-owners-submitted?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const accountNow = await req.patch()
        assert.strictEqual(accountNow.company.owners_provided, true)
        const owners = await global.api.user.connect.BeneficialOwners.get(req)
        for (const owner of owners) {
          assert.strictEqual(owner.requirements.past_due.length, 0)
          assert.strictEqual(owner.requirements.eventually_due.length, 0)
          assert.strictEqual(owner.requirements.currently_due.length, 0)
        }
      })
    }
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
      const req = TestHelper.createRequest(`/account/connect/create-beneficial-owner?stripeid=${user.stripeAccount.id}`)
      req.waitOnSubmit = true
      req.account = user.account
      req.session = user.session
      req.uploads = {
        verification_document_back: TestHelper['success_id_scan_back.png'],
        verification_document_front: TestHelper['success_id_scan_front.png']
      }
      req.body = JSON.parse(JSON.stringify(TestStripeAccounts.beneficialOwnerData['DE']))
      req.body.email = person.email
      req.body.first_name = person.firstName
      req.body.last_name = person.lastName
      await req.post()
      const req2 = TestHelper.createRequest(`/api/user/connect/beneficial-owners?stripeid=${user.stripeAccount.id}`)
      req2.account = user.account
      req2.session = user.session
      const owners = await req2.get()
      const owner = owners[0]
      const req3 = TestHelper.createRequest(`/account/connect/edit-beneficial-owner?personid=${owner.id}`)
      req3.account = user.account
      req3.session = user.session
      req3.uploads = {
        verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        verification_additional_document_front: TestHelper['success_id_scan_front.png']
      }
      await req.post()
      const req4 = TestHelper.createRequest(`/api/user/connect/set-beneficial-owners-submitted?stripeid=${user.stripeAccount.id}`)
      req4.account = user.account
      req4.session = user.session
      req4.filename = __filename
      req4.saveResponse = true
      const accountNow = await req4.patch()
      assert.strictEqual(accountNow.company.owners_provided, true)
      const req5 = TestHelper.createRequest(`/api/user/connect/beneficial-owner?personid=${owner.id}`)
      req5.account = user.account
      req5.session = user.session
      req5.filename = __filename
      req5.saveResponse = true
      const ownerNow = await req5.get()
      assert.strictEqual(ownerNow.metadata.token, undefined)
    })
  })
})

