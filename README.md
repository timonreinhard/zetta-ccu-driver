# Zetta driver for HomeMatic CCU

_Experimental_ driver for [Zetta](http://www.zettajs.org) to connect with a HomeMatic CCU2.

## Supported Hardware

  * HM-Sec-SCo (Door/Window Contact)
  * HM-Sec-RHS (Rotary Handle Sensor)

## Install

```bash
$ npm install timonreinhard/zetta-ccu-driver
```

## Usage

```javascript
var zetta = require('zetta');
var CcuDriver = require('zetta-ccu-driver');

zetta()
  .use(CcuDriver)
  .listen(1337)
```

## License

Published under the [MIT License](https://github.com/timonreinhard/zetta-ccu-driver/blob/master/LICENSE).
