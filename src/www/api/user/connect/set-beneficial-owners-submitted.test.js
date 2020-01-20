/* eslint-env mocha */
const assert = require('assert')
const connect = require('../../../../../index.js')
const TestHelper = require('../../../../../test-helper.js')

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
      if (country.id === 'JP') {
        continue
      }
      it('object (' + country.id + ')', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: country.id,
          type: 'company'
        })
        const person = TestHelper.nextIdentity()
        const owner = JSON.parse(JSON.stringify(beneficialOwnerData[country.id]))
        owner.email = person.email,
        owner.first_name = person.firstName,
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
        await TestHelper.waitForVerificationFieldsToLeave(user, 'relationship.owner')
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
      req.body = JSON.parse(JSON.stringify(beneficialOwnerData['DE']))
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

const beneficialOwnerData = {
  AT: {
    address_city: 'Berlin',
    address_country: 'DE',
    address_line1: 'First Street',
    address_postal_code: '01067',
    address_state: 'BW',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  AU: {
    address_city: 'Berlin',
    address_country: 'DE',
    address_line1: 'First Street',
    address_postal_code: '01067',
    address_state: 'BW',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  BE: {
    address_city: 'Brussels',
    address_country: 'BE',
    address_line1: 'First Street',
    address_postal_code: '1020',
    address_state: 'BRU',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  CA: {
    address_city: 'Vancouver',
    address_line1: '123 Sesame St',
    address_postal_code: 'V5K 0A1',
    address_state: 'BC',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  CH: {
    address_city: 'Berlin',
    address_country: 'DE',
    address_line1: 'First Street',
    address_postal_code: '01067',
    address_state: 'BW',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  DE:  {
    address_city: 'Berlin',
    address_country: 'DE',
    address_line1: 'First Street',
    address_postal_code: '01067',
    address_state: 'BW',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  DK: {
    address_city: 'Berlin',
    address_country: 'DE',
    address_line1: 'First Street',
    address_postal_code: '01067',
    address_state: 'BW',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  }, 
  EE: {
    address_city: 'Berlin',
    address_country: 'DE',
    address_line1: 'First Street',
    address_postal_code: '01067',
    address_state: 'BW',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  }, 
  ES: {
    address_city: 'Berlin',
    address_country: 'DE',
    address_line1: 'First Street',
    address_postal_code: '01067',
    address_state: 'BW',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  FI: {
    address_city: 'Berlin',
    address_country: 'DE',
    address_line1: 'First Street',
    address_postal_code: '01067',
    address_state: 'BW',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  FR: {
    address_city: 'Paris',
    address_country: 'FR',
    address_line1: '123 Sesame St',
    address_postal_code: '75001',
    address_state: 'A',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  GB: {
    address_city: 'London',
    address_country: 'GB',
    address_line1: '123 Sesame St',
    address_postal_code: 'EC1A 1AA',
    address_state: 'LND',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  GR: {
    address_city: 'Athens',
    address_country: 'GR',
    address_line1: '123 Park Lane',
    address_postal_code: '104',
    address_state: 'I',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  HK: {
    address_city: 'Hong Kong',
    address_country: 'HK',
    address_line1: '123 Sesame St',
    address_postal_code: '999077',
    address_state: 'HK',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  IE: {
    address_city: 'Dublin',
    address_country: 'IE',
    address_line1: '123 Sesame St',
    address_postal_code: 'Dublin 1',
    address_state: 'D',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  IT: {
    address_city: 'Rome',
    address_country: 'IT',
    address_line1: '123 Sesame St',
    address_postal_code: '00010',
    address_state: '65',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  JP: {
  },
  LT: {
    address_city: 'Vilnius',
    address_country: 'LT',
    address_line1: '123 Sesame St',
    address_postal_code: 'LT-00000',
    address_state: 'AL',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  LU: {
    address_city: 'Luxemburg',
    address_country: 'LU',
    address_line1: '123 Sesame St',
    address_postal_code: '1623',
    address_state: 'L',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  LV: {
    address_city: 'Riga',
    address_country: 'LV',
    address_line1: '123 Sesame St',
    address_postal_code: 'LV–1073',
    address_state: 'AI',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  MY: {
    address_city: 'Kuala Lumpur',
    address_country: 'MY',
    address_line1: '123 Sesame St',
    address_postal_code: '50450',
    address_state: 'C',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  }, 
  NL: {
    address_city: 'Amsterdam',
    address_country: 'NL',
    address_line1: '123 Sesame St',
    address_postal_code: '1071 JA',
    address_state: 'DR',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
  },
  NO: {
    address_city: 'Oslo',
    address_country: 'NO',
    address_line1: '123 Sesame St',
    address_postal_code: '0001',
    address_state: '02',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  NZ: {
    address_city: 'Auckland',
    address_country: 'NZ',
    address_line1: '844 Fleet Street',
    address_postal_code: '6011',
    address_state: 'N',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  PL: {
    address_city: 'Krakow',
    address_country: 'PL',
    address_line1: '123 Park Lane',
    address_postal_code: '32-400',
    address_state: 'KR',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  PT: {
    address_city: 'Stockholm',
    address_country: 'PT',
    address_line1: '123 Sesame St',
    address_postal_code: '00150',
    address_state: 'K',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  SE: {
    address_city: 'Singapore',
    address_country: 'SE',
    address_line1: '123 Sesame St',
    address_postal_code: '339696',
    address_state: 'SG',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  SK: {
    address_city: 'Slovakia',
    address_country: 'SK',
    address_line1: '123 Sesame St',
    address_postal_code: '00102',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  US: {
    address_city: 'New York',
    address_country: 'US',
    address_line1: '285 Fulton St',
    address_postal_code: '10007',
    address_state: 'NY',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  }
}