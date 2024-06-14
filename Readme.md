
# Signal K Govee Plugin

## Description

The Signal K Govee Plugin reads temperature, humidity, and battery level data from Govee H5179 devices and sends it to the Signal K server. It is untested with other Govee devices.

## Installation

The plugin can be easily installed via the Signal K Appstore. Simply search for "Signal K Govee Plugin" and follow the installation instructions.

## Configuration

Once installed, you need to configure the plugin to connect to your Govee device.

1. **Open the Signal K server settings:**
   - Navigate to your Signal K server's web interface.
   - Go to the "Plugins" section.

2. **Locate the Govee Plugin:**
   - Find "Signal K Govee Plugin" in the list of installed plugins.

3. **Configure the plugin:**
   - **Govee Device Address:** Enter the MAC address of your Govee H5179 device. This is usually found on the device or in the device’s documentation.
   - **Polling Interval:** Set how often (in seconds) the plugin should check the Govee device for new data. The default is 10 seconds.

4. **Save the settings:**
   - Click the "Save" button to apply your settings.

## Bluetooth Configuration

To enable Bluetooth scanning, you may need to configure the permissions on your device. The following is tested on a raspberry pi 4 running openplotter:

1. **Set the necessary permissions:**
   ```bash
   sudo setcap cap_net_raw+eip $(eval readlink -f `which node`)
   ```

2. **Ensure permissions are set on startup:**
   - Add the above command to `/etc/rc.local` to make sure permissions are given on start up.

## Usage

Once configured, the plugin will automatically start scanning for the specified Govee device and send data to the Signal K server. 

You can monitor the following data paths in Signal K:
- **Temperature:** `environment.inside.temperature` (in Kelvin)
- **Humidity:** `environment.inside.humidity` (as a fraction from 0 to 1)
- **Battery Level:** `electrical.batteries.govee.batteryLevel` (as a fraction from 0 to 1)

## Example Data

Here is an example of the data that will be sent to your Signal K server:

```json
{
  "environment": {
    "inside": {
      "temperature": 297.15
    }
  },
  "environment": {
    "inside": {
      "humidity": 0.45
    }
  },
  "electrical": {
    "batteries": {
      "govee": {
        "batteryLevel": 0.80
      }
    }
  }
}
```

## Troubleshooting

- Make sure your Govee device is turned on and within range of your Signal K server.
- Double-check the MAC address entered in the configuration.
- Check the Signal K server logs for any error messages or debugging information.

## Support

For any questions or support, please open an issue in the plugin's repository or contact the maintainers through the Signal K community.

## License

This project is licensed under the MIT License.
