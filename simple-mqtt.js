/*******************************************************************************

  Bare Conductive Pi Cap
  ----------------------

  simple-mqtt.js - sends capacitive touch / release data from MPR121 to a
  specified MQTT broker.

  Written for Raspberry Pi.

  Original example by Sven Haiges.

  Bare Conductive code written by Szymon Kaliski.

  This work is licensed under a Creative Commons Attribution-ShareAlike 3.0
  Unported License (CC BY-SA 3.0) http://creativecommons.org/licenses/by-sa/3.0/

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
  THE SOFTWARE.

 *******************************************************************************/

var MPR121 = require('node-picap');
var mqtt   = require('mqtt');
var argv   = require('yargs').argv;

var mpr121;

function printHelp() {
  console.log('Sends Pi Cap touch readings through MQTT - MUST be run as root.\n');
  console.log('Usage: node simple-mqtt.js [OPTIONS]\n');
  console.log('Options:');
  console.log('  -b, --broker  MQTT broker [REQUIRED]');
  console.log('      --help    displays this message');

  process.exit(0);
}

// sift through the arguments and set stuff up / show help as appropriate
if (argv.help || !(argv.b || argv.broker)) { printHelp(); }

var broker = argv.b || argv.broker;
var client = mqtt.connect('mqtt://' + broker);

// correct address for the Pi Cap - other boards may vary
mpr121 = new MPR121('0x5C'); 

client.on('connect', function() {
  mpr121.on('data', function(data) {
    data.map(function(electrode, i) {
      // publish new touch and release events
      if (electrode.isNewTouch) {
        client.publish('picap/touched', '' + i);
      }
      else if (electrode.isNewRelease) {
        client.publish('picap/released', '' + i);
      }
    });
  });
});

// this allows us to exit the program via Ctrl+C while still exiting elegantly
process.on('SIGINT', function () {
  process.exit(0);
});

