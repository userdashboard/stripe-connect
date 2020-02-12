module.exports = {
  setup: (doc, stripeAccount) => {
    const removeElements = []
    if (stripeAccount.metadata.submitted) {
      removeElements.push(
        'navbar-submit-company-link', 
        'navbar-submit-individual-link',
        'navbar-submit-beneficial-owners-link',
        'navbar-submit-company-directors-link'
        )
    } 
    if (stripeAccount.business_type === 'individual') {
      removeElements.push(
        'navbar-edit-company-link', 
        'navbar-submit-company-link',  
        'navbar-persons-link',
        'navbar-submit-beneficial-owners-link',
        'navbar-submit-company-directors-link'
      )
    } else {
      removeElements.push('navbar-edit-individual-link', 'navbar-submit-individual-link')
      if (stripeAccount.metadata.requiresOwners !== 'true') {
        removeElements.push('navbar-submit-beneficial-owners-link')
      }
      if (stripeAccount.metadata.requiresDirectors !== 'true') {
        removeElements.push('navbar-submit-company-directors-link')
      }
    }
    const template = doc.getElementById('navbar')
    for (const id of removeElements) {
      const element = template.getElementById(id)
      element.parentNode.removeChild(element)
    }
  }
}
