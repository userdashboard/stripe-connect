const stripeCache = require('../../../../stripe-cache.js')

module.exports = async (stripeEvent) => {
  const person = stripeEvent.data.object
  await stripeCache.update(person)
}
