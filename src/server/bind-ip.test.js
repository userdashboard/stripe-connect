/* eslint-env mocha */
const assert = require('assert')
const BindIP = require('./bind-ip.js')

describe('server/bind-ip', async () => {
  describe('BindIP#BEFORE', () => {
    it('should prioritize ip from header', async () => {
      const req = {
        headers: {
          'x-forwarded-for': '1.2.3.4'
        }
      }
      await BindIP.before(req)
      assert.strictEqual(req.ip, '1.2.3.4')
    })

    it('should bind ip from connection remoteAddress', async () => {
      const req = {
        headers: {},
        connection: {
          remoteAddress: '4.5.6.7'
        }
      }
      await BindIP.before(req)
      assert.strictEqual(req.ip, '4.5.6.7')
    })

    it('should bind ip from connection socket', async () => {
      const req = {
        headers: {},
        connection: {
          socket: '4.5.6.7'
        }
      }
      await BindIP.before(req)
      assert.strictEqual(req.ip, '4.5.6.7')
    })

    it('should bind ip from socket remoteAddress', async () => {
      const req = {
        headers: {},
        socket: {
          remoteAddress: '8.9.10.11'
        }
      }
      await BindIP.before(req)
      assert.strictEqual(req.ip, '8.9.10.11')
    })
  })
})
