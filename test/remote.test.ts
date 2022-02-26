import { Rm4mini, Rm4pro, Rmmini, Rmminib, Rmpro } from '../src/remote';
import { create, spySendPacket } from './index.test';

const testRmmini = (device: Rmmini, spy: jest.SpyInstance): void => {
  it('enterLearning', () => {
    void device.enterLearning();
    expect(spy).toHaveBeenCalledWith(Buffer.from([3, 0, 0, 0]));
  });
  it('checkData', () => {
    void device.checkData();
    expect(spy).toHaveBeenCalledWith(Buffer.from([4, 0, 0, 0]));
  });
  it('sendData', () => {
    void device.sendData([
      74, 7, 212, 7, 17, 161, 184, 70, 118, 205, 218, 227, 204, 61, 238, 92, 21, 6, 6, 46, 99, 11, 204, 204, 203, 45,
      101, 37, 74, 70, 179, 76,
    ]);
    expect(spy).toHaveBeenCalledWith(
      Buffer.from([
        2, 0, 0, 0, 74, 7, 212, 7, 17, 161, 184, 70, 118, 205, 218, 227, 204, 61, 238, 92, 21, 6, 6, 46, 99, 11, 204,
        204, 203, 45, 101, 37, 74, 70, 179, 76,
      ]),
    );
  });
};

describe('Rmmini', () => {
  const device = create(Rmmini);
  const spy = spySendPacket(device);
  testRmmini(device, spy);
});

describe('Rmpro', () => {
  const device = create(Rmpro);
  const spy = spySendPacket(device);
  testRmmini(device, spy);
  it('sweepFrequency', () => {
    void device.sweepFrequency();
    expect(spy).toHaveBeenCalledWith(Buffer.from([25, 0, 0, 0]));
  });
  it('cancelSweepFrequency', () => {
    void device.cancelSweepFrequency();
    expect(spy).toHaveBeenCalledWith(Buffer.from([30, 0, 0, 0]));
  });
  it('checkFrequency', () => {
    void device.checkFrequency();
    expect(spy).toHaveBeenCalledWith(Buffer.from([26, 0, 0, 0]));
  });
  it('findRfPacket', () => {
    void device.findRfPacket();
    expect(spy).toHaveBeenCalledWith(Buffer.from([27, 0, 0, 0]));
  });
  it('readSensor', () => {
    void device.readSensor();
    expect(spy).toHaveBeenCalledWith(Buffer.from([1, 0, 0, 0]));
  });
});

const testRmminib = (device: Rmminib, spy: jest.SpyInstance): void => {
  it('enterLearning', () => {
    void device.enterLearning();
    expect(spy).toHaveBeenCalledWith(Buffer.from([4, 0, 3, 0, 0, 0]));
  });
  it('checkData', () => {
    void device.checkData();
    expect(spy).toHaveBeenCalledWith(Buffer.from([4, 0, 4, 0, 0, 0]));
  });
  it('sendData', () => {
    void device.sendData([
      74, 7, 212, 7, 17, 161, 184, 70, 118, 205, 218, 227, 204, 61, 238, 92, 21, 6, 6, 46, 99, 11, 204, 204, 203, 45,
      101, 37, 74, 70, 179, 76,
    ]);
    expect(spy).toHaveBeenCalledWith(
      Buffer.from([
        36, 0, 2, 0, 0, 0, 74, 7, 212, 7, 17, 161, 184, 70, 118, 205, 218, 227, 204, 61, 238, 92, 21, 6, 6, 46, 99, 11,
        204, 204, 203, 45, 101, 37, 74, 70, 179, 76,
      ]),
    );
  });
};

describe('Rmminib', () => {
  const device = create(Rmminib);
  const spy = spySendPacket(device);
  testRmminib(device, spy);
});

const testRm4mini = (device: Rm4mini, spy: jest.SpyInstance): void => {
  testRmminib(device, spy);
  it('checkSensors', () => {
    void device.checkSensors();
    expect(spy).toHaveBeenCalledWith(Buffer.from([4, 0, 36, 0, 0, 0]));
  });
};

describe('Rm4mini', () => {
  const device = create(Rm4mini);
  const spy = spySendPacket(device);
  testRm4mini(device, spy);
});

describe('Rm4pro', () => {
  const device = create(Rm4pro);
  const spy = spySendPacket(device);
  testRm4mini(device, spy);
  it('sweepFrequency', () => {
    void device.sweepFrequency();
    expect(spy).toHaveBeenCalledWith(Buffer.from([4, 0, 25, 0, 0, 0]));
  });
  it('cancelSweepFrequency', () => {
    void device.cancelSweepFrequency();
    expect(spy).toHaveBeenCalledWith(Buffer.from([4, 0, 30, 0, 0, 0]));
  });
  it('checkFrequency', () => {
    void device.checkFrequency();
    expect(spy).toHaveBeenCalledWith(Buffer.from([4, 0, 26, 0, 0, 0]));
  });
  it('findRfPacket', () => {
    void device.findRfPacket();
    expect(spy).toHaveBeenCalledWith(Buffer.from([4, 0, 27, 0, 0, 0]));
  });
});
