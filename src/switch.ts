import Device from './device';
import struct from './struct';

export class Sp1 extends Device {
  TYPE = 'SP1';

  public setPower(pwr: boolean): Promise<void> {
    const packet = Buffer.alloc(4);
    packet[0] = (pwr && 1) || 0;
    return this.sendPacket(packet).then();
  }
}

export class Sp2 extends Device {
  TYPE = 'SP2';

  public setPower(pwr: boolean): Promise<void> {
    const packet = Buffer.alloc(16);
    packet[0] = 2;
    packet[4] = (pwr && 1) || 0;
    return this.sendPacket(packet).then();
  }

  public checkPower(): Promise<boolean> {
    const packet = Buffer.alloc(16);
    packet[0] = 1;
    return this.sendPacket(packet).then((response) => {
      return !!this.decrypt(response)[0x4];
    });
  }
}

export class Sp2s extends Sp2 {
  TYPE = 'SP2S';

  public getEnergy(): Promise<number> {
    const packet = Buffer.alloc(16);
    packet[0] = 4;
    return this.sendPacketAndDecrypt(packet).then((payload) => payload.subarray(0x4, 0x7).readInt8() / 1000);
  }
}

export class Sp3 extends Device {
  TYPE = 'SP3';

  public setPower(pwr: boolean): Promise<void> {
    return this.checkNightlight().then((bool) => {
      const packet = Buffer.alloc(16);
      packet[0] = 2;
      packet[4] = (((bool && 1) || 0) << 1) | ((pwr && 1) || 0);
      return this.sendPacket(packet).then();
    });
  }

  public setNightlight(ntlight: boolean): Promise<void> {
    return this.checkPower().then((bool) => {
      const packet = Buffer.alloc(16);
      packet[0] = 2;
      packet[4] = (((ntlight && 1) || 0) << 1) | ((bool && 1) || 0);
      return this.sendPacket(packet).then();
    });
  }

  public checkPower(): Promise<boolean> {
    const packet = Buffer.alloc(16);
    packet[0] = 1;
    return this.sendPacket(packet).then((response) => {
      const payload = this.decrypt(response);
      return !!(payload[0x4] & 2);
    });
  }

  public checkNightlight(): Promise<boolean> {
    const packet = Buffer.alloc(16);
    packet[0] = 1;
    return this.sendPacket(packet).then((response) => {
      const payload = this.decrypt(response);
      return !!(payload[0x4] & 1);
    });
  }
}

export class Sp3s extends Sp2 {
  TYPE = 'SP3S';

  public getEnergy(): Promise<number> {
    return this.sendPacketAndDecrypt(Buffer.of(8, 0, 254, 1, 5, 1, 0, 0, 0, 45)).then(
      (payload) => payload.subarray(0x7a, 0x4).readInt8() / 100,
    );
  }
}

interface Sp4State<T = boolean> {
  pwr: T;
  ntlight: T;
  indicator: T;
  ntlbrightness: number;
  maxworktime: number;
  childlock: T;
}

export class Sp4 extends Device {
  TYPE = 'SP4';

  public setPower(pwr: boolean): Promise<void> {
    return this.setState({ pwr }).then();
  }

  public setNightlight(ntlight: boolean): Promise<void> {
    return this.setState({ ntlight }).then();
  }

  public setState(state: Partial<Sp4State>): Promise<Sp4State> {
    return this.sendPacket(this.encode(2, state)).then((payload) => this.decode(payload));
  }

  public checkPower(): Promise<boolean> {
    return this.getState().then(({ pwr }) => pwr);
  }

  public checkNightlight(): Promise<boolean> {
    return this.getState().then(({ ntlight }) => ntlight);
  }

  public getState(): Promise<Sp4State> {
    return this.sendPacketAndDecrypt(this.encode(1, {})).then((payload) => this.decode(payload));
  }

  protected encode(flag: number, state: Partial<Sp4State>): Buffer {
    const data = JSON.stringify(this.getValue(state, Number));
    const packet = Buffer.concat([
      struct('<HHHBBI').pack_into(Buffer.alloc(12), 0, 0xa5a5, 0x5a5a, 0x0000, flag, 0x0b, data.length),
      Buffer.from(data),
    ]);
    const checksum = packet.reduce((acc, v) => acc + v, 0xbeaf) & 0xffff;
    packet[0x04] = checksum & 0xff;
    packet[0x05] = (checksum >> 8) & 0xff;
    return packet;
  }

  protected getValue<I extends number | boolean, O extends number | boolean>(
    state: Partial<Sp4State<I>>,
    Number: (value: I) => O,
  ): Partial<Sp4State<O>> {
    return {
      pwr: state.pwr !== undefined ? Number(state.pwr) : undefined,
      ntlight: state.ntlight !== undefined ? Number(state.ntlight) : undefined,
      indicator: state.indicator !== undefined ? Number(state.indicator) : undefined,
      ntlbrightness: state.ntlbrightness,
      maxworktime: state.maxworktime,
      childlock: state.childlock !== undefined ? Number(state.childlock) : undefined,
    };
  }

  protected decode(payload: Buffer): Sp4State {
    return this.getValue(
      JSON.parse(
        payload.subarray(0x0c, 0x0c + struct('<I').unpack_from(payload, 0x08)[0]).toString(),
      ) as Sp4State<number>,
      Boolean,
    ) as Sp4State;
  }
}
export class Sp4b extends Sp4 {
  TYPE = 'SP4B';

  protected encode(flag: number, state: Sp4State): Buffer {
    const data = JSON.stringify(this.getValue(state, Number));
    const packet = Buffer.concat([
      struct('<HHHHBBI').pack_into(
        Buffer.alloc(14),
        0,
        12 + data.length,
        0xa5a5,
        0x5a5a,
        0x0000,
        flag,
        0x0b,
        data.length,
      ),
      Buffer.from(data),
    ]);
    const checksum = packet.subarray(0x02).reduce((acc, b) => acc + b, 0xbeaf) & 0xffff;
    packet[0x06] = checksum & 0xff;
    packet[0x07] = (checksum >> 8) & 0xff;
    return packet;
  }

  protected decode(payload: Buffer): Sp4State {
    const data = this.getValue(
      JSON.parse(payload.subarray(0x0c, 0x0c + struct('<I').unpack_from(payload, 0x08)[0]).toString()) as Sp4State,
      Boolean,
    ) as Sp4State;
    return {
      ...data,
      ntlbrightness: data.ntlbrightness !== undefined ? data.ntlbrightness / 1000 : undefined,
      maxworktime: data.maxworktime !== undefined ? data.maxworktime / 1000 : undefined,
    } as Sp4State;
  }
}

interface Bg1State<T = boolean> {
  pwr: T;
  pwr1: T;
  pwr2: T;
  maxworktime: number;
  maxworktime1: number;
  maxworktime2: number;
  idcbrightness: number;
}

export class Bg1 extends Device {
  TYPE = 'BG1';

  protected getValue<I extends number | boolean, O extends number | boolean>(
    state: Partial<Bg1State<I>>,
    Number: (value: I) => O,
  ): Partial<Bg1State<O>> {
    return {
      pwr: state.pwr !== undefined ? Number(state.pwr) : undefined,
      pwr1: state.pwr1 !== undefined ? Number(state.pwr1) : undefined,
      pwr2: state.pwr2 !== undefined ? Number(state.pwr2) : undefined,
      maxworktime: state.maxworktime,
      maxworktime1: state.maxworktime1,
      maxworktime2: state.maxworktime2,
      idcbrightness: state.idcbrightness,
    };
  }

  public getState(): Promise<Bg1State> {
    return new Promise((resolve, reject) => {
      this.sendPacket(this.encode(1, {}))
        .then((response) => {
          resolve(this.decode(response));
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  public setState(state: Bg1State): Promise<Bg1State> {
    return new Promise((resolve, reject) => {
      this.sendPacket(this.encode(2, state))
        .then((response) => {
          resolve(this.decode(this.decrypt(response)));
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  private encode(flag: number, state: Partial<Bg1State>): Buffer {
    const data = JSON.stringify(this.getValue(state, Number));
    const packet = Buffer.concat([
      Buffer.from(
        struct('<HHHHBBI').pack_into(
          Buffer.alloc(14),
          0,
          12 + data.length,
          0xa5a5,
          0x5a5a,
          0x0000,
          flag,
          0x0b,
          data.length,
        ),
      ),
      Buffer.from(data),
    ]);
    const checksum = packet.subarray(0x2).reduce((acc, b) => acc + b, 0xbeaf) & 0xffff;
    packet[0x06] = checksum & 0xff;
    packet[0x07] = (checksum >> 8) & 0xff;
    return packet;
  }

  private decode(payload: Buffer): Bg1State {
    return this.getValue(
      JSON.parse(
        payload.subarray(0x0e, 0x0e + struct('<I').unpack_from(payload, 0x0a)[0]).toString(),
      ) as Bg1State<number>,
      Boolean,
    ) as Bg1State;
  }
}

export class Mp1 extends Device {
  TYPE = 'MP1';

  private setPowerMask(sidMask: number, state?: number): Promise<void> {
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
    return this.sendPacket(packet).then();
  }

  public setPower(sid: number, state?: boolean): Promise<void> {
    return this.setPowerMask(0x01 << (sid - 1), Number(state)).then();
  }

  private checkPowerRaw(): Promise<number> {
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

      this.sendPacket(packet)
        .then((response) => {
          const payload = this.decrypt(response);
          resolve(payload[0x0e]);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  public checkPower(): Promise<{
    s1: boolean;
    s2: boolean;
    s3: boolean;
    s4: boolean;
  }> {
    return this.checkPowerRaw().then((state) => {
      return {
        s1: !!(state & 0x01),
        s2: !!(state & 0x02),
        s3: !!(state & 0x04),
        s4: !!(state & 0x08),
      };
    });
  }
}
