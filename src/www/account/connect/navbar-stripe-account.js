module.exports = {
  setup: (doc, stripeAccount, countrySpec) => {
    const template = doc.getElementById('navbar')
    // completed registration
    if (stripeAccount.metadata.submitted) {
      const editCompany = template.getElementById('navbar-edit-company')
      editCompany.parentNode.removeChild(editCompany)
      const submitCompany = template.getElementById('navbar-submit-company')
      submitCompany.parentNode.removeChild(submitCompany)
      const editIndividual = template.getElementById('navbar-edit-individual')
      editIndividual.parentNode.removeChild(editIndividual)
      const submitIndividual = template.getElementById('navbar-submit-individual')
      submitIndividual.parentNode.removeChild(submitIndividual)
      const additionalOwners = template.getElementById('navbar-additional-owners')
      additionalOwners.parentNode.removeChild(additionalOwners)
      return
    }
    // in progress
    if (stripeAccount.legal_entity.type === 'individual') {
      const editCompany = template.getElementById('navbar-edit-company')
      editCompany.parentNode.removeChild(editCompany)
      const submitCompany = template.getElementById('navbar-submit-company')
      submitCompany.parentNode.removeChild(submitCompany)
      const additionalOwners = template.getElementById('navbar-additional-owners')
      additionalOwners.parentNode.removeChild(additionalOwners)
    } else {
      const editIndividual = template.getElementById('navbar-edit-individual')
      editIndividual.parentNode.removeChild(editIndividual)
      const submitIndividual = template.getElementById('navbar-submit-individual')
      submitIndividual.parentNode.removeChild(submitIndividual)
      if (countrySpec.verification_fields.company.minimum.indexOf('legal_entity.additional_owners') === -1 &&
          countrySpec.verification_fields.company.additional.indexOf('legal_entity.additional_owners') === -1) {
        const additionalOwners = template.getElementById('navbar-additional-owners')
        additionalOwners.parentNode.removeChild(additionalOwners)
      }
    }
  }
}
