import Device from './device';
import struct from './struct';

function hexStringToPulseArray(data: string): number[] {
  // Take each 2 chars and convert them to a number
  return data.match(/[\da-f]{2}/gi)?.map((hex) => parseInt(hex, 16)) as number[];
}

export class Rmmini extends Device {
  TYPE = 'RMMINI';
  protected send(command: number, data: number[] = []): Promise<Buffer> {
    return this.sendPacketAndDecrypt(Buffer.concat([struct('<I').pack(command), Buffer.from(data)])).then((payload) =>
      payload.subarray(0x4),
    );
  }

  public checkData(): Promise<Buffer> {
    return this.send(0x4);
  }

  public sendData(data: number[] | string): Promise<void> {
    let pulseArray: number[];
    if (typeof data === 'string') {
      pulseArray = hexStringToPulseArray(data);
    } else {
      pulseArray = data;
    }
    return this.send(0x2, pulseArray).then();
  }

  public enterLearning(): Promise<void> {
    return this.send(0x3).then();
  }

  public cancelLearning(): Promise<void> {
    return this.send(0x1e).then();
  }
}

export class Rmpro extends Rmmini {
  TYPE = 'RMPRO';

  public sweepFrequency(): Promise<void> {
    return this.send(0x19).then();
  }

  public cancelSweepFrequency(): Promise<void> {
    return this.send(0x1e).then();
  }

  public checkFrequency(): Promise<boolean> {
    return this.send(0x1a).then((response) => response[0] == 1);
  }

  public findRfPacket(): Promise<void> {
    return this.send(0x1b).then();
  }

  public checkTemperature(): Promise<number> {
    return this.readSensor().then(({ temperature }) => temperature);
  }

  public readSensor(): Promise<{ temperature: number }> {
    return this.send(0x1).then((resp) => {
      const [a, b] = struct('<bb').unpack(resp.subarray(0, 0x2));
      return {
        temperature: a + b / 10.0,
      };
    });
  }
}

export class Rmminib extends Rmmini {
  TYPE = 'RMMINIB';

  protected send(command: number, data: number[] = []): Promise<Buffer> {
    return this.sendPacketAndDecrypt(
      Buffer.concat([struct('<HI').pack(data.length + 4, command), Buffer.from(data)]),
    ).then((payload) => {
      return payload.subarray(0x6, struct('<H').unpack(payload.subarray(0, 0x2))[0] + 2);
    });
  }
}

export class Rm4mini extends Rmminib {
  TYPE = 'RM4MINI';

  public checkSensors(): Promise<{ temperature: number; humidity: number }> {
    return this.send(0x24).then((payload) => {
      return {
        temperature: struct('<bb').unpack(payload.subarray(0, 0x2))[0x0] + payload[0x1] / 100.0,
        humidity: payload[0x2] + payload[0x3] / 100.0,
      };
    });
  }

  public checkTemperature(): Promise<number> {
    return this.checkSensors().then(({ temperature }) => temperature);
  }

  public checkHumidity(): Promise<number> {
    return this.checkSensors().then(({ humidity }) => humidity);
  }
}

export class Rm4pro extends Rm4mini {
  public sweepFrequency(): Promise<void> {
    return this.send(0x19).then();
  }

  public cancelSweepFrequency(): Promise<void> {
    return this.send(0x1e).then();
  }

  public checkFrequency(): Promise<boolean> {
    return this.send(0x1a).then((response) => response[0] == 1);
  }

  public findRfPacket(): Promise<void> {
    return this.send(0x1b).then();
  }

  public checkTemperature(): Promise<number> {
    return this.checkSensors().then(({ temperature }) => temperature);
  }
}
