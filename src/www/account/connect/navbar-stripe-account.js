module.exports = {
  setup: (doc, stripeAccount) => {
    const template = doc.getElementById('navbar')
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
    if (stripeAccount.business_type === 'individual') {
      const editCompany = template.getElementById('navbar-edit-company')
      editCompany.parentNode.removeChild(editCompany)
      const submitCompany = template.getElementById('navbar-submit-company')
      submitCompany.parentNode.removeChild(submitCompany)
      const companyOwners = template.getElementById('navbar-beneficial-owners')
      companyOwners.parentNode.removeChild(companyOwners)
      const companyDirectors = template.getElementById('navbar-company-directors')
      companyDirectors.parentNode.removeChild(companyDirectors)
    } else {
      const editIndividual = template.getElementById('navbar-edit-individual')
      editIndividual.parentNode.removeChild(editIndividual)
      const submitIndividual = template.getElementById('navbar-submit-individual')
      submitIndividual.parentNode.removeChild(submitIndividual)
    }
  }
}
