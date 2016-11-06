var CcuClient = require('./lib/client')

var util = require('util')
var Scout = require('zetta-scout')

var CcuScout = module.exports = function () {
  Scout.call(this)
}
util.inherits(CcuScout, Scout)

CcuScout.prototype.init = function (next) {
  this._client = new CcuClient({
    ccuHostname: 'ccu2'
  }).on('connect', this.search.bind(this))
  next()
}

CcuScout.prototype.search = function () {
  this._client.listDevices(function (err, result) {
    if (err) throw err
    var tree = this._buildDeviceTree(result)
    console.log(JSON.stringify(tree, 4, ' '))
    // this.initDevice('wemo-color-light', WemoColorLight, endDevice, client)
  }.bind(this))
}

CcuScout.prototype._buildDeviceTree = function (devices) {
  return devices
    .filter(device => !device.PARENT && device.CHILDREN)
    .map(device => {
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
