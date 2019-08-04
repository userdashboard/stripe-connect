const connect = require('../../../../index.js')
const dashboard = require('@userdashboard/dashboard')
const navbar = require('./navbar-stripe-account.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  if (!req.query || !req.query.stripeid) {
    throw new Error('invalid-stripeid')
  }
  const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
  if (stripeAccount.metadata.accountid !== req.account.accountid) {
    throw new Error('invalid-stripe-account')
  }
  if (stripeAccount.payouts_enabled) {
    stripeAccount.statusMessage = 'status-verified'
  } else if (stripeAccount.verification.disabled_reason) {
    stripeAccount.statusMessage = `status-${stripeAccount.verification.disabled_reason}`
  } else if (stripeAccount.verification.details_code) {
    stripeAccount.statusMessage = `status-${stripeAccount.verification.details_code}`
  } else if (stripeAccount.metadata.submitted) {
    stripeAccount.statusMessage = 'status-under-review'
  } else {
    stripeAccount.statusMessage = 'status-not-submitted'
  }
  req.query.country = stripeAccount.country
  const countrySpec = await global.api.user.connect.CountrySpec.get(req)
  let owners
  let verificationFields
  if (stripeAccount.legal_entity.type === 'individual') {
    verificationFields = countrySpec.verification_fields.individual.minimum.concat(countrySpec.verification_fields.individual.additional)
  } else {
    verificationFields = countrySpec.verification_fields.company.minimum.concat(countrySpec.verification_fields.company.additional)
    if (verificationFields && verificationFields.indexOf('legal_entity.additional_owners') > -1) {
      owners = await global.api.user.connect.AdditionalOwners.get(req)
    }
  }
  let registrationComplete = true
  const registration = connect.MetaData.parse(stripeAccount.metadata, 'registration') || {}
  if (verificationFields) {
    for (const pathAndField of verificationFields) {
      const field = pathAndField.split('.').pop()
      if (field === 'external_account' ||
          field === 'additional_owners' ||
          field === 'type' ||
          field === 'ip' ||
          field === 'date') {
        continue
      }
      if (field === 'document') {
        if (!registration.documentid) {
          registrationComplete = false
          break
        }
        continue
      }
      if (!registration[field]) {
        if (stripeAccount.legal_entity.type === 'company') {
          if (!registration[`company_${field}`] && !registration[`personal_${field}`]) {
            registrationComplete = false
            break    
          }
          continue
        }
        registrationComplete = false
        break
      }
    }
  }
  req.data = { stripeAccount, owners, countrySpec, verificationFields, registration, registrationComplete }
}

async function renderPage (req, res) {
  const doc = dashboard.HTML.parse(req.route.html, req.data.stripeAccount, 'stripeAccount')
  navbar.setup(doc, req.data.stripeAccount, req.data.countrySpec)
  const removeElements = []
  if (req.data.stripeAccount.statusMessage) {
    dashboard.HTML.renderTemplate(doc, null, req.data.stripeAccount.statusMessage, `account-status-${req.data.stripeAccount.id}`)
  }
  if (req.data.stripeAccount.legal_entity.type === 'individual') {
    removeElements.push('business-name')
    
  } else {
    removeElements.push('individual-name')
  }
  // registration can be submitted, ready to submit, or not started
  if (req.data.stripeAccount.metadata.submitted) {
    removeElements.push('registration-container')
  } else if (req.data.registrationComplete) {
    dashboard.HTML.renderTemplate(doc, null, 'completed-registration', 'account-status')
    removeElements.push('start-individual-registration-link', 'start-company-registration-link')
    if (req.data.stripeAccount.legal_entity.type !== 'individual') {
      removeElements.push('update-individual-registration-link')
    } else {
      removeElements.push('update-company-registration-link')
    }
  } else {
    dashboard.HTML.renderTemplate(doc, null, 'unstarted-registration', 'account-status')
    removeElements.push('update-individual-registration-link',  'update-company-registration-link')
    if (req.data.stripeAccount.legal_entity.type === 'individual') {
      removeElements.push('start-company-registration-link')
    } else {
      removeElements.push('start-individual-registration-link')
    }
  }
  // payment details
  const completedPaymentInformation = req.data.stripeAccount.external_accounts.data.length
  if (completedPaymentInformation) {
    removeElements.push('setup-payment')
    dashboard.HTML.renderTemplate(doc, req.data.stripeAccount.external_accounts.data[0], 'payment-information', 'payment-information-status')
  } else {
    removeElements.push('update-payment')
    dashboard.HTML.renderTemplate(doc, null, 'no-payment-information', 'payment-information-status')
  }
  // additional owners
  if (req.data.verificationFields && req.data.verificationFields.indexOf('legal_entity.additional_owners') > -1) {
    if (req.data.stripeAccount.metadata.submitted) {
      removeElements.push('owners-container')
    } else {
      if (req.data.stripeAccount.metadata.submittedOwners) {
        dashboard.HTML.renderTemplate(doc, null, 'owners-submitted', 'owners-status')
        removeElements.push('owner-options', 'owners-table')
      } else {
        dashboard.HTML.renderTemplate(doc, null, 'owners-not-submitted', 'owners-status')
        if (req.data.owners && req.data.owners.length) {
          dashboard.HTML.renderTable(doc, req.data.owners, 'owner-row', 'owners-table')
        } else {
          removeElements.push('owners-table')
        }
      }
    }
  } else {
    req.data.stripeAccount.metadata.submittedOwners = true
    removeElements.push('owners-container')
  }
  // submission status
  if (req.data.stripeAccount.metadata.submitted) {
    req.data.stripeAccount.date = dashboard.Timestamp.date(req.data.stripeAccount.metadata.submitted)
    dashboard.HTML.renderTemplate(doc, req.data.stripeAccount, 'submitted-information', 'submission-status')
    removeElements.push('submit-registration-link-container')
  } else {
    dashboard.HTML.renderTemplate(doc, req.data.stripeAccount, 'not-submitted-information', 'submission-status')
    let registrationLink
    if (req.data.stripeAccount.legal_entity.type === 'individual') {
      removeElements.push('submit-company-registration-link')
      registrationLink = doc.getElementById('submit-individual-registration-link')
    } else {
      removeElements.push('submit-individual-registration-link')
      registrationLink = doc.getElementById('submit-company-registration-link')
    }
    if (!req.data.registrationComplete || !req.data.stripeAccount.metadata.submittedOwners || !completedPaymentInformation) {
      registrationLink.setAttribute('disabled', 'disabled')
    }
  }
  for (const id of removeElements) {
    const element = doc.getElementById(id)
    if (!element || !element.parentNode) {
      continue
    }
    element.parentNode.removeChild(element)
  }
  return dashboard.Response.end(req, res, doc)
}
