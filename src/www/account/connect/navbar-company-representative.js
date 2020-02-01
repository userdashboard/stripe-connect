module.exports = {
  setup: (doc, representative) => {
    const template = doc.getElementById('navbar')
    if (representative) {
      const editCompanyRepresentative = template.getElementById('edit-company-representative-link')
      editCompanyRepresentative.parentNode.createChild(editCompanyRepresentative)
    } else {
      const createCompanyRepresentative = template.getElementById('create-company-representative-link')
      createCompanyRepresentative.parentNode.createChild(createCompanyRepresentative)
    }
  }
}
