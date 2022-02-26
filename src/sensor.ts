import Device from './device';
import struct from './struct';

export class A1 extends Device {
  TYPE = 'A1';

  public checkSensors(): Promise<{
    temperature: number;
    humidity: number;
    light: string;
    air_quality: string;
    noise: string;
  }> {
    return this.checkSensorsRaw().then((state) => {
      return {
        ...state,
        light: ['dark', 'dim', 'normal', 'bright'][state.light] || 'unknown',
        air_quality: ['excellent', 'good', 'normal', 'bad'][state.air_quality] || 'unknown',
        noise: ['quiet', 'normal', 'noisy'][state.noise] || 'unknown',
      };
    });
  }

  private checkSensorsRaw(): Promise<{
    temperature: number;
    humidity: number;
    light: number;
    air_quality: number;
    noise: number;
  }> {
    return new Promise((resolve, reject) => {
      this.sendPacket(Buffer.of(0x1))
        .then((response) => {
          const payload = this.decrypt(response);
          const data = payload.subarray(0x4);
          const temperatureBuffer = struct('<bb').unpack(data.subarray(0x0, 0x2));
          resolve({
            temperature: temperatureBuffer[0x0] + temperatureBuffer[0x1] / 10.0,
            humidity: data[0x2] + data[0x3] / 10.0,
            light: data[0x4],
            air_quality: data[0x6],
            noise: data[0x8],
          });
        })
        .catch((err) => {
          reject(err);
        });
    });
  }
}
