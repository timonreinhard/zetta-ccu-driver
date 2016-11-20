var util = require('util')
var Scout = require('zetta-scout')

var CcuClient = require('./lib/client')
var ShutterContact = require('./devices/shutter-contact')

var CcuScout = module.exports = function () {
  Scout.call(this)
}
util.inherits(CcuScout, Scout)

CcuScout.prototype.init = function (next) {
  this._client = new CcuClient({
    ccuHostname: 'ccu2'
  })
  this._client.on('connect', () => {
    this._client.subscribe()
    this.search()
  })
  next()
}

CcuScout.prototype.search = function () {
  var self = this
  this._client.getRegaDeviceNames(function (err, deviceNames) {
    if (err) throw err
    self._client.listDevices(function (err, devices) {
      if (err) throw err
      self._buildDeviceTree(devices, deviceNames).forEach(device => {
        if (ShutterContact.TYPES.includes(device.TYPE)) {
          self.initDevice('shutter-contact', ShutterContact, device, this._client)
        } else {
          console.log(device)
        }
      })
    })
  })
}

CcuScout.prototype._buildDeviceTree = function (devices, deviceNames) {
  return devices
    .filter(device => !device.PARENT && device.CHILDREN)
    .map(device => {
      device.NAME = deviceNames[device.ADDRESS]
      device.CHILDREN = device.CHILDREN.map(addr => {
        return devices.find(device => device.ADDRESS === addr)
      })
      return device
    })
}

CcuScout.prototype.initDevice = function (type, Class, device) {
  var self = this
  var query = this.server.where({type: type, UDN: device.UDN})
  this.server.find(query, function (err, results) {
    if (!err && results && results.length > 0) {
      self.provision(results[0], Class, device, self._client)
    } else {
      self.discover(Class, device, self._client)
    }
  })
}
