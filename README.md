# Node.JS library for Broadlink controllers

A promise based Node.js module created from Python API [python-broadlink](http://github.com/mjg59/python-broadlink) for controlling [Broadlink](http://www.ibroadlink.com/rm/) IR/RF controllers.

## Example use

Setup a new device on your local wireless network:

1. Put the device into AP Mode
2. Long press the reset button until the blue LED is blinking quickly.
3. Long press again until blue LED is blinking slowly.
4. Manually connect to the WiFi SSID named BroadlinkProv.
5. Run setup() and provide your ssid, network password (if secured), and set the security mode
6. Security mode options are (0 = none, 1 = WEP, 2 = WPA1, 3 = WPA2, 4 = WPA1/2)

```
const broadlink = require('broadlink-iot');

broadlink.setup('myssid', 'mynetworkpass', 3)
```

Discover available devices on the local network:

```
const broadlink = require('broadlink-iot');

broadlink.discover().then((devices) => {}).catch((error) => {});
```

Obtain the authentication key required for further communication:

```
devices[0].auth().then((device) => {}).catch((error) => {});
```

Enter learning mode:

```
devices[0].enter_learning().then((responseRaw) => {}).catch((error) => {});
```

Sweep RF frequencies:

```
devices[0].sweep_frequency().then((responseRaw) => {}).catch((error) => {});
```

Cancel sweep RF frequencies:

```
devices[0].cancel_sweep_frequency().then((responseRaw) => {}).catch((error) => {});
```

Check whether a frequency has been found:

```
devices[0].check_frequency().then((found) => {}).catch((error) => {});
```

(This will return true if the RM has locked onto a frequency, false otherwise)

Attempt to learn an RF packet:

```
devices[0].find_rf_packet().then((found) => {}).catch((error) => {});
```

(This will return true if a packet has been found, false otherwise)

Obtain an IR or RF packet while in learning mode:

```
devices[0].check_data().then((ir_packet) => {}).catch((error) => {});
```

(This will reject an error if the device does not have a packet to return)

Send an IR or RF packet:

```
devices[0].send_data(ir_packet).then((responseRaw) => {}).catch((error) => {});
```

Obtain temperature data from an RM2:

```
devices[0].check_temperature().then((temperature) => {}).catch((error) => {});
```

Obtain sensor data from an A1:

```
devices[0].check_sensors().then((data ) => {}).catch((error) => {});
```

Set power state on a SmartPlug SP2/SP3:

```
devices[0].set_power(True).then((responseRaw) => {}).catch((error) => {});
```

Check power state on a SmartPlug:

```
devices[0].check_power().then((state) => {}).catch((error) => {});
```

Check energy consumption on a SmartPlug:

```
devices[0].get_energy().then((state) => {}).catch((error) => {});
```

Set power state for S1 on a SmartPowerStrip MP1:

```
devices[0].set_power(1, True).then((responseRaw) => {}).catch((error) => {});
```

Check power state on a SmartPowerStrip:

```
devices[0].check_power().then((state) => {}).catch((error) => {});
```
