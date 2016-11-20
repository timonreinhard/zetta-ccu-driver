var os = require('os')
var http = require('http')
var util = require('util')
var rpc = require('binrpc')
var EventEmitter = require('events').EventEmitter

var CcuClient = module.exports = function (options) {
  EventEmitter.call(this)
  var self = this
  this.clientId = options.clientId || 'Zetta'
  this.ccuHostname = options.ccuHostname

  this.rpcServer = this.createServer()
  this.rpcServerUrl = 'xmlrpc_bin://' + this.rpcServer.host + ':' + this.rpcServer.port

  this.rpcClient = rpc.createClient({
    host: this.ccuHostname,
    port: CcuClient.CCU_XMLRPC_PORT
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
CcuClient.CCU_XMLRPC_PORT = 2001
CcuClient.CCU_REGA_PORT = 8181

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
  }.bind(this))

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

CcuClient.prototype.getDeviceDescription = function (address, cb) {
  return this.rpcClient.methodCall('getDeviceDescription', [address], cb)
}

CcuClient.prototype.getParamset = function (address, paramsetKey, cb) {
  return this.rpcClient.methodCall('getParamset', [address, paramsetKey], cb)
}

CcuClient.prototype.getParamsetDescription = function (address, paramsetKey, cb) {
  return this.rpcClient.methodCall('getParamsetDescription', [address, paramsetKey], cb)
}

CcuClient.prototype.getValuesParamset = function (address, cb) {
  return this.getParamset(address, 'VALUES', cb)
}

CcuClient.prototype.getValue = function (address, valueKey, cb) {
  return this.rpcClient.methodCall('getValue', [address, valueKey], cb)
}

CcuClient.prototype.getRegaDeviceNames = function (cb) {
  var script = [
    'string id;',
    'foreach(id, root.Devices().EnumUsedIDs()) {',
    '  var d = dom.GetObject(id);',
    '  Write(d.Address() + "\t" + d.Name() + "\n");',
    '}',
    'foreach(id, root.Channels().EnumUsedIDs()) {',
    '  var d = dom.GetObject(id);',
    '  WriteXML(d.Address() + "\t" + d.Name() + "\n");',
    '}'
  ].join('')

  var parseResponse = function (response) {
    var result = {}
    var payload = response.substring(0, response.indexOf('<xml>'))
    var lines = payload.split('\n')
    lines.forEach(function (line) {
      var cols = line.split('\t')
      if ((cols.length === 2) && cols[0] && cols[1]) {
        result[cols[0]] = cols[1]
      }
    })
    return result
  }

  var req = http.request({
    host: this.ccuHostname,
    port: CcuClient.CCU_REGA_PORT,
    method: 'POST',
    path: '/Test.exe',
    headers: {
      'Content-Type': 'text/plain',
      'Content-Length': Buffer.byteLength(script)
    }
  }, function (res) {
    var body = ''
    res.setEncoding('latin1')
    res.on('data', function (chunk) {
      body += chunk
    })
    res.on('end', function () {
      if (res.statusCode === 200) {
        var result = parseResponse(body)
        cb(null, result)
      } else {
        cb(new Error('HTTP ' + res.statusCode + ': ' + body))
      }
    })
  })
  req.on('error', cb)
  req.write(script)
  req.end()
}
