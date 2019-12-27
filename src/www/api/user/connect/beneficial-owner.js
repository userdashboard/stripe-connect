const dashboard = require('@userdashboard/dashboard')
const stripeCache = require('../../../../stripe-cache.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.personid) {
      console.log('bad id')
      throw new Error('invalid-personid')
    }
    console.log('loading person', req.query)
    const stripeid = await dashboard.Storage.read(`${req.appid}/map/personid/stripeid/${req.query.personid}`)
    if (!stripeid) {
      console.log('bad stripeid')
      throw new Error('invalid-personid')
    }
    console.log('loading person', 'got stripeid', stripeid)
    try {
      const person = await stripeCache.retrievePerson(stripeid, req.query.personid, req.stripeKey)
      if (!person) {
        console.log('bad person')
        throw new Error('invalid-personid')
      }
      if (person.relationship.owner !== true) {
        console.log('bad person type')
        throw new Error('invalid-person')
      }
      console.log('got person', person)
      return person
    } catch (error) {
      console.log(error)
      throw new Error('unknown-error')
    }
  }
}
