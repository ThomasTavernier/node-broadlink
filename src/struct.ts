import struct from '@aksel/structjs';

export default (
  format: string,
): {
  unpack_from: (buffer: Buffer, offs: number) => Array<number>;
  pack_into: (buffer: Buffer, offs: number, ...values: number[]) => Buffer;
  unpack: (buffer: Buffer) => Array<number>;
  pack: (...values: number[]) => Buffer;
} => {
  const s = struct(format);
  return {
    unpack_from: (buffer, offs) => s.unpack_from(buffer.buffer, offs),
    pack_into: (buffer, offs, ...values): Buffer => {
      s.pack_into(buffer.buffer, offs, ...values);
      return buffer;
    },
    unpack: (buffer) => s.unpack(buffer.buffer),
    pack: (...values) => Buffer.from(s.pack(...values)),
  };
};
