/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')

describe('/api/user/connect/country-specs', () => {
  describe('CountrySpecs#GET', () => {
    it('should return stripe countrySpec list', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/api/user/connect/country-specs`)
      req.account = user.account
      req.session = user.session
      const countrySpecs = await req.get()
      assert.strictEqual(countrySpecs[0].object, 'country_spec')
    })
  })
})
