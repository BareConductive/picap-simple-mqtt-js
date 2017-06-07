/*******************************************************************************

  Bare Conductive Pi Cap
  ----------------------

  simple-mqtt.js - sends capacitive touch / release data from MPR121 to a
  specified MQTT broker.

  Written for Raspberry Pi.

  Original example by Sven Haiges.

  Bare Conductive code written by Szymon Kaliski.

  This work is licensed under a MIT license https://opensource.org/licenses/MIT

  Copyright (c) 2016, Bare Conductive

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all
  copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  SOFTWARE.

 *******************************************************************************/

var MPR121 = require('node-picap');
var mqtt   = require('mqtt');
var argv   = require('yargs').argv;

var mpr121;

// this is the touch threshold - setting it low makes it more like a proximity trigger
// default value is 40 for touch
var touchThreshold = 40;

// this is the release threshold - must ALWAYS be smaller than the touch threshold
// default value is 20 for touch
var releaseThreshold = 20;

function printHelp() {
  console.log('Sends Pi Cap touch readings through MQTT - MUST be run as root.\n');
  console.log('Usage: node simple-mqtt.js [OPTIONS]\n');
  console.log('Options:');
  console.log('  -b, --broker    MQTT broker [REQUIRED]');
  console.log('  -u, --username  MQTT broker username [OPTIONAL]');
  console.log('  -p, --password  MQTT broker password [OPTIONAL]');
  console.log('      --help      displays this message');

  process.exit(0);
}

// sift through the arguments and set stuff up / show help as appropriate
if (argv.help || !(argv.b || argv.broker)) { printHelp(); }

var broker   = argv.b || argv.broker;
var username = argv.u || argv.username;
var password = argv.p || argv.password;
var client   = mqtt.connect('mqtt://' + broker, { username: username, password: password });

// correct address for the Pi Cap - other boards may vary
mpr121 = new MPR121('0x5C');

mpr121.setTouchThreshold(touchThreshold);
mpr121.setReleaseThreshold(releaseThreshold);

client.on('connect', function() {
  mpr121.on('data', function(data) {
    data.map(function(electrode, i) {
      // publish new touch and release events
      if (electrode.isNewTouch) {
        if (username) {
          client.publish(username + '/feeds/picap-touched', '' + i);
        }
        else {
          client.publish('/feeds/picap-touched', '' + i);
        }
      }
      else if (electrode.isNewRelease) {
        if (username) {
          client.publish(username + '/feeds/picap-released', '' + i);
        }
        else {
          client.publish('/feeds/picap-released', '' + i);
        }
      }
    });
  });
});

// this allows us to exit the program via Ctrl+C while still exiting elegantly
process.on('SIGINT', function () {
  process.exit(0);
});
