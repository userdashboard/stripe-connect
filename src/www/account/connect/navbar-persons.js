module.exports = {
  setup: (doc, stripeAccount) => {
    const template = doc.getElementById('navbar')
    if (stripeAccount.metadata.requiresOwners !== 'true') {
      const submitOwnersLink = template.getElementById('navbar-submit-owners-link')
      submitOwnersLink.parentNode.removeChild(submitOwnersLink)
    }
    if (stripeAccount.metadata.requiresDirectors !== 'true') {
      const submitDirectorsLink = template.getElementById('navbar-submit-directors-link')
      submitDirectorsLink.parentNode.removeChild(submitDirectorsLink)
    }
  }
}
