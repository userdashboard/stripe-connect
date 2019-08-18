/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')

describe('/api/user/connect/country-spec', () => {
  describe('CountrySpec#GET', () => {
    it('should reject invalid country', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/api/user/connect/country-spec?country=invalid`)
      req.account = user.account
      req.session = user.session
      const countrySpec = await req.get()
      assert.strictEqual(countrySpec.message, 'invalid-country')
    })

    it('should return stripe countrySpec data', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/api/user/connect/country-spec?country=US`)
      req.account = user.account
      req.session = user.session
      const countrySpec = await req.get()
      assert.strictEqual(countrySpec.id, 'US')
    })
  })
      })
