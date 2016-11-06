var util = require('util')
var Device = require('zetta-device')

var ShutterContact = module.exports = function (device, client) {
  this.name = device.ADDRESS
  this.state = ''
  this._client = client
  this._device = device
  Device.call(this)
}
util.inherits(ShutterContact, Device)

ShutterContact.TYPES = ['HM-Sec-SCo']

ShutterContact.prototype.init = function (config) {
  config
    .type('shutter-contact')
    .state(this.state)
    .name(this.name)
  this._client.on('update', this._updateHandler.bind(this))
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
