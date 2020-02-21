module.exports = {
  setup: (doc, stripeAccount) => {
    const removeElements = []
    if (stripeAccount.metadata.submitted) {
      removeElements.push(
        'navbar-submit-link'
      )
    }
    if (stripeAccount.business_type === 'individual') {
      removeElements.push(
        'navbar-persons-link',
        'navbar-submit-beneficial-owners-link',
        'navbar-submit-company-directors-link'
      )
    } else {
      if (stripeAccount.metadata.submitted) {
        removeElements.push(
          'navbar-submit-beneficial-owners-link',
          'navbar-submit-company-directors-link'
        )
      } else {
        if (stripeAccount.metadata.requiresOwners !== 'true') {
          removeElements.push('navbar-submit-beneficial-owners-link')
        }
        if (stripeAccount.metadata.requiresDirectors !== 'true') {
          removeElements.push('navbar-submit-company-directors-link')
        }
      }
    }
    const template = doc.getElementById('navbar')
    for (const id of removeElements) {
      const element = template.getElementById(id)
      element.parentNode.removeChild(element)
    }
  }
}
