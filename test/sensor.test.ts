import { create, spySendPacket } from './index.test';
import { A1 } from '../src/sensor';

describe('A1', () => {
  const device = create(A1);
  const spy = spySendPacket(device);
  it('open', () => {
    void device.checkSensors();
    expect(spy).toHaveBeenCalledWith(Buffer.from([1]));
  });
});
