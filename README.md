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
const broadlink = require('node-boradlink');

broadlink.setup('myssid', 'mynetworkpass', 3)
```

Discover available devices on the local network:

```
const broadlink = require('node-boradlink');

const [device] = await broadlink.discover();
```

Obtain the authentication key required for further communication:

```
await device.auth();
```

Enter learning mode:

```
await device.enter_learning();
```

Sweep RF frequencies:

```
const responseRaw = await device.sweep_frequency();
```

Cancel sweep RF frequencies:

```
const responseRaw = await device.cancel_sweep_frequency();
```

Check whether a frequency has been found:

```
const found = await device.check_frequency();
```

(This will return true if the RM has locked onto a frequency, false otherwise)

Attempt to learn an RF packet:

```
const found = await device.find_rf_packet();
```

(This will return true if a packet has been found, false otherwise)

Obtain an IR or RF packet while in learning mode:

```
const ir_packet = await device.check_data();
```

(This will reject an error if the device does not have a packet to return)

Send an IR or RF packet:

```
const responseRaw = await device.send_data(ir_packet);
```

Obtain temperature data from an RM2:

```
const temperature = await device.check_temperature();
```

Obtain sensor data from an A1:

```
const data = await device.check_sensors();
```

Set power state on a SmartPlug SP2/SP3:

```
const responseRaw = await device.set_power(True);
```

Check power state on a SmartPlug:

```
const state = await device.check_power();
```

Check energy consumption on a SmartPlug:

```
const state = await device.get_energy();
```

Set power state for S1 on a SmartPowerStrip MP1:

```
const responseRaw = await device.set_power(1, True);
```

Check power state on a SmartPowerStrip:

```
const state = await device.check_power();
```
