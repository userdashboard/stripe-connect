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
    const testedRequiredFields = [
      'relationship_title',
      'relationship_director',
      'relationship_executive',
      'relationship_representative',
      'relationship_owner'
    ]
    for (const country of connect.countrySpecs) {
      const payload = TestStripeAccounts.createPostData(TestStripeAccounts.representativeData[country.id])
      if (payload === false) {
        continue
      }
      for (const field in payload) {
        if (testedRequiredFields.indexOf(field) > -1) {
          continue
        }
        testedRequiredFields.push(field)
        it('should have element for ' + field, async () => {
          const user = await TestHelper.createUser()
          await TestHelper.createStripeAccount(user, {
            country: country.id,
            type: 'company'
          })
          await TestHelper.createPerson(user, {
            relationship_representative: 'true',
            relationship_executive: 'true',
            relationship_title: 'SVP Testing',
            relationship_percent_ownership: '0'
          })
          const req = TestHelper.createRequest(`/account/connect/edit-person?personid=${user.representative.id}`)
          req.account = user.account
          req.session = user.session
          const result = await req.get()
          const doc = TestHelper.extractDoc(result.html)
          if (field.startsWith('dob_')) {
            const elementContainer = doc.getElementById('dob-container')
            assert.strictEqual(elementContainer.tag, 'div')
          } else {
            const elementContainer = doc.getElementById(`${field}-container`)
            assert.strictEqual(elementContainer.tag, 'div')
          }
        })
      }
    }

    const uploadFields = [
      'verification_document',
      'verification_additional_document'
    ]
    for (const field of uploadFields) {
      it(`should have element for upload ${field}`, async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'AT',
          type: 'company'
        })
        await TestHelper.createPerson(user, {
          relationship_representative: 'true',
          relationship_executive: 'true',
          relationship_title: 'SVP Testing',
          relationship_percent_ownership: '0'
        })
        await TestHelper.updatePerson(user, user.representative, TestStripeAccounts.createPostData(TestStripeAccounts.representativeData.AT))
        if (field === 'verification_additional_document') {
          await TestHelper.updatePerson(user, user.representative, null, {
            verification_document_front: TestHelper['success_id_scan_back.png'],
            verification_document_back: TestHelper['success_id_scan_back.png']
          })
        }
        const property = field.replace('verification_', 'verification.')
        await TestHelper.waitForAccountRequirement(user, `${user.representative.id}.${property}`)
        await TestHelper.waitForPersonRequirement(user, user.representative.id, property)
        const req = TestHelper.createRequest(`/account/connect/edit-person?personid=${user.representative.id}`)
        req.account = user.account
        req.session = user.session
        const result = await req.get()
        const doc = TestHelper.extractDoc(result.html)
        const elementContainer = doc.getElementById(`${field}-container`)
        assert.strictEqual(elementContainer.tag, 'div')
      })
    }
  })

  describe('EditPerson#POST', async () => {
    const testedMissingFields = [
      'relationship_title',
      'relationship_director',
      'relationship_executive',
      'relationship_representative',
      'relationship_owner'
    ]
    for (const country of connect.countrySpecs) {
      const payload = TestStripeAccounts.createPostData(TestStripeAccounts.representativeData[country.id])
      if (payload === false) {
        continue
      }
      for (const field in payload) {
        if (testedMissingFields.indexOf(field) > -1) {
          continue
        }
        testedMissingFields.push(field)
        it(`should reject missing ${field} no stripe.js`, async () => {
          const user = await TestHelper.createUser()
          await TestHelper.createStripeAccount(user, {
            country: country.id,
            type: 'company'
          })
          await TestHelper.createPerson(user, {
            relationship_representative: 'true',
            relationship_executive: 'true',
            relationship_title: 'SVP Testing',
            relationship_percent_ownership: '0'
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
          delete (req.body[field])
          const result = await req.post()
          const doc = TestHelper.extractDoc(result.html)
          const messageContainer = doc.getElementById('message-container')
          const message = messageContainer.child[0]
          assert.strictEqual(message.attr.template, `invalid-${field}`)
        })

        it(`should reject missing ${field} stripe.js v3`, async () => {
          const user = await TestHelper.createUser()
          await TestHelper.createStripeAccount(user, {
            country: country.id,
            type: 'company'
          })
          await TestHelper.createPerson(user, {
            relationship_representative: 'true',
            relationship_executive: 'true',
            relationship_title: 'SVP Testing',
            relationship_percent_ownership: '0'
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
          global.stripeJS = 3
          const req = TestHelper.createRequest(`/account/connect/edit-person?personid=${user.representative.id}`)
          req.account = user.account
          req.session = user.session
          req.body = TestStripeAccounts.createPostData(TestStripeAccounts.representativeData[country.id])
          req.waitFormLoad = async (page) => {
            while (true) {
              const loaded = await page.evaluate(() => {
                return window.loaded
              })
              if (loaded) {
                break
              }
              await page.waitFor(100)
            }
          }
          req.waitFormComplete = async (page) => {
            while (true) {
              const message = await page.evaluate(() => {
                var container = document.getElementById('message-container')
                return container.children.length
              })
              if (message > 0) {
                return
              }
              await page.waitFor(100)
            }
          }
          req.uploads = {
            verification_document_front: TestHelper['success_id_scan_back.png'],
            verification_document_back: TestHelper['success_id_scan_back.png']
          }
          delete (req.body[field])
          const result = await req.post()
          const doc = TestHelper.extractDoc(result.html)
          const messageContainer = doc.getElementById('message-container')
          const message = messageContainer.child[0]
          assert.strictEqual(message.attr.template, `invalid-${field}`)
        })
      }
    }

    const uploadFields = [
      'verification_document_front',
      'verification_document_back',
      'verification_additional_document_front',
      'verification_additional_document_back'
    ]
    for (const field of uploadFields) {
      it(`should reject missing upload ${field} no stripe.js`, async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'AT',
          type: 'company'
        })
        await TestHelper.createPerson(user, {
          relationship_representative: 'true',
          relationship_executive: 'true',
          relationship_title: 'SVP Testing',
          relationship_percent_ownership: '0'
        })
        await TestHelper.updatePerson(user, user.representative, TestStripeAccounts.createPostData(TestStripeAccounts.representativeData.AT))
        const req = TestHelper.createRequest(`/account/connect/edit-person?personid=${user.representative.id}`)
        req.account = user.account
        req.session = user.session
        req.uploads = {
          verification_additional_document_front: TestHelper['success_id_scan_back.png'],
          verification_additional_document_back: TestHelper['success_id_scan_back.png'],
          verification_document_front: TestHelper['success_id_scan_back.png'],
          verification_document_back: TestHelper['success_id_scan_back.png']
        }
        delete (req.uploads[field])
        const result = await req.post()
        const doc = TestHelper.extractDoc(result.html)
        const messageContainer = doc.getElementById('message-container')
        const message = messageContainer.child[0]
        assert.strictEqual(message.attr.template, `invalid-${field}`)
      })

      it(`should reject missing upload ${field} stripe.js v3`, async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'AT',
          type: 'company'
        })
        await TestHelper.createPerson(user, {
          relationship_representative: 'true',
          relationship_executive: 'true',
          relationship_title: 'SVP Testing',
          relationship_percent_ownership: '0'
        })
        if (field.indexOf('additional') > -1) {
          await TestHelper.updatePerson(user, user.representative, TestStripeAccounts.createPostData(TestStripeAccounts.representativeData.AT))
          await TestHelper.waitForPersonRequirement(user, user.representative.id, 'verification.document')
          await TestHelper.updatePerson(user, user.representative, null, {
            verification_document_front: TestHelper['success_id_scan_back.png'],
            verification_document_back: TestHelper['success_id_scan_back.png']
          })
          await TestHelper.waitForPersonRequirement(user, user.representative.id, 'verification.additional_document')
        } else {
          await TestHelper.updatePerson(user, user.representative, TestStripeAccounts.createPostData(TestStripeAccounts.representativeData.AT))
        }
        global.stripeJS = 3
        const req = TestHelper.createRequest(`/account/connect/edit-person?personid=${user.representative.id}`)
        req.waitFormLoad = async (page) => {
          while (true) {
            const loaded = await page.evaluate(() => {
              return window.loaded
            })
            if (loaded) {
              break
            }
            await page.waitFor(100)
          }
        }
        req.waitFormComplete = async () => {
          return true
        }
        req.account = user.account
        req.session = user.session
        if (field.indexOf('additional') > -1) {
          req.uploads = {
            verification_additional_document_front: TestHelper['success_id_scan_back.png'],
            verification_additional_document_back: TestHelper['success_id_scan_back.png']
          }
        } else {
          req.uploads = {
            verification_document_front: TestHelper['success_id_scan_back.png'],
            verification_document_back: TestHelper['success_id_scan_back.png']
          }
        }
        delete (req.uploads[field])
        const result = await req.post()
        const doc = TestHelper.extractDoc(result.html)
        const messageContainer = doc.getElementById('message-container')
        const message = messageContainer.child[0]
        assert.strictEqual(message.attr.template, `invalid-${field}`)
      })
    }

    it('should update person (screenshots) no stripe.js', async () => {
      const country = connect.countrySpecs[Math.floor(Math.random() * connect.countrySpecs.length)]
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: country.id,
        type: 'company'
      })
      await TestHelper.createPerson(user, {
        relationship_representative: 'true',
        relationship_executive: 'true',
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
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const row = doc.getElementById(user.representative.id)
      assert.strictEqual(row.tag, 'tbody')
    })

    it('should update person stripe.js v3', async () => {
      const country = connect.countrySpecs[Math.floor(Math.random() * connect.countrySpecs.length)]
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: country.id,
        type: 'company'
      })
      await TestHelper.createPerson(user, {
        relationship_representative: 'true',
        relationship_executive: 'true',
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
      req.waitFormLoad = async (page) => {
        while (true) {
          const loaded = await page.evaluate(() => {
            return window.loaded
          })
          if (loaded) {
            break
          }
          await page.waitFor(100)
        }
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const row = doc.getElementById(user.representative.id)
      assert.strictEqual(row.tag, 'tbody')
    })
  })
})
