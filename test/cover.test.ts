import { create, spySendPacket } from './index.test';
import { Dooya } from '../src/cover';

describe('Dooya', () => {
  const device = create(Dooya);
  const spy = spySendPacket(device);
  it('open', () => {
    void device.open();
    expect(spy).toHaveBeenCalledWith(Buffer.from([9, 0, 187, 1, 0, 0, 0, 0, 0, 250, 68, 0, 0, 0, 0, 0]));
  });
  it('close', () => {
    void device.close();
    expect(spy).toHaveBeenCalledWith(Buffer.from([9, 0, 187, 2, 0, 0, 0, 0, 0, 250, 68, 0, 0, 0, 0, 0]));
  });
  it('stop', () => {
    void device.stop();
    expect(spy).toHaveBeenCalledWith(Buffer.from([9, 0, 187, 3, 0, 0, 0, 0, 0, 250, 68, 0, 0, 0, 0, 0]));
  });
  it('getPercentage', () => {
    void device.getPercentage();
    expect(spy).toHaveBeenCalledWith(Buffer.from([9, 0, 187, 6, 93, 0, 0, 0, 0, 250, 68, 0, 0, 0, 0, 0]));
  });
});
