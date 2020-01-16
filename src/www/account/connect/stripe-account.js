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
    stripeAccount.statusMessage = 'verified'
  } else if (stripeAccount.verification && stripeAccount.requirements.disabled_reason) {
    stripeAccount.statusMessage = stripeAccount.requirements.disabled_reason
  } else if (stripeAccount.verification && stripeAccount.requirements.details_code) {
    stripeAccount.statusMessage = stripeAccount.requirements.details_code
  } else if (stripeAccount.metadata.submitted) {
    stripeAccount.statusMessage = 'under-review'
  } else {
    stripeAccount.statusMessage = 'not-submitted'
  }
  if (stripeAccount.metadata && stripeAccount.metadata.submitted) {
    stripeAccount.metadata.submittedFormatted = dashboard.Format.date(stripeAccount.metadata.submitted)
  }
  let registrationComplete = true
  if (stripeAccount.requirements.currently_due.length) {
    for (const field of stripeAccount.requirements.currently_due) {
      if (field === 'external_account' ||
          field === 'relationship.representative' ||
          field === 'relationship.account_opener' ||
          field === 'relationship.title' ||
          field === 'relationship.owner' ||
          field === 'relationship.executive' ||
          field === 'relationship.director' ||
          field === 'business_type' ||
          field === 'tos_acceptance.ip' ||
          field === 'individual.verification.document' ||
          field === 'tos_acceptance.date') {
        continue
      }
      registrationComplete = false
    }
  }
  stripeAccount.company = stripeAccount.company || {}
  stripeAccount.individual = stripeAccount.individual || {}
  let owners, directors, representative
  if (stripeAccount.business_type === 'company') {
    owners = await global.api.user.connect.BeneficialOwners.get(req)
    directors = await global.api.user.connect.CompanyDirectors.get(req)
    req.query.personid = stripeAccount.metadata.representative
    representative = await global.api.user.connect.CompanyRepresentative.get(req)
  }
  req.data = { owners, directors, representative, stripeAccount, registrationComplete }
}

async function renderPage (req, res) {
  const doc = dashboard.HTML.parse(req.route.html, req.data.stripeAccount, 'stripeAccount')
  navbar.setup(doc, req.data.stripeAccount)
  const removeElements = []
  if (req.data.stripeAccount.statusMessage) {
    dashboard.HTML.renderTemplate(doc, null, req.data.stripeAccount.statusMessage, `account-status-${req.data.stripeAccount.id}`)
  }
  if (req.data.stripeAccount.metadata.submitted) {
    removeElements.push('not-submitted2')
  } else {
    removeElements.push('submitted')
  }
  if (req.data.stripeAccount.business_type === 'individual') {
    removeElements.push('business', 'business-name')
    if (req.data.stripeAccount.individual.first_name) {
      removeElements.push('blank-name')
    } else {
      removeElements.push('individual-name')
    }
  } else {
    removeElements.push('individual', 'individual-name')
    if (req.data.stripeAccount.company.name) {
      removeElements.push('blank-name')
    } else {
      removeElements.push('business-name')
    }
    if (req.data.stripeAccount.metadata.representative) {
      if (req.data.representative.first_name) {
        removeElements.push('add-company-representative-link')
      } else {
        removeElements.push('update-company-representative-link', 'remove-company-representative-link')
      }
      dashboard.HTML.renderTable(doc, [req.data.representative], 'representative-row', 'representatives-table')
    } else {
      removeElements.push('update-company-representative-link', 'remove-company-representative-link', 'representative-container')
    }
    if (req.data.stripeAccount.metadata.submitted) {
      removeElements.push('add-account-opener-link', 'edit-account-opener-link')
    } else if (req.data.stripeAccount.metadata.accountOpener) {
      removeElements.push('add-account-opener-link')
    }
  }
  if (req.data.stripeAccount.metadata.submitted) {
    removeElements.push('registration-container')
  } else if (req.data.registrationComplete) {
    dashboard.HTML.renderTemplate(doc, null, 'completed-registration', 'account-status')
    removeElements.push('start-individual-registration-link', 'start-company-registration-link')
    if (req.data.stripeAccount.business_type === 'individual') {
      removeElements.push('update-company-registration-link')
    } else {
      removeElements.push('update-individual-registration-link')
    }
  } else {
    dashboard.HTML.renderTemplate(doc, null, 'unstarted-registration', 'account-status')
    removeElements.push('update-individual-registration-link', 'update-company-registration-link')
    if (req.data.stripeAccount.business_type === 'individual') {
      removeElements.push('start-company-registration-link')
    } else {
      removeElements.push('start-individual-registration-link')
    }
  }
  const completedPaymentInformation = req.data.stripeAccount.external_accounts.data.length
  if (completedPaymentInformation) {
    removeElements.push('setup-payment')
    dashboard.HTML.renderTemplate(doc, req.data.stripeAccount.external_accounts.data[0], 'payment-information', 'payment-information-status')
  } else {
    removeElements.push('update-payment')
    dashboard.HTML.renderTemplate(doc, null, 'no-payment-information', 'payment-information-status')
  }
  if (!req.data.stripeAccount.metadata.submitted && req.data.owners && req.data.owners.length) {
    dashboard.HTML.renderTable(doc, req.data.owners, 'owner-row', 'owners-table')
  } else {
    if (req.data.stripeAccount.metadata.submitted ||
        req.data.stripeAccount.company.owners_provided ||
        req.data.stripeAccount.business_type === 'individual' ||
        req.data.stripeAccount.requirements.currently_due.indexOf('relationship.owner') === -1) {
      removeElements.push('owners-container')
    } else {
      removeElements.push('owners-table')
    }
  }
  if (!req.data.stripeAccount.metadata.submitted &&
      !req.data.stripeAccount.company.directors_provided &&
      req.data.directors &&
      req.data.directors.length) {
    dashboard.HTML.renderTable(doc, req.data.directors, 'director-row', 'directors-table')
  } else {
    if (req.data.stripeAccount.metadata.submitted ||
        req.data.stripeAccount.company.directors_provided ||
        req.data.stripeAccount.business_type === 'individual' ||
        req.data.stripeAccount.requirements.currently_due.indexOf('relationship.director') === -1) {
      removeElements.push('directors-table')
    } else {
      removeElements.push('directors-table')
    }
  }
  if (req.data.stripeAccount.metadata.submitted) {
    dashboard.HTML.renderTemplate(doc, req.data.stripeAccount, 'submitted-information', 'submission-status')
    removeElements.push('submit-registration-link-container')
  } else {
    dashboard.HTML.renderTemplate(doc, req.data.stripeAccount, 'not-submitted-information', 'submission-status')
    let registrationLink
    if (req.data.stripeAccount.business_type === 'individual') {
      removeElements.push('submit-company-registration-link')
      registrationLink = doc.getElementById('submit-individual-registration-link')
    } else {
      removeElements.push('submit-individual-registration-link')
      registrationLink = doc.getElementById('submit-company-registration-link')
    }
    if (!req.data.registrationComplete || !completedPaymentInformation) {
      registrationLink.setAttribute('disabled', 'disabled')
    }
  }
  for (const id of removeElements) {
    const element = doc.getElementById(id)
    element.parentNode.removeChild(element)
  }
  return dashboard.Response.end(req, res, doc)
}
