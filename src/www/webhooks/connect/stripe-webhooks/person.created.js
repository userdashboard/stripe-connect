const stripeCache = require('../../../../stripe-cache.js')

module.exports = async (stripeEvent) => {
  stripeCache.update(stripeEvent.data.object)
}
