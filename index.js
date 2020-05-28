const dgram = require('dgram');
const os = require('os');
const crypto = require('crypto');
const struct = require('@aksel/structjs');

module.exports = new (class Broadlink {
  setup(ssid, password, securityMode, interfaces) {
    return new Promise((resolve) => {
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

      const checksum = payload.reduce((checksum, b) => (checksum = (checksum + b) & 0xffff), 0xbeaf);
      payload[0x20] = checksum & 0xff;
      payload[0x21] = checksum >> 8;

      Promise.all(
        this._getNetworkInterfaces(interfaces).map((networkInterface) => {
          return new Promise((resolve, reject) => {
            const socket = dgram.createSocket('udp4');
            socket.once('listening', () => {
              socket.setBroadcast(true);
              socket.sendto(payload, 0, payload.length, 80, networkInterface.broadcastAdress);
            });
            socket.on('error', (err) => {
              socket.close();
              reject(err);
            });
            socket.bind({ address: networkInterface.address }, () => {
              socket.close();
              resolve(networkInterface);
            });
          });
        })
      ).then((interfaces) => {
        resolve({
          ssid,
          password,
          securityMode: `${securityMode} (${['none', 'WEP', 'WPA1', 'WPA2', 'WPA1/2'][securityMode]})`,
          interfaces,
        });
      });
    });
  }

  gendevice(devtype, host, mac, id, key) {
    return new ([
      [sp1, [0]],
      [
        sp2,
        [
          0x2711, // SP2
          ...[0x2719, 0x7919, 0x271a, 0x791a], // Honeywell SP2
          0x2720, // SPMini
          0x753e, // SP3
          0x7d00, // OEM branded SP3
          ...[0x947a, 0x9479], // SP3S
          0x2728, // SPMini2
          ...[0x2733, 0x273e], // OEM branded SPMini
          ...[0x7530, 0x7546, 0x7918], // OEM branded SPMini2
          0x7d0d, // TMall OEM SPMini3
          0x2736, // SPMiniPlus
        ],
      ],
      [
        rm,
        [
          0x2712, // RM2
          0x2737, // RM Mini
          0x273d, // RM Pro Phicomm
          0x2783, // RM2 Home Plus
          0x277c, // RM2 Home Plus GDT
          0x272a, // RM2 Pro Plus
          0x2787, // RM2 Pro Plus2
          0x279d, // RM2 Pro Plus3
          0x27a9, // RM2 Pro Plus_300
          0x278b, // RM2 Pro Plus BL
          0x2797, // RM2 Pro Plus HYC
          0x27a1, // RM2 Pro Plus R1
          0x27a6, // RM2 Pro PP
          0x278f, // RM Mini Shate
          0x27c2, // RM Mini 3
          0x27d1, // new RM Mini3
          0x27de, // RM Mini 3 (C)
        ],
      ],
      [
        rm4,
        [
          0x51da, // RM4 Mini
          0x5f36, // RM Mini 3
          0x6026, // RM4 Pro
          0x6070, // RM4c Mini
          0x610e, // RM4 Mini
          0x610f, // RM4c
          0x62bc, // RM4 Mini
          0x62be, // RM4c Mini
        ],
      ],
      [a1, [0x2714]], // A1
      [
        mp1,
        [
          0x4eb5, // MP1
          0x4ef7, // Honyar oem mp1
        ],
      ],
      [hysen, [0x4ead]], // Hysen controller
      [S1C, [0x2722]], // S1 (SmartOne Alarm Kit)
      [dooya, [0x4e4d]], // Dooya DT360E (DOOYA_CURTAIN_V2)
      [bg1, [0x51e3]], // BG Electrical Smart Power Socket
      [lb1, [0x60c8]], // RGB Smart Bulb
    ].find(([deviceClass, types]) => types.includes(devtype)) || [device])[0](host, mac, devtype, id, key);
  }

  discover(timeout = 500, interfaces) {
    return new Promise((resolve) => {
      const devices = [];
      const sockets = this._getNetworkInterfaces(interfaces).map((networkInterface) => {
        const cs = dgram.createSocket('udp4');

        cs.once('listening', () => {
          cs.setBroadcast(true);

          const address = networkInterface.address.split('.');
          const port = cs.address().port;
          const now = new Date();
          const timezone = now.getTimezoneOffset() / -3600;
          const year = now.getYear();
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
          packet[0x0d] = year >> 8;
          packet[0x0e] = now.minute;
          packet[0x0f] = now.hour;
          packet[0x10] = ~~year % 100;
          packet[0x11] = now.getDay();
          packet[0x12] = now.day;
          packet[0x13] = now.month;
          packet[0x18] = ~~address[0];
          packet[0x19] = ~~address[1];
          packet[0x1a] = ~~address[2];
          packet[0x1b] = ~~address[3];
          packet[0x1c] = port & 0xff;
          packet[0x1d] = port >> 8;
          packet[0x26] = 6;

          const checksum = packet.reduce((checksum, b) => (checksum = (checksum + b) & 0xffff), 0xbeaf);
          packet[0x20] = checksum & 0xff;
          packet[0x21] = checksum >> 8;

          cs.sendto(packet, 0, packet.length, 80, networkInterface.broadcastAdress);
        });

        cs.on('message', (msg, rinfo) => {
          const devtype = msg[0x34] | (msg[0x35] << 8);
          const mac = [...msg.subarray(0x3a, 0x40)].map((n) => Number(n).toString(16)).reverse();
          if (!devices.find((device) => device.mac.toString() === mac.toString())) {
            devices.push(this.gendevice(devtype, rinfo, mac));
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

  _getNetworkInterfaces(interfaces) {
    interfaces = interfaces && !Array.isArray(interfaces) ? [interfaces] : interfaces;
    return Array.isArray(interfaces) && interfaces.length > 0
      ? interfaces.flat().map((arg) => {
          return {
            address: arg.address || arg,
            broadcastAdress: arg.broadcastAdress || '255.255.255.255',
          };
        })
      : Object.values(os.networkInterfaces())
          .flat()
          .filter((networkInterface) => networkInterface.family === 'IPv4' && !networkInterface.internal)
          .map((networkInterface) => {
            const address = networkInterface.address.split('.');
            networkInterface.broadcastAdress = networkInterface.netmask
              .split('.')
              .map((byte, index) => (byte === '255' ? address[index] : '255'))
              .join('.');
            return networkInterface;
          });
  }
})();

class device {
  constructor(host, mac, devtype, id, key) {
    this.host = host;
    this.mac = typeof mac === 'string' ? mac.split(':') : mac;
    this.devtype = devtype || 0x272a;
    this.id = id || [0, 0, 0, 0];
    this.key = key || [0x09, 0x76, 0x28, 0x34, 0x3f, 0xe9, 0x9e, 0x23, 0x76, 0x5c, 0x15, 0x13, 0xac, 0xcf, 0x8b, 0x02];
    this.count = Math.floor(Math.random() * 0xffff);
    this.iv = Buffer.from([
      0x56,
      0x2e,
      0x17,
      0x99,
      0x6d,
      0x09,
      0x3d,
      0x28,
      0xdd,
      0xb3,
      0xba,
      0x69,
      0x5a,
      0x2e,
      0x6f,
      0x58,
    ]);
    this.type = 'Unknown';
    this.socket = dgram.createSocket('udp4');
    this.socket.bind();
  }

  encrypt(payload) {
    const cipher = crypto.createCipheriv('aes-128-cbc', Buffer.from(this.key), this.iv);
    return cipher.update(payload);
  }

  decrypt(response) {
    const decipher = crypto.createDecipheriv('aes-128-cbc', Buffer.from(this.key), this.iv);
    decipher.setAutoPadding(false);
    return Buffer.concat([decipher.update(response.subarray(0x38)), decipher.final()]);
  }

  auth() {
    const payload = Buffer.alloc(0x50);
    payload[0x04] = 0x31;
    payload[0x05] = 0x31;
    payload[0x06] = 0x31;
    payload[0x07] = 0x31;
    payload[0x08] = 0x31;
    payload[0x09] = 0x31;
    payload[0x0a] = 0x31;
    payload[0x0b] = 0x31;
    payload[0x0c] = 0x31;
    payload[0x0d] = 0x31;
    payload[0x0e] = 0x31;
    payload[0x0f] = 0x31;
    payload[0x10] = 0x31;
    payload[0x11] = 0x31;
    payload[0x12] = 0x31;
    payload[0x1e] = 0x01;
    payload[0x2d] = 0x01;
    payload[0x30] = 'T'.charCodeAt(0);
    payload[0x31] = 'e'.charCodeAt(0);
    payload[0x32] = 's'.charCodeAt(0);
    payload[0x33] = 't'.charCodeAt(0);
    payload[0x34] = ' '.charCodeAt(0);
    payload[0x35] = ' '.charCodeAt(0);
    payload[0x36] = '1'.charCodeAt(0);

    return new Promise((resolve, reject) => {
      this.sendPacket(0x65, payload)
        .then((response) => {
          const payload = this.decrypt(response);
          const key = payload.subarray(0x04, 0x14);
          if (key.length > 0 && key.length % 16 === 0) {
            this.id = [...payload.subarray(0x00, 0x04)];
            this.key = [...key];
            resolve(this);
          } else {
            reject(new Error('auth failed'));
          }
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  sendPacket(command, payload) {
    return new Promise((resolve, reject) => {
      this.count = (this.count + 1) & 0xffff;
      let packet = Buffer.alloc(0x38);
      packet[0x00] = 0x5a;
      packet[0x01] = 0xa5;
      packet[0x02] = 0xaa;
      packet[0x03] = 0x55;
      packet[0x04] = 0x5a;
      packet[0x05] = 0xa5;
      packet[0x06] = 0xaa;
      packet[0x07] = 0x55;
      packet[0x24] = this.devtype & 0xff;
      packet[0x25] = this.devtype >> 8;
      packet[0x26] = command;
      packet[0x28] = this.count & 0xff;
      packet[0x29] = this.count >> 8;
      packet[0x2a] = this.mac[5];
      packet[0x2b] = this.mac[4];
      packet[0x2c] = this.mac[3];
      packet[0x2d] = this.mac[2];
      packet[0x2e] = this.mac[1];
      packet[0x2f] = this.mac[0];
      packet[0x30] = this.id[0];
      packet[0x31] = this.id[1];
      packet[0x32] = this.id[2];
      packet[0x33] = this.id[3];

      if (payload) payload = Buffer.concat([payload, Buffer.alloc((((16 - payload.length) % 16) + 16) % 16)]);

      let checksum = payload.reduce((checksum, b) => (checksum = (checksum + b) & 0xffff), 0xbeaf);

      packet[0x34] = checksum & 0xff;
      packet[0x35] = checksum >> 8;

      payload = this.encrypt(payload);
      packet = Buffer.concat([packet, payload]);
      checksum = packet.reduce((checksum, b) => (checksum = (checksum + b) & 0xffff), 0xbeaf);

      packet[0x20] = checksum & 0xff;
      packet[0x21] = checksum >> 8;
      this.socket.once('message', (response) => {
        const errorCode = this.checkError(response.subarray(0x22, 0x24));
        if (!errorCode) {
          resolve(response);
        } else {
          reject(new Error(errorCode));
        }
      });
      this.socket.sendto(packet, 0, packet.length, this.host.port, this.host.address);
    });
  }

  checkError(error) {
    return error[0] | (error[1] << 8);
  }
}

class mp1 extends device {
  constructor(...args) {
    super(...args);
    this.type = 'MP1';
  }

  setPowerMask(sidMask, state) {
    const packet = Buffer.alloc(16);
    packet[0x00] = 0x0d;
    packet[0x02] = 0xa5;
    packet[0x03] = 0xa5;
    packet[0x04] = 0x5a;
    packet[0x05] = 0x5a;
    packet[0x06] = 0xb2 + (state ? sidMask << 1 : sidMask);
    packet[0x07] = 0xc0;
    packet[0x08] = 0x02;
    packet[0x0a] = 0x03;
    packet[0x0d] = sidMask;
    packet[0x0e] = state ? sidMask : 0;
    return this.sendPacket(0x6a, packet);
  }

  setPower(sid, state) {
    return this.setPowerMask(0x01 << (sid - 1), state);
  }

  checkPowerRaw() {
    return new Promise((resolve, reject) => {
      const packet = Buffer.alloc(16);
      packet[0x00] = 0x0a;
      packet[0x02] = 0xa5;
      packet[0x03] = 0xa5;
      packet[0x04] = 0x5a;
      packet[0x05] = 0x5a;
      packet[0x06] = 0xae;
      packet[0x07] = 0xc0;
      packet[0x08] = 0x01;

      this.sendPacket(0x6a, packet)
        .then((response) => {
          const payload = this.decrypt(response);
          resolve(typeof payload[0x4] === 'number' ? payload[0x0e] : payload[0x0e].charCodeAt(0));
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  checkPower() {
    return new Promise((resolve, reject) => {
      this.checkPowerRaw()
        .then((state) => {
          resolve(
            state === undefined
              ? { s1: undefined, s2: undefined, s3: undefined, s4: undefined }
              : {
                  s1: state & 0x01,
                  s2: state & 0x02,
                  s3: state & 0x04,
                  s4: state & 0x08,
                }
          );
          return data;
        })
        .catch((err) => {
          reject(err);
        });
    });
  }
}

class bg1 extends device {
  constructor(...args) {
    super(...args);
    this.type = 'BG1';
  }

  getState() {
    return new Promise((resolve, reject) => {
      this.sendPacket(0x6a, this._encode(1, '{}'))
        .then((response) => {
          resolve(this._decode(response));
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  setState(pwr, pwr1, pwr2, maxworktime, maxworktime1, maxworktime2, idcbrightness) {
    return new Promise((resolve, reject) => {
      this.sendPacket(
        0x6a,
        this._encode(
          2,
          JSON.stringify({
            pwr: pwr !== undefined ? Number(Boolean(pwr)) : undefined,
            pwr1: pwr1 !== undefined ? Number(Boolean(pwr1)) : undefined,
            pwr2: pwr2 !== undefined ? Number(Boolean(pwr2)) : undefined,
            maxworktime,
            maxworktime1,
            maxworktime2,
            idcbrightness,
          })
        )
      )
        .then((response) => {
          resolve(this._decode(this.decrypt(response)));
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  _encode(flag, js) {
    const length = 4 + 2 + 2 + 4 + js.length;
    const packet = Buffer.concat([
      Buffer.from(struct('<HHHHBBI').pack(length, 0xa5a5, 0x5a5a, 0x0000, flag, 0x0b, js.length)),
      Buffer.from(js),
    ]);
    const checksum = packet.subarray(0x08).reduce((checksum, b) => (checksum = (checksum + b) & 0xffff), 0xc0ad);
    packet[0x06] = checksum & 0xff;
    packet[0x07] = checksum >> 8;
    return packet;
  }

  _decode(payload) {
    return JSON.parse(payload.subarray(0x0e, 0x0e + struct('<I').unpack_from(payload, 0x0a)[0]));
  }
}

class sp1 extends device {
  constructor(...args) {
    super(...args);
    this.type = 'SP1';
  }

  setPower(state) {
    return this.sendPacket(0x66, Buffer.of(state));
  }
}

class sp2 extends device {
  constructor(...args) {
    super(...args);
    this.type = 'SP2';
  }

  setPower(state) {
    return new Promise((resolve, reject) => {
      const packet = Buffer.alloc(16);
      packet[0] = 2;
      this.checkNightlight()
        .then((isNightlight) => {
          if (isNightlight) {
            packet[4] = state ? 3 : 2;
          } else {
            packet[4] = state ? 1 : 0;
          }
          return this.sendPacket(0x6a, packet)
            .then((response) => {
              resolve(response);
            })
            .catch((err) => {
              reject(err);
            });
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  setNightlight(state) {
    return new Promise((resolve, reject) => {
      const packet = Buffer.alloc(16);
      packet[0] = 2;
      this.checkPower()
        .then((isPower) => {
          if (isPower) {
            packet[4] = state ? 3 : 1;
          } else {
            packet[4] = state ? 2 : 0;
          }
          return this.sendPacket(0x6a, packet)
            .then((response) => {
              resolve(response);
            })
            .catch((err) => {
              reject(err);
            });
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  checkPower() {
    return new Promise((resolve, reject) => {
      this.sendPacket(0x6a, Buffer.of(1))
        .then((response) => {
          const payload = this.decrypt(response);
          resolve(
            typeof payload[0x4] === 'number'
              ? Boolean(payload[0x4] === 1 || payload[0x4] === 3 || payload[0x4] === 0xfd)
              : Boolean(
                  payload[0x4].charCodeAt(0) === 1 ||
                    payload[0x4].charCodeAt(0) === 3 ||
                    payload[0x4].charCodeAt(0) === 0xfd
                )
          );
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  checkNightlight() {
    return new Promise((resolve, reject) => {
      this.sendPacket(0x6a, Buffer.of(1))
        .then((response) => {
          const payload = this.decrypt(response);
          resolve(
            typeof payload[0x4] === 'number'
              ? Boolean(payload[0x4] == 2 || payload[0x4] == 3 || payload[0x4] == 0xff)
              : Boolean(
                  payload[0x4].charCodeAt(0) == 1 ||
                    payload[0x4].charCodeAt(0) == 3 ||
                    payload[0x4].charCodeAt(0) == 0xfd
                )
          );
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  getEnergy() {
    return new Promise((resolve, reject) => {
      this.sendPacket(0x6a, Buffer.of(8, 0, 254, 1, 5, 1, 0, 0, 0, 45))
        .then((response) => {
          const payload = this.decrypt(response);
          resolve(
            typeof payload[0x7] === 'number'
              ? [
                  ...Buffer.from(Number(packet[0x07] * 256 + packet[0x06]).toString(16), 'hex').values(),
                  ...Buffer.from(Number(packet[0x05]).toString(16), 'hex').values(),
                ].reduce((sum, value) => (sum += value), 0) / 100.0
              : [
                  ...Buffer.from(
                    Number(packet[0x07].charCodeAt(0) * 256 + packet[0x06].charCodeAt(0)).toString(16),
                    'hex'
                  ).values(),
                  ...Buffer.from(Number(packet[0x05].charCodeAt(0)).toString(16), 'hex').values(),
                ].reduce((sum, value) => (sum += value), 0) / 100.0
          );
        })
        .catch((err) => {
          reject(err);
        });
    });
  }
}

class a1 extends device {
  constructor(...args) {
    super(...args);
    this.type = 'A1';
  }

  checkSensors() {
    return new Promise((resolve, reject) => {
      this.sendPacket(0x6a, Buffer.of(1))
        .then((response) => {
          const payload = this.decrypt(response);
          const data = {};
          let light;
          let airQuality;
          let noise;
          if (typeof payload(0x4) === 'number') {
            data.temperature = (payload[0x4] * 10 + payload[0x5]) / 10.0;
            data.humidity = (payload[0x6] * 10 + payload[0x7]) / 10.0;
            light = payload[0x8];
            airQuality = payload[0x0a];
            noise = payload[0xc];
          } else {
            data.temperature = (payload[0x4].charCodeAt(0) * 10 + payload[0x5]).charCodeAt(0) / 10.0;
            data.humidity = (payload[0x6].charCodeAt(0) * 10 + payload[0x7]).charCodeAt(0) / 10.0;
            light = payload[0x8].charCodeAt(0);
            airQuality = payload[0x0a].charCodeAt(0);
            noise = payload[0xc].charCodeAt(0);
          }
          switch (light) {
            case 0:
              data.light = 'dark';
              break;
            case 1:
              data.light = 'dim';
              break;
            case 2:
              data.light = 'normal';
              break;
            case 3:
              data.light = 'bright';
              break;
            default:
              data.light = 'unknown';
              break;
          }
          switch (airQuality) {
            case 0:
              data.airQuality = 'excellent';
              break;
            case 1:
              data.airQuality = 'good';
              break;
            case 2:
              data.airQuality = 'normal';
              break;
            case 3:
              data.airQuality = 'bad';
              break;
            default:
              data.airQuality = 'unknown';
              break;
          }
          switch (noise) {
            case 0:
              data.noise = 'quiet';
              break;
            case 1:
              data.noise = 'normal';
              break;
            case 2:
              data.noise = 'noisy';
              break;
            default:
              data.noise = 'unknown';
              break;
          }
          resolve(data);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  checkSensorsRaw() {
    return new Promise((resolve, reject) => {
      this.sendPacket(0x6a, Buffer.of(1))
        .then((response) => {
          const data = {};
          const payload = this.decrypt(response);
          if (typeof payload(0x4) === 'number') {
            data.temperature = (payload[0x4] * 10 + payload[0x5]) / 10.0;
            data.humidity = (payload[0x6] * 10 + payload[0x7]) / 10.0;
            data.light = payload[0x8];
            data.airQuality = payload[0x0a];
            data.noise = payload[0xc];
          } else {
            data.temperature = (payload[0x4].charCodeAt(0) * 10 + payload[0x5]).charCodeAt(0) / 10.0;
            data.humidity = (payload[0x6].charCodeAt(0) * 10 + payload[0x7]).charCodeAt(0) / 10.0;
            data.light = payload[0x8].charCodeAt(0);
            data.airQuality = payload[0x0a].charCodeAt(0);
            data.noise = payload[0xc].charCodeAt(0);
          }
          resolve(data);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }
}
class rm extends device {
  constructor(...args) {
    super(...args);
    this.type = 'RM2';
    this._requestHeader = Buffer.of(0x00);
    this._codeSendingHeader = Buffer.of(0x00);
  }

  checkData() {
    return new Promise((resolve, reject) => {
      this.sendPacket(0x6a, Buffer.concat([this._requestHeader, Buffer.of(0x04)]))
        .then((response) => {
          const payload = this.decrypt(response);
          resolve([...payload.subarray(this._requestHeader.length + 4)]);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  sendData(data) {
    return this.sendPacket(
      0x6a,
      Buffer.concat([this._codeSendingHeader, Buffer.from([0x02, 0x00, 0x00, 0x00]), Buffer.from(data)])
    );
  }

  enterLearning() {
    return this.sendPacket(0x6a, Buffer.concat([this._requestHeader, Buffer.of(0x03)]));
  }

  sweepFrequency() {
    return this.sendPacket(0x6a, Buffer.concat([this._requestHeader, Buffer.of(0x04)]));
  }

  cancelSweepFrequency() {
    return this.sendPacket(0x6a, Buffer.concat([this._requestHeader, Buffer.of(0x1e)]));
  }

  checkFrequency() {
    return new Promise((resolve, reject) => {
      this.sendPacket(0x6a, Buffer.concat([this._requestHeader, Buffer.of(0x1a)]))
        .then((response) => {
          const payload = this.decrypt(response);
          resolve(payload.subarray(this._requestHeader.length + 4) == 1);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  findRfPacket() {
    return new Promise((resolve, reject) => {
      this.sendPacket(0x6a, Buffer.concat([this._requestHeader, Buffer.of(0x1b)]))
        .then((response) => {
          const payload = this.decrypt(response);
          resolve(payload.subarray(this._requestHeader.length + 4) == 1);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  checkTemperature() {
    return this._readSensor(0x01, 4, 10.0);
  }

  _readSensor(type, offset, divider) {
    return new Promise((resolve, reject) => {
      const packet = Buffer.concat([this._requestHeader, Buffer.of(type)]);
      this.sendPacket(0x6a, packet)
        .then((response) => {
          const payload = this.decrypt(response);
          const valuePos = this._requestHeader.length + offset;
          resolve(
            typeof payload[valuePos] === 'number'
              ? payload[valuePos] + payload[valuePos + 1] / divider
              : payload[valuePos].charCodeAt(0) + payload[valuePos + 1].charCodeAt(0) / divider
          );
        })
        .catch((err) => {
          reject(err);
        });
    });
  }
}
class rm4 extends rm {
  constructor(...args) {
    super(...args);
    this.type = 'RM4';
    this._requestHeader = Buffer.of(0x04, 0x00);
    this._codeSendingHeader = Buffer.of(0xd0, 0x00);
  }
}

class hysen extends device {
  constructor(...args) {
    super(...args);
    this.type = 'Hysen heating controller';
  }

  calculateCrc16(inputData) {
    const crc16Tab = [...Array(256).keys()].map((i) =>
      [...Array(8)].reduce((crc) => (crc = crc & 0x0001 ? (crc >> 1) ^ 0xa001 : crc >> 1), i)
    );

    const isString = typeof inputData === 'string';
    const isBytes = Buffer.isBuffer(inputData) && inputData.length === 8;

    if (!isString && !isBytes) {
      throw new Error('Please provide a string or a byte sequence as argument for calculation.');
    }

    [...inputData].reduce(
      (crcValue, c) => (crcValue = (crcValue >> 8) ^ crc16Tab[(crcValue ^ (isString ? c.charCodeAt(0) : c)) & 0x00ff]),
      0xffff
    );
  }

  sendRequest(inputPayload) {
    return new Promise((resolve, reject) => {
      let crc = this.calculateCrc16(inputPayload);
      this.sendPacket(
        0x6a,
        Buffer.concat([Buffer.of(inputPayload.length + 2), inputPayload, Buffer.of(crc & 0xff, (crc >> 8) & 0xff)])
      ).then((response) => {
        const responsePayload = this.decrypt(response);
        const responsePayloadLength = responsePayload[0];
        try {
          if (responsePayloadLength + 2 > responsePayloadLength.length) {
            throw new Error('hysenResponseError', 'first byte of response is not length');
          } else {
            crc = this.calculateCrc16(responsePayload.subarray(2, responsePayloadLength));
            if (
              (responsePayload[responsePayloadLength] === crc) & 0xff &&
              (responsePayload[responsePayloadLength + 1] === crc >> 8) & 0xff
            ) {
              resolve(responsePayload.subarray(2, responsePayloadLength));
            } else {
              throw new Error('hysenResponseError', 'CRC check on response failed');
            }
          }
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  getTemp() {
    return new Promise((resolve, reject) => {
      this.sendRequest(Buffer.of(0x01, 0x03, 0x00, 0x00, 0x00, 0x08))
        .then((payload) => {
          resolve(payload[0x05] / 2.0);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  getExternalTemp() {
    return new Promise((resolve, reject) => {
      this.sendRequest(Buffer.of(0x01, 0x03, 0x00, 0x00, 0x00, 0x08))
        .then((payload) => {
          resolve(payload[18] / 2.0);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  getFullStatus() {
    return new Promise((resolve, reject) => {
      this.sendRequest(Buffer.of(0x01, 0x03, 0x00, 0x00, 0x00, 0x16))
        .then((payload) => {
          const week = [...Array(8).keys()].map((i) => {
            return {
              startHour: payload[2 * i + 23],
              startMinute: payload[2 * i + 24],
              temp: payload[i + 39] / 2.0,
            };
          });
          const roomTempAdj = ((payload[13] << 8) + payload[14]) / 2.0;
          resolve({
            remoteLock: payload[3] & 1,
            power: payload[4] & 1,
            active: (payload[4] >> 4) & 1,
            tempManual: (payload[4] >> 6) & 1,
            roomTemp: (payload[5] & 255) / 2.0,
            thermostatTemp: (payload[6] & 255) / 2.0,
            autoMode: payload[7] & 15,
            loopMode: (payload[7] >> 4) & 15,
            sensor: payload[8],
            osv: payload[9],
            dif: payload[10],
            svh: payload[11],
            svl: payload[12],
            roomTempAdj: roomTempAdj > 32767 ? 32767 - roomTempAdj : roomTempAdj,
            fre: payload[15],
            poweron: payload[16],
            unknown: payload[17],
            externalTemp: (payload[18] & 255) / 2.0,
            hour: payload[19],
            min: payload[20],
            sec: payload[21],
            dayofweek: payload[22],
            weekDay: week.slice(0, 6),
            weekEnd: week.slice(6),
          });
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  setMode(autoMode, loopMode, sensor = 0) {
    return this.sendRequest(Buffer.of(0x01, 0x06, 0x00, 0x02, ((loopMode + 1) << 4) + autoMode, sensor));
  }

  setAdvanced(loopMode, sensor, osv, dif, svh, svl, adj, fre, poweron) {
    return this.sendRequest(
      Buffer.of(
        0x01,
        0x10,
        0x00,
        0x02,
        0x00,
        0x05,
        0x0a,
        loopMode,
        sensor,
        osv,
        dif,
        svh,
        svl,
        (int(adj * 2) >> 8) & 0xff,
        int(adj * 2) & 0xff,
        fre,
        poweron
      )
    );
  }

  setTemp(temp) {
    return this.sendRequest(Buffer.of(0x01, 0x06, 0x00, 0x01, 0x00, int(temp * 2)));
  }

  setPower(power = 1, remoteLock = 0) {
    return this.sendRequest(Buffer.of(0x01, 0x06, 0x00, 0x00, remoteLock, power));
  }

  setTime(hour, minute, second, day) {
    return this.sendRequest(Buffer.of(0x01, 0x10, 0x00, 0x08, 0x00, 0x02, 0x04, hour, minute, second, day));
  }

  setSchedule(weekday, weekend) {
    return this.sendRequest(
      Buffer.from(
        0x01,
        0x10,
        0x00,
        0x0a,
        0x00,
        0x0c,
        0x18,
        ...[...Array(6).keys()].map((i) => [weekday[i].startHour, weekday[i].startMinute]).flat(),
        ...[...Array(2).keys()].map((i) => [weekend[i].startHour, weekend[i].startMinute]).flat(),
        ...[...Array(6).keys()].map((i) => weekday[i].temp * 2),
        ...[...Array(2).keys()].map((i) => weekend[i].temp * 2)
      )
    );
  }
}

class S1C extends device {
  S1C_SENSORS_TYPES = {
    0x31: 'Door Sensor',
    0x91: 'Key Fob',
    0x21: 'Motion Sensor',
  };

  constructor(...args) {
    super(...args);
    this.type = 'S1C';
  }

  getSensorsStatus() {
    return new Promise((resolve) => {
      const packet = Buffer.of(0x06);
      this.sendPacket(0x6a, packet).then((response) => {
        const payload = this.decrypt(response);
        if (!payload) {
          resolve(undefined);
        }
        const count = payload[0x4];
        const sensors = payload.subarray(0x6);
        const sensorsA = [...Array(Math.floor(sensors.length / 83)).keys()].map((i) =>
          sensors.subarray(i * 83, (i + 1) * 83)
        );
        resolve({
          count: count,
          sensors: sensorsA
            .map((sens) => {
              const r = {
                status: String.fromCharCode(sens[0]).charCodeAt(0),
                name: String.fromCharCode(...sens.subarray(4, 26)),
                type: S1C_SENSORS_TYPES[String.fromCharCode(sens[3]).charCodeAt(0)] || 'Unknown',
                order: String.fromCharCode(sens[1]).charCodeAt(0),
                serial: String.fromCharCode(...Buffer.from(sens.subarray(26, 30), 'hex').values()),
              };
              if (r.serial !== '00000000') {
                return r;
              }
            })
            .filter((sensRes) => sensRes),
        });
      });
    });
  }
}

class dooya extends device {
  constructor(...args) {
    super(...args);
    this.type = 'Dooya DT360E';
  }

  open() {
    return this._send(0x01, 0x00);
  }

  close() {
    return this._send(0x02, 0x00);
  }

  stop() {
    return this._send(0x03, 0x00);
  }

  getPercentage() {
    return this._send(0x06, 0x5d);
  }

  setPercentageAndWait(newPercentage) {
    return new Promise((resolve, reject) => {
      this.getPercentage()
        .then((current) => {
          if (current > newPercentage) {
            this.close()
              .then(() => {
                const interval = setInterval(() => {
                  this.getPercentage()
                    .then((current) => {
                      if (current === undefined || current <= newPercentage) {
                        clearInterval(interval);
                        resolve(this.stop());
                      }
                    })
                    .catch((err) => {
                      clearInterval(interval);
                      reject(err);
                    });
                }, 200);
              })
              .catch((err) => {
                reject(err);
              });
          } else if (current > newPercentage) {
            this.open()
              .then(() => {
                const interval = setInterval(() => {
                  this.getPercentage()
                    .then((current) => {
                      if (current === undefined || current >= newPercentage) {
                        clearInterval(interval);
                        resolve(this.stop());
                      }
                    })
                    .catch((err) => {
                      clearInterval(interval);
                      reject(err);
                    });
                }, 200);
              })
              .catch((err) => {
                reject(err);
              });
          }
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  _send(magic1, magic2) {
    return new Promise((resolve, reject) => {
      const packet = Buffer.alloc(16);
      packet[0] = 0x09;
      packet[2] = 0xbb;
      packet[3] = magic1;
      packet[4] = magic2;
      packet[9] = 0xfa;
      packet[10] = 0x44;
      this.sendPacket(0x6a, packet)
        .then((response) => {
          resolve(this.decrypt(response)[4].charCodeAt(0));
        })
        .catch((err) => {
          reject(err);
        });
    });
  }
}

class lb1 extends device {
  stateDict = [];
  effectMapDict = {
    'lovely color': 0,
    flashlight: 1,
    lightning: 2,
    'color fading': 3,
    'color breathing': 4,
    'multicolor breathing': 5,
    'color jumping': 6,
    'multicolor jumping': 7,
  };

  constructor(...args) {
    super(...args);
    this.type = 'SmartBulb';
  }

  sendCommand(command, type = 'set') {
    return new Promise((resolve, reject) => {
      const packet = Buffer.concat([
        Buffer.alloc(0x0e),
        command,
        Buffer.alloc(16 + (~~(command.length / 16) + 1) * 16 - 0x0e - command.length),
      ]);
      packet[0x02] = 0xa5;
      packet[0x03] = 0xa5;
      packet[0x04] = 0x5a;
      packet[0x05] = 0x5a;
      packet[0x08] = type === 'set' ? 0x02 : 0x01;
      packet[0x09] = 0x0b;
      packet[0x0a] = command.length;

      const checksum = packet.reduce((checksum, b) => (checksum = (checksum + b) & 0xffff), 0xbeaf);
      packet[0x00] = (0x0c + command.length) & 0xff;
      packet[0x06] = checksum & 0xff;
      packet[0x07] = checksum >> 8;

      this.sendPacket(0x6a, packet)
        .then((response) => {
          const payload = this.decrypt(response);
          const responseLength = ~~payload[0x0a] | (~~payload[0x0b] << 8);
          if (responseLength > 0) {
            this.stateDict = JSON.parse(payload.subarray(0x0e, 0x0e + responseLength));
          }
          resolve(this.stateDict);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  setJson(jsonString) {
    return new Promise((resolve, reject) => {
      const reconvert = JSON.parse(jsonString);
      if (Object.keys(reconvert).includes(bulbSceneidx)) {
        reconvert.bulbSceneidx = this.effectMapDict[reconvert.bulbSceneidx] || 255;
      }
      this.sendCommand(JSON.stringify(reconvert))
        .then(() => {
          resolve(JSON.parse(this.stateDict));
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  setState(state) {
    return this.sendCommand(`{"pwr":${state === 'ON' ? 1 : 0}}`);
  }

  getState() {
    return this.sendCommand('{}');
  }
}
