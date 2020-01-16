const connect = require('../../../../index.js')
const dashboard = require('@userdashboard/dashboard')

module.exports = {
  before: beforeRequest,
  get: renderPage,
  post: submitForm
}

async function beforeRequest (req) {
  if (!req.query || !req.query.personid) {
    throw new Error('invalid-personid')
  }
  const owner = await global.api.user.connect.BeneficialOwner.get(req)
  owner.stripePublishableKey = global.stripePublishableKey
  req.query.stripeid = owner.account
  const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
  if (stripeAccount.business_type === 'individual') {
    throw new Error('invalid-stripe-account')
  }
  if (stripeAccount.company && stripeAccount.company.owners_provided) {
    throw new Error('invalid-stripe-account')
  }
  req.data = { stripeAccount, owner }
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = messageTemplate || (req.query ? req.query.message : null)
  const removeElements = []
  const doc = dashboard.HTML.parse(req.route.html, req.data.owner, 'person')
  if (global.stripeJS !== 3) {
    removeElements.push('stripe-v3', 'client-v3', 'connect-v3', 'handler-v3')
  } else {
    res.setHeader('content-security-policy',
      'default-src * \'unsafe-inline\'; ' +
    `style-src https://uploads.stripe.com/ https://m.stripe.com/ https://m.stripe.network/ https://js.stripe.com/v3/ https://js.stripe.com/v2/ ${global.dashboardServer}/public/ 'unsafe-inline'; ` +
    `script-src * https://uploads.stripe.com/ https://q.stripe.com/ https://m.stripe.com/ https://m.stripe.network/ https://js.stripe.com/v3/ https://js.stripe.com/v2/ ${global.dashboardServer}/public/ 'unsafe-eval' 'unsafe-inline'; ` +
    'frame-src * https://uploads.stripe.com/ https://m.stripe.com/ https://m.stripe.network/ https://js.stripe.com/ \'unsafe-inline\'; ' +
    'connect-src https://uploads.stripe.com/ https://m.stripe.com/ https://m.stripe.network/ https://js.stripe.com/ \'unsafe-inline\'; ')
  }
  if (messageTemplate) {
    console.log(messageTemplate)
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (messageTemplate === 'success') {
      removeElements.push('form-container')
      for (const id of removeElements) {
        const element = doc.getElementById(id)
        element.parentNode.removeChild(element)
      }
      return dashboard.Response.end(req, res, doc)
    }
  }
  if (req.data.stripeAccount.requirements.currently_due.indexOf(`${req.data.owner.id}.id_number`) === -1) {
    removeElements.push('id_number-container')
  }
  if (req.data.stripeAccount.requirements.currently_due.indexOf(`${req.data.owner.id}.email`) === -1) {
    removeElements.push('email-container')
  }
  if (req.data.stripeAccount.requirements.currently_due.indexOf(`${req.data.owner.id}.address.state`) === -1) {
    removeElements.push('state-container')
  }
  if (req.data.stripeAccount.requirements.currently_due.indexOf(`${req.data.owner.id}.address.country`) === -1) {
    removeElements.push('country-container')
  }
  if (req.data.stripeAccount.requirements.currently_due.indexOf(`${req.data.owner.id}.verification.document`) === -1) {
    removeElements.push('document-container')
  }
  if (req.data.stripeAccount.requirements.currently_due.indexOf(`${req.data.owner.id}.verification.additional_document`) === -1) {
    removeElements.push('additional_document-container')
  }
  if (req.method === 'GET' && req.data.owner.address.country) {
    const selectedCountry = req.data.owner.address.country
    const states = connect.countryDivisions[selectedCountry]
    dashboard.HTML.renderList(doc, states, 'state-option', 'address_state')
    dashboard.HTML.renderList(doc, connect.countryList, 'country-option', 'address_country')
    dashboard.HTML.setSelectedOptionByValue(doc, 'address_country', selectedCountry)
    for (const field of req.data.stripeAccount.requirements.currently_due) {
      if (!field.startsWith(req.data.owner.id)) {
        continue
      }
      const posted = field.split('.').join('_').replace(`${req.data.owner.id}_`, '')
      if (field === 'verification.document' ||
          field === 'verification.additional_document') {
        continue
      }
      const element = doc.getElementById(posted)
      if (element.attr.tag === 'input') {
        if (element.attr.tag === 'checkbox') {
          element.attr.checked = req.data.owner[posted]
          continue
        }
        element.setAttribute('value', req.data.owner[posted])
      } else if (element.attr.tag === 'select') {
        dashboard.HTML.setSelectedOptionByValue(doc, element.attr.id, req.data.owner[posted])
      }
    }
  } else if (req.body) {
    if (req.data.stripeAccount.requirements.currently_due.indexOf(`${req.data.owner.id}.address.state`) > -1) {
      let selectedCountry
      if (req.data.stripeAccount.requirements.currently_due.indexOf(`${req.data.owner.id}.address.country`) > -1) {
        selectedCountry = req.body.address_country || req.data.stripeAccount.country
      } else {
        selectedCountry = req.data.stripeAccount.country
      }
      const states = connect.countryDivisions[selectedCountry]
      dashboard.HTML.renderList(doc, states, 'state-option', 'address_state')
    }
    if (req.data.stripeAccount.requirements.currently_due.indexOf(`${req.data.owner.id}.address.country`) > -1) {
      const selectedCountry = req.body.address_country || req.data.owner.address_country
      dashboard.HTML.renderList(doc, connect.countryList, 'country-option', 'address_country')
      dashboard.HTML.setSelectedOptionByValue(doc, 'address_country', selectedCountry)
    }
    for (const field of req.data.stripeAccount.requirements.currently_due) {
      const posted = field.split('.').join('_')
      if (!req.body[posted]) {
        continue
      }
      const el = doc.getElementById(posted)
      if (!el) {
        continue
      }
      switch (el.tag) {
        case 'select':
          dashboard.HTML.setSelectedOptionByValue(doc, el.attr.id, req.body[posted])
          continue
        case 'input':
          if (el.attr.type === 'radio') {
            el.attr.checked = 'checked'
          } else {
            el.attr.value = req.body[posted]
          }
          continue
      }
    }
  }
  for (const id of removeElements) {
    const element = doc.getElementById(id)
    element.parentNode.removeChild(element)
  }
  return dashboard.Response.end(req, res, doc)
}

async function submitForm (req, res) {
  if (!req.body || req.body.refresh === 'true') {
    return renderPage(req, res)
  }
  if (req.query && req.query.message === 'success') {
    return renderPage(req, res)
  }
  if (global.stripeJS === 3 && !req.body.token) {
    return renderPage(req, res, 'invalid-token')
  }
  for (const field of req.data.stripeAccount.requirements.currently_due) {
    if (!field.startsWith(req.data.owner.id)) {
      continue
    }
    const posted = field.split('.').join('_').replace(`${req.data.owner.id}_`, '')
    if (!field) {
      if (field === 'relationship.executive' || 
          field === 'verification.document' ||
          field === 'verification.additional_document') {
        continue
      }
      return renderPage(req, res, `invalid-${posted}`)
    }
  }
  if (req.data.stripeAccount.requirements.currently_due.indexOf(`${req.data.owner.id}.address.country`) > -1) {
    if (!req.body.address_country || !connect.countryNameIndex[req.body.address_country]) {
      return renderPage(req, res, 'invalid-address_country')
    }
  }
  if (req.data.stripeAccount.requirements.currently_due.indexOf(`${req.data.owner.id}.address.state`) > -1) {
    if (!req.body.address_state) {
      return renderPage(req, res, 'invalid-address_state')
    }
    const states = connect.countryDivisions[req.body.address_country]
    let found
    for (const state of states) {
      found = state.value === req.body.address_state
      if (found) {
        break
      }
    }
    if (!found) {
      return renderPage(req, res, 'invalid-address_state')
    }
  }
  try {
    await global.api.user.connect.UpdateBeneficialOwner.patch(req)
  } catch (error) {
    return renderPage(req, res, error.message)
  }
  if (req.query['return-url']) {
    return dashboard.Response.redirect(req, res, req.query['return-url'])
  } else {
    res.writeHead(302, {
      location: `${req.urlPath}?personid=${req.query.personid}&message=success`
    })
    return res.end()
  }
}
