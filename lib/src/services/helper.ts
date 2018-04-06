export class Helper {
  public static lowByte(num: number): number {
    // tslint:disable-next-line:no-bitwise
    return num & 0xFF;
  }

  public static hiByte(num: number): number {
    // tslint:disable-next-line:no-bitwise
    num = num & 0xFF00;
    // tslint:disable-next-line:no-bitwise
    return num >> 8;
  }

  public static toArray(num: number): number[] {
    const numberArray: number[] = [];
    numberArray[0] = this.hiByte(num);
    numberArray[1] = this.lowByte(num);
    return numberArray;
  }
}
