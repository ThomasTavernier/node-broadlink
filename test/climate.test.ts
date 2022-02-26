import { create, spySendPacket } from './index.test';
import { Hysen } from '../src/climate';

describe('Hysen', () => {
  const device = create(Hysen);
  const spy = spySendPacket(device);
  it('getTemp', () => {
    void device.getTemp();
    expect(spy).toHaveBeenCalledWith(Buffer.from([8, 0, 1, 3, 0, 0, 0, 8, 68, 12]));
  });
  it('getExternalTemp', () => {
    void device.getExternalTemp();
    expect(spy).toHaveBeenCalledWith(Buffer.from([8, 0, 1, 3, 0, 0, 0, 8, 68, 12]));
  });
  it('getFullStatus', () => {
    void device.getFullStatus();
    expect(spy).toHaveBeenCalledWith(Buffer.from([8, 0, 1, 3, 0, 0, 0, 22, 196, 4]));
  });
  it('setMode', () => {
    void device.setMode(1, 2, 0);
    expect(spy).toHaveBeenCalledWith(Buffer.from([8, 0, 1, 6, 0, 2, 49, 0, 61, 154]));
  });
  it('setAdvanced', () => {
    void device.setAdvanced(1, 0, 42, 8, 95, 18, -0.5, 0, 1);
    expect(spy).toHaveBeenCalledWith(
      Buffer.from([19, 0, 1, 16, 0, 2, 0, 5, 10, 1, 0, 42, 8, 95, 18, 255, 251, 0, 1, 108, 209]),
    );
  });
  it('setTemp', () => {
    void device.setTemp(17.3);
    expect(spy).toHaveBeenCalledWith(Buffer.from([8, 0, 1, 6, 0, 1, 0, 34, 88, 19]));
  });
  it('setPower', () => {
    void device.setPower(1, 0);
    expect(spy).toHaveBeenCalledWith(Buffer.from([8, 0, 1, 6, 0, 0, 0, 1, 72, 10]));
  });
  it('setTime', () => {
    void device.setTime(11, 55, 37, 7);
    expect(spy).toHaveBeenCalledWith(Buffer.from([13, 0, 1, 16, 0, 8, 0, 2, 4, 11, 55, 37, 7, 26, 177]));
  });
  it('setSchedule', () => {
    void device.setSchedule(
      [
        { startHour: 11, startMinute: 30, temp: 22 },
        { startHour: 12, startMinute: 25, temp: 24 },
        { startHour: 13, startMinute: 20, temp: 26 },
        { startHour: 14, startMinute: 15, temp: 28 },
        { startHour: 15, startMinute: 10, temp: 30 },
        { startHour: 16, startMinute: 5, temp: 32 },
      ],
      [
        { startHour: 10, startMinute: 0, temp: 20 },
        { startHour: 17, startMinute: 0, temp: 34 },
      ],
    );
    expect(spy).toHaveBeenCalledWith(
      Buffer.from([
        33, 0, 1, 16, 0, 10, 0, 12, 24, 11, 30, 12, 25, 13, 20, 14, 15, 15, 10, 16, 5, 10, 0, 17, 0, 44, 48, 52, 56, 60,
        64, 40, 68, 148, 102,
      ]),
    );
  });
});
