/* eslint-env mocha */
global.applicationPath = global.applicationPath || __dirname
global.stripeAPIVersion = '2019-08-14'
global.maximumStripeRetries = 0
global.connectWebhookEndPointSecret = true

const fs = require('fs')
let ngrok
if (process.env.NGROK) {
  ngrok = require('ngrok')
}
const packageJSON = require('./package.json')
const stripe = require('stripe')()
stripe.setApiVersion(global.stripeAPIVersion)
stripe.setMaxNetworkRetries(global.maximumStripeRetries)
stripe.setAppInfo({
  version: packageJSON.version,
  name: '@userdashboard/stripe-connect (test suite)',
  url: 'https://github.com/userdashboard/stripe-connect'
})

const util = require('util')
const stripeKey = {
  api_key: process.env.STRIPE_KEY
}

const wait = util.promisify((callback) => {
  return setTimeout(callback, 100)
})

const waitForWebhook = util.promisify(async (webhookType, matching, callback) => {
  if (process.env.DEBUG_ERRORS) {
  }
  let retries = 0
  async function wait () {
    retries++
    if (retries === 20000) {
      return callback()
    }
    if (global.testEnded) {
      return
    }
    if (!global.webhooks || !global.webhooks.length) {
      return setTimeout(wait, 20)
    }
    for (const received of global.webhooks) {
      if (received.type !== webhookType) {
        continue
      }
      if (matching(received)) {
        return setTimeout(() => {
          callback(null, received)
        }, 20)
      }
    }
    return setTimeout(wait, 20)
  }
  return setTimeout(wait, 20)
})

module.exports = {
  createBeneficialOwner,
  createCompanyDirector,
  createExternalAccount,
  createMultiPart,
  createPayout,
  createStripeAccount,
  createStripeRegistration,
  createCompanyRepresentative,
  setCompanyRepresentative,
  submitBeneficialOwners,
  submitCompanyDirectors,
  submitStripeAccount,
  triggerVerification,
  waitForWebhook,
  waitForVerification: util.promisify(waitForVerification),
  waitForPayoutsEnabled: util.promisify(waitForPayoutsEnabled),
  waitForVerificationFieldsToLeave: util.promisify(waitForVerificationFieldsToLeave),
  waitForVerificationFieldsToReturn: util.promisify(waitForVerificationFieldsToReturn),
  waitForVerificationFailure: util.promisify(waitForVerificationFailure),
  waitForVerificationStart: util.promisify(waitForVerificationStart),
  waitForPayout: util.promisify(waitForPayout),
  'success_id_scan_front.png': {
    filename: 'id_scan_front.png',
    name: 'id_scan_front.png',
    path: `${__dirname}/test-documentid-success.png`
  },
  'fail_id_scan_front.png': {
    filename: 'id_scan_front.png',
    name: 'id_scan_front.png',
    path: `${__dirname}/test-documentid-failed.png`
  },
  'success_id_scan_back.png': {
    filename: 'id_scan_back.png',
    name: 'id_scan_back.png',
    path: `${__dirname}/test-documentid-success.png`
  },
  'fail_id_scan_back.png': {
    filename: 'id_scan_back.png',
    name: 'id_scan_back.png',
    path: `${__dirname}/test-documentid-failed.png`
  }
}

let TestHelper, tunnel, connect
before(async () => {
  let webhooks = await stripe.webhookEndpoints.list(stripeKey)
  while (webhooks.data && webhooks.data.length) {
    for (const webhook of webhooks.data) {
      if (webhook === 0) {
        continue
      }
      try {
        await stripe.webhookEndpoints.del(webhook.id, stripeKey)
      } catch (error) {
      }
    }
    try {
      webhooks = await stripe.webhookEndpoints.list(stripeKey)
    } catch (error) {
      webhooks = { data: [0] }
    }
  }
  let accounts = await stripe.accounts.list(stripeKey)
  while (accounts.data && accounts.data.length) {
    for (const account of accounts.data) {
      const persons = await stripe.accounts.listPersons(account.id, { limit: 100 }, stripeKey)
      if (persons.data && persons.data.length) {
        for (const person of persons.data) {
          try {
            await stripe.accounts.deletePerson(account.id, person.id, stripeKey)
          } catch (error) {
          }
        }
      }
      try {
        await stripe.accounts.del(account.id, stripeKey)
      } catch (error) {
      }
    }
    try {
      accounts = await stripe.accounts.list(stripeKey)
    } catch (error) {
    }
  }
  if (process.env.NGROK) {
    while (!tunnel) {
      try {
        tunnel = await ngrok.connect(process.env.PORT)
        if (!tunnel) {
          continue
        }
        global.dashboardServer = tunnel.replace('https://', 'http://')
        global.domain = tunnel.split('://')[1]
      } catch (error) {
        continue
      }
    }
  }
  TestHelper = require('@userdashboard/dashboard/test-helper.js')
  for (const x in TestHelper) {
    module.exports[x] = TestHelper[x]
  }
  module.exports.createRequest = (rawURL, method) => {
    const req = TestHelper.createRequest(rawURL, method)
    req.stripeKey = stripeKey
    return req
  }
  connect = require('./index.js')
  const events = fs.readdirSync(`${__dirname}/src/www/webhooks/connect/stripe-webhooks`)
  const eventList = []
  for (const event of events) {
    eventList.push(event.substring(0, event.indexOf('.js')))
  }
  const webhook = await stripe.webhookEndpoints.create({
    connect: true,
    url: `${global.dashboardServer}/webhooks/connect/index-connect-data`,
    enabled_events: eventList
  }, stripeKey)
  global.connectWebhookEndPointSecret = webhook.secret
})

after(async () => {
  if (process.env.NGROK) {
    ngrok.kill()
  }
  let webhooks = await stripe.webhookEndpoints.list(stripeKey)
  while (webhooks.data && webhooks.data.length) {
    for (const webhook of webhooks.data) {
      await stripe.webhookEndpoints.del(webhook.id, stripeKey)
    }
    webhooks = await stripe.webhookEndpoints.list(stripeKey)
  }
  let accounts = await stripe.accounts.list(stripeKey)
  while (accounts.data && accounts.data.length) {
    for (const account of accounts.data) {
      while (true) {
        try {
          await stripe.accounts.del(account.id, stripeKey)
        } catch (error) {
          if (error.raw && error.raw.code === 'lock_timeout') {
            continue
          }
          break
        }
      }
    }
    accounts = await stripe.accounts.list(stripeKey)
  }
})

const helperRoutes = require('./test-helper-routes.js')

beforeEach((callback) => {
  global.sitemap['/api/fake-payout'] = helperRoutes.fakePayout
  global.sitemap['/api/substitute-failed-document-front'] = helperRoutes.substituteFailedDocumentFront
  global.sitemap['/api/substitute-failed-document-back'] = helperRoutes.substituteFailedDocumentBack
  global.stripeJS = false
  global.webhooks = []
  return callback()
})

async function createStripeAccount (user, properties) {
  const req = TestHelper.createRequest(`/api/user/connect/create-stripe-account?accountid=${user.account.accountid}`)
  req.session = user.session
  req.account = user.account
  req.body = properties
  user.stripeAccount = await req.post()
  return user.stripeAccount
}

async function createStripeRegistration (user, properties, uploads) {
  const req = TestHelper.createRequest(`/api/user/connect/update-${user.stripeAccount.business_type}-registration?stripeid=${user.stripeAccount.id}`)
  req.session = user.session
  req.account = user.account
  req.uploads = uploads
  req.body = createMultiPart(req, properties)
  user.stripeAccount = await req.patch()
  await waitForWebhook('account.updated', (stripeEvent) => {
    return stripeEvent.data.object.id === user.stripeAccount.id
  })
  return user.stripeAccount
}

async function createCompanyRepresentative (user, properties, uploads) {
  const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
  req.session = user.session
  req.account = user.account
  req.uploads = uploads || {}
  req.body = createMultiPart(req, properties)
  await req.patch()
  await waitForWebhook('account.updated', (stripeEvent) => {
    return stripeEvent.data.object.metadata.representative !== undefined
  })
  return user.stripeAccount
}

function createMultiPart (req, body) {
  const boundary = '-----------------test' + global.testNumber
  const delimiter = `\r\n--${boundary}`
  const closeDelimiter = delimiter + '--'
  const buffers = []
  for (const field in req.uploads) {
    const filename = req.uploads[field].filename
    const type = filename.endsWith('.png') ? 'image/png' : 'image/jpeg'
    const segment = [
      delimiter,
      `Content-Disposition: form-data; name="${field}"; filename="${filename}"`,
      `Content-Type: ${type}`,
      '\r\n'
    ]
    buffers.push(Buffer.from(segment.join('\r\n')), fs.readFileSync(req.uploads[field].path), Buffer.from('\r\n'))
  }
  for (const field in body) {
    buffers.push(Buffer.from(`${delimiter}\r\nContent-Disposition: form-data; name="${field}"\r\n\r\n${body[field]}`))
  }
  buffers.push(Buffer.from(closeDelimiter))
  const multipartBody = Buffer.concat(buffers)
  req.headers = req.headers || {}
  req.headers['Content-Type'] = `multipart/form-data; boundary=${boundary}`
  req.headers['Content-Length'] = multipartBody.length
  return multipartBody
}

async function createExternalAccount (user, body) {
  const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
  req.session = user.session
  req.account = user.account
  req.body = body
  user.stripeAccount = await req.patch()
  await waitForWebhook('account.updated', (stripeEvent) => {
    return stripeEvent.data.object.id === user.stripeAccount.id &&
           stripeEvent.data.object.external_accounts.data.length
  })
  return user.stripeAccount.external_accounts.data[0]
}

async function createBeneficialOwner (user, body, uploads) {
  const req = TestHelper.createRequest(`/api/user/connect/create-beneficial-owner?stripeid=${user.stripeAccount.id}`)
  req.session = user.session
  req.account = user.account
  req.uploads = uploads
  req.body = createMultiPart(req, body)
  const owner = await req.post()
  await waitForWebhook('account.updated', (stripeEvent) => {
    const owners = connect.MetaData.parse(stripeEvent.data.object.metadata, 'owners')
    return stripeEvent.data.object.id === user.stripeAccount.id &&
           owners &&
           owners.length &&
           owners[owners.length - 1] === owner.id
  })
  user.owner = owner
  return owner
}

async function createCompanyDirector (user, body, uploads) {
  const req = TestHelper.createRequest(`/api/user/connect/create-company-director?stripeid=${user.stripeAccount.id}`)
  req.session = user.session
  req.account = user.account
  req.uploads = uploads
  req.body = createMultiPart(req, body)
  const director = await req.post()
  await waitForWebhook('account.updated', (stripeEvent) => {
    const directors = connect.MetaData.parse(stripeEvent.data.object.metadata, 'directors')
    return stripeEvent.data.object.id === user.stripeAccount.id &&
           directors &&
           directors.length &&
           directors[directors.length - 1] === director.id
  })
  user.director = director
  return director
}

async function createPayout (user) {
  const req = TestHelper.createRequest(`/api/fake-payout?stripeid=${user.stripeAccount.id}`)
  req.session = user.session
  req.account = user.account
  await req.get()
  while (true) {
    const req2 = TestHelper.createRequest(`/api/user/connect/payouts?accountid=${user.account.accountid}&limit=1`)
    req2.session = user.session
    req2.account = user.account
    const payouts = await req2.get(req2)
    if (!payouts || !payouts.length) {
      await wait()
      continue
    }
    if (user.payout && user.payout.id === payouts[0].id) {
      await wait()
      continue
    }
    user.payout = payouts[0]
    break
  }
  return user.payout
}

async function submitBeneficialOwners (user) {
  const req = TestHelper.createRequest(`/api/user/connect/set-beneficial-owners-submitted?stripeid=${user.stripeAccount.id}`)
  req.session = user.session
  req.account = user.account
  const stripeAccount = await req.patch()
  user.stripeAccount = stripeAccount
  await waitForWebhook('account.updated', (stripeEvent) => {
    return stripeEvent.data.object.id === user.stripeAccount.id &&
           stripeEvent.data.object.company.owners_provided === true
  })
  await wait()
  return stripeAccount
}

async function submitCompanyDirectors (user) {
  const req = TestHelper.createRequest(`/api/user/connect/set-company-directors-submitted?stripeid=${user.stripeAccount.id}`)
  req.session = user.session
  req.account = user.account
  const stripeAccount = await req.patch()
  user.stripeAccount = stripeAccount
  await waitForWebhook('account.updated', (stripeEvent) => {
    return stripeEvent.data.object.id === user.stripeAccount.id &&
           stripeEvent.data.object.company.directors_provided === true
  })
  await wait()
  return user.stripeAccount
}

async function setCompanyRepresentative (user) {
  const req = TestHelper.createRequest(`/api/user/connect/set-company-representative?stripeid=${user.stripeAccount.id}`)
  req.session = user.session
  req.account = user.account
  await req.patch()
  await waitForWebhook('person.created', (stripeEvent) => {
    return stripeEvent.account === user.stripeAccount.id &&
           stripeEvent.data.object.relationship.representative
  })
  await waitForWebhook('account.updated', (stripeEvent) => {
    return stripeEvent.account === user.stripeAccount.id &&
           stripeEvent.data.object.metadata.representative
  })
  await wait()
  return user.stripeAccount
}

async function submitStripeAccount (user) {
  const req = TestHelper.createRequest(`/api/user/connect/set-${user.stripeAccount.business_type}-registration-submitted?stripeid=${user.stripeAccount.id}`)
  req.session = user.session
  req.account = user.account
  const stripeAccount = await req.patch()
  user.stripeAccount = stripeAccount
  await waitForWebhook('account.updated', (stripeEvent) => {
    return stripeEvent.data.object.id === user.stripeAccount.id &&
           stripeEvent.data.object.metadata.submitted
  })
  return stripeAccount
}

async function waitForPayout (administrator, stripeid, previousid, callback) {
  callback = callback || previousid
  if (callback === previousid) {
    previousid = null
  }
  async function wait () {
    if (global.testEnded) {
      return
    }
    const req = module.exports.createRequest(`/api/administrator/connect/stripe-account-payouts?stripeid=${stripeid}&limit=1`)
    req.account = administrator.account
    req.session = administrator.session
    const itemids = await req.get()
    if (!itemids || !itemids.length) {
      return setTimeout(wait, 100)
    }
    if (previousid && previousid === itemids[0].id) {
      return setTimeout(wait, 100)
    }
    return setTimeout(() => {
      callback(null, itemids[0])
    }, 100)
  }
  return setTimeout(wait, 100)
}

async function waitForPayoutsEnabled (user, callback) {
  const req = TestHelper.createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.id}&from=waitForPayoutsEnabled`)
  req.account = user.account
  req.session = user.session
  async function wait () {
    if (global.testEnded) {
      return
    }
    const stripeAccount = await req.get(req)
    if (!stripeAccount.payouts_enabled) {
      return setTimeout(wait, 100)
    }
    return setTimeout(() => {
      return callback(null, stripeAccount)
    }, 10)
  }
  return setTimeout(wait, 100)
}

async function waitForVerification (user, callback) {
  const req = TestHelper.createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.id}&from=waitForVerification`)
  req.account = user.account
  req.session = user.session
  async function wait () {
    if (global.testEnded) {
      return
    }
    const stripeAccount = await req.get(req)
    if (stripeAccount.business_type === 'individual') {
      if (!stripeAccount.individual || stripeAccount.individual.verification.status !== 'verified') {
        return setTimeout(wait, 100)
      }
    } else {
      if (!stripeAccount.company || stripeAccount.company.verification.status !== 'verified') {
        return setTimeout(wait, 100)
      }
    }
    if (!stripeAccount.payouts_enabled && !stripeAccount.requirements.currently_due.length) {
      return setTimeout(wait, 100)
    }
    return setTimeout(() => {
      return callback(null, stripeAccount)
    }, 10)
  }
  return setTimeout(wait, 100)
}

async function waitForVerificationFailure (user, callback) {
  const req = TestHelper.createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.id}&from=waitForVerificationFailure`)
  req.account = user.account
  req.session = user.session
  async function wait () {
    if (global.testEnded) {
      return
    }
    const stripeAccount = await req.get(req)
    if (stripeAccount.business_type === 'individual') {
      if (stripeAccount.requirements.pending_verification.length ||
          (stripeAccount.individual && stripeAccount.individual.verification.status !== 'unverified')) {
        return setTimeout(wait, 100)
      }
    } else {
      if (stripeAccount.requirements.pending_verification.length ||
        (stripeAccount.company && stripeAccount.company.verification.status !== 'unverified')) {
        return setTimeout(wait, 100)
      }
    }
    return setTimeout(callback, 10)
  }
  return setTimeout(wait, 100)
}

async function waitForVerificationFieldsToLeave (user, contains, callback) {
  const req = TestHelper.createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
  req.account = user.account
  req.session = user.session
  let attempts = 0
  async function wait () { 
    if (global.testEnded) {
      return
    }
    attempts++
    const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
    if (attempts === 1000) {
      return callback()
    }
    for (const field of stripeAccount.requirements.eventually_due) {
      if (field.indexOf(contains) > -1) {
        return setTimeout(wait, 100)
      }
    }
    for (const field of stripeAccount.requirements.past_due) {
      if (field.indexOf(contains) > -1) {
        return setTimeout(wait, 100)
      }
    }
    for (const field of stripeAccount.requirements.currently_due) {
      if (field.indexOf(contains) > -1) {
        return setTimeout(wait, 100)
      }
    }
    return setTimeout(callback, 10)
  }
  return setTimeout(wait, 100)
}

async function waitForVerificationFieldsToReturn (user, contains, callback) {
  const req = TestHelper.createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
  req.account = user.account
  req.session = user.session
  let attempts = 0
  async function wait () {
    if (global.testEnded) {
      return
    }
    attempts++
    const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
    if (attempts === 1000) {
      return callback()
    }
    for (const field of stripeAccount.requirements.eventually_due) {
      if (field.indexOf(contains) > -1) {
        return setTimeout(callback, 10)
      }
    }
    for (const field of stripeAccount.requirements.past_due) {
      if (field.indexOf(contains) > -1) {
        return setTimeout(callback, 10)
      }
    }
    for (const field of stripeAccount.requirements.currently_due) {
      if (field.indexOf(contains) > -1) {
        return setTimeout(callback, 10)
      }
    }
    return setTimeout(wait, 100)
  }
  return setTimeout(wait, 100)
}

async function waitForVerificationStart (user, callback) {
  const req = TestHelper.createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
  req.account = user.account
  req.session = user.session
  let attempts = 0
  async function wait () {
    if (global.testEnded) {
      return
    }
    attempts++
    const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
    if (attempts === 400) {
      return callback()
    }
    if (stripeAccount.requirements.eventually_due.length ||
      stripeAccount.requirements.past_due.length ||
      stripeAccount.requirements.currently_due.length) {
      return setTimeout(wait, 100)
    }
    return setTimeout(callback, 10)
  }
  return setTimeout(wait, 100)
}

async function triggerVerification (user) {
  const accountKey = {
    api_key: stripeKey.api_key,
    stripe_account: user.stripeAccount.id
  }
  const chargeInfo = {
    amount: 2000,
    currency: 'usd',
    source: 'tok_visa_triggerVerification',
    description: 'Test charge'
  }
  let charge
  try {
    charge = await stripe.charges.create(chargeInfo, accountKey)
  } catch (error) {
  }
  user.charge = charge
  return charge
}
