const stripeCache = require('../../../../stripe-cache.js')

module.exports = async (stripeEvent) => {
  const account = stripeEvent.data.object
  if (global.monitorStripeAccount === account.id) {
    console.log('monitored account activity')
    console.log(JSON.stringify(stripeEvent, null, '  '))
  }
  await stripeCache.delete(account.id)
}
