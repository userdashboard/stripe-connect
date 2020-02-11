const dashboard = require('@userdashboard/dashboard')
const stripe = require('stripe')()
stripe.setApiVersion(global.stripeAPIVersion)
if (global.maxmimumStripeRetries) {
  stripe.setMaxNetworkRetries(global.maximumStripeRetries)
}
stripe.setTelemetryEnabled(false)
const util = require('util')

const wait = util.promisify((callback) => {
  return setTimeout(callback, 100)
})

function retriableError (error) {
  if (global.testEnded) {
    return false
  }
  if (error.type === 'StripeConnectionError') {
    return true
  }
  if (error.type === 'StripeAPIError') {
    return true
  }
  if (error.message === 'An error occurred with our connection to Stripe.') {
    return true
  }
  if (!error.raw || !error.raw.code) {
    return false
  }
  if (error.raw.code === 'lock_timeout') {
    return true
  }
  if (error.raw.code === 'rate_limit') {
    return true
  }
  if (error.raw.code === 'account_invalid') {
    return true
  }
  if (error.raw.code === 'idempotency_key_in_use') {
    return true
  }
  if (error.raw.code === 'resource_missing') {
    return true
  }
  return false
}

function formatError (error) {
  if (error.raw && error.raw.param) {
    const property = error.raw.param.replace('[', '.').replace(']', '').replace('.', '_')
    return `invalid-${property}`
  }
  return 'unknown-error'
}

function execute (group, method, p1, p2, p3, p4, p5, callback) {
  if (!callback) {
    if (p5) {
      callback = p5
      p5 = null
    } else if (p4) {
      callback = p4
      p4 = null
    } else if (p3) {
      callback = p3
      p3 = null
    } else if (p2) {
      callback = p2
      p2 = null
    } else if (p1) {
      callback = p1
      p1 = null
    }
  }
  if (p5) {
    return stripe[group][method](p1, p2, p3, p4, p5, (error, result) => {
      if (!error) {
        return callback(null, result)
      }
      const retry = retriableError(error)
      if (retry) {
        return execute(group, method, p1, p2, p3, p4, p5, callback)
      }
      return callback(new Error(formatError(error)))
    })
  } else if (p4) {
    return stripe[group][method](p1, p2, p3, p4, (error, result) => {
      if (!error) {
        return callback(null, result)
      }
      const retry = retriableError(error)
      if (retry) {
        return execute(group, method, p1, p2, p3, p4, p5, callback)
      }
      return callback(new Error(formatError(error)))
    })
  } else if (p3) {
    return stripe[group][method](p1, p2, p3, (error, result) => {
      if (!error) {
        return callback(null, result)
      }
      const retry = retriableError(error)
      if (retry) {
        return execute(group, method, p1, p2, p3, p4, p5, callback)
      }
      return callback(new Error(formatError(error)))
    })
  } else if (p2) {
    return stripe[group][method](p1, p2, (error, result) => {
      if (!error) {
        return callback(null, result)
      }
      const retry = retriableError(error)
      if (retry) {
        return execute(group, method, p1, p2, p3, p4, p5, callback)
      }
      return callback(new Error(formatError(error)))
    })
  } else if (p1) {
    return stripe[group][method](p1, (error, result) => {
      if (!error) {
        return callback(null, result)
      }
      const retry = retriableError(error)
      if (retry) {
        return execute(group, method, p1, p2, p3, p4, p5, callback)
      }
      return callback(new Error(formatError(error)))
    })
  }
}

const stripeCache = module.exports = {
  execute: util.promisify(execute),
  retrieve: async (id, group, stripeKey) => {
    if (global.testEnded) {
      return
    }
    const string = await dashboard.Storage.read(`stripe/${id}`)
    if (string) {
      return JSON.parse(string)
    }
    return stripeCache.execute(group, 'retrieve', id, stripeKey)
  },
  retrievePerson: async (stripeid, personid, stripeKey) => {
    if (global.testEnded) {
      return
    }
    const string = await dashboard.Storage.read(`stripe/${personid}`)
    if (string) {
      return JSON.parse(string)
    }
    const object = await stripeCache.execute('accounts', 'retrievePerson', stripeid, personid, stripeKey)
    const cached = JSON.stringify(object)
    await dashboard.Storage.write(`stripe/${personid}`, cached)
    return object
  },
  update: async (object) => {
    if (global.testEnded) {
      return
    }
    const cached = JSON.stringify(object)
    await dashboard.Storage.write(`stripe/${object.id}`, cached)
  },
  delete: async (id) => {
    if (global.testEnded) {
      return
    }
    if (!id) {
      throw new Error('invalid-id', id)
    }
    try {
      await dashboard.Storage.deleteFile(`stripe/${id}`)
    } catch (error) {
    }
  }
}
