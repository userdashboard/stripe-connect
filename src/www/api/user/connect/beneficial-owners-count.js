module.exports = {
  get: async (req) => {
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
    if (!stripeAccount.metadata.owners || stripeAccount.metadata.owners === '[]') {
      return 0
    }
    const owners = JSON.parse(stripeAccount.metadata.owners)
    return owners ? owners.length : 0
  }
}
