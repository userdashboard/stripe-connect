/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')

describe('/account/connect/company-director', () => {
  describe('CompanyDirector#BEFORE', () => {
    it('should reject invalid personid', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/account/connect/company-director?personid=invalid')
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

    it('should bind director to req', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'FR',
        type: 'company'
      })
      const person = TestHelper.nextIdentity()
      await TestHelper.createCompanyDirector(user, {
        dob_day: '1',
        dob_month: '1',
        dob_year: '1950',
        first_name: person.firstName,
        last_name: person.lastName
      }, {
        verification_document_back: TestHelper['success_id_scan_back.png'],
        verification_document_front: TestHelper['success_id_scan_front.png']
      })
      const req = TestHelper.createRequest(`/account/connect/company-director?personid=${user.director.id}`)
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.director.id, user.director.id)
    })
  })

  describe('CompanyDirector#GET', () => {
    it('should show table for director', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'GB',
        type: 'company'
      })
      const person = TestHelper.nextIdentity()
      await TestHelper.createCompanyDirector(user, {
        dob_day: '1',
        dob_month: '1',
        dob_year: '1950',
        first_name: person.firstName,
        last_name: person.lastName
      }, {
        verification_document_back: TestHelper['success_id_scan_back.png'],
        verification_document_front: TestHelper['success_id_scan_front.png']
      })
      const req = TestHelper.createRequest(`/account/connect/company-director?personid=${user.director.id}`)
      req.account = user.account
      req.session = user.session
      req.filename = __filename
      req.screenshots = [
        { hover: '#account-menu-container' },
        { click: '/account/connect' },
        { click: '/account/connect/stripe-accounts' },
        { click: `/account/connect/stripe-account?stripeid=${user.stripeAccount.id}` },
        { click: `/account/connect/company-directors?stripeid=${user.stripeAccount.id}` },
        { click: `/account/connect/company-director?personid=${user.director.id}` }
      ]
      const page = await req.get()
      const doc = TestHelper.extractDoc(page)
      const row = doc.getElementById(user.director.id)
      assert.strictEqual(row.tag, 'tbody')
    })
  })
})
