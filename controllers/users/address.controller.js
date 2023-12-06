const { responseData } = require('../../helpers/responseData')
const addressService = require('../../services/users/address.services')

module.exports = {
  add_address: async (req, res) => {
    try {
      await addressService.add_address(req, res)
    } catch (err) {
      const msg = err.message || 'SOMETHING_WENT_WRONG'
      return res.status(422).json(responseData(msg, {}, req))
    }
  },
  list_address: async (req, res) => {
    try {
      await addressService.list_address(req, res)
    } catch (err) {
      const msg = err.message || 'SOMETHING_WENT_WRONG'
      return res.status(422).json(responseData(msg, {}, req))
    }
  },
  delete_address: async (req, res) => {
    try {
      await addressService.delete_address(req, res)
    } catch (err) {
      const msg = err.message || 'SOMETHING_WENT_WRONG'
      return res.status(422).json(responseData(msg, {}, req))
    }
  },
  set_default: async (req, res) => {
    try {
      await addressService.set_default(req, res)
    } catch (err) {
      const msg = err.message || 'SOMETHING_WENT_WRONG'
      return res.status(422).json(responseData(msg, {}, req))
    }
  }
}
