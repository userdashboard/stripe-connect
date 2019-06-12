const allCountries = require('../../../../countries.json')
const connect = require('../../../../index.js')
const dashboard = require('@userappstore/dashboard')

module.exports = {
  before: beforeRequest,
  get: renderPage,
  post: submitForm
}

async function beforeRequest (req) {
  if (!req.query || !req.query.stripeid) {
    throw new Error('invalid-stripeid')
  }
  if (req.session.lockURL === req.url && req.session.unlocked) {
    try {
      const owner = await global.api.user.connect.CreateAdditionalOwner._post(req)
      req.data = { owner }
    } catch (error) {
      req.error = error.message
    }
  }
  const stripeAccount = await global.api.user.connect.StripeAccount._get(req)
  if (stripeAccount.metadata.submitted ||
    stripeAccount.metadata.submittedOwners ||
    stripeAccount.legal_entity.type === 'individual' ||
    stripeAccount.metadata.accountid !== req.account.accountid) {
    throw new Error('invalid-stripe-account')
  }
  req.query.country = stripeAccount.country
  const countrySpec = await global.api.user.connect.CountrySpec._get(req)
  const verificationFields = countrySpec.verification_fields.company
  if (verificationFields.minimum.indexOf('legal_entity.additional_owners') === -1 &&
      verificationFields.additional.indexOf('legal_entity.additional_owners') === -1) {
    throw new Error('invalid-stripe-account')
  }
  let country
  const countries = []
  for (const countryItem of allCountries) {
    if (countryItem.code === countrySpec.id) {
      country = countryItem
    }
    countries.push({ value: countryItem.code, text: countryItem.name, object: 'option' })
  }
  const states = []
  for (const code in country.divisions) {
    const name = country.divisions[code]
    states.push({ value: code, text: name, object: 'option' })
  }
  const owners = connect.MetaData.parse(stripeAccount.metadata, 'owners')
  if (!req.success && owners && owners.length === 4) {
    req.error = 'maximum-owners'
  }
  req.data = { stripeAccount, owners, countries, country, countrySpec, states }
}

async function renderPage (req, res, messageTemplate) {
  if (req.success) {
    if (req.query && req.query.returnURL) {
      return dashboard.Response.redirect(req, res, req.query.returnURL)
    }
    return dashboard.Response.redirect(req, res, `/account/connect/additional-owner?ownerid=${req.data.owner.ownerid}`)
  } else if (req.error) {
    messageTemplate = req.error
  }
  const doc = dashboard.HTML.parse(req.route.html, req.data.stripeAccount, 'stripeAccount')
  if (!messageTemplate && req.method === 'GET' && req.query && req.query.returnURL) {
    const submitForm = doc.getElementById('submit-form')
    const divider = submitForm.attr.action.indexOf('?') > -1 ? '&' : '?'
    submitForm.attr.action += `${divider}returnURL=${encodeURI(req.query.returnURL).split('?').join('%3E')}`
  }
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (messageTemplate === 'success' || messageTemplate === 'maximum-owners') {
      const submitForm = doc.getElementById('submit-form')
      submitForm.parentNode.removeChild(submitForm)
      return dashboard.Response.end(req, res, doc)
    }
  }
  if (req.data.states && req.data.states.length) {
    dashboard.HTML.renderList(doc, req.data.states, 'state-option', 'state')
  } else {
    const stateContainer = doc.getElementById('state-container')
    stateContainer.parentNode.removeChild(stateContainer)
  }
  dashboard.HTML.renderList(doc, req.data.countries, 'country-option', 'country')
  if (!req.body) {
    return dashboard.Response.end(req, res, doc)
  }
  for (const fieldName in req.body) {
    const el = doc.getElementById(fieldName)
    if (!el) {
      continue
    }
    switch (el.tag) {
      case 'select':
        dashboard.HTML.setSelectedOptionByValue(doc, el.attr.id, req.body[fieldName])
        continue
      case 'input':
        if (el.attr.type === 'radio') {
          el.attr.checked = 'checked'
        } else {
          el.attr.value = req.body[fieldName]
        }
        continue
    }
  }
  if (req.data.country && !req.body.country) {
    dashboard.HTML.setSelectedOptionByValue(doc, 'country', req.data.country.code)
  }
  return dashboard.Response.end(req, res, doc)
}

async function submitForm (req, res) {
  if (req.error) {
    return renderPage(req, res)
  }
  if (!req.body || req.body.refresh === 'true') {
    return renderPage(req, res)
  }
  if (!req.body.city) {
    return renderPage(req, res, 'invalid-city')
  }
  if (!req.body.country) {
    return renderPage(req, res, 'invalid-country')
  }
  if (!req.body.line1) {
    return renderPage(req, res, 'invalid-line1')
  }
  if (!req.body.postal_code) {
    return renderPage(req, res, 'invalid-postal_code')
  }
  if (!req.body.day) {
    return renderPage(req, res, 'invalid-day')
  }
  if (!req.body.month) {
    return renderPage(req, res, 'invalid-month')
  }
  if (!req.body.year) {
    return renderPage(req, res, 'invalid-year')
  }
  if (!req.body.first_name) {
    return renderPage(req, res, 'invalid-first_name')
  }
  if (!req.body.last_name) {
    return renderPage(req, res, 'invalid-last_name')
  }
  if (req.data && req.data.owners && req.data.owners.length) {
    for (const owner of req.data.owners) {
      if (owner.first_name === req.body.first_name && owner.last_name === req.body.last_name) {
        return renderPage(req, res, 'duplicate-name')
      }
    }
  }
  try {
    const owner = await global.api.user.connect.CreateAdditionalOwner._post(req)
    if (req.success) {
      req.data = { owner }
      return renderPage(req, res, 'success')
    }
    return dashboard.Response.redirect(req, res, '/account/authorize')
  } catch (error) {
    return renderPage(req, res, error.message)
  }
}
