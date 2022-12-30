import dgram, { RemoteInfo, Socket } from 'dgram';
import crypto from 'crypto';

export default class Device {
  protected TYPE: string;
  private id: number[];
  private key: number[];
  private count: number;
  private readonly iv: Buffer;
  private readonly socket: Socket;

  constructor(
    public readonly host: RemoteInfo,
    public readonly mac: number[],
    public readonly deviceType: number = 0x272a,
    public readonly name: string = '',
    public readonly isLocked: boolean = false,
    public readonly model: string = '',
    public readonly manufacturer: string = '',
  ) {
    this.id = [0, 0, 0, 0];
    this.key = [0x09, 0x76, 0x28, 0x34, 0x3f, 0xe9, 0x9e, 0x23, 0x76, 0x5c, 0x15, 0x13, 0xac, 0xcf, 0x8b, 0x02];
    this.count = Math.floor(Math.random() * 0xffff);
    this.iv = Buffer.from([
      0x56, 0x2e, 0x17, 0x99, 0x6d, 0x09, 0x3d, 0x28, 0xdd, 0xb3, 0xba, 0x69, 0x5a, 0x2e, 0x6f, 0x58,
    ]);
    this.TYPE = 'Unknown';
    this.socket = dgram.createSocket('udp4');
    this.socket.bind();
  }

  private encrypt(payload: Buffer): Buffer {
    const cipher = crypto.createCipheriv('aes-128-cbc', Buffer.from(this.key), this.iv);
    return cipher.update(payload);
  }

  protected decrypt(response: Buffer): Buffer {
    const decipher = crypto.createDecipheriv('aes-128-cbc', Buffer.from(this.key), this.iv);
    decipher.setAutoPadding(false);
    return Buffer.concat([decipher.update(response.subarray(0x38)), decipher.final()]);
  }

  public auth(): Promise<Device> {
    const payload = Buffer.alloc(0x50);
    payload.fill(0x31, 0x04, 0x14);
    payload[0x1e] = 0x01;
    payload[0x2d] = 0x01;
    payload.fill('Test 1', 0x30, 0x36);

    return new Promise((resolve, reject) => {
      this.sendPacket(payload, 0x65)
        .then((response) => {
          const responsePayload = this.decrypt(response);
          const key = responsePayload.subarray(0x04, 0x14);
          if (key.length > 0 && key.length % 16 === 0) {
            this.id = [...responsePayload.subarray(0x00, 0x04)];
            this.key = [...key];
            resolve(this);
          } else {
            reject(new Error('auth failed'));
          }
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  protected sendPacket(buffer: Buffer, command = 0x6a): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      this.count = (this.count + 1) & 0xffff;
      let packet = Buffer.alloc(0x38);
      [packet[0x00], packet[0x01], packet[0x02], packet[0x03], packet[0x04], packet[0x05], packet[0x06], packet[0x07]] =
        [0x5a, 0xa5, 0xaa, 0x55, 0x5a, 0xa5, 0xaa, 0x55];
      packet[0x24] = this.deviceType & 0xff;
      packet[0x25] = (this.deviceType >> 8) & 0xff;
      packet[0x26] = command;
      packet[0x28] = this.count & 0xff;
      packet[0x29] = (this.count >> 8) & 0xff;
      [packet[0x2a], packet[0x2b], packet[0x2c], packet[0x2d], packet[0x2e], packet[0x2f]] = this.mac.reverse();
      [packet[0x30], packet[0x31], packet[0x32], packet[0x33]] = this.id;

      const payload = Buffer.concat([buffer, Buffer.alloc((((16 - buffer.length) % 16) + 16) % 16)]);

      let checksum = payload.reduce((acc, b) => acc + b, 0xbeaf) & 0xffff;

      packet[0x34] = checksum & 0xff;
      packet[0x35] = (checksum >> 8) & 0xff;

      packet = Buffer.concat([packet, this.encrypt(payload)]);
      checksum = packet.reduce((acc, b) => acc + b, 0xbeaf) & 0xffff;

      packet[0x20] = checksum & 0xff;
      packet[0x21] = (checksum >> 8) & 0xff;
      this.socket.once('message', (response) => {
        const error = response.subarray(0x22, 0x24);
        const errorCode = error[0] | (error[1] << 8);
        if (!errorCode) {
          resolve(response);
        } else {
          reject(new Error(`${errorCode}`));
        }
      });
      this.socket.send(packet, 0, packet.length, this.host.port, this.host.address);
    });
  }

  protected sendPacketAndDecrypt(buffer: Buffer): Promise<Buffer> {
    return this.sendPacket(buffer).then((response) => this.decrypt(response));
  }
}
