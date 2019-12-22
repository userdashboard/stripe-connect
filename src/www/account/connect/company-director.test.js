/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')

describe('/account/connect/company-director', () => {
  describe('CompanyDirector#BEFORE', () => {
    it('should reject invalid directorid', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/account/connect/company-director?directorid=invalid')
      req.account = user.account
      req.session = user.session
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-directorid')
    })

    it('should bind director to req', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'FR',
        type: 'company'
      })
      const person = TestHelper.nextIdentity()
      await TestHelper.createCompanyDirector(user, {
        relationship_director_dob_day: '1',
        relationship_director_dob_month: '1',
        relationship_director_dob_year: '1950',
        relationship_director_first_name: person.firstName,
        relationship_director_last_name: person.lastName
      }, {
        relationship_director_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_director_verification_document_front: TestHelper['success_id_scan_front.png']
      })
      const req = TestHelper.createRequest(`/account/connect/company-director?directorid=${user.director.directorid}`)
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.director.directorid, user.director.directorid)
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
        relationship_director_dob_day: '1',
        relationship_director_dob_month: '1',
        relationship_director_dob_year: '1950',
        relationship_director_first_name: person.firstName,
        relationship_director_last_name: person.lastName
      }, {
        relationship_director_verification_document_back: TestHelper['success_id_scan_back.png'],
        relationship_director_verification_document_front: TestHelper['success_id_scan_front.png']
      })
      const req = TestHelper.createRequest(`/account/connect/company-director?directorid=${user.director.directorid}`)
      req.account = user.account
      req.session = user.session
      req.filename = __filename
      req.screenshots = [
        { hover: '#account-menu-container' },
        { click: '/account/stripe-connect' },
        { click: '/account/connect/stripe-accounts' },
        { click: `/account/connect/stripe-account?stripeid=${user.stripeAccount.id}` },
        { click: `/account/connect/company-directors?stripeid=${user.stripeAccount.id}` },
        { click: `/account/connect/company-director?directorid=${user.director.directorid}` }
      ]
      const page = await req.get()
      const doc = TestHelper.extractDoc(page)
      const row = doc.getElementById(user.director.directorid)
      assert.strictEqual(row.tag, 'tbody')
    })
  })
})
