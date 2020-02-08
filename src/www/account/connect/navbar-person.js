module.exports = {
  setup: (doc, person) => {
    const template = doc.getElementById('navbar')
    if (person.requirements.currently_due.length === 0) {
      const editPerson = template.getElementById('edit-person-link')
      editPerson.parentNode.removeChild(editPerson)
    }
    if (person.relationship.representative) {
      const deletePerson = template.getElementById('delete-person-link')
      deletePerson.parentNode.removeChild(deletePerson)
    }
  }
}
