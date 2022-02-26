import { create, spySendPacket } from './index.test';
import { A1 } from '../src/sensor';
import { Bg1, Mp1, Sp1, Sp2, Sp2s, Sp3, Sp3s, Sp4, Sp4b } from '../src/switch';
import SpyInstance = jest.SpyInstance;

describe('Sp1', () => {
  const device = create(Sp1);
  const spy = spySendPacket(device);
  it('setPower', () => {
    void device.setPower(true);
    expect(spy).toHaveBeenCalledWith(Buffer.from([1, 0, 0, 0]));
  });
});

const testSp2 = (device: Sp2, spy: SpyInstance): void => {
  it('setPower', () => {
    void device.setPower(true);
    expect(spy).toHaveBeenCalledWith(Buffer.from([2, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]));
  });
  it('checkPower', () => {
    void device.checkPower();
    expect(spy).toHaveBeenCalledWith(Buffer.from([1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]));
  });
};

describe('Sp2', () => {
  const device = create(Sp2);
  const spy = spySendPacket(device);
  testSp2(device, spy);
});

describe('Sp2s', () => {
  const device = create(Sp2s);
  const spy = spySendPacket(device);
  testSp2(device, spy);
  it('checkPower', () => {
    void device.getEnergy();
    expect(spy).toHaveBeenCalledWith(Buffer.from([4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]));
  });
});

describe('Sp3', () => {
  const device = create(Sp3);
  const spy = spySendPacket(device);
  it('checkPower', () => {
    void device.checkPower();
    expect(spy).toHaveBeenCalledWith(Buffer.from([1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]));
  });
  it('checkNightlight', () => {
    void device.checkNightlight();
    expect(spy).toHaveBeenCalledWith(Buffer.from([1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]));
  });
});

describe('Sp3s', () => {
  const device = create(Sp3s);
  const spy = spySendPacket(device);
  testSp2(device, spy);
  it('getEnergy', () => {
    void device.getEnergy();
    expect(spy).toHaveBeenCalledWith(Buffer.from([8, 0, 254, 1, 5, 1, 0, 0, 0, 45]));
  });
});

describe('Sp4', () => {
  const device = create(Sp4);
  const spy = spySendPacket(device);
  it('setPower', () => {
    void device.setPower(true);
    expect(spy).toHaveBeenCalledWith(
      Buffer.from([165, 165, 90, 90, 195, 195, 2, 11, 9, 0, 0, 0, 123, 34, 112, 119, 114, 34, 58, 49, 125]),
    );
  });
  it('setNightlight', () => {
    void device.setNightlight(true);
    expect(spy).toHaveBeenCalledWith(
      Buffer.from([
        165, 165, 90, 90, 104, 197, 2, 11, 13, 0, 0, 0, 123, 34, 110, 116, 108, 105, 103, 104, 116, 34, 58, 49, 125,
      ]),
    );
  });
  it('setState', () => {
    void device.setState({
      pwr: false,
      ntlight: false,
      indicator: true,
      ntlbrightness: 3,
      maxworktime: 5,
      childlock: false,
    });
    expect(spy).toHaveBeenCalledWith(
      Buffer.from([
        165, 165, 90, 90, 250, 220, 2, 11, 83, 0, 0, 0, 123, 34, 112, 119, 114, 34, 58, 48, 44, 34, 110, 116, 108, 105,
        103, 104, 116, 34, 58, 48, 44, 34, 105, 110, 100, 105, 99, 97, 116, 111, 114, 34, 58, 49, 44, 34, 110, 116, 108,
        98, 114, 105, 103, 104, 116, 110, 101, 115, 115, 34, 58, 51, 44, 34, 109, 97, 120, 119, 111, 114, 107, 116, 105,
        109, 101, 34, 58, 53, 44, 34, 99, 104, 105, 108, 100, 108, 111, 99, 107, 34, 58, 48, 125,
      ]),
    );
  });
  it('getState', () => {
    void device.getState();
    expect(spy).toHaveBeenCalledWith(Buffer.from([165, 165, 90, 90, 179, 193, 1, 11, 2, 0, 0, 0, 123, 125]));
  });
});

describe('Sp4b', () => {
  const device = create(Sp4b);
  const spy = spySendPacket(device);
  it('setPower', () => {
    void device.setPower(true);
    expect(spy).toHaveBeenCalledWith(
      Buffer.from([21, 0, 165, 165, 90, 90, 195, 195, 2, 11, 9, 0, 0, 0, 123, 34, 112, 119, 114, 34, 58, 49, 125]),
    );
  });
  it('setNightlight', () => {
    void device.setNightlight(true);
    expect(spy).toHaveBeenCalledWith(
      Buffer.from([
        25, 0, 165, 165, 90, 90, 104, 197, 2, 11, 13, 0, 0, 0, 123, 34, 110, 116, 108, 105, 103, 104, 116, 34, 58, 49,
        125,
      ]),
    );
  });
  it('setState', () => {
    void device.setState({
      pwr: false,
      ntlight: false,
      indicator: true,
      ntlbrightness: 3,
      maxworktime: 5,
      childlock: false,
    });
    expect(spy).toHaveBeenCalledWith(
      Buffer.from([
        95, 0, 165, 165, 90, 90, 250, 220, 2, 11, 83, 0, 0, 0, 123, 34, 112, 119, 114, 34, 58, 48, 44, 34, 110, 116,
        108, 105, 103, 104, 116, 34, 58, 48, 44, 34, 105, 110, 100, 105, 99, 97, 116, 111, 114, 34, 58, 49, 44, 34, 110,
        116, 108, 98, 114, 105, 103, 104, 116, 110, 101, 115, 115, 34, 58, 51, 44, 34, 109, 97, 120, 119, 111, 114, 107,
        116, 105, 109, 101, 34, 58, 53, 44, 34, 99, 104, 105, 108, 100, 108, 111, 99, 107, 34, 58, 48, 125,
      ]),
    );
  });
  it('getState', () => {
    void device.getState();
    expect(spy).toHaveBeenCalledWith(Buffer.from([14, 0, 165, 165, 90, 90, 179, 193, 1, 11, 2, 0, 0, 0, 123, 125]));
  });
});

describe('Bg1', () => {
  const device = create(Bg1);
  const spy = spySendPacket(device);
  it('getState', () => {
    void device.getState();
    expect(spy).toHaveBeenCalledWith(Buffer.from([14, 0, 165, 165, 90, 90, 179, 193, 1, 11, 2, 0, 0, 0, 123, 125]));
  });
  it('setState', () => {
    void device.setState({
      pwr: true,
      pwr1: false,
      pwr2: false,
      maxworktime: 4,
      maxworktime1: 5,
      maxworktime2: 6,
      idcbrightness: 7,
    });
    expect(spy).toHaveBeenCalledWith(
      Buffer.from([
        107, 0, 165, 165, 90, 90, 84, 224, 2, 11, 95, 0, 0, 0, 123, 34, 112, 119, 114, 34, 58, 49, 44, 34, 112, 119,
        114, 49, 34, 58, 48, 44, 34, 112, 119, 114, 50, 34, 58, 48, 44, 34, 109, 97, 120, 119, 111, 114, 107, 116, 105,
        109, 101, 34, 58, 52, 44, 34, 109, 97, 120, 119, 111, 114, 107, 116, 105, 109, 101, 49, 34, 58, 53, 44, 34, 109,
        97, 120, 119, 111, 114, 107, 116, 105, 109, 101, 50, 34, 58, 54, 44, 34, 105, 100, 99, 98, 114, 105, 103, 104,
        116, 110, 101, 115, 115, 34, 58, 55, 125,
      ]),
    );
  });
});

describe('Mp1', () => {
  const device = create(Mp1);
  const spy = spySendPacket(device);
  it('checkPower', () => {
    void device.checkPower();
    expect(spy).toHaveBeenCalledWith(Buffer.from([10, 0, 165, 165, 90, 90, 174, 192, 1, 0, 0, 0, 0, 0, 0, 0]));
  });
  it('setPower', () => {
    void device.setPower(5, true);
    expect(spy).toHaveBeenCalledWith(Buffer.from([13, 0, 165, 165, 90, 90, 210, 192, 2, 0, 3, 0, 0, 16, 16, 0]));
  });
});
