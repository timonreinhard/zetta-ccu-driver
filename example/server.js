var zetta = require('zetta')
var Ccu = require('../index')

zetta()
  .use(Ccu)
  .listen(1337)
