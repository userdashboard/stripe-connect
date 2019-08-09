const dashboard = require('@userdashboard/dashboard')
const stripe = require('stripe')()

module.exports = {
  retrieve: async (id, group, stripeKey) => {
    if (global.testEnded) {
      return
    }
    const string = await dashboard.Storage.read(`stripe/${id}`)
    if (string) {
      return JSON.parse(string)
    }
    const object = await stripe[group].retrieve(id, stripeKey)
    const cached = JSON.stringify(object)
    await dashboard.Storage.write(`stripe/${id}`, cached)
    return object
  },
  update: async (object) => {
    if (global.testEnded) {
      return
    }
    const cached = JSON.stringify(object)
    await dashboard.Storage.write(`stripe/${object.id}`, cached)
  },
  delete: async (id) => {
    if (global.testEnded) {
      return
    }
    if (!id) {
      throw new Error('invalid-id', id)
    }
    try {
      await dashboard.Storage.deleteFile(`stripe/${id}`)
    } catch (error) {
      if (error !== 'invalid-file') {
        throw error
      }
    }
  }
}
