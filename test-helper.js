/* eslint-env mocha */
global.applicationPath = global.applicationPath || __dirname
global.stripeAPIVersion = '2020-03-02'
global.maximumStripeRetries = 0

const fs = require('fs')
const Log = require('@userdashboard/dashboard/src/log.js')('stripe-connect')
const util = require('util')
let ngrok, publicIP, localTunnel, localhostRun
if (process.env.NGROK) {
  ngrok = require('ngrok')
} else if (process.env.PUBLIC_IP) {
  publicIP = require('public-ip')
} else if (process.env.LOCAL_TUNNEL) {
  localTunnel = require('localtunnel')
}

const packageJSON = require('./package.json')
const stripe = require('stripe')()
stripe.setApiVersion(global.stripeAPIVersion)
if (global.maxmimumStripeRetries) {
  stripe.setMaxNetworkRetries(global.maximumStripeRetries)
}
stripe.setTelemetryEnabled(false)
stripe.setAppInfo({
  version: packageJSON.version,
  name: '@userdashboard/stripe-connect (test suite)',
  url: 'https://github.com/userdashboard/stripe-connect'
})
const stripeKey = {
  api_key: process.env.STRIPE_KEY
}

const wait = util.promisify((callback) => {
  return setTimeout(callback, 100)
})

let eventFolderPath = `${__dirname}/src/www/webhooks/connect/stripe-webhooks`
if (!fs.existsSync(eventFolderPath)) {
  eventFolderPath = `${__dirname}/node_modules/@userdashboard/stripe-connect/src/www/webhooks/connect/stripe-webhooks`
}
const events = fs.readdirSync(eventFolderPath)
const eventList = []
for (const event of events) {
  eventList.push(event.substring(0, event.indexOf('.js')))
}

module.exports = {
  createExternalAccount,
  createPayout,
  createPerson,
  createStripeAccount,
  deleteOldWebhooks,
  setupWebhook,
  submitBeneficialOwners,
  submitCompanyDirectors,
  submitStripeAccount,
  triggerVerification,
  updatePerson,
  updateStripeAccount,
  waitForAccountRequirement: util.promisify(waitForAccountRequirement),
  waitForPersonRequirement: util.promisify(waitForPersonRequirement),
  waitForPendingFieldsToLeave: util.promisify(waitForPendingFieldsToLeave),
  waitForVerification: util.promisify(waitForVerification),
  waitForPayoutsEnabled: util.promisify(waitForPayoutsEnabled),
  waitForVerificationFieldsToLeave: util.promisify(waitForVerificationFieldsToLeave),
  waitForCurrentlyDueFieldsToLeave: util.promisify(waitForCurrentlyDueFieldsToLeave),
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

const TestHelper = require('@userdashboard/dashboard/test-helper.js')
for (const x in TestHelper) {
  module.exports[x] = TestHelper[x]
}
const createRequest = module.exports.createRequest = (rawURL, method) => {
  const req = TestHelper.createRequest(rawURL, method)
  req.stripeKey = stripeKey
  return req
}

module.exports.setupBeforeEach = setupBeforeEach

async function setupBefore () {
  const connect = require('./index.js')
  connect.setup()
  if (process.env.GENERATE_COUNTRY) {
    connect.countrySpecs = [
      connect.countrySpecIndex[process.env.GENERATE_COUNTRY]
    ]
  }
  await deleteOldWebhooks()
}

async function setupBeforeEach () {
  const helperRoutes = require('./test-helper-routes.js')
  global.sitemap['/api/fake-payout'] = helperRoutes.fakePayout
  global.sitemap['/api/substitute-failed-document-front'] = helperRoutes.substituteFailedDocumentFront
  global.sitemap['/api/substitute-failed-document-back'] = helperRoutes.substituteFailedDocumentBack
  global.stripeJS = false
  global.maximumStripeRetries = 0
  global.webhooks = []
}

let webhook, tunnel, data

async function setupWebhook () {
  if (webhook) {
    return
  }
  let newAddress
  if (process.env.NGROK) {
    if (ngrok) {
      ngrok.kill()
    }
    tunnel = null
    while (!tunnel) {
      try {
        tunnel = await ngrok.connect({
          port: global.port,
          auth: process.env.NGROK_AUTH
        })
        if (!tunnel) {
          continue
        }
        newAddress = tunnel
        break
      } catch (error) {
        continue
      }
    }
  } else if (process.env.PUBLIC_IP) {
    const ip = await publicIP.v4()
    newAddress = `http://${ip}:${global.port}`
  } else if (process.env.LOCAL_TUNNEL) {
    if (tunnel) {
      tunnel.close()
    }
    tunnel = await localTunnel({ port: global.port, local_https: false, host: 'http://localtunnel.me' })
    newAddress = tunnel.url
  } else if (process.env.LOCALHOST_RUN) {
    if (localhostRun) {
      localhostRun.stdin.pause()
      localhostRun.kill()
    }
    const asyncLocalHostRun = util.promisify(createLocalHostRun)
    const url = await asyncLocalHostRun()
    newAddress = url
  } else {
    newAddress = global.dashboardServer
  }
  if (newAddress) {
    webhook = await stripe.webhookEndpoints.create({
      url: `${newAddress}/webhooks/connect/index-connect-data`,
      enabled_events: eventList,
      connect: true
    }, stripeKey)
    global.connectWebhookEndPointSecret = webhook.secret
  }
}

beforeEach(setupBeforeEach)
before(setupBefore)

afterEach(async () => {
  if (data) {
    await deleteOldStripeAccounts()
    data = false
  }
})

after(async () => {
  if (webhook) {
    await deleteOldWebhooks()
    webhook = null
  }
  if (process.env.NGROK) {
    if (ngrok) {
      ngrok.kill()
    }
  } else if (process.env.LOCAL_TUNNEL) {
    if (tunnel) {
      tunnel.close()
    }
  } else if (process.env.LOCALHOST_RUN) {
    if (localhostRun) {
      localhostRun.stdin.pause()
      localhostRun.kill()
    }
  }
})

async function deleteOldWebhooks () {
  webhook = null
  let webhooks
  while (true) {
    try {
      webhooks = await stripe.webhookEndpoints.list(stripeKey)
      break
    } catch (error) {
    }
  }
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
}

async function deleteOldStripeAccounts () {
  let accounts
  while (true) {
    try {
      accounts = await stripe.accounts.list(stripeKey)
      break
    } catch (error) {
    }
  }
  while (accounts.data && accounts.data.length) {
    for (const account of accounts.data) {
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
}

function createLocalHostRun (callback) {
  const spawn = require('child_process').spawn
  localhostRun = spawn('ssh', ['-T', '-o', 'StrictHostKeyChecking=no', '-R', '80:localhost:' + global.port, 'ssh.localhost.run'])
  localhostRun.stdout.once('data', async (log) => {
    const url = log.toString().split(' ').pop().trim()
    return callback(null, url)
  })
  localhostRun.stderr.on('error', async (log) => {
    Log.error('localhost.run error', log.toString())
  })
}

async function createStripeAccount (user, body) {
  data = true
  const req = createRequest(`/api/user/connect/create-stripe-account?accountid=${user.account.accountid}`)
  req.session = user.session
  req.account = user.account
  req.body = body
  user.stripeAccount = await req.post()
  return user.stripeAccount
}

async function updateStripeAccount (user, body, uploads) {
  const req = createRequest(`/api/user/connect/update-stripe-account?stripeid=${user.stripeAccount.id}`)
  req.session = user.session
  req.account = user.account
  req.body = TestHelper.createMultiPart(req, body, uploads)
  user.stripeAccount = await req.patch()
  return user.stripeAccount
}

async function createExternalAccount (user, body) {
  const req = createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
  req.session = user.session
  req.account = user.account
  req.body = body
  user.stripeAccount = await req.patch()
  const req2 = createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
  req2.session = user.session
  req2.account = user.account
  req2.stripeKey = stripeKey
  while (true) {
    try {
      user.stripeAccount = await global.api.user.connect.StripeAccount.get(req2)
      if (user.stripeAccount.external_accounts.total_count === 1) {
        return user.stripeAccount
      }
    } catch (error) {
    }
    await wait()
  }
}

async function createPerson (user, body) {
  const req = createRequest(`/api/user/connect/create-person?stripeid=${user.stripeAccount.id}`)
  req.session = user.session
  req.account = user.account
  req.body = body
  const person = await req.post()
  if (body && body.relationship_owner) {
    user.owner = person
  } else if (body && body.relationship_director) {
    user.director = person
  } else if (body && body.relationship_representative) {
    user.representative = person
  }
  return person
}

async function updatePerson (user, person, body, uploads) {
  const req = createRequest(`/api/user/connect/update-person?personid=${person.id}`)
  req.session = user.session
  req.account = user.account
  req.body = TestHelper.createMultiPart(req, body, uploads)
  const personNow = await req.patch()
  if (personNow.relationship.owner) {
    user.owner = personNow
  } else if (personNow.relationship.director) {
    user.director = personNow
  } else if (personNow.relationship.representative) {
    user.representative = personNow
  }
  return personNow
}

async function createPayout (user) {
  const req = createRequest(`/api/fake-payout?stripeid=${user.stripeAccount.id}`)
  req.session = user.session
  req.account = user.account
  const payout = await req.get()
  const req2 = createRequest(`/api/user/connect/payouts?accountid=${user.account.accountid}&stripeid=${user.stripeAccount.id}&limit=1`)
  req2.session = user.session
  req2.account = user.account
  req2.stripeKey = stripeKey
  while (true) {
    const payouts = await global.api.user.connect.Payouts.get(req2)
    if (!payouts || !payouts.length) {
      await wait()
      continue
    }
    if (payout.id === payouts[0].id) {
      user.payout = payout
      return user.payout
    }
    await wait()
  }
}

async function submitBeneficialOwners (user) {
  const req = createRequest(`/api/user/connect/set-beneficial-owners-submitted?stripeid=${user.stripeAccount.id}`)
  req.session = user.session
  req.account = user.account
  user.stripeAccount = await req.patch()
  const req2 = createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
  req2.session = user.session
  req2.account = user.account
  req2.stripeKey = stripeKey
  while (true) {
    try {
      user.stripeAccount = await global.api.user.connect.StripeAccount.get(req2)
      if (user.stripeAccount.company.owners_provided) {
        return user.stripeAccount
      }
    } catch (error) {
    }
    await wait()
  }
}

async function submitCompanyDirectors (user) {
  const req = createRequest(`/api/user/connect/set-company-directors-submitted?stripeid=${user.stripeAccount.id}`)
  req.session = user.session
  req.account = user.account
  user.stripeAccount = await req.patch()
  const req2 = createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
  req2.session = user.session
  req2.account = user.account
  req2.stripeKey = stripeKey
  while (true) {
    try {
      user.stripeAccount = await global.api.user.connect.StripeAccount.get(req2)
      if (user.stripeAccount.company.directors_provided) {
        return user.stripeAccount
      }
    } catch (error) {
    }
    await wait()
  }
}

async function submitStripeAccount (user) {
  const req = createRequest(`/api/user/connect/set-stripe-account-submitted?stripeid=${user.stripeAccount.id}`)
  req.session = user.session
  req.account = user.account
  user.stripeAccount = await req.patch()
  const req2 = createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
  req2.session = user.session
  req2.account = user.account
  req2.stripeKey = stripeKey
  while (true) {
    try {
      user.stripeAccount = await global.api.user.connect.StripeAccount.get(req2)
      if (user.stripeAccount.requirements.pending_verification.length) {
        return wait()
      }
    } catch (error) {
    }
    return user.account
  }
}

async function waitForPayout (administrator, stripeid, previousid, callback) {
  Log.info('waitForPayout')
  callback = callback || previousid
  if (callback === previousid) {
    previousid = null
  }
  async function wait () {
    if (global.testEnded) {
      return
    }
    const req = module.exports.createRequest(`/api/administrator/connect/payouts?stripeid=${stripeid}&limit=1`)
    req.account = administrator.account
    req.session = administrator.session
    req.stripeKey = stripeKey
    const itemids = await global.api.administrator.connect.Payouts.get(req)
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
  Log.info('waitForPayoutsEnabled')
  const req = createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.id}&from=waitForPayoutsEnabled`)
  req.account = user.account
  req.session = user.session
  req.stripeKey = stripeKey
  async function wait () {
    if (global.testEnded) {
      return
    }
    try {
      const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
      if (stripeAccount.requirements.currently_due.length) {
        throw new Error('account requires fields ' + stripeAccount.requirements.currently_due.join(', '))
      } else if (stripeAccount.requirements.eventually_due.length) {
        throw new Error('account requires fields ' + stripeAccount.requirements.eventually_due.join(', '))
      }
      if (!stripeAccount.payouts_enabled) {
        return setTimeout(wait, 100)
      }
      return setTimeout(() => {
        return callback(null, stripeAccount)
      }, 10)
    } catch (error) {
    }
    return setTimeout(wait, 10)
  }
  return setTimeout(wait, 100)
}

async function waitForVerification (user, callback) {
  Log.info('waitForVerification')
  const req = createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.id}&from=waitForVerification`)
  req.account = user.account
  req.session = user.session
  req.stripeKey = stripeKey
  async function wait () {
    if (global.testEnded) {
      return
    }
    try {
      const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
      if (stripeAccount.business_type === 'individual') {
        if (!stripeAccount.individual || stripeAccount.individual.verification.status !== 'verified') {
          return setTimeout(wait, 100)
        }
      }
      if (!stripeAccount.payouts_enabled || stripeAccount.requirements.currently_due.length) {
        return setTimeout(wait, 100)
      }
      user.stripeAccount = stripeAccount
      return callback(null, stripeAccount)
    } catch (error) {
    }
    return setTimeout(wait, 10)
  }
  return setTimeout(wait, 100)
}

async function waitForVerificationFailure (user, callback) {
  Log.info('waitForVerificationFailure')
  const req = createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.id}&from=waitForVerificationFailure`)
  req.account = user.account
  req.session = user.session
  req.stripeKey = stripeKey
  async function wait () {
    if (global.testEnded) {
      return
    }
    try {
      const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
      if (stripeAccount.business_type === 'individual') {
        if ((stripeAccount.requirements && stripeAccount.requirements.pending_verification.length) ||
            (stripeAccount.individual && stripeAccount.individual.verification.status !== 'unverified')) {
          return setTimeout(wait, 100)
        }
      } else {
        if ((stripeAccount.requirements && stripeAccount.requirements.pending_verification.length) ||
          (stripeAccount.company && stripeAccount.company.verification.status !== 'unverified')) {
          return setTimeout(wait, 100)
        }
      }
      return setTimeout(callback, 10)
    } catch (error) {
    }
    return setTimeout(wait, 10)
  }
  return setTimeout(wait, 100)
}

async function waitForPendingFieldsToLeave (user, callback) {
  Log.info('waitForPendingFieldsToLeave')
  const req = createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
  req.account = user.account
  req.session = user.session
  req.stripeKey = stripeKey
  async function wait () {
    if (global.testEnded) {
      return
    }
    try {
      const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
      if (stripeAccount.requirements.pending_verification.length) {
        return setTimeout(wait, 100)
      }
      user.stripeAccount = stripeAccount
      return setTimeout(callback, 10)
    } catch (error) {
    }
    return setTimeout(wait, 10)
  }
  return setTimeout(wait, 100)
}

async function waitForCurrentlyDueFieldsToLeave (user, contains, callback) {
  Log.info('waitForCurrentlyDueFieldsToLeave', contains)
  const req = createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
  req.account = user.account
  req.session = user.session
  req.stripeKey = stripeKey
  async function wait () {
    if (global.testEnded) {
      return
    }
    try {
      const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
      for (const field of stripeAccount.requirements.currently_due) {
        if (field.indexOf(contains) > -1) {
          return setTimeout(wait, 100)
        }
      }
      user.stripeAccount = stripeAccount
      return setTimeout(callback, 10)
    } catch (error) {
    }
    return setTimeout(wait, 10)
  }
  return setTimeout(wait, 100)
}

async function waitForVerificationFieldsToLeave (user, contains, callback) {
  Log.info('waitForVerificationFieldsToLeave')
  const req = createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
  req.account = user.account
  req.session = user.session
  req.stripeKey = stripeKey
  async function wait () {
    if (global.testEnded) {
      return
    }
    try {
      const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
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
      user.stripeAccount = stripeAccount
      return setTimeout(callback, 10)
    } catch (error) {
    }
    return setTimeout(wait, 10)
  }
  return setTimeout(wait, 100)
}

async function waitForVerificationStart (user, callback) {
  Log.info('waitForVerificationStart')
  const req = createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
  req.account = user.account
  req.session = user.session
  req.stripeKey = stripeKey
  async function wait () {
    if (global.testEnded) {
      return
    }
    try {
      const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
      if (stripeAccount.requirements.eventually_due.length ||
        stripeAccount.requirements.past_due.length ||
        stripeAccount.requirements.currently_due.length) {
        return setTimeout(wait, 100)
      }
      user.stripeAccount = stripeAccount
      return setTimeout(callback, 10)
    } catch (error) {
    }
    return setTimeout(wait, 10)
  }
  return setTimeout(wait, 100)
}

async function waitForAccountRequirement (user, requirement, callback) {
  Log.info('waitForAccountRequirement', requirement)
  const req = createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
  req.account = user.account
  req.session = user.session
  req.stripeKey = stripeKey
  async function wait () {
    if (global.testEnded) {
      return
    }
    try {
      const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
      if (!stripeAccount.requirements) {
        return setTimeout(wait, 100)
      }
      if (stripeAccount.requirements.currently_due.indexOf(requirement) > -1) {
        user.stripeAccount = stripeAccount
        return setTimeout(callback, 10)
      }
      if (stripeAccount.requirements.eventually_due.indexOf(requirement) > -1) {
        user.stripeAccount = stripeAccount
        return setTimeout(callback, 10)
      }
      return setTimeout(wait, 100)
    } catch (error) {
    }
    return setTimeout(wait, 10)
  }
  return setTimeout(wait, 100)
}

async function waitForPersonRequirement (user, personid, requirement, callback) {
  Log.info('waitForPersonRequirement', personid, requirement)
  const req = createRequest(`/api/user/connect/person?personid=${personid}`)
  req.account = user.account
  req.session = user.session
  req.stripeKey = stripeKey
  async function wait () {
    if (global.testEnded) {
      return
    }
    try {
      const person = await global.api.user.connect.Person.get(req)
      if (person && person.requirements) {
        if (person.requirements.currently_due.indexOf(requirement) > -1 ||
            person.requirements.eventually_due.indexOf(requirement) > -1) {
          return setTimeout(callback, 10)
        }
      }
    } catch (error) {
    }
    return setTimeout(wait, 100)
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
