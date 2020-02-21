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
  let owners, directors, representatives
  if (stripeAccount.business_type === 'company') {
    req.query.all = true
    const persons = await global.api.user.connect.Persons.get(req)
    if (persons && persons.length) {
      for (const person of persons) {
        if (person.relationship.representative) {
          representatives = representatives || []
          representatives.push(person)
        }
        if (person.relationship.owner) {
          owners = owners || []
          owners.push(person)
        }
        if (person.relationship.director) {
          directors = directors || []
          directors.push(person)
        }
      }
    }
  }
  req.data = { owners, directors, representatives, stripeAccount, registrationComplete }
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
    if (req.data.representatives && req.data.representatives.length) {
      dashboard.HTML.renderTable(doc, req.data.representatives, 'person-row', 'representatives-table')
      for (const person of req.data.representatives) {
        if (person.requirements.currently_due.length) {
          removeElements.push(`requires-no-information-${person.id}`)
        } else {
          removeElements.push(`requires-information-${person.id}`)
        }
      }
    } else {
      removeElements.push('representatives-table')
    }
  }
  if (req.data.stripeAccount.metadata.submitted) {
    removeElements.push('registration-container')
  } else if (req.data.registrationComplete) {
    dashboard.HTML.renderTemplate(doc, null, 'completed-registration', 'account-status')
    removeElements.push('start-registration-link')
  } else {
    dashboard.HTML.renderTemplate(doc, null, 'unstarted-registration', 'account-status')
    removeElements.push('update-registration-link')
  }
  const completedPaymentInformation = req.data.stripeAccount.external_accounts.data.length
  if (completedPaymentInformation) {
    removeElements.push('setup-payment')
    dashboard.HTML.renderTemplate(doc, req.data.stripeAccount.external_accounts.data[0], 'payment-information', 'payment-information-status')
  } else {
    removeElements.push('update-payment')
    dashboard.HTML.renderTemplate(doc, null, 'no-payment-information', 'payment-information-status')
  }
  if (req.data.owners && req.data.owners.length) {
    dashboard.HTML.renderTable(doc, req.data.owners, 'person-row', 'owners-table')
    for (const person of req.data.owners) {
      if (person.requirements.currently_due.length) {
        removeElements.push(`requires-no-information-${person.id}`)
      } else {
        removeElements.push(`requires-information-${person.id}`)
      }
    }
  } else if (req.data.stripeAccount.metadata.requiresOwners === 'false') {
    removeElements.push('owners-container')
  }
  if (req.data.directors && req.data.directors.length) {
    dashboard.HTML.renderTable(doc, req.data.directors, 'person-row', 'directors-table')
    for (const person of req.data.directors) {
      if (person.requirements.currently_due.length) {
        removeElements.push(`requires-no-information-${person.id}`)
      } else {
        removeElements.push(`requires-information-${person.id}`)
      }
    }
  } else if (req.data.stripeAccount.metadata.requiresDirectors === 'false') {
    removeElements.push('directors-container')
  }
  if (req.data.stripeAccount.metadata.submitted) {
    dashboard.HTML.renderTemplate(doc, req.data.stripeAccount, 'submitted-information', 'submission-status')
    removeElements.push('submit-registration-link-container')
  } else {
    dashboard.HTML.renderTemplate(doc, req.data.stripeAccount, 'not-submitted-information', 'submission-status')
    if (!req.data.registrationComplete || !completedPaymentInformation) {
      const registrationLink = doc.getElementById('submit-registration-link')
      registrationLink.setAttribute('disabled', 'disabled')
    }
  }
  for (const id of removeElements) {
    const element = doc.getElementById(id)
    element.parentNode.removeChild(element)
  }
  return dashboard.Response.end(req, res, doc)
}
