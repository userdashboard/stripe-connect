/* eslint-env mocha */
global.applicationPath = global.applicationPath || __dirname
global.stripeAPIVersion = '2019-08-14'
global.maximumStripeRetries = 2
global.connectWebhookEndPointSecret = true

const fs = require('fs')
const stripe = require('stripe')()
stripe.setApiVersion(global.stripeAPIVersion)
stripe.setMaxNetworkRetries(global.maximumStripeRetries)
const util = require('util')
const stripeKey = {
  api_key: process.env.STRIPE_KEY
}

const TestHelper = require('@userdashboard/dashboard/test-helper.js')
const wait = util.promisify((callback) => {
  return setTimeout(callback, 100)
})

module.exports = {
  createBeneficialOwner,
  createCompanyDirector,
  createExternalAccount,
  createMultiPart,
  createPayout,
  createStripeAccount,
  createStripeRegistration,
  submitStripeAccount,
  triggerVerification,
  waitForVerification: util.promisify(waitForVerification),
  waitForVerificationFailure: util.promisify(waitForVerificationFailure),
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

for (const x in TestHelper) {
  module.exports[x] = TestHelper[x]
}

before(async () => {
  const webhooks = await stripe.webhookEndpoints.list(stripeKey)
  if (webhooks.data && webhooks.data.length) {
    for (const webhook of webhooks.data) {
      await stripe.webhookEndpoints.del(webhook.id, stripeKey)
    }
  }
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

const helperRoutes = require('./test-helper-routes.js')

beforeEach((callback) => {
  global.sitemap['/api/fake-payout'] = helperRoutes.fakePayout
  return callback()
})
module.exports.createRequest = (rawURL, method) => {
  const req = TestHelper.createRequest(rawURL, method)
  req.stripeKey = stripeKey
  req.retry = true
  return req
}

async function createStripeAccount (user, properties) {
  const req = TestHelper.createRequest(`/api/user/connect/create-stripe-account?accountid=${user.account.accountid}`)
  req.session = user.session
  req.account = user.account
  req.body = properties
  user.stripeAccount = await req.post()
  return user.stripeAccount
}

async function createStripeRegistration (user, properties) {
  const req = TestHelper.createRequest(`/api/user/connect/update-${user.stripeAccount.business_type}-registration?stripeid=${user.stripeAccount.id}`)
  req.session = user.session
  req.account = user.account
  if (user.stripeAccount.business_type === 'individual') {
    req.uploads = {
      individual_verification_document_front: module.exports['success_id_scan_front.png'],
      individual_verification_document_back: module.exports['success_id_scan_back.png']
    }
  } else {
    req.uploads = {
      relationship_account_opener_verification_document_front: module.exports['success_id_scan_front.png'],
      relationship_account_opener_verification_document_back: module.exports['success_id_scan_back.png']
    }
  }
  req.body = createMultiPart(req, properties)
  user.stripeAccount = await req.patch()
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

async function createExternalAccount (user, details) {
  const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
  req.session = user.session
  req.account = user.account
  req.body = details
  user.stripeAccount = await req.patch()
  return user.stripeAccount.external_accounts.data[0]
}

async function createBeneficialOwner (user, properties) {
  const req = TestHelper.createRequest(`/api/user/connect/create-beneficial-owner?stripeid=${user.stripeAccount.id}`)
  req.session = user.session
  req.account = user.account
  req.uploads = {
    relationship_owner_verification_document_front: module.exports['success_id_scan_front.png'],
    relationship_owner_verification_document_back: module.exports['success_id_scan_back.png']
  }
  req.body = createMultiPart(req, properties)
  const owner = await req.post()
  user.owner = owner
  return owner
}

async function createCompanyDirector (user, properties) {
  const req = TestHelper.createRequest(`/api/user/connect/create-company-director?stripeid=${user.stripeAccount.id}`)
  req.session = user.session
  req.account = user.account
  req.uploads = {
    relationship_director_verification_document_front: module.exports['success_id_scan_front.png'],
    relationship_director_verification_document_back: module.exports['success_id_scan_back.png']
  }
  req.body = createMultiPart(req, properties)
  const director = await req.post()
  user.director = director
  return director
}

async function createPayout (user) {
  const req = TestHelper.createRequest(`/api/fake-payout?stripeid=${user.stripeAccount.id}`)
  req.session = user.session
  req.account = user.account
  await req.get()
  while (true) {
    const req2 = TestHelper.createRequest(`/api/user/connect/payouts?accountid=${user.account.accountid}`)
    req2.session = user.session
    req2.account = user.account
    const payouts = await req2.get(req2)
    if (!payouts || !payouts.length) {
      await wait()
      continue
    }
    if (user.payout && user.payout.id === payouts[0]) {
      await wait()
      continue
    }
    user.payout = payouts[0]
    break
  }
  return user.payout
}

async function submitStripeAccount (user) {
  const req = TestHelper.createRequest(`/api/user/connect/set-${user.stripeAccount.business_type}-registration-submitted?stripeid=${user.stripeAccount.id}`)
  req.session = user.session
  req.account = user.account
  const stripeAccount = await req.patch()
  user.stripeAccount = stripeAccount
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

async function waitForVerification (stripeid, callback) {
  async function wait () {
    if (global.testEnded) {
      return
    }
    const stripeAccount = await stripe.accounts.retrieve(stripeid, stripeKey)
    if (stripeAccount.business_type === 'individual') {
      if (!stripeAccount.payouts_enabled ||
          !stripeAccount.individual.verification ||
          stripeAccount.individual.verification.status !== 'verified') {
        return setTimeout(wait, 100)
      }
    } else {
      if (!stripeAccount.payouts_enabled ||
          !stripeAccount.requirements ||
          stripeAccount.requirements.disabled_reason !== 'requirements.pending_verification') {
        return setTimeout(wait, 100)
      }
    }
    return setTimeout(() => {
      return callback(null, stripeAccount)
    }, 1000)
  }
  return setTimeout(wait, 100)
}

async function waitForVerificationFailure (stripeid, callback) {
  async function wait () {
    if (global.testEnded) {
      return
    }
    const stripeAccount = await stripe.accounts.retrieve(stripeid, stripeKey)
    if (stripeAccount.business_type === 'individual') {
      if (stripeAccount.payouts_enabled ||
        stripeAccount.individual.disabled_reason.status !== 'requirements.pending_verification') {
        return setTimeout(wait, 100)
      }
    } else {
      if (stripeAccount.payouts_enabled ||
          stripeAccount.requirements.disabled_reason !== 'requirements.pending_verification') {
        return setTimeout(wait, 100)
      }
    }
    return setTimeout(() => {
      return callback(null, stripeAccount)
    }, 1000)
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
