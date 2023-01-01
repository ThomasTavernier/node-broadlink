import { RemoteInfo, Socket } from 'dgram';
import Device from '../src/device';
import * as index from '../src';
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

jest.mock('../src', (): typeof index => ({
  ...jest.requireActual('../src'),
  getNetworkInterfaces: () => [{ address: '192.0.2.42', broadcastAddress: '192.0.2.42' }],
}));

jest.mock('dgram', () => ({
  createSocket: (): Socket => {
    const socket = {
      bind: () => socket,
      once: (_, __) => {},
      setBroadcast: (_) => {},
      send: (_) => {},
      close: () => {},
      on(event, callback) {
        if (event === 'message') {
          callback(
            Buffer.from(
              '0000000000000000000000007b0027061605050b00000000c0a86c2c10a10000d3a20000000007000000000000000000308875207975776ca8c042902db7df24546573742d4465766963652d5350342d4e616d653100000000000000000000000000000000000000000000000000000000000000000000000000000000000200',
              'hex',
            ),
            {
              address: '192.168.108.101',
              family: 'IPv4',
              port: 80,
              size: 128,
            },
          );
        }
      },
    } as Socket;

    return socket;
  },
}));

describe('index', () => {
  describe('discover', () => {
    it('finds correct device', async () => {
      expect(await index.discover()).toEqual([
        expect.objectContaining({
          TYPE: 'SP4',
          isLocked: false,
          name: 'Test-Device-SP4-Name1',
        }),
      ]);
    });
  });
});
