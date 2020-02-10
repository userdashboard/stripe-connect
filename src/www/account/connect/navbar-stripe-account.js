module.exports = {
  setup: (doc, stripeAccount) => {
    const template = doc.getElementById('navbar')
    if (stripeAccount.metadata.submitted) {
      const submitCompany = template.getElementById('navbar-submit-company')
      submitCompany.parentNode.removeChild(submitCompany)
      const submitIndividual = template.getElementById('navbar-submit-individual')
      submitIndividual.parentNode.removeChild(submitIndividual)
      return
    }
    if (stripeAccount.business_type === 'individual') {
      const editCompany = template.getElementById('navbar-edit-company')
      editCompany.parentNode.removeChild(editCompany)
      const submitCompany = template.getElementById('navbar-submit-company')
      submitCompany.parentNode.removeChild(submitCompany)
      const persons = template.getElementById('navbar-persons')
      persons.parentNode.removeChild(persons)
    } else {
      const editIndividual = template.getElementById('navbar-edit-individual')
      editIndividual.parentNode.removeChild(editIndividual)
      const submitIndividual = template.getElementById('navbar-submit-individual')
      submitIndividual.parentNode.removeChild(submitIndividual)
    }
  }
}
