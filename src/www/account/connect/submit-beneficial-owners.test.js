/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts.js')

describe('/account/connect/submit-beneficial-owners', function () {
  after(TestHelper.deleteOldWebhooks)
  before(TestHelper.setupWebhook)
  describe('exceptions', () => {
    it('should reject invalid stripeid', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/account/connect/submit-beneficial-owners?stripeid=invalid')
      req.account = user.account
      req.session = user.session
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-stripeid')
    })

    it('should reject individual registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        type: 'individual'
      })
      const req = TestHelper.createRequest(`/account/connect/submit-beneficial-owners?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-stripe-account')
    })

    it('should reject Stripe account that doesn\'t require owners', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'JP',
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/submit-beneficial-owners?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-stripe-account')
    })
  })

  describe('before', () => {
    it('should bind data to req', async () => {
      const user = await TestStripeAccounts.createCompanyWithOwners('DE', 2)
      const req = TestHelper.createRequest(`/account/connect/submit-beneficial-owners?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.stripeAccount.id, user.stripeAccount.id)
      assert.strictEqual(req.data.owners.length, 2)
    })
  })

  describe('view', () => {
    it('should reject if an owner requires information', async () => {
      const user = await TestStripeAccounts.createCompanyWithOwners('DE', 1)
      const req = TestHelper.createRequest(`/account/connect/submit-beneficial-owners?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-beneficial-owners')
    })

    it('should present the form without owners', async () => {
      const user = await TestStripeAccounts.createCompanyWithOwners('DE', 0)
      const req = TestHelper.createRequest(`/account/connect/submit-beneficial-owners?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
      assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
    })

    it('should present the form with completed owners', async () => {
      const user = await TestStripeAccounts.createCompanyWithOwners('DE', 1)
      await TestHelper.updatePerson(user, user.owner, TestStripeAccounts.createPostData(TestStripeAccounts.beneficialOwnerData.DE))
      await TestHelper.waitForAccountRequirement(user, `${user.owner.id}.verification.document`)
      await TestHelper.waitForPersonRequirement(user, user.owner.id, 'verification.document')
      await TestHelper.updatePerson(user, user.owner, null, {
        verification_document_back: TestHelper['success_id_scan_back.png'],
        verification_document_front: TestHelper['success_id_scan_front.png']
      })
      await TestHelper.waitForAccountRequirement(user, `${user.owner.id}.verification.additional_document`)
      await TestHelper.waitForPersonRequirement(user, user.owner.id, 'verification.additional_document')
      await TestHelper.updatePerson(user, user.owner, null, {
        verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        verification_additional_document_front: TestHelper['success_id_scan_front.png']
      })
      const req = TestHelper.createRequest(`/account/connect/submit-beneficial-owners?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
      assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
    })
  })

  describe('submit', () => {
    it('should submit owners (screenshots)', async () => {
      const user = await TestStripeAccounts.createCompanyWithOwners('DE', 1)
      await TestHelper.updatePerson(user, user.owner, TestStripeAccounts.createPostData(TestStripeAccounts.beneficialOwnerData.DE))
      await TestHelper.waitForAccountRequirement(user, `${user.owner.id}.verification.document`)
      await TestHelper.waitForPersonRequirement(user, user.owner.id, 'verification.document')
      await TestHelper.updatePerson(user, user.owner, null, {
        verification_document_back: TestHelper['success_id_scan_back.png'],
        verification_document_front: TestHelper['success_id_scan_front.png']
      })
      await TestHelper.waitForAccountRequirement(user, `${user.owner.id}.verification.additional_document`)
      await TestHelper.waitForPersonRequirement(user, user.owner.id, 'verification.additional_document')
      await TestHelper.updatePerson(user, user.owner, null, {
        verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        verification_additional_document_front: TestHelper['success_id_scan_front.png']
      })
      const req = TestHelper.createRequest(`/account/connect/submit-beneficial-owners?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {}
      req.filename = __filename
      req.screenshots = [
        { hover: '#account-menu-container' },
        { click: '/account/connect' },
        { click: '/account/connect/stripe-accounts' },
        { click: `/account/connect/stripe-account?stripeid=${user.stripeAccount.id}` },
        { click: `/account/connect/submit-beneficial-owners?stripeid=${user.stripeAccount.id}` },
        {
          fill: '#submit-form',
          waitAfter: async (page) => {
            while (true) {
              try {
                const frame = await page.frames().find(f => f.name() === 'application-iframe')
                if (frame) {
                  const loaded = await frame.evaluate(() => {
                    const accountTable = document.getElementById('stripe-accounts-table')
                    return accountTable && accountTable.children.length
                  })
                  if (loaded) {
                    break
                  }
                }
              } catch (error) {
              }
              await page.waitForTimeout(100)
            }
          }
        }
      ]
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const accountTable = doc.getElementById(user.stripeAccount.id)
      assert.strictEqual(accountTable.tag, 'tbody')
    })

    it('should submit without owners', async () => {
      const user = await TestStripeAccounts.createCompanyWithOwners('DE', 0)
      const req = TestHelper.createRequest(`/account/connect/submit-beneficial-owners?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = {}
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })
  })
})
