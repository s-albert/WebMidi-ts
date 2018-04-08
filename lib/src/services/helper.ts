import { Semitones } from "./enums";

export class Helper {
  public static lowByte(num: number): number {
    // tslint:disable-next-line:no-bitwise
    return num & 0xff;
  }

  public static hiByte(num: number): number {
    // tslint:disable-next-line:no-bitwise
    num = num & 0xff00;
    // tslint:disable-next-line:no-bitwise
    return num >> 8;
  }

  public static toArray(num: number): number[] {
    const numberArray: number[] = [];
    numberArray[0] = this.hiByte(num);
    numberArray[1] = this.lowByte(num);
    return numberArray;
  }

  /**
   * Returns a valid MIDI note number given the specified input. The input can be a note name (C3,
   * F#4, D-2, G8, etc.) or an int between 0 and 127.
   *
   * @method guessNoteNumber

   *
   * @param input  A string to extract the note number from. An integer can also be
   * used, in which case it will simply be returned (if between 0 and 127).
   * @throws {Error} Invalid note number.
   * @returns  A valid MIDI note number (0-127).
   */
  public static guessNoteNumber(input: number | string): number {
    let output = -1;

    if (typeof input === "string") {
      // string
      output = Helper.noteNameToNumber(input);
    } else if (input && input.toFixed && input >= 0 && input <= 127) {
      // uint
      output = Math.round(input);
    } else if (input >= 0 && input <= 127) {
      // uint as string
      output = input;
    }

    if (output === -1) {
      throw new Error(`Invalid note number (${input}).`);
    }

    return output;
  }

  /**
   * Returns a MIDI note number matching the note name passed in the form of a string parameter. The
   * note name must include the octave number which should be between -2 and 8. The name can also
   * optionally include a sharp "#" or double sharp "##" symbol and a flat "b" or double flat "bb"
   * symbol: C5, G4, D#-1, F0, Gb7, Eb-1, Abb4, B##6, etc.
   *
   * The lowest note is C-2 (MIDI note number 0) and the highest note is G8 (MIDI note number 127).
   *
   * @method noteNameToNumber

   *
   * @param name The name of the note in the form of a letter, followed by an optional "#",
   * "##", "b" or "bb" followed by the octave number (between -2 and 8).
   *
   * @throws {RangeError} Invalid note name.
   * @throws {RangeError} Invalid note name or note outside valid range.
   * @return  The MIDI note number (between 0 and 127)
   */
  public static noteNameToNumber(name: string): number {
    if (typeof name !== "string") {
      name = "";
    }

    const matches = name.match(/([CDEFGAB])(#{0,2}|b{0,2})(-?\d+)/i);
    if (!matches) {
      throw new RangeError("Invalid note name.");
    }

    const semitones = Semitones[matches[1].toUpperCase()] as number;
    const octave = parseInt(matches[3]);
    let result = (octave + 2) * 12 + semitones;

    if (matches[2].toLowerCase().indexOf("b") > -1) {
      result -= matches[2].length;
    } else if (matches[2].toLowerCase().indexOf("#") > -1) {
      result += matches[2].length;
    }

    if (
      semitones < 0 ||
      octave < -2 ||
      octave > 8 ||
      result < 0 ||
      result > 127
    ) {
      throw new RangeError("Invalid note name or note outside valid range.");
    }

    return result;
  }

  /**
   * Returns the octave number for the specified MIDI note number. The returned value will be
   * between -2 and 8.
   *
   * @method getOctave

   *
   * @param number  An integer representing a valid MIDI note number (between 0 and 127).
   *
   * @returns  The octave as an integer between -2 and 8. If the note number passed to
   * `getOctave()` is invalid, `undefined` will be returned.
   *
   * @since 2.0.0-rc.6
   */
  public static getOctave(num: number): number | undefined {
    if (num && num >= 0 && num <= 127) {
      return Math.floor(num / 12 - 1) - 1;
    } else {
      return undefined;
    }
  }
}
