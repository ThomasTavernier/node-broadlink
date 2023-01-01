import { create, spySendPacket } from './index.test';
import { Lb1, Lb2 } from '../src/light';

describe('Lb1', () => {
  const device = create(Lb1);
  const spy = spySendPacket(device);
  const data = {
    pwr: true,
    red: 235,
    blue: 123,
    green: 38,
    brightness: 45,
    colortemp: 38,
    hue: 8,
    saturation: 35,
    transitionduration: 5,
    maxworktime: 9,
    bulb_colormode: 4,
    bulb_scenes: 'a',
    bulb_scene: 'b',
    bulb_sceneidx: 1,
  };
  it('can decode encoded', () => {
    expect(device['decode'](device['encode'](0, data))).toEqual(data);
  });
  it('getState', () => {
    void device.getState();
    expect(spy).toHaveBeenCalledWith(Buffer.from([14, 0, 165, 165, 90, 90, 179, 193, 1, 11, 2, 0, 0, 0, 123, 125]));
  });
  it('setState', () => {
    void device.setState(data);
    expect(spy).toHaveBeenCalledWith(
      Buffer.from([
        219, 0, 165, 165, 90, 90, 5, 5, 2, 11, 207, 0, 0, 0, 123, 34, 112, 119, 114, 34, 58, 49, 44, 34, 114, 101, 100,
        34, 58, 50, 51, 53, 44, 34, 98, 108, 117, 101, 34, 58, 49, 50, 51, 44, 34, 103, 114, 101, 101, 110, 34, 58, 51,
        56, 44, 34, 98, 114, 105, 103, 104, 116, 110, 101, 115, 115, 34, 58, 52, 53, 44, 34, 99, 111, 108, 111, 114,
        116, 101, 109, 112, 34, 58, 51, 56, 44, 34, 104, 117, 101, 34, 58, 56, 44, 34, 115, 97, 116, 117, 114, 97, 116,
        105, 111, 110, 34, 58, 51, 53, 44, 34, 116, 114, 97, 110, 115, 105, 116, 105, 111, 110, 100, 117, 114, 97, 116,
        105, 111, 110, 34, 58, 53, 44, 34, 109, 97, 120, 119, 111, 114, 107, 116, 105, 109, 101, 34, 58, 57, 44, 34, 98,
        117, 108, 98, 95, 99, 111, 108, 111, 114, 109, 111, 100, 101, 34, 58, 52, 44, 34, 98, 117, 108, 98, 95, 115, 99,
        101, 110, 101, 115, 34, 58, 34, 97, 34, 44, 34, 98, 117, 108, 98, 95, 115, 99, 101, 110, 101, 34, 58, 34, 98,
        34, 44, 34, 98, 117, 108, 98, 95, 115, 99, 101, 110, 101, 105, 100, 120, 34, 58, 49, 125,
      ]),
    );
  });
});

describe('Lb2', () => {
  const device = create(Lb2);
  const spy = spySendPacket(device);
  const data = {
    pwr: true,
    red: 235,
    blue: 123,
    green: 38,
    brightness: 45,
    colortemp: 38,
    hue: 8,
    saturation: 35,
    transitionduration: 5,
    maxworktime: 9,
    bulb_colormode: 4,
    bulb_scenes: 'a',
    bulb_scene: 'b',
  };
  it('can decode encoded', () => {
    expect(device['decode'](device['encode'](0, data))).toEqual(data);
  });
  it('getState', () => {
    void device.getState();
    expect(spy).toHaveBeenCalledWith(Buffer.from([165, 165, 90, 90, 179, 193, 1, 11, 2, 0, 0, 0, 123, 125]));
  });
  it('setState', () => {
    void device.setState(data);
    expect(spy).toHaveBeenCalledWith(
      Buffer.from([
        165, 165, 90, 90, 193, 254, 2, 11, 189, 0, 0, 0, 123, 34, 112, 119, 114, 34, 58, 49, 44, 34, 114, 101, 100, 34,
        58, 50, 51, 53, 44, 34, 98, 108, 117, 101, 34, 58, 49, 50, 51, 44, 34, 103, 114, 101, 101, 110, 34, 58, 51, 56,
        44, 34, 98, 114, 105, 103, 104, 116, 110, 101, 115, 115, 34, 58, 52, 53, 44, 34, 99, 111, 108, 111, 114, 116,
        101, 109, 112, 34, 58, 51, 56, 44, 34, 104, 117, 101, 34, 58, 56, 44, 34, 115, 97, 116, 117, 114, 97, 116, 105,
        111, 110, 34, 58, 51, 53, 44, 34, 116, 114, 97, 110, 115, 105, 116, 105, 111, 110, 100, 117, 114, 97, 116, 105,
        111, 110, 34, 58, 53, 44, 34, 109, 97, 120, 119, 111, 114, 107, 116, 105, 109, 101, 34, 58, 57, 44, 34, 98, 117,
        108, 98, 95, 99, 111, 108, 111, 114, 109, 111, 100, 101, 34, 58, 52, 44, 34, 98, 117, 108, 98, 95, 115, 99, 101,
        110, 101, 115, 34, 58, 34, 97, 34, 44, 34, 98, 117, 108, 98, 95, 115, 99, 101, 110, 101, 34, 58, 34, 98, 34,
        125,
      ]),
    );
  });
});
