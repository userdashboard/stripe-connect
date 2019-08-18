const euCountries = ['AT', 'BE', 'DE', 'ES', 'FI', 'FR', 'GB', 'IE', 'IT', 'LU', 'NL', 'NO', 'PT', 'SE']

module.exports = {
  setup: (doc, stripeAccount) => {
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
      const companyOwners = template.getElementById('navbar-beneficial-owners')
      companyOwners.parentNode.removeChild(companyOwners)
      return
    }
    // in progress
    if (stripeAccount.business_type === 'individual') {
      const editCompany = template.getElementById('navbar-edit-company')
      editCompany.parentNode.removeChild(editCompany)
      const submitCompany = template.getElementById('navbar-submit-company')
      submitCompany.parentNode.removeChild(submitCompany)
      const companyOwners = template.getElementById('navbar-beneficial-owners')
      companyOwners.parentNode.removeChild(companyOwners)
    } else {
      const editIndividual = template.getElementById('navbar-edit-individual')
      editIndividual.parentNode.removeChild(editIndividual)
      const submitIndividual = template.getElementById('navbar-submit-individual')
      submitIndividual.parentNode.removeChild(submitIndividual)
      if (euCountries.indexOf(stripeAccount.country) === -1) {
        const companyOwners = template.getElementById('navbar-beneficial-owners')
        companyOwners.parentNode.removeChild(companyOwners)
      }
    }
  }
}
