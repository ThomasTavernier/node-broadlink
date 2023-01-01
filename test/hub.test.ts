import { create, spySendPacket } from './index.test';
import { S3 } from '../src/hub';

describe('S3', () => {
  const device = create(S3);
  const spy = spySendPacket(device);
  const data = { did: '00000000000000000000a043b0d06963', pwr1: true, pwr2: false, pwr3: true };
  it('can decode encoded', () => {
    expect(device['decode'](device['encode'](0, data))).toEqual(data);
  });
  it('getSubDevices', async () => {
    spy.mockReturnValue(Promise.resolve());
    jest
      .spyOn(device as any, 'decrypt')
      .mockReturnValueOnce(
        device['encode'](14, {
          list: ['1', '2', '3', '4', '5'],
          total: 6,
        } as never),
      )
      .mockReturnValueOnce(
        device['encode'](14, {
          list: ['6'],
          total: 6,
        } as never),
      );
    const subDevices = await device.getSubDevices();
    expect(spy).toHaveBeenNthCalledWith(
      1,
      Buffer.from([
        165, 165, 90, 90, 161, 199, 14, 11, 21, 0, 0, 0, 123, 34, 99, 111, 117, 110, 116, 34, 58, 53, 44, 34, 105, 110,
        100, 101, 120, 34, 58, 48, 125,
      ]),
    );
    expect(spy).toHaveBeenNthCalledWith(
      2,
      Buffer.from([
        165, 165, 90, 90, 166, 199, 14, 11, 21, 0, 0, 0, 123, 34, 99, 111, 117, 110, 116, 34, 58, 53, 44, 34, 105, 110,
        100, 101, 120, 34, 58, 53, 125,
      ]),
    );
    expect(subDevices).toEqual(['1', '2', '3', '4', '5', '6']);
  });
  it('getState', () => {
    void device.getState('00000000000000000000a043b0d06963');
    expect(spy).toHaveBeenCalledWith(
      Buffer.from([
        165, 165, 90, 90, 132, 202, 1, 11, 42, 0, 0, 0, 123, 34, 100, 105, 100, 34, 58, 34, 48, 48, 48, 48, 48, 48, 48,
        48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 97, 48, 52, 51, 98, 48, 100, 48, 54, 57, 54, 51, 34, 125,
      ]),
    );
  });
  it('setState', () => {
    void device.setState(data);
    expect(spy).toHaveBeenCalledWith(
      Buffer.from([
        165, 165, 90, 90, 209, 209, 2, 11, 69, 0, 0, 0, 123, 34, 100, 105, 100, 34, 58, 34, 48, 48, 48, 48, 48, 48, 48,
        48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 97, 48, 52, 51, 98, 48, 100, 48, 54, 57, 54, 51, 34, 44, 34,
        112, 119, 114, 49, 34, 58, 49, 44, 34, 112, 119, 114, 50, 34, 58, 48, 44, 34, 112, 119, 114, 51, 34, 58, 49,
        125,
      ]),
    );
  });
});
