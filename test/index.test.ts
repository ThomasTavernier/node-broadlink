import { RemoteInfo } from 'dgram';
import Device from '../src/device';
import SpyInstance = jest.SpyInstance;

export const create = <T>(clazz: { new (host: RemoteInfo, mac: number[]): T }): T =>
  new clazz(
    {
      address: '127.0.0.1',
      port: 123,
    } as RemoteInfo,
    [0xc6, 0x4e, 0x3e, 0x09, 0xa0, 0x21],
  );

export const spySendPacket = (device: Device): SpyInstance => {
  const spy = jest.spyOn(device as any, 'sendPacket');
  beforeEach(() => {
    spy.mockClear();
  });
  return spy;
};

test.todo('');
