declare module '@aksel/structjs' {
  export default function (pattern: string): {
    pack(...numbers: number[]): ArrayBuffer;
    pack_into(arrb: ArrayBuffer, ...numbers: number[]): void;
    unpack(arrb: ArrayBuffer): Array<number>;
    unpack_from(arrb: ArrayBuffer, ...numbers: number[]): Array<number>;
  };
}
