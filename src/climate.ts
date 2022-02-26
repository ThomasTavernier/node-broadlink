import Device from './device';

interface DayModel {
  startHour: number;
  startMinute: number;
  temp: number;
}

export class Hysen extends Device {
  protected TYPE = 'Hysen heating controller';

  private calculateCrc16(inputData: Buffer): number {
    const crc16Tab = [...Array(256).keys()].map((i) =>
      [...(Array(8) as undefined[])].reduce((crc) => (crc & 0x0001 ? (crc >> 1) ^ 0xa001 : crc >> 1), i),
    );
    return [...inputData].reduce((crcValue, c) => (crcValue >> 8) ^ crc16Tab[(crcValue ^ c) & 0x00ff], 0xffff);
  }

  private static toBytes2(value: number): Buffer {
    return Buffer.of(value & 0xff, (value >> 8) & 0xff);
  }

  private sendRequest(inputPayload: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      this.sendPacket(
        Buffer.concat([
          Hysen.toBytes2(inputPayload.length + 2),
          inputPayload,
          Hysen.toBytes2(this.calculateCrc16(inputPayload)),
        ]),
      )
        .then((response) => {
          const responsePayload = this.decrypt(response);
          const responsePayloadLength = responsePayload[0];
          try {
            if (responsePayloadLength + 2 > responsePayload.length) {
              throw new Error('hysenResponseError first byte of response is not length');
            } else {
              const nom_crc = response.subarray(0, 2).readInt8();
              const real_crc = this.calculateCrc16(responsePayload.subarray(2, responsePayloadLength));
              if (nom_crc !== real_crc) {
                resolve(responsePayload.subarray(2, responsePayloadLength));
              } else {
                throw new Error('hysenResponseError CRC check on response failed');
              }
            }
          } catch (err) {
            reject(err);
          }
        })
        .catch(reject);
    });
  }

  public getTemp(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.sendRequest(Buffer.of(0x01, 0x03, 0x00, 0x00, 0x00, 0x08))
        .then((payload) => {
          resolve(payload[0x05] / 2.0);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  public getExternalTemp(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.sendRequest(Buffer.of(0x01, 0x03, 0x00, 0x00, 0x00, 0x08))
        .then((payload) => {
          resolve(payload[18] / 2.0);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  public getFullStatus(): Promise<{
    remoteLock: number;
    power: number;
    active: number;
    tempManual: number;
    roomTemp: number;
    thermostatTemp: number;
    autoMode: number;
    loopMode: number;
    sensor: number;
    osv: number;
    dif: number;
    svh: number;
    svl: number;
    roomTempAdj: number;
    fre: number;
    poweron: number;
    unknown: number;
    externalTemp: number;
    hour: number;
    min: number;
    sec: number;
    dayofweek: number;
    weekDay: DayModel[];
    weekEnd: DayModel[];
  }> {
    return new Promise((resolve, reject) => {
      this.sendRequest(Buffer.of(0x01, 0x03, 0x00, 0x00, 0x00, 0x16))
        .then((payload) => {
          const week = [...Array(8).keys()].map((i) => {
            return {
              startHour: payload[2 * i + 23],
              startMinute: payload[2 * i + 24],
              temp: payload[i + 39] / 2.0,
            };
          });
          const roomTempAdj = ((payload[13] << 8) + payload[14]) / 2.0;
          resolve({
            remoteLock: payload[3] & 1,
            power: payload[4] & 1,
            active: (payload[4] >> 4) & 1,
            tempManual: (payload[4] >> 6) & 1,
            roomTemp: (payload[5] & 255) / 2.0,
            thermostatTemp: (payload[6] & 255) / 2.0,
            autoMode: payload[7] & 15,
            loopMode: (payload[7] >> 4) & 15,
            sensor: payload[8],
            osv: payload[9],
            dif: payload[10],
            svh: payload[11],
            svl: payload[12],
            roomTempAdj: roomTempAdj > 32767 ? 32767 - roomTempAdj : roomTempAdj,
            fre: payload[15],
            poweron: payload[16],
            unknown: payload[17],
            externalTemp: (payload[18] & 255) / 2.0,
            hour: payload[19],
            min: payload[20],
            sec: payload[21],
            dayofweek: payload[22],
            weekDay: week.slice(0, 6),
            weekEnd: week.slice(6),
          });
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  public setMode(autoMode: number, loopMode: number, sensor = 0): Promise<void> {
    return this.sendRequest(Buffer.of(0x01, 0x06, 0x00, 0x02, ((loopMode + 1) << 4) + autoMode, sensor)).then();
  }

  public setAdvanced(
    loopMode: number,
    sensor: number,
    osv: number,
    dif: number,
    svh: number,
    svl: number,
    adj: number,
    fre: number,
    powerOn: number,
  ): Promise<void> {
    return this.sendRequest(
      Buffer.of(
        0x01,
        0x10,
        0x00,
        0x02,
        0x00,
        0x05,
        0x0a,
        loopMode,
        sensor,
        osv,
        dif,
        svh,
        svl,
        ((adj * 10) >> 8) & 0xff,
        (adj * 10) & 0xff,
        fre,
        powerOn,
      ),
    ).then();
  }

  public setTemp(temp: number): Promise<void> {
    return this.sendRequest(Buffer.of(0x01, 0x06, 0x00, 0x01, 0x00, temp * 2)).then();
  }

  public setPower(power = 1, remoteLock = 0): Promise<void> {
    return this.sendRequest(Buffer.of(0x01, 0x06, 0x00, 0x00, remoteLock, power)).then();
  }

  public setTime(hour: number, minute: number, second: number, day: number): Promise<void> {
    return this.sendRequest(Buffer.of(0x01, 0x10, 0x00, 0x08, 0x00, 0x02, 0x04, hour, minute, second, day)).then();
  }

  public setSchedule(weekday: DayModel[], weekend: DayModel[]): Promise<void> {
    return this.sendRequest(
      Buffer.from([
        0x01,
        0x10,
        0x00,
        0x0a,
        0x00,
        0x0c,
        0x18,
        ...[...Array(6).keys()].map((i) => [weekday[i].startHour, weekday[i].startMinute]).flat(),
        ...[...Array(2).keys()].map((i) => [weekend[i].startHour, weekend[i].startMinute]).flat(),
        ...[...Array(6).keys()].map((i) => weekday[i].temp * 2),
        ...[...Array(2).keys()].map((i) => weekend[i].temp * 2),
      ]),
    ).then();
  }
}
