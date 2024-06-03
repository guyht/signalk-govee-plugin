// index.js
const noble = require('@abandonware/noble');
const { Plugin } = require('@signalk/server-api');

module.exports = function (app) {
  var plugin = {};
  plugin.id = 'signalk-govee-plugin';
  plugin.name = 'Signal K Govee Plugin';
  plugin.description = 'Plugin to read data from Govee devices and send to Signal K server';

  plugin.schema = {
    type: 'object',
    properties: {
      address: {
        type: 'string',
        title: 'Govee Device Address',
        default: ''
      },
      interval: {
        type: 'number',
        title: 'Polling Interval (seconds)',
        default: 10
      }
    }
  };

  let nobleStarted = false;
  let targetAddress;
  let interval;
  let peripheralDevice;

  function parseGoveeData(manufacturerData) {
    try {
      const data = manufacturerData.slice(2);
      if (data.length >= 8) {
        const temperatureRaw = data.readInt16LE(4);
        const temperature = temperatureRaw / 100 + 273.15; // Convert to Kelvin
        const humidityRaw = data.readUInt16LE(6);
        const humidity = humidityRaw / 100; // Express as a fraction (0 to 1)
        const battery = data.length > 8 ? data.readUInt8(8) / 100 : null; // Express as a fraction (0 to 1)
        return { temperature, humidity, battery };
      }
    } catch (e) {
      app.error(`Error parsing data: ${e}`);
    }
    return { temperature: null, humidity: null, battery: null };
  }

  function connectToDevice(peripheral) {
    peripheral.connect((error) => {
      if (error) {
        app.error(`Error connecting to device: ${error}`);
        return;
      }

      app.debug('Connected to device');
      peripheral.once('disconnect', () => {
        app.debug('Device disconnected, attempting to reconnect...');
        startScanning();
      });

      // Read manufacturer data periodically
      setInterval(() => {
        const manufacturerData = peripheral.advertisement.manufacturerData;
        if (manufacturerData) {
          app.debug(`Manufacturer data: ${manufacturerData.toString('hex')}`);
          const { temperature, humidity, battery } = parseGoveeData(manufacturerData);
          if (temperature !== null && humidity !== null && battery !== null) {
            app.handleMessage(plugin.id, {
              updates: [
                {
                  values: [
                    {
                      path: 'environment.inside.temperature',
                      value: temperature
                    },
                    {
                      path: 'environment.inside.humidity',
                      value: humidity
                    },
                    {
                      path: 'electrical.batteries.govee.batteryLevel',
                      value: battery
                    }
                  ]
                }
              ]
            });
            app.debug(`Data from ${targetAddress}: Temperature ${temperature} K, Humidity ${humidity} (fraction), Battery ${battery} (fraction)`);
          } else {
            app.error('Failed to parse data from manufacturer data.');
          }
        } else {
          app.error('No manufacturer data found.');
        }
      }, interval);
    });
  }

  function startNoble() {
    if (!nobleStarted) {
      noble.on('stateChange', (state) => {
        app.debug(`Noble state changed to: ${state}`);
        if (state === 'poweredOn') {
          app.debug('Starting scanning...');
          noble.startScanning([], true);
        } else {
          app.debug('Stopping scanning...');
          noble.stopScanning();
        }
      });

      noble.on('discover', (peripheral) => {
        if (peripheral.id === targetAddress.toLowerCase()) {
          app.debug(`Discovered target device: ${peripheral.id} (${peripheral.advertisement.localName})`);
          noble.stopScanning();
          peripheralDevice = peripheral;
          connectToDevice(peripheral);
        }
      });

      noble.on('scanStart', () => {
        app.debug('Scan started.');
      });

      noble.on('scanStop', () => {
        app.debug('Scan stopped.');
      });

      noble.on('warning', (message) => {
        app.error(`Noble warning: ${message}`);
      });

      nobleStarted = true;
    }
  }

  function startScanning() {
    startNoble();
    noble.startScanning([], true);
  }

  plugin.start = function (options) {
    targetAddress = options.address;
    interval = options.interval * 1000; // Convert to milliseconds

    startScanning();
  };

  plugin.stop = function () {
    if (peripheralDevice) {
      peripheralDevice.disconnect();
    }
    noble.stopScanning();
    app.debug('Plugin stopped.');
  };

  return plugin;
};
