var util = require('util')
var Device = require('zetta-device')

var ShutterContact = module.exports = function (device, client) {
  this.name = device.NAME
  this.serialNumber = device.ADDRESS
  this.model = device.TYPE
  this._client = client
  this._device = device
  this.state = ''

  const channel = this._device.CHILDREN.find(child =>
    child.TYPE === 'SHUTTER_CONTACT' && child.PARAMSETS.includes('VALUES')
  )
  this._client.getValue(channel.ADDRESS, 'STATE', (err, res) => {
    if (err) throw err
    this.state = res ? 'open' : 'closed'
  })

  this._client.on('update', this._updateHandler.bind(this))

  Device.call(this)
}
util.inherits(ShutterContact, Device)

ShutterContact.TYPES = ['HM-Sec-SCo']

ShutterContact.prototype.init = function (config) {
  config
    .type('shutter-contact')
    .monitor('state')
    .state(this.state)
    .name(this.name)
}

ShutterContact.prototype._updateHandler = function (params) {
  var address = params[1]
  var key = params[2]
  var value = params[3]
  var channel = this._findChannel(address)
  if (channel && channel.TYPE === 'SHUTTER_CONTACT') {
    if (key === 'STATE') {
      this.state = value ? 'open' : 'closed'
    }
  }
}

ShutterContact.prototype._findChannel = function (address) {
  return this._device.CHILDREN.find(child => child.ADDRESS === address)
}
