module.exports = {
  setup: (doc, representative) => {
    const template = doc.getElementById('navbar')
    if (representative) {
      const editCompanyRepresentative = template.getElementById('edit-company-representative-link')
      editCompanyRepresentative.parentNode.removeChild(editCompanyRepresentative)
    } else {
      const removeCompanyRepresentative = template.getElementById('remove-company-representative-link')
      removeCompanyRepresentative.parentNode.removeChild(removeCompanyRepresentative)
    }
  }
}
