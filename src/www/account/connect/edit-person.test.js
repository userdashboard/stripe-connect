/* eslint-env mocha */
const assert = require('assert')
const connect = require('../../../../index.js')
const TestHelper = require('../../../../test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts.js')

describe('/account/connect/edit-person', () => {
  describe('EditPerson#BEFORE', () => {
    it('should reject invalid person', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/account/connect/edit-person?personid=invalid')
      req.account = user.account
      req.session = user.session
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-personid')
    })
  })

  describe('EditPerson#GET', () => {
    for (const country of connect.countrySpecs) {
      it('should present the form (' + country.id + ')', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: country.id,
          type: 'company'
        })
        await TestHelper.createPerson(user, {
          relationship_representative: true,
          relationship_executive: true,
          relationship_title: 'SVP Testing',
          relationship_percent_ownership: 0
        })
        const req = TestHelper.createRequest(`/account/connect/edit-person?personid=${user.representative.id}`)
        req.account = user.account
        req.session = user.session
        const page = await req.get()
        const doc = TestHelper.extractDoc(page)
        assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
        assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
      })
    }
  })

  describe('EditPerson#POST', () => {
    const excludeFields = [
      'relationship_representative',
      'relationship_executive',
      'relationship_title',
      'relationship_percent_ownership'
    ]
    for (const country of connect.countrySpecs) {
      it('should reject invalid fields (' + country.id + ')', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: country.id,
          type: 'company'
        })
        await TestHelper.createPerson(user, {
          relationship_representative: true,
          relationship_executive: true,
          relationship_title: 'SVP Testing',
          relationship_percent_ownership: 0
        })
        let property = field.replace('address_kana_', 'address_kana.')
                            .replace('address_kanji_', 'address_kanji.')
                            .replace('dob_', 'dob.')
                            .replace('relationship_', 'relationship.')
        if (property.indexOf('address_') > -1 && property.indexOf('_ka') === -1) {
          property = property.replace('address_', 'address.')
        }
        await TestHelper.waitForAccountRequirement(user, `${user.representative.id}.${property}`)
        await TestHelper.waitForPersonRequirement(user, user.representative.id, property)
        const req = TestHelper.createRequest(`/account/connect/edit-person?personid=${user.representative.id}`)
        req.account = user.account
        req.session = user.session
        req.body = TestStripeAccounts.createPostData(TestStripeAccounts.representativeData[country.id])
        const fields = Object.keys(req.body)
        const body = JSON.stringify(req.body)
        for (const field of fields) {
          if (excludeFields.indexOf(field) > -1) {
            continue
          }
          req.body = JSON.parse(body)
          if (req.body[field]) {
            delete (req.body[field])
          }
          const page = await req.post()
          const doc = TestHelper.extractDoc(page)
          const messageContainer = doc.getElementById('message-container')
          const message = messageContainer.child[0]
          assert.strictEqual(message.attr.template, `invalid-${field}`)
        }
      })
    }

    for (const country of connect.countrySpecs) {
      it('should update information (' + country.id + ') (screenshots)', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: country.id,
          type: 'company'
        })
        await TestHelper.createPerson(user, {
          relationship_representative: true,
          relationship_executive: true,
          relationship_title: 'CEO',
          relationship_percent_ownership: '100'
        })
        await TestHelper.waitForAccountRequirement(user, `${user.representative.id}.dob.year`)
        await TestHelper.waitForPersonRequirement(user, user.representative.id, 'dob.year')
        const req = TestHelper.createRequest(`/account/connect/edit-person?personid=${user.representative.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          verification_document_back: TestHelper['success_id_scan_back.png'],
          verification_document_front: TestHelper['success_id_scan_front.png']
        }
        req.body = TestStripeAccounts.createPostData(TestStripeAccounts.representativeData[country.id])
        req.filename = __filename
        req.screenshots = [
          { hover: '#account-menu-container' },
          { click: '/account/connect' },
          { click: `/account/connect/stripe-account?stripeid=${user.stripeAccount.id}` },
          { click: `/account/connect/persons?stripeid=${user.stripeAccount.id}` },
          { click: `/account/connect/person?personid=${user.representative.id}` },
          { click: `/account/connect/edit-person?personid=${user.representative.id}` },
          { fill: '#submit-form' }
        ]
        const page = await req.post()
        const doc = TestHelper.extractDoc(page)
        const row = doc.getElementById(user.representative.id)
        assert.strictEqual(row.tag, 'tbody')
      })
    }
  })
})
