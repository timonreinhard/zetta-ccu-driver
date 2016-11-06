var os = require('os')
var util = require('util')
var rpc = require('binrpc')
var EventEmitter = require('events').EventEmitter

var CcuClient = module.exports = function (options) {
  EventEmitter.call(this)
  var self = this
  this.clientId = options.clientId || 'Zetta'

  this.rpcServer = this.createServer()
  this.rpcServerUrl = 'xmlrpc_bin://' + this.rpcServer.host + ':' + this.rpcServer.port

  this.rpcClient = rpc.createClient({
    host: options.ccuHostname,
    port: options.ccuPort || 2001
  }).on('connect', function () {
    self.subscribe()
    self.emit('connect')
  })

  process.on('SIGINT', function () {
    self.unsubcribe()
  })

  return this
}

util.inherits(CcuClient, EventEmitter)

CcuClient.LISTEN_PORT = 2001

CcuClient.prototype.getLocalInterfaceAddress = function () {
  var addresses = []
  var interfaces = os.networkInterfaces()
  for (var k in interfaces) {
    for (var k2 in interfaces[k]) {
      var address = interfaces[k][k2]
      if (address.family === 'IPv4' && !address.internal) {
        addresses.push(address.address)
      }
    }
  }
  return addresses.shift()
}

CcuClient.prototype.createServer = function () {
  var server = rpc.createServer({
    host: this.getLocalInterfaceAddress(),
    port: CcuClient.LISTEN_PORT
  })

  server.on('system.listMethods', function (err, params, cb) {
    if (err) throw err
    cb(['system.listMethods', 'system.multicall', 'event', 'listDevices'])
  })

  server.on('listDevices', function (err, params, cb) {
    if (err) throw err
    cb([])
  })

  server.on('event', function (err, params, cb) {
    if (err) throw err
    this.emit('update', params)
    cb([''])
  })

  return server
}

CcuClient.prototype.subscribe = function () {
  this.rpcClient.methodCall('init', [this.rpcServerUrl, 'zetta'], function (err, res) {
    if (err) throw err
  })
}

CcuClient.prototype.unsubcribe = function () {
  this.rpcClient.methodCall('init', [this.rpcServerUrl, ''], function (err, res) {
    if (err) throw err
    process.exit()
  })
}

CcuClient.prototype.listDevices = function (cb) {
  return this.rpcClient.methodCall('listDevices', [], cb)
}
