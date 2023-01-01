import Device from './device';
import struct from './struct';

interface StateModelS3<T = boolean> {
  did: string;
  pwr1: T;
  pwr2: T;
  pwr3: T;
}

export class S3 extends Device {
  TYPE = 'S3';
  private step = 5;
  private *range(): Generator<number> {
    yield 0;
    yield this.step;
    yield 8;
  }
  public getSubDevices(): Promise<string[]> {
    return this.getSubDevicesRecursive([], this.range());
  }

  private getSubDevicesRecursive(acc: string[], rangeIterator: Generator<number>): Promise<string[]> {
    const { value: index, done } = rangeIterator.next() as unknown as { value: number; done: boolean };
    return this.sendPacketAndDecrypt(
      this.encode(14, {
        count: this.step,
        index,
      } as never),
    )
      .then((data) => this.decode(data) as unknown as { list: string[]; total: number })
      .then((state) => {
        acc.push(...state.list);
        if (acc.length === state.total || done) {
          return acc;
        }
        return this.getSubDevicesRecursive(acc, rangeIterator);
      });
  }

  public getState(did?: string): Promise<StateModelS3> {
    return this.sendPacketAndDecrypt(this.encode(1, { did } as StateModelS3)).then((data) => {
      return this.decode(data);
    });
  }

  public setState(state: StateModelS3): Promise<StateModelS3> {
    return this.sendPacketAndDecrypt(this.encode(2, state)).then((response) => this.decode(response));
  }

  private encode(flag: number, state: StateModelS3): Buffer {
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

  private decode(response: Buffer): StateModelS3 {
    const [js_len] = struct('<I').unpack_from(response, 0x08);
    return this.mapToBoolean(JSON.parse(response.subarray(0x0c, 0x0c + js_len).toString()) as StateModelS3<number>);
  }

  private mapToNumber(state: StateModelS3): StateModelS3<number> {
    return {
      ...state,
      pwr1: state.pwr1 !== undefined ? Number(state.pwr1) : undefined,
      pwr2: state.pwr2 !== undefined ? Number(state.pwr2) : undefined,
      pwr3: state.pwr3 !== undefined ? Number(state.pwr3) : undefined,
    } as StateModelS3<number>;
  }

  private mapToBoolean(state: StateModelS3<number>): StateModelS3 {
    return {
      ...state,
      pwr1: state.pwr1 !== undefined ? Boolean(state.pwr1) : undefined,
      pwr2: state.pwr2 !== undefined ? Boolean(state.pwr2) : undefined,
      pwr3: state.pwr3 !== undefined ? Boolean(state.pwr3) : undefined,
    } as StateModelS3;
  }
}
