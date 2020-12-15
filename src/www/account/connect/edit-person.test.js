/* eslint-env mocha */
const assert = require('assert')
const connect = require('../../../../index.js')
const TestHelper = require('../../../../test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@userdashboard/dashboard/test-helper.js')

describe('/account/connect/edit-person', function () {
  const fields = [
    'address_city',
    'address_line1',
    'address_postal_code',
    'dob_day',
    'dob_month',
    'dob_year',
    'phone',
    'first_name',
    'last_name',
    'email',
    'address_state',
    'address_kana_city',
    'address_kana_line1',
    'address_kana_postal_code',
    'address_kana_state',
    'address_kana_town',
    'address_kanji_city',
    'address_kanji_line1',
    'address_kanji_postal_code',
    'address_kanji_state',
    'address_kanji_town',
    'first_name_kana',
    'first_name_kanji',
    'gender',
    'last_name_kana',
    'last_name_kanji',
    'id_number',
    'ssn_last_4'
  ]
  const hasElementResults = {}
  const hasElementUploadResults = {}
  const rejectMissingResults = {}
  const rejectMissingResultsStripeV3 = {}
  const rejectMissingUploadResults = {}
  const rejectMissingUploadResultsStripeV3 = {}
  const testedRequiredFields = [
    'relationship_title',
    'relationship_director',
    'relationship_executive',
    'relationship_representative',
    'relationship_owner'
  ]
  const uploadFields = [
    'verification_document_front',
    'verification_document_back',
    'verification_additional_document_front',
    'verification_additional_document_back'
  ]
  after(TestHelper.deleteOldWebhooks)
  async function beforeSetup () {
    await DashboardTestHelper.setupBeforeEach()
    await TestHelper.setupBeforeEach()
    await TestHelper.setupWebhook()
    const users = {}
    for (const country of connect.countrySpecs) {
      const payload = TestStripeAccounts.createPostData(TestStripeAccounts.representativeData[country.id])
      if (payload === false) {
        continue
      }
      let user = users[country.id]
      if (!user) {
        user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: country.id,
          type: 'company'
        })
        await TestHelper.createPerson(user, {
          relationship_representative: 'false',
          relationship_executive: 'true',
          relationship_title: 'SVP Testing',
          relationship_percent_ownership: '0'
        })
        users[country.id] = user
      }
      for (const field in payload) {
        if (testedRequiredFields.indexOf(field) > -1) {
          continue
        }
        testedRequiredFields.push(field)
        const req = TestHelper.createRequest(`/account/connect/edit-person?personid=${user.representative.id}`)
        req.account = user.account
        req.session = user.session
        hasElementResults[field] = await req.get()
        // without stripe.js
        const req2 = TestHelper.createRequest(`/account/connect/edit-person?personid=${user.representative.id}`)
        req2.account = user.account
        req2.session = user.session
        req2.body = TestStripeAccounts.createPostData(TestStripeAccounts.representativeData[country.id])
        delete (req2.body[field])
        rejectMissingResults[field] = await req2.post()
        // with stripe.js version 3
        const req3 = TestHelper.createRequest(`/account/connect/edit-person?personid=${user.representative.id}`)
        req3.account = user.account
        req3.session = user.session
        req3.body = TestStripeAccounts.createPostData(TestStripeAccounts.representativeData[country.id])
        req3.waitBefore = async (page) => {
          while (true) {
            const loaded = await page.evaluate(() => {
              return window.loaded
            })
            if (loaded) {
              break
            }
            await page.waitForTimeout(100)
          }
        }
        req3.waitAfter = async (page) => {
          while (true) {
            const message = await page.evaluate(() => {
              const container = document.getElementById('message-container')
              return container.children.length
            })
            if (message > 0) {
              return
            }
            await page.waitForTimeout(100)
          }
        }
        req3.uploads = {
          verification_document_front: TestHelper['success_id_scan_back.png'],
          verification_document_back: TestHelper['success_id_scan_back.png']
        }
        delete (req3.body[field])
        global.stripeJS = 3
        rejectMissingResultsStripeV3[field] = await req3.post()
        global.stripeJS = false
      }
    }
    // upload fields
    const uploader1 = await TestHelper.createUser()
    await TestHelper.createStripeAccount(uploader1, {
      country: 'AT',
      type: 'company'
    })
    await TestHelper.createPerson(uploader1, {
      relationship_representative: 'true',
      relationship_executive: 'true',
      relationship_title: 'SVP Testing',
      relationship_percent_ownership: '0'
    })
    await TestHelper.updatePerson(uploader1, uploader1.representative, TestStripeAccounts.createPostData(TestStripeAccounts.representativeData.AT))
    const uploader2 = await TestHelper.createUser()
    await TestHelper.createStripeAccount(uploader2, {
      country: 'AT',
      type: 'company'
    })
    await TestHelper.createPerson(uploader2, {
      relationship_representative: 'true',
      relationship_executive: 'true',
      relationship_title: 'SVP Testing',
      relationship_percent_ownership: '0'
    })
    await TestHelper.updatePerson(uploader2, uploader2.representative, TestStripeAccounts.createPostData(TestStripeAccounts.representativeData.AT), {
      verification_document_front: TestHelper['success_id_scan_back.png'],
      verification_document_back: TestHelper['success_id_scan_back.png']
    })
    for (const field of uploadFields) {
      const user = field.startsWith('verification_additional') ? uploader2 : uploader1
      const property = field.replace('verification_', 'verification.').replace('_front', '').replace('_back', '')
      await TestHelper.waitForAccountRequirement(user, `${user.representative.id}.${property}`)
      await TestHelper.waitForPersonRequirement(user, user.representative.id, property)
      const req = TestHelper.createRequest(`/account/connect/edit-person?personid=${user.representative.id}`)
      req.account = user.account
      req.session = user.session
      hasElementUploadResults[field] = await req.get()
      // without stripe.js
      req.uploads = {
        verification_additional_document_front: TestHelper['success_id_scan_back.png'],
        verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        verification_document_front: TestHelper['success_id_scan_back.png'],
        verification_document_back: TestHelper['success_id_scan_back.png']
      }
      delete (req.uploads[field])
      rejectMissingUploadResults[field] = await req.post()
      // with stripe.js v3
      const req2 = TestHelper.createRequest(`/account/connect/edit-person?personid=${user.representative.id}`)
      req2.waitBefore = async (page) => {
        while (true) {
          const loaded = await page.evaluate(() => {
            return window.loaded
          })
          if (loaded) {
            break
          }
          await page.waitForTimeout(100)
        }
      }
      req2.waitAfter = async (page) => {
        while (true) {
          const message = await page.evaluate(() => {
            const container = document.getElementById('message-container')
            return container.children.length
          })
          if (message > 0) {
            return
          }
          await page.waitForTimeout(100)
        }
      }
      req2.account = user.account
      req2.session = user.session
      if (field.indexOf('additional') > -1) {
        req2.uploads = {
          verification_additional_document_front: TestHelper['success_id_scan_back.png'],
          verification_additional_document_back: TestHelper['success_id_scan_back.png']
        }
      } else {
        req2.uploads = {
          verification_document_front: TestHelper['success_id_scan_back.png'],
          verification_document_back: TestHelper['success_id_scan_back.png']
        }
      }
      delete (req2.uploads[field])
      global.stripeJS = 3
      rejectMissingUploadResultsStripeV3[field] = await req2.post()
      global.stripeJS = false
    }
  }

  describe('exceptions', () => {
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

  describe('view', async () => {
    before(beforeSetup)
    for (const field of fields) {
      it('should have element for ' + field, async () => {
        const result = hasElementResults[field]
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
    for (const field of uploadFields) {
      it(`should have element for upload ${field}`, async () => {
        const result = hasElementUploadResults[field]
        const doc = TestHelper.extractDoc(result.html)
        const property = field.replace('_front', '').replace('_back', '')
        const elementContainer = doc.getElementById(`${property}-container`)
        assert.strictEqual(elementContainer.tag, 'div')
      })
    }
  })

  describe('submit', async () => {
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
      req.waitBefore = async (page) => {
        while (true) {
          const loaded = await page.evaluate(() => {
            return window.loaded
          })
          if (loaded) {
            break
          }
          await page.waitForTimeout(100)
        }
      }
      req.waitAfter = async (page) => {
        while (true) {
          try {
            const url = await page.url()
            if (url.indexOf('edit-person') === -1) {
              break
            }
          } catch (error) {
          }
          await page.waitForTimeout(100)
        }
      }
      global.stripeJS = 3
      const result = await req.post()
      global.stripeJS = false
      const doc = TestHelper.extractDoc(result.html)
      const row = doc.getElementById(user.representative.id)
      assert.strictEqual(row.tag, 'tbody')
    })
  })

  describe('errors', () => {
    before(beforeSetup)
    for (const field of fields) {
      describe(`invalid-${field}`, () => {
        it(`missing ${field} no stripe.js`, async () => {
          const result = rejectMissingResults[field]
          const doc = TestHelper.extractDoc(result.html)
          const messageContainer = doc.getElementById('message-container')
          const message = messageContainer.child[0]
          assert.strictEqual(message.attr.template, `invalid-${field}`)
        })

        it(`missing ${field} stripe.js v3`, async () => {
          const result = rejectMissingResultsStripeV3[field]
          const doc = TestHelper.extractDoc(result.html)
          const messageContainer = doc.getElementById('message-container')
          const message = messageContainer.child[0]
          assert.strictEqual(message.attr.template, `invalid-${field}`)
        })
      })
    }
    for (const field of uploadFields) {
      describe(`invalid-${field}`, () => {
        it(`missing upload ${field} no stripe.js`, async () => {
          const result = rejectMissingUploadResults[field]
          const doc = TestHelper.extractDoc(result.html)
          const messageContainer = doc.getElementById('message-container')
          const message = messageContainer.child[0]
          assert.strictEqual(message.attr.template, `invalid-${field}`)
        })

        it(`missing upload ${field} stripe.js v3`, async () => {
          const result = rejectMissingUploadResultsStripeV3[field]
          const doc = TestHelper.extractDoc(result.html)
          const messageContainer = doc.getElementById('message-container')
          const message = messageContainer.child[0]
          assert.strictEqual(message.attr.template, `invalid-${field}`)
        })
      })
    }
  })
})
