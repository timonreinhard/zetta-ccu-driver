var util = require('util')
var Device = require('zetta-device')

var RotaryHandleSensor = module.exports = function (device, client) {
  this.name = device.NAME
  this.serialNumber = device.ADDRESS
  this.model = device.TYPE
  this._client = client
  this._device = device
  this.state = ''

  const channel = this._device.CHILDREN.find(child =>
    child.TYPE === 'ROTARY_HANDLE_SENSOR' && child.PARAMSETS.includes('VALUES')
  )

  this._client.getValue(channel.ADDRESS, 'STATE', (err, value) => {
    if (err) throw err
    this.state = RotaryHandleSensor.STATE[value]
  })

  this._client.on('update', this._updateHandler.bind(this))

  Device.call(this)
}
util.inherits(RotaryHandleSensor, Device)

RotaryHandleSensor.TYPES = ['HM-Sec-RHS']
RotaryHandleSensor.STATE = {
  0: 'closed',
  1: 'open',
  2: 'tilted'
}

RotaryHandleSensor.prototype.init = function (config) {
  config
    .type('rotary-handle-sensor')
    .monitor('state')
    .state(this.state)
    .name(this.name)
}

RotaryHandleSensor.prototype._updateHandler = function (params) {
  var address = params[1]
  var key = params[2]
  var value = params[3]
  var channel = this._findChannel(address)
  if (channel && channel.TYPE === 'ROTARY_HANDLE_SENSOR') {
    if (key === 'STATE') {
      this.state = RotaryHandleSensor.STATE[value]
    }
  }
}

RotaryHandleSensor.prototype._findChannel = function (address) {
  return this._device.CHILDREN.find(child => child.ADDRESS === address)
}
