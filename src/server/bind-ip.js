module.exports = {
  before: async (req) => {
    req.ip = req.ip || requestIPAddress(req)
  }
}

function requestIPAddress (req) {
  const xForwardFor = req.headers['x-forwarded-for']
  if (xForwardFor) {
    const comma = xForwardFor.indexOf(',')
    if (comma > -1) {
      return xForwardFor.substring(0, comma)
    }
    return xForwardFor
  }
  if (req.connection) {
    if (req.connection.remoteAddress) {
      return req.connection.remoteAddress
    } else if (req.connection.socket) {
      return req.connection.socket
    }
  }
  if (req.socket && req.socket.remoteAddress) {
    return req.socket.remoteAddress
  }
}
