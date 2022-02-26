import Device from './device';

interface Sensor {
  status: number;
  name: string;
  type: string;
  order: number;
  serial: string;
}
export class S1C extends Device {
  TYPE = 'S1C';

  private readonly S1C_SENSORS_TYPES: Record<number, string> = {
    0x31: 'Door Sensor',
    0x91: 'Key Fob',
    0x21: 'Motion Sensor',
  };

  public getSensorsStatus(): Promise<{
    count: number;
    sensors: Sensor[];
  }> {
    return new Promise((resolve, reject) => {
      const packet = Buffer.alloc(16);
      packet[0] = 0x06;
      this.sendPacketAndDecrypt(packet)
        .then((response) => {
          const payload = this.decrypt(response);
          const count = payload[0x4];
          const sensors = payload.subarray(0x6);
          const sensorsA = [...Array(Math.floor(sensors.length / 83)).keys()].map((i) =>
            sensors.subarray(i * 83, (i + 1) * 83),
          );
          resolve({
            count,
            sensors: sensorsA.reduce((acc: Sensor[], sensor) => {
              const serial = sensor.subarray(26, 30).toString('hex');
              if (serial !== '00000000') {
                acc.push({
                  status: sensor[0],
                  name: response.subarray(4, 26).toString().trim(),
                  type: this.S1C_SENSORS_TYPES[sensor[3]] || 'Unknown',
                  order: sensor[1],
                  serial,
                });
              }
              return acc;
            }, []),
          });
        })
        .catch(reject);
    });
  }
}
