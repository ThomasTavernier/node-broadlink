import dgram, { RemoteInfo } from 'dgram';
import os from 'os';
import Device from './device';
import { Rm4mini, Rm4pro, Rmmini, Rmminib, Rmpro } from './remote';
import { S1C } from './alarm';
import { Hysen } from './climate';
import { Dooya } from './cover';
import { Lb1, Lb2 } from './light';
import { A1 } from './sensor';
import { Bg1, Mp1, Sp1, Sp2, Sp2s, Sp3, Sp3s, Sp4, Sp4b } from './switch';

// Export all TypeScript classes, to avoid internal (node-broadlink/dist/...) import for Liberty users */
export * from './alarm';
export * from './climate';
export * from './cover';
export * from './device';
export * from './light';
export * from './remote';
export * from './sensor';
export * from './switch';

interface NetworkInterfaceModel {
  address: string;
  broadcastAddress: string;
}

type NetworkInterface = NetworkInterfaceModel | NetworkInterfaceModel[];

const SUPPORTED_TYPES: Record<
  number,
  [
    {
      new (host: RemoteInfo, mac: number[], deviceType?: number, model?: string, manufacturer?: string): Device;
    },
    ...string[],
  ]
> = {
  0x0000: [Sp1, 'SP1', 'Broadlink'],
  0x2717: [Sp2, 'NEO', 'Ankuoo'],
  0x2719: [Sp2, 'SP2-compatible', 'Honeywell'],
  0x271a: [Sp2, 'SP2-compatible', 'Honeywell'],
  0x2720: [Sp2, 'SP mini', 'Broadlink'],
  0x2728: [Sp2, 'SP2-compatible', 'URANT'],
  0x273e: [Sp2, 'SP mini', 'Broadlink'],
  0x7530: [Sp2, 'SP2', 'Broadlink (OEM)'],
  0x7539: [Sp2, 'SP2-IL', 'Broadlink (OEM)'],
  0x753e: [Sp2, 'SP mini 3', 'Broadlink'],
  0x7540: [Sp2, 'MP2', 'Broadlink'],
  0x7544: [Sp2, 'SP2-CL', 'Broadlink'],
  0x7546: [Sp2, 'SP2-UK/BR/IN', 'Broadlink (OEM)'],
  0x7547: [Sp2, 'SC1', 'Broadlink'],
  0x7918: [Sp2, 'SP2', 'Broadlink (OEM)'],
  0x7919: [Sp2, 'SP2-compatible', 'Honeywell'],
  0x791a: [Sp2, 'SP2-compatible', 'Honeywell'],
  0x7d0d: [Sp2, 'SP mini 3', 'Broadlink (OEM)'],
  0x2711: [Sp2s, 'SP2', 'Broadlink'],
  0x2716: [Sp2s, 'NEO PRO', 'Ankuoo'],
  0x271d: [Sp2s, 'Ego', 'Efergy'],
  0x2736: [Sp2s, 'SP mini+', 'Broadlink'],
  0x2733: [Sp3, 'SP3', 'Broadlink'],
  0x7d00: [Sp3, 'SP3-EU', 'Broadlink (OEM)'],
  0x9479: [Sp3s, 'SP3S-US', 'Broadlink'],
  0x947a: [Sp3s, 'SP3S-EU', 'Broadlink'],
  0x7568: [Sp4, 'SP4L-CN', 'Broadlink'],
  0x756c: [Sp4, 'SP4M', 'Broadlink'],
  0x756f: [Sp4, 'MCB1', 'Broadlink'],
  0x7579: [Sp4, 'SP4L-EU', 'Broadlink'],
  0x757b: [Sp4, 'SP4L-AU', 'Broadlink'],
  0x7583: [Sp4, 'SP mini 3', 'Broadlink'],
  0x7587: [Sp4, 'SP4L-UK', 'Broadlink'],
  0x7d11: [Sp4, 'SP mini 3', 'Broadlink'],
  0xa56a: [Sp4, 'MCB1', 'Broadlink'],
  0xa56b: [Sp4, 'SCB1E', 'Broadlink'],
  0xa56c: [Sp4, 'SP4L-EU', 'Broadlink'],
  0xa589: [Sp4, 'SP4L-UK', 'Broadlink'],
  0xa5d3: [Sp4, 'SP4L-EU', 'Broadlink'],
  0x5115: [Sp4b, 'SCB1E', 'Broadlink'],
  0x51e2: [Sp4b, 'AHC/U-01', 'BG Electrical'],
  0x6111: [Sp4b, 'MCB1', 'Broadlink'],
  0x6113: [Sp4b, 'SCB1E', 'Broadlink'],
  0x618b: [Sp4b, 'SP4L-EU', 'Broadlink'],
  0x6489: [Sp4b, 'SP4L-AU', 'Broadlink'],
  0x648b: [Sp4b, 'SP4M-US', 'Broadlink'],
  0x6494: [Sp4b, 'SCB2', 'Broadlink'],
  0x2737: [Rmmini, 'RM mini 3', 'Broadlink'],
  0x278f: [Rmmini, 'RM mini', 'Broadlink'],
  0x27c2: [Rmmini, 'RM mini 3', 'Broadlink'],
  0x27c7: [Rmmini, 'RM mini 3', 'Broadlink'],
  0x27cc: [Rmmini, 'RM mini 3', 'Broadlink'],
  0x27cd: [Rmmini, 'RM mini 3', 'Broadlink'],
  0x27d0: [Rmmini, 'RM mini 3', 'Broadlink'],
  0x27d1: [Rmmini, 'RM mini 3', 'Broadlink'],
  0x27d3: [Rmmini, 'RM mini 3', 'Broadlink'],
  0x27dc: [Rmmini, 'RM mini 3', 'Broadlink'],
  0x27de: [Rmmini, 'RM mini 3', 'Broadlink'],
  0x2712: [Rmpro, 'RM pro/pro+', 'Broadlink'],
  0x272a: [Rmpro, 'RM pro', 'Broadlink'],
  0x273d: [Rmpro, 'RM pro', 'Broadlink'],
  0x277c: [Rmpro, 'RM home', 'Broadlink'],
  0x2783: [Rmpro, 'RM home', 'Broadlink'],
  0x2787: [Rmpro, 'RM pro', 'Broadlink'],
  0x278b: [Rmpro, 'RM plus', 'Broadlink'],
  0x2797: [Rmpro, 'RM pro+', 'Broadlink'],
  0x279d: [Rmpro, 'RM pro+', 'Broadlink'],
  0x27a1: [Rmpro, 'RM plus', 'Broadlink'],
  0x27a6: [Rmpro, 'RM plus', 'Broadlink'],
  0x27a9: [Rmpro, 'RM pro+', 'Broadlink'],
  0x27c3: [Rmpro, 'RM pro+', 'Broadlink'],
  0x5f36: [Rmminib, 'RM mini 3', 'Broadlink'],
  0x6507: [Rmminib, 'RM mini 3', 'Broadlink'],
  0x6508: [Rmminib, 'RM mini 3', 'Broadlink'],
  0x51da: [Rm4mini, 'RM4 mini', 'Broadlink'],
  0x5209: [Rm4mini, 'RM4 TV mate', 'Broadlink'],
  0x6070: [Rm4mini, 'RM4C mini', 'Broadlink'],
  0x610e: [Rm4mini, 'RM4 mini', 'Broadlink'],
  0x610f: [Rm4mini, 'RM4C mini', 'Broadlink'],
  0x62bc: [Rm4mini, 'RM4 mini', 'Broadlink'],
  0x62be: [Rm4mini, 'RM4C mini', 'Broadlink'],
  0x6364: [Rm4mini, 'RM4S', 'Broadlink'],
  0x648d: [Rm4mini, 'RM4 mini', 'Broadlink'],
  0x6539: [Rm4mini, 'RM4C mini', 'Broadlink'],
  0x653a: [Rm4mini, 'RM4 mini', 'Broadlink'],
  0x5213: [Rm4pro, 'RM4 pro', 'Broadlink'],
  0x6026: [Rm4pro, 'RM4 pro', 'Broadlink'],
  0x6184: [Rm4pro, 'RM4C pro', 'Broadlink'],
  0x61a2: [Rm4pro, 'RM4 pro', 'Broadlink'],
  0x649b: [Rm4pro, 'RM4 pro', 'Broadlink'],
  0x653c: [Rm4pro, 'RM4 pro', 'Broadlink'],
  0x2714: [A1, 'e-Sensor', 'Broadlink'],
  0x4eb5: [Mp1, 'MP1-1K4S', 'Broadlink'],
  0x4ef7: [Mp1, 'MP1-1K4S', 'Broadlink (OEM)'],
  0x4f1b: [Mp1, 'MP1-1K3S2U', 'Broadlink (OEM)'],
  0x4f65: [Mp1, 'MP1-1K3S2U', 'Broadlink'],
  0x5043: [Lb1, 'SB800TD', 'Broadlink (OEM)'],
  0x504e: [Lb1, 'LB1', 'Broadlink'],
  0x606e: [Lb1, 'SB500TD', 'Broadlink (OEM)'],
  0x60c7: [Lb1, 'LB1', 'Broadlink'],
  0x60c8: [Lb1, 'LB1', 'Broadlink'],
  0x6112: [Lb1, 'LB1', 'Broadlink'],
  0x644c: [Lb1, 'LB27 R1', 'Broadlink'],
  0x644e: [Lb1, 'LB26 R1', 'Broadlink'],
  0xa4f4: [Lb2, 'LB27 R1', 'Broadlink'],
  0xa5f7: [Lb2, 'LB27 R1', 'Broadlink'],
  0x2722: [S1C, 'S2KIT', 'Broadlink'],
  0x4ead: [Hysen, 'HY02/HY03', 'Hysen'],
  0x4e4d: [Dooya, 'DT360E-45/20', 'Dooya'],
  0x51e3: [Bg1, 'BG800/BG900', 'BG Electrical'],
};

export function getNetworkInterfaces(interfaces?: NetworkInterface): NetworkInterfaceModel[] {
  return interfaces && (!Array.isArray(interfaces) || interfaces.length > 0)
    ? ((Array.isArray(interfaces) && interfaces) || [interfaces]).flat().map(
        (arg) =>
          ({
            address: arg.address || arg,
            broadcastAddress: arg.broadcastAddress || '255.255.255.255',
          } as NetworkInterfaceModel),
      )
    : Object.values(os.networkInterfaces())
        .flat()
        .filter(
          (networkInterface) => networkInterface && networkInterface.family === 'IPv4' && !networkInterface.internal,
        )
        .map((networkInterface) => {
          const address = networkInterface!.address.split('.');
          return {
            address: networkInterface!.address,
            broadcastAddress: networkInterface!.netmask
              .split('.')
              .map((byte, index) => (byte === '255' ? address[index] : '255'))
              .join('.'),
          } as NetworkInterfaceModel;
        });
}

export function setup(
  ssid: string,
  password: string,
  securityMode: number,
  networkInterfaces?: NetworkInterfaceModel,
): Promise<{
  ssid: string;
  password: string;
  securityMode: string;
  interfaces: NetworkInterfaceModel[];
}> {
  return new Promise((resolve, reject) => {
    const payload = Buffer.concat([
      Buffer.alloc(68),
      Buffer.of(...ssid.split('').map((letter) => letter.charCodeAt(0))),
      Buffer.alloc(100 - 68 - ssid.length),
      Buffer.of(...password.split('').map((letter) => letter.charCodeAt(0))),
      Buffer.alloc(0x88 - 100 - password.length),
    ]);
    payload[0x26] = 0x14;
    payload[0x84] = ssid.length;
    payload[0x85] = password.length;
    payload[0x86] = securityMode;

    const checksum = payload.reduce((acc, b) => acc + b, 0xbeaf) & 0xffff;
    payload[0x20] = checksum & 0xff;
    payload[0x21] = (checksum >> 8) & 0xff;

    (
      Promise.all(
        getNetworkInterfaces(networkInterfaces).map(
          (networkInterface) =>
            new Promise((resolveSocketBound, rejectSocketBound) => {
              const socket = dgram.createSocket('udp4');
              socket.once('listening', () => {
                socket.setBroadcast(true);
                socket.send(payload, 0, payload.length, 80, networkInterface.broadcastAddress);
              });
              socket.on('error', (err) => {
                socket.close();
                rejectSocketBound(err);
              });
              socket.bind({ address: networkInterface.address }, () => {
                socket.close();
                resolveSocketBound(networkInterface);
              });
            }),
        ),
      ) as Promise<NetworkInterfaceModel[]>
    )
      .then((interfaces) => {
        resolve({
          ssid,
          password,
          securityMode: `${securityMode} (${['none', 'WEP', 'WPA1', 'WPA2', 'WPA1/2'][securityMode]})`,
          interfaces,
        });
      })
      .catch(reject);
  });
}

export function genDevice(deviceType: number, host: RemoteInfo, mac: number[]): Device {
  if (deviceType in SUPPORTED_TYPES) {
    const [DeviceClazz, ...args] = SUPPORTED_TYPES[deviceType];
    return new DeviceClazz(host, mac, deviceType, ...args);
  }
  return new Device(host, mac, deviceType);
}

export function discover(timeout = 500, interfaces?: NetworkInterface, discoverIpPort = 80): Promise<Device[]> {
  return new Promise((resolve) => {
    const devices: Device[] = [];
    const sockets = getNetworkInterfaces(interfaces).map((networkInterface) => {
      const cs = dgram.createSocket('udp4');

      cs.once('listening', () => {
        cs.setBroadcast(true);

        const address = networkInterface.address.split('.');
        const { port } = cs.address();
        const now = new Date();
        const timezone = now.getTimezoneOffset() / -3600;
        const year = now.getFullYear() - 1900;
        const packet = Buffer.alloc(0x30);

        if (timezone < 0) {
          packet[0x08] = 0xff + timezone - 1;
          packet[0x09] = 0xff;
          packet[0x0a] = 0xff;
          packet[0x0b] = 0xff;
        } else {
          packet[0x08] = timezone;
          packet[0x09] = 0;
          packet[0x0a] = 0;
          packet[0x0b] = 0;
        }
        packet[0x0c] = year & 0xff;
        packet[0x0d] = (year >> 8) & 0xff;
        packet[0x0e] = now.getMinutes();
        packet[0x0f] = now.getHours();
        packet[0x10] = ~~year % 100;
        packet[0x11] = now.getDay();
        packet[0x12] = now.getDay();
        packet[0x13] = now.getMonth();
        packet[0x18] = ~~address[0];
        packet[0x19] = ~~address[1];
        packet[0x1a] = ~~address[2];
        packet[0x1b] = ~~address[3];
        packet[0x1c] = port & 0xff;
        packet[0x1d] = (port >> 8) & 0xff;
        packet[0x26] = 6;

        const checksum = packet.reduce((acc, b) => acc + b, 0xbeaf) & 0xffff;
        packet[0x20] = checksum & 0xff;
        packet[0x21] = (checksum >> 8) & 0xff;

        cs.send(packet, 0, packet.length, discoverIpPort, networkInterface.broadcastAddress);
      });

      cs.on('message', (msg, rinfo) => {
        const deviceType = msg[0x34] | (msg[0x35] << 8);
        const mac = [...msg.subarray(0x3a, 0x40)].reverse();
        if (!devices.some((device) => device.mac.toString() === mac.toString())) {
          devices.push(genDevice(deviceType, rinfo, mac));
        }
      });

      cs.bind({ address: networkInterface.address });
      return cs;
    });

    setTimeout(() => {
      sockets.forEach((socket) => socket.close());
      resolve(devices);
    }, ~~timeout);
  });
}
