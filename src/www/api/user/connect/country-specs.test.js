/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')

describe('/api/user/connect/country-specs', () => {
  describe('receives', () => {
    it('optional querystring offset (integer)', async () => {
      const offset = 1
      global.delayDiskWrites = true
      const req = TestHelper.createRequest('/api/user/connect/country-specs?all=true')
      const countries = await req.get()
      const req2 = TestHelper.createRequest(`/api/user/connect/country-specs?offset=${offset}`)
      const countriesNow = await req2.get()
      for (let i = 0, len = global.pageSize; i < len; i++) {
        assert.strictEqual(countriesNow[i].id, countries[offset + i].id)
      }
    })

    it('optional querystring limit (integer)', async () => {
      const limit = 1
      const req = TestHelper.createRequest(`/api/user/connect/country-specs?limit=${limit}`)
      const countriesNow = await req.get()
      assert.strictEqual(countriesNow.length, limit)
    })

    it('optional querystring all (boolean)', async () => {
      global.pageSize = 1
      const req = TestHelper.createRequest('/api/user/connect/country-specs?all=true')
      const countriesNow = await req.get()
      assert.notStrictEqual(countriesNow.length, 0)
      assert.notStrictEqual(countriesNow.length, global.pageSize)
    })
  })

  describe('returns', () => {
    it('array', async () => {
      const req = TestHelper.createRequest('/api/user/connect/country-specs')
      const countrySpecs = await req.get()
      assert.strictEqual(countrySpecs.length, global.pageSize)
    })
  })

  describe('configuration', () => {
    it('environment PAGE_SIZE', async () => {
      global.pageSize = 3
      const req = TestHelper.createRequest('/api/user/connect/country-specs')
      const countrySpecs = await req.get()
      assert.strictEqual(countrySpecs.length, global.pageSize)
    })
  })
})
