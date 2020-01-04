/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')

describe('/api/user/connect/country-specs-count', () => {
  describe('returns', () => {
    it('integer', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/api/user/connect/country-specs-count')
      req.account = user.account
      req.session = user.session
      req.filename = __filename
      req.saveResponse = true
      const total = await req.get()
      assert.strictEqual(total > 0, true)
    })
  })
})
