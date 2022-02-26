import Device from './device';
import struct from './struct';

interface StateModelLb<T = boolean> {
  pwr?: T;
  red?: number;
  blue?: number;
  green?: number;
  brightness?: number;
  colortemp?: number;
  hue?: number;
  saturation?: number;
  transitionduration?: number;
  maxworktime?: number;
  bulb_colormode?: number;
  bulb_scenes?: string;
  bulb_scene?: string;
}
interface StateModelLb1<T = boolean> extends StateModelLb<T> {
  bulb_sceneidx: number;
}

abstract class Lb<T extends StateModelLb> extends Device {
  public getState(): Promise<T> {
    return this.sendPacketAndDecrypt(this.encode(1, {} as T)).then((data) => {
      return this.decode(data);
    });
  }

  protected mapToNumber(state: StateModelLb): StateModelLb<number> {
    return {
      pwr: state.pwr !== undefined ? Number(state.pwr) : undefined,
      red: state.red,
      blue: state.blue,
      green: state.green,
      brightness: state.brightness,
      colortemp: state.colortemp,
      hue: state.hue,
      saturation: state.saturation,
      transitionduration: state.transitionduration,
      maxworktime: state.maxworktime,
      bulb_colormode: state.bulb_colormode,
      bulb_scenes: state.bulb_scenes,
      bulb_scene: state.bulb_scene,
    } as StateModelLb<number>;
  }

  protected mapToBoolean(state: StateModelLb<number>): StateModelLb {
    return {
      pwr: state.pwr !== undefined ? Boolean(state.pwr) : undefined,
      red: state.red,
      blue: state.blue,
      green: state.green,
      brightness: state.brightness,
      colortemp: state.colortemp,
      hue: state.hue,
      saturation: state.saturation,
      transitionduration: state.transitionduration,
      maxworktime: state.maxworktime,
      bulb_colormode: state.bulb_colormode,
      bulb_scenes: state.bulb_scenes,
      bulb_scene: state.bulb_scene,
    } as T;
  }

  public setState(state: T): Promise<T> {
    return this.sendPacket(this.encode(2, state)).then((response) => this.decode(response));
  }

  protected abstract encode(flag: number, state: T): Buffer;

  protected decode(response: Buffer): T {
    this.decrypt(response);
    const [js_len] = struct('<I').unpack_from(response, 0xa);
    return this.mapToBoolean(JSON.parse(response.subarray(0xe, 0xe + js_len).toString()) as StateModelLb<number>) as T;
  }
}

export class Lb1 extends Lb<StateModelLb1> {
  TYPE = 'SmartBulb';

  protected mapToNumber(state: StateModelLb1): StateModelLb1<number> {
    return { ...super.mapToNumber(state), bulb_sceneidx: state.bulb_sceneidx };
  }

  protected mapToBoolean(state: StateModelLb1<number>): StateModelLb1 {
    return { ...super.mapToBoolean(state), bulb_sceneidx: state.bulb_sceneidx };
  }

  protected encode(flag: number, state: StateModelLb1): Buffer {
    const data = JSON.stringify(this.mapToNumber(state));
    const p_len = 12 + data.length;
    const packet = Buffer.concat([
      struct('<HHHHBBI').pack_into(Buffer.alloc(14), 0, p_len, 0xa5a5, 0x5a5a, 0, flag, 0x0b, data.length),
      Buffer.from(data),
    ]);
    const checksum = packet.subarray(0x02).reduce((acc, b) => (acc + b) & 0xffff, 0xbeaf);
    packet[0x06] = checksum & 0xff;
    packet[0x07] = (checksum >> 8) & 0xff;
    return packet;
  }
}

export class Lb2 extends Lb<StateModelLb> {
  TYPE = 'LB2';
  protected encode(flag: number, state: StateModelLb): Buffer {
    const data = JSON.stringify(this.mapToNumber(state));
    const packet = Buffer.concat([
      struct('<HHHBBI').pack_into(Buffer.alloc(12), 0, 0xa5a5, 0x5a5a, 0, flag, 0x0b, data.length),
      Buffer.from(data),
    ]);
    const checksum = packet.reduce((acc, b) => (acc + b) & 0xffff, 0xbeaf);
    packet[0x04] = checksum & 0xff;
    packet[0x05] = (checksum >> 8) & 0xff;
    return packet;
  }
}
