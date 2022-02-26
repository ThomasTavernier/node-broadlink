import Device from './device';

export class Dooya extends Device {
  TYPE = 'Dooya DT360E';

  public open(): Promise<number> {
    return this.send(0x01, 0x00);
  }

  public close(): Promise<number> {
    return this.send(0x02, 0x00);
  }

  public stop(): Promise<number> {
    return this.send(0x03, 0x00);
  }

  public getPercentage(): Promise<number> {
    return this.send(0x06, 0x5d);
  }

  public setPercentageAndWait(newPercentage: number): Promise<number> {
    return new Promise((resolve, reject) => {
      this.getPercentage()
        .then((current) => {
          if (current > newPercentage) {
            this.close()
              .then(() => {
                const interval = setInterval(() => {
                  this.getPercentage()
                    .then((current) => {
                      if (current === undefined || current <= newPercentage) {
                        clearInterval(interval);
                        resolve(this.stop());
                      }
                    })
                    .catch((err) => {
                      clearInterval(interval);
                      reject(err);
                    });
                }, 200);
              })
              .catch((err) => {
                reject(err);
              });
          } else if (current < newPercentage) {
            this.open()
              .then(() => {
                const interval = setInterval(() => {
                  this.getPercentage()
                    .then((current) => {
                      if (current === undefined || current >= newPercentage) {
                        clearInterval(interval);
                        resolve(this.stop());
                      }
                    })
                    .catch((err) => {
                      clearInterval(interval);
                      reject(err);
                    });
                }, 200);
              })
              .catch((err) => {
                reject(err);
              });
          }
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  private send(magic1: number, magic2: number): Promise<number> {
    return new Promise((resolve, reject) => {
      const packet = Buffer.alloc(16);
      packet[0] = 0x09;
      packet[2] = 0xbb;
      packet[3] = magic1;
      packet[4] = magic2;
      packet[9] = 0xfa;
      packet[10] = 0x44;
      this.sendPacket(packet)
        .then((response) => {
          resolve(this.decrypt(response)[4]);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }
}
