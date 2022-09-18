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

```typescript
import * as broadlink from 'node-broadlink';

broadlink.setup('myssid', 'mynetworkpass', 3)
```

Discover available devices on the local network:

```typescript
import * as broadlink from 'node-broadlink';

const [device] = await broadlink.discover();
```

Obtain the authentication key required for further communication:

```typescript
await device.auth();
```

Enter learning mode:

```typescript
import { Rmmini } from 'node-broadlink';
const rmminiDevice = device as Rmmini;
await rmminiDevice.enterLearning();
```

Sweep RF frequencies:

```typescript
import { Rmpro } from 'node-broadlink';
const rmproDevice = device as Rmpro;
const responseRaw = await rmproDevice.sweepFrequency();
```

Cancel sweep RF frequencies:

```typescript
const responseRaw = await rmproDevice.cancelSweepFrequency();
```

Check whether a frequency has been found:

```typescript
const found = await rmproDevice.checkFrequency();
```

(This will return true if the RM has locked onto a frequency, false otherwise)

Attempt to learn an RF packet:

```typescript
const found = await rmproDevice.findRfPacket();
```

(This will return true if a packet has been found, false otherwise)

Obtain an IR or RF packet while in learning mode:

```typescript
const ir_packet = await rmminiDevice.checkData(); // 2600d80000012894133814381312131213121312.....
```

(This will reject an error if the device does not have a packet to return)

Send an IR or RF packet:

```typescript
// ir_packet can be an hex-string (e.g "2600d80000012894133814381312131....") or a numbers array (e.g. [74, 7, 212, 7, 17, 161, 184, 70, 118, 205, ....]) 
const responseRaw = await rmminiDevice.sendData(ir_packet);
```

Obtain temperature data from an RM2:

```typescript
const temperature = await rmproDevice.checkTemperature(); // 45.5
```

Obtain sensor data from an A1:

```typescript
import { A1 } from 'node-broadlink';
const a1Device = device as A1;
const data = await a1Device.checkSensors();
```

Set power state on a SmartPlug SP2/SP3:

```typescript
import { Sp2 } from 'node-broadlink';
const sp2Device = device as Sp2;
const responseRaw = await sp2Device.setPower(true);
```

Check power state on a SmartPlug:

```typescript
const state = await sp2Device.checkPower();
```

Check energy consumption on a SmartPlug:

```typescript
import { Sp2s } from 'node-broadlink';
const sp2sDevice = device as Sp2s;
const state = await sp2sDevice.getEnergy();
```

Set power state for S1 on a SmartPowerStrip MP1:

```typescript
import { Mp1 } from 'node-broadlink';
const mp1Device = device as Mp1;
const responseRaw = await mp1Device.setPower(1, true);
```

Check power state on a SmartPowerStrip:

```typescript
const state = await mp1Device.checkPower();
```
