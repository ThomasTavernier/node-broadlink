import { create, spySendPacket } from './index.test';
import { S1C } from '../src/alarm';

describe('S1C', () => {
  const device = create(S1C);
  const spy = spySendPacket(device);

  it('getSensorsStatus', () => {
    void device.getSensorsStatus();
    expect(spy).toHaveBeenCalledWith(Buffer.from([6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]));
  });
});
