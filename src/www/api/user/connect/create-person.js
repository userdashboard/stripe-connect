const dashboard = require('@userdashboard/dashboard')
const stripeCache = require('../../../../stripe-cache.js')

module.exports = {
  post: async (req) => {
    if (!req.query || !req.query.stripeid) {
      throw new Error('invalid-stripeid')
    }
    const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
    if (!stripeAccount) {
      throw new Error('invalid-stripeid')
    }
    if (stripeAccount.business_type !== 'company') {
      throw new Error('invalid-stripe-account')
    }
    if (!req.body.relationship_representative && !req.body.relationship_director && !req.body.relationship_owner) {
      throw new Error('invalid-selection')
    }
    if (req.body.relationship_representative && !req.body.relationship_executive) {
      throw new Error('invalid-relationship_executive')
    }
    // TODO: the 5000 character limit is from Stripe
    // they'll probably change it so monitor this
    if (!req.body.relationship_title ||
        !req.body.relationship_title.length ||
        req.body.relationship_title.length > 5000) {
      throw new Error('invalid-relationship_title')
    }
    if (!req.body.relationship_percent_ownership) {
      throw new Error('invalid-relationship_percent_ownership')
    }
    try {
      const percent = parseFloat(req.body.relationship_percent_ownership, 10)
      if ((!percent && percent !== 0) || percent > 100 || percent < 0) {
        throw new Error('invalid-relationship_percent_ownership')
      }
      // TODO: 0% ownership throws an error on Stripe if the person is not 'owner=true'
      if (percent === 0) {
        if (req.body.relationship_owner) {
          throw new Error('invalid-relationship_percent_ownership')
        }
        delete (req.body.relationship_percent_ownership)
      }
    } catch (s) {
      throw new Error('invalid-relationship_percent_ownership')
    }
    const personInfo = {
      relationship: {
        title: req.body.relationship_title
      }
    }
    if (req.body.relationship_percent_ownership) {
      personInfo.relationship.percent_ownership = req.body.relationship_percent_ownership
    }
    if (req.body.relationship_representative) {
      personInfo.relationship.representative = true
    }
    if (req.body.relationship_executive) {
      personInfo.relationship.executive = true
    }
    if (req.body.relationship_director) {
      if (stripeAccount.metadata.requiresDirectors === 'false') {
        throw new Error('invalid-stripe-account')
      }
      personInfo.relationship.director = true
    }
    if (req.body.relationship_owner) {
      if (stripeAccount.metadata.requiresOwners === 'false') {
        throw new Error('invalid-stripe-account')
      }
      personInfo.relationship.owner = true
    }
    const person = await stripeCache.execute('accounts', 'createPerson', req.query.stripeid, personInfo, req.stripeKey)
    await dashboard.Storage.write(`${req.appid}/map/personid/stripeid/${person.id}`, req.query.stripeid)
    await dashboard.StorageList.add(`${req.appid}/persons`, person.id)
    await dashboard.StorageList.add(`${req.appid}/stripeAccount/persons/${req.query.stripeid}`, person.id)
    return person
  }
}
