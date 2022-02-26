import Device from '../src/device';
import { create, spySendPacket } from './index.test';

describe('device', () => {
  const device = create(Device);
  const spy = spySendPacket(device);
  it('auth', () => {
    void device.auth();
    expect(spy).toHaveBeenCalledWith(
      Buffer.from([
        0, 0, 0, 0, 49, 49, 49, 49, 49, 49, 49, 49, 49, 49, 49, 49, 49, 49, 49, 49, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 84, 101, 115, 116, 32, 49, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      ]),
      0x65,
    );
  });
});
