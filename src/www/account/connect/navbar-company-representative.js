module.exports = {
  setup: (doc, stripeAccount) => {
    const template = doc.getElementById('navbar')
    if (stripeAccount.metadata.representative) {
      const submitCompanyRepresentative = template.getElementById('submit-company-representative-link')
      submitCompanyRepresentative.parentNode.removeChild(submitCompanyRepresentative)
      const editCompanyRepresentative = template.getElementById('edit-company-representative-link')
      editCompanyRepresentative.parentNode.removeChild(editCompanyRepresentative)
    } else {
      const removeCompanyRepresentative = template.getElementById('remove-company-representative-link')
      removeCompanyRepresentative.parentNode.removeChild(removeCompanyRepresentative)
    }
  }
}
