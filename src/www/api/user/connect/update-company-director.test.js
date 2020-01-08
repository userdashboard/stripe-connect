/* eslint-env mocha */
/*
  This script now only supports information specified
  in the requirements.currently_due and eventually_due
  collections.  Testing most fields is disabled until
  they submit data that fails validation first.
*/
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')

describe('/api/user/connect/update-company-director', () => {
  describe('exceptions', () => {
    describe('invalid-personid', () => {
      it('missing querystring personid', async () => {
        const user = await TestHelper.createUser()
        const person = TestHelper.nextIdentity()
        const req = TestHelper.createRequest('/api/user/connect/update-company-director')
        req.account = user.account
        req.session = user.session
        req.body = {
          dob_day: '1',
          dob_month: '1',
          dob_year: '1950',
          email: person.email,
          first_name: person.firstName,
          last_name: person.lastName
        }
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-personid')
      })

      it('invalid querystring personid', async () => {
        const user = await TestHelper.createUser()
        const person = TestHelper.nextIdentity()
        const req = TestHelper.createRequest('/api/user/connect/update-company-director?personid=invalid')
        req.account = user.account
        req.session = user.session
        req.body = {
          dob_day: '1',
          dob_month: '1',
          dob_year: '1950',
          email: person.email,
          first_name: person.firstName,
          last_name: person.lastName
        }
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-personid')
      })
    })

    describe('invalid-account', () => {
      it('ineligible accessing account', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'DE',
          type: 'company'
        })
        const person = TestHelper.nextIdentity()
        const director = await TestHelper.createCompanyDirector(user, {
          dob_day: '1',
          dob_month: '1',
          dob_year: '1950',
          email: person.email,
          first_name: person.firstName,
          last_name: person.lastName
        }, {
          verification_document_back: TestHelper['success_id_scan_back.png'],
          verification_document_front: TestHelper['success_id_scan_front.png']
        })
        const user2 = await TestHelper.createUser()
        const req = TestHelper.createRequest(`/api/user/connect/update-company-director?personid=${director.id}`)
        req.account = user2.account
        req.session = user2.session
        req.body = {
          dob_day: '1',
          dob_month: '1',
          dob_year: '1950',
          email: person.email,
          first_name: person.firstName,
          last_name: person.lastName
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
  })

  describe('receives', () => {
    it('optionally-required posted token', async () => {
      // global.stripeJS = 3
      // const user = await TestHelper.createUser()
      // await TestHelper.createStripeAccount(user, {
      //   country: 'GB',
      //   type: 'company'
      // })
      // const person = TestHelper.nextIdentity()
      // const director = await TestHelper.createCompanyDirector(user, {
      //   dob_day: '1',
      //   dob_month: '1',
      //   dob_year: '1950',
      //   first_name: person.firstName,
      //   last_name: person.lastName,
      //   token: 'sample1'
      // }, {
      //   verification_document_back: TestHelper['success_id_scan_back.png'],
      //   verification_document_front: TestHelper['success_id_scan_front.png']
      // })
      // const req = TestHelper.createRequest(`/api/user/connect/update-company-director?personid=${director.id}`)
      // req.account = user.account
      // req.session = user.session
      // const body = {
      //   dob_day: '1',
      //   dob_month: '1',
      //   dob_year: '1950',
      //   first_name: 'Modified name',
      //   last_name: person.lastName,
      //   token: 'sample2'
      // }
      // req.body = TestHelper.createMultiPart(req, body)
      // const directorNow = await req.patch()
      // assert.notStrictEqual(directorNow.token, director.token)
    })

    it('optional posted file verification_document_front', async () => {
      // const user = await TestHelper.createUser()
      // await TestHelper.createStripeAccount(user, {
      //   country: 'GB',
      //   type: 'company'
      // })
      // const person = TestHelper.nextIdentity()
      // const director = await TestHelper.createCompanyDirector(user, {
      //   dob_day: '1',
      //   dob_month: '1',
      //   dob_year: '1950',
      //   email: person.email,
      //   first_name: person.firstName,
      //   last_name: person.lastName
      // }, {
      //   verification_document_back: TestHelper['success_id_scan_back.png'],
      //   verification_document_front: TestHelper['success_id_scan_front.png']
      // })
      // const req = TestHelper.createRequest(`/api/user/connect/update-company-director?personid=${director.id}`)
      // req.account = user.account
      // req.session = user.session
      // req.uploads = {
      //   verification_document_front: TestHelper['success_id_scan_front.png']
      // }
      // const body = {
      //   dob_day: '1',
      //   dob_month: '1',
      //   dob_year: '1950',
      //   first_name: 'Modified name',
      //   last_name: person.lastName
      // }
      // req.body = TestHelper.createMultiPart(req, body)
      // const directorNow = await req.patch()
      // assert.notStrictEqual(directorNow.verification_document_front, director.verification_document_front)
    })

    it('optional posted file verification_document_back', async () => {
      // const user = await TestHelper.createUser()
      // await TestHelper.createStripeAccount(user, {
      //   country: 'GB',
      //   type: 'company'
      // })
      // const person = TestHelper.nextIdentity()
      // const director = await TestHelper.createCompanyDirector(user, {
      //   dob_day: '1',
      //   dob_month: '1',
      //   dob_year: '1950',
      //   email: person.email,
      //   first_name: person.firstName,
      //   last_name: person.lastName
      // }, {
      //   verification_document_back: TestHelper['success_id_scan_back.png'],
      //   verification_document_front: TestHelper['success_id_scan_front.png']
      // })
      // const req = TestHelper.createRequest(`/api/user/connect/update-company-director?personid=${director.id}`)
      // req.account = user.account
      // req.session = user.session
      // req.uploads = {
      //   verification_document_back: TestHelper['success_id_scan_front.png']
      // }
      // const body = {
      //   dob_day: '1',
      //   dob_month: '1',
      //   dob_year: '1950',
      //   first_name: 'Modified name',
      //   last_name: person.lastName
      // }
      // req.body = TestHelper.createMultiPart(req, body)
      // const directorNow = await req.patch()
      // assert.notStrictEqual(directorNow.verification_document_back, director.verification_document_back)
    })

    it('optionally-required posted first_name', async () => {
    })

    it('optionally-required posted last_name', async () => {
    })

    it('optionally-required posted dob_day', async () => {
    })

    it('optionally-required posted dob_month', async () => {
    })

    it('optionally-required posted dob_year', async () => {
    })
  })

  describe('returns', () => {
    it('object', async () => {
      // const user = await TestHelper.createUser()
      // await TestHelper.createStripeAccount(user, {
      //   country: 'GB',
      //   type: 'company'
      // })
      // const person = TestHelper.nextIdentity()
      // const director = await TestHelper.createCompanyDirector(user, {
      //   dob_day: '1',
      //   dob_month: '1',
      //   dob_year: '1950',
      //   email: person.email,
      //   first_name: person.firstName,
      //   last_name: person.lastName
      // }, {
      //   verification_document_back: TestHelper['success_id_scan_back.png'],
      //   verification_document_front: TestHelper['success_id_scan_front.png']
      // })
      // const req = TestHelper.createRequest(`/api/user/connect/update-company-director?personid=${director.id}`)
      // req.account = user.account
      // req.session = user.session
      // req.body = {}
      // req.filename = __filename
      // req.saveResponse = true
      // const directorNow = await req.patch()
      // assert.strictEqual(directorNow.object, 'person')
    })

    // describe('configuration', () => {
    // it('environment STRIPE_JS', async () => {
    // global.stripeJS = 3
    // const user = await TestHelper.createUser()
    // await TestHelper.createStripeAccount(user, {
    //   country: 'GB',
    //   type: 'company'
    // })
    // const person = TestHelper.nextIdentity()
    // const req = TestHelper.createRequest(`/account/connect/create-company-director?stripeid=${user.stripeAccount.id}`)
    // req.waitOnSubmit = true
    // req.account = user.account
    // req.session = user.session
    // req.uploads = {
    //   verification_document_back: TestHelper['success_id_scan_back.png'],
    //   verification_document_front: TestHelper['success_id_scan_front.png']
    // }
    // req.body = {
    //   dob_day: '1',
    //   dob_month: '1',
    //   dob_year: '1950',
    //   email: person.email,
    //   first_name: person.firstName,
    //   last_name: person.lastName
    // }
    // await req.post()
    // const directors = await global.api.user.connect.CompanyDirectors.get(req)
    // const director = directors[0]
    // const req2 = TestHelper.createRequest(`/account/connect/edit-company-director?personid=${director.id}`)
    // req2.waitOnSubmit = true
    // req2.account = user.account
    // req2.session = user.session
    // req2.body = {
    //   dob_day: '1',
    //   dob_month: '1',
    //   dob_year: '1950',
    //   email: person.email,
    //   first_name: person.firstName,
    //   last_name: person.lastName
    // }

    // await req2.post()
    // const directorNow = await global.api.user.connect.CompanyDirector.get(req2)
    // assert.notStrictEqual(directorNow.token, director.token)
    // assert.notStrictEqual(directorNow.token, null)
    // assert.notStrictEqual(directorNow.token, undefined)
    // })
  })
})
