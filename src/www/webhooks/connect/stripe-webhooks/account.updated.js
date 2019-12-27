const stripeCache = require('../../../../stripe-cache.js')

module.exports = async (stripeEvent) => {
  const account = stripeEvent.data.object
  await stripeCache.update(account)
}
