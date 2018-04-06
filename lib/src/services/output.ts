import { MidiService } from "./midi.service";
import {
  MIDI_SYSTEM_MESSAGES,
  MIDI_CHANNEL_MESSAGES,
  MIDI_CONTROL_CHANGE_MESSAGES,
  MIDI_REGISTERED_PARAMETER,
  MIDI_CHANNEL_MODE_MESSAGES,
  MIDI_CHANNEL_COUNT
} from "./enums";
import { Helper } from "./helper";

export class Output {
  /**
   * The `Output` object represents a MIDI output port on the host system. This object is created by
   * the MIDI subsystem and cannot be instantiated directly.
   *
   * You will find all available `Output` objects in the `WebMidi.outputs` array.
   *
   * @param MIDIOutput midiOutput Actual `MIDIOutput` object as defined by the MIDI subsystem
   */
  constructor(private midiService: MidiService, public _midiOutput: any) {}

  /**
   * [read-only] Status of the MIDI port's connection
   *
   * @property connection
   */
  get connection(): string {
    return this._midiOutput.connection;
  }

  /**
   * [read-only] ID string of the MIDI port
   *
   * @property id
   */
  get id(): string {
    return this._midiOutput.id;
  }

  /**
   * [read-only] Manufacturer of the device to which this port belongs
   *
   * @property manufacturer
   */
  get manufacturer(): string {
    return this._midiOutput.manufacturer;
  }

  /**
   * [read-only] Name of the MIDI port
   *
   * @property name
   */
  get name(): string {
    return this._midiOutput.name;
  }

  /**
   * [read-only] State of the MIDI port
   *
   * @property state
   */
  get state(): string {
    return this._midiOutput.namstatee;
  }

  /**
   * [read-only] Type of the MIDI port (`output`)
   *
   * @property state
   */
  get type(): string {
    return this._midiOutput.type;
  }

  /**
   * Sends a MIDI message on the MIDI output port, at the scheduled timestamp.
   *
   * Unless, you are familiar with the details of the MIDI message format, you should not use this
   * method directly. Instead, use one of the simpler helper methods: `playNote()`, `stopNote()`,
   * `sendControlChange()`, `sendSystemMessage()`, etc.
   *
   * Details on the format of MIDI messages are available in the
   * <a href="http://www.midi.org/techspecs/midimessages.php">summary of MIDI messages</a> of the
   * MIDI Manufacturers Association.
   *
   * @method send
   * @chainable
   *
   * @param status The MIDI status byte of the message (128-255).
   *
   * @param [data=[]] An array of uints for the message. The number of data bytes varies
   * depending on the status byte. It is perfectly legal to send no data for some message types (use
   * undefined or an empty array in this case). Each byte must be between 0 and 127.
   *
   * @param [timestamp=0] DOMHighResTimeStamp The timestamp at which to send the message. You can
   * use `WebMidi.time` to retrieve the current timestamp. To send immediately, leave blank or use
   * 0.
   *
   * @throws {RangeError} The status byte must be an integer between 128 (0x80) and 255 (0xFF).
   * @throws {RangeError} Data bytes must be integers between 0 (0x00) and 127 (0x7F).
   *
   * @return Returns the `Output` object so methods can be chained.
   */
  public send = (
    status: number,
    data?: number[],
    timestamp?: number
  ): Output => {
    if (!(status >= 128 && status <= 255)) {
      throw new RangeError(
        "The status byte must be an integer between 128 (0x80) and 255 (0xFF)."
      );
    }

    if (data === undefined) {
      data = [];
    }
    if (!Array.isArray(data)) {
      data = [data];
    }

    const message = [];

    data.forEach(item => {
      const parsed = item; // mandatory because of 'null'

      if (parsed >= 0 && parsed <= 127) {
        message.push(parsed);
      } else {
        throw new RangeError(
          "Data bytes must be integers between 0 (0x00) and 127 (0x7F)."
        );
      }
    });

    this._midiOutput.send([status].concat(message), timestamp || 0);

    return this;
  };

  /**
   * Sends a MIDI *system exclusive* message. The generated message will automatically be prepended
   * with the *SysEx* byte (0xF0) and terminated with the *End of SysEx* byte (0xF7).
   *
   * For example, if you want to send a SysEx message to a Korg device connected to the first
   * output, you would use the following code:
   *
   *     WebMidi.outputs[0].sendSysex(0x42, [1, 2, 3, 4, 5]);
   *
   * The above code sends the byte values 1, 2, 3, 4 and 5 to Korg (ID 0x42) devices. Some
   * manufacturers are identified using 3 bytes. In this case, you would use a 3-position array as
   * the first parameter. For example, to send the same SysEx message to a *Native Instruments*
   * device:
   *
   *     WebMidi.outputs[0].sendSysex([0x00, 0x21, 0x09], [1, 2, 3, 4, 5]);
   *
   * There is no limit for the length of the data array. However, it is generally suggested to keep
   * system exclusive messages to 64Kb or less.
   *
   * @method sendSysex
   * @chainable
   *
   * @param manufacturer {Number|Array} An unsigned integer or an array of three unsigned integers
   * between 0 and 127 that identify the targeted manufacturer. The *MIDI Manufacturers Association*
   * maintains a full list of
   * [Manufacturer ID Numbers](https://www.midi.org/specifications/item/manufacturer-id-numbers).
   *
   * @param [data=[]] {Array} An array of uints between 0 and 127. This is the data you wish to
   * transfer.
   *
   * @param  [options={}]
   *
   * @param DOMHighResTimeStamp|String [options.time=undefined] This value can be one of two
   * things. If the value is a string starting with the + sign and followed by a number, the request
   * will be delayed by the specified number (in milliseconds). Otherwise, the value is considered a
   * timestamp and the request will be scheduled at that timestamp. The `DOMHighResTimeStamp` value
   * is relative to the navigation start of the document. To retrieve the current time, you can use
   * `WebMidi.time`. If `time` is not present or is set to a time in the past, the request is to be
   * sent as soon as possible.
   *
   * @throw SysEx message support must first be activated.
   * @throw The data bytes of a SysEx message must be integers between 0 (0x00) and 127 (0x7F).
   *
   * @return  Returns the `Output` object so methods can be chained.
   */
  public sendSysex = (
    manufacturer: number | number[],
    data: number[],
    options: any
  ): Output => {
    if (!this.midiService.sysexEnabled) {
      throw new Error("SysEx message support must first be activated.");
    }

    options = options || {};

    manufacturer = [].concat(manufacturer);

    data.forEach(item => {
      if (item < 0 || item > 127) {
        throw new RangeError(
          "The data bytes of a SysEx message must be integers between 0 (0x00) and 127 (0x7F)."
        );
      }
    });

    data = manufacturer.concat(data, MIDI_SYSTEM_MESSAGES.sysexend);
    this.send(
      MIDI_SYSTEM_MESSAGES.sysex,
      data,
      this._parseTimeParameter(options.time)
    );

    return this;
  };

  /**
   * Sends a *MIDI Timecode Quarter Frame* message. Please note that no processing is being done on
   * the data. It is up to the developer to format the data according to the
   * [MIDI Timecode](https://en.wikipedia.org/wiki/MIDI_timecode) format.
   *
   * @method sendTimecodeQuarterFrame
   * @chainable
   *
   * @param value Number The quarter frame message content (integer between 0 and 127).
   *
   * @param Object [options={}]
   *
   * @param DOMHighResTimeStamp|String [options.time=undefined] This value can be one of two
   * things. If the value is a string starting with the + sign and followed by a number, the request
   * will be delayed by the specified number (in milliseconds). Otherwise, the value is considered a
   * timestamp and the request will be scheduled at that timestamp. The `DOMHighResTimeStamp` value
   * is relative to the navigation start of the document. To retrieve the current time, you can use
   * `WebMidi.time`. If `time` is not present or is set to a time in the past, the request is to be
   * sent as soon as possible.
   *
   * @return Output Returns the `Output` object so methods can be chained.
   */
  public sendTimecodeQuarterFrame = (value: number, options: {}): Output => {
    options = options || {};
    this.send(
      MIDI_SYSTEM_MESSAGES.timecode,
      [value],
      this._parseTimeParameter((<any>options).time)
    );
    return this;
  };

  /**
   * Sends a *Song Position* MIDI message. The value is expressed in MIDI beats (between 0 and
   * 16383) which are 16th note. Position 0 is always the start of the song.
   *
   * @method sendSongPosition
   * @chainable
   *
   * @param [value=0] Number The MIDI beat to cue to (int between 0 and 16383).
   *
   * @param Object [options={}]
   *
   * @param DOMHighResTimeStamp|String [options.time=undefined] This value can be one of two
   * things. If the value is a string starting with the + sign and followed by a number, the request
   * will be delayed by the specified number (in milliseconds). Otherwise, the value is considered a
   * timestamp and the request will be scheduled at that timestamp. The `DOMHighResTimeStamp` value
   * is relative to the navigation start of the document. To retrieve the current time, you can use
   * `WebMidi.time`. If `time` is not present or is set to a time in the past, the request is to be
   * sent as soon as possible.
   *
   * @return Output Returns the `Output` object so methods can be chained.
   */
  public sendSongPosition = (value: number, options: any): Output => {
    value = value || 0;

    options = options || {};

    // tslint:disable-next-line:no-bitwise
    const msb = (value >> 7) & 0x7f;
    // tslint:disable-next-line:no-bitwise
    const lsb = value & 0x7f;

    this.send(
      MIDI_SYSTEM_MESSAGES.songposition,
      [msb, lsb],
      this._parseTimeParameter(options.time)
    );
    return this;
  };

  /**
   * Sends a *Song Select* MIDI message. Beware that some devices will display position 0 as
   * position 1 for user-friendlyness.
   *
   * @method sendSongSelect
   * @chainable
   *
   * @param value Number The number of the song to select (integer between 0 and 127).
   *
   * @param Object [options={}]
   *
   * @param DOMHighResTimeStamp|String [options.time=undefined] This value can be one of two
   * things. If the value is a string starting with the + sign and followed by a number, the request
   * will be delayed by the specified number (in milliseconds). Otherwise, the value is considered a
   * timestamp and the request will be scheduled at that timestamp. The `DOMHighResTimeStamp` value
   * is relative to the navigation start of the document. To retrieve the current time, you can use
   * `WebMidi.time`. If `time` is not present or is set to a time in the past, the request is to be
   * sent as soon as possible.
   *
   * @throw The song number must be between 0 and 127.
   *
   * @return Output Returns the `Output` object so methods can be chained.
   */
  public sendSongSelect = (value: number, options: any): Output => {
    value = +value;

    options = options || {};

    if (!(value >= 0 && value <= 127)) {
      throw new RangeError("The song number must be between 0 and 127.");
    }

    this.send(
      MIDI_SYSTEM_MESSAGES.songselect,
      [value],
      this._parseTimeParameter(options.time)
    );

    return this;
  };

  /**
   * Sends a *MIDI tuning request* real-time message.
   *
   * Note: there is currently a bug in Chrome's MIDI implementation. If you try to use this
   * function, Chrome will actually throw a "Message is incomplete" error. The bug is
   * [scheduled to be fixed](https://bugs.chromium.org/p/chromium/issues/detail?id=610116).
   *
   * @method sendTuningRequest
   * @chainable
   *
   * @param Object [options={}]
   *
   * @param DOMHighResTimeStamp|String [options.time=undefined] This value can be one of two
   * things. If the value is a string starting with the + sign and followed by a number, the request
   * will be delayed by the specified number (in milliseconds). Otherwise, the value is considered a
   * timestamp and the request will be scheduled at that timestamp. The `DOMHighResTimeStamp` value
   * is relative to the navigation start of the document. To retrieve the current time, you can use
   * `WebMidi.time`. If `time` is not present or is set to a time in the past, the request is to be
   * sent as soon as possible.
   *
   * @return Output Returns the `Output` object so methods can be chained.
   */
  public sendTuningRequest = (options: any): Output => {
    options = options || {};
    this.send(
      MIDI_SYSTEM_MESSAGES.tuningrequest,
      undefined,
      this._parseTimeParameter(options.time)
    );
    return this;
  };

  /**
   * Sends a *MIDI Clock* real-time message. According to the standard, there are 24 MIDI Clocks
   * for every quarter note.
   *
   * @method sendClock
   * @chainable
   *
   * @param Object [options={}]
   *
   * @param DOMHighResTimeStamp|String [options.time=undefined] This value can be one of two
   * things. If the value is a string starting with the + sign and followed by a number, the request
   * will be delayed by the specified number (in milliseconds). Otherwise, the value is considered a
   * timestamp and the request will be scheduled at that timestamp. The `DOMHighResTimeStamp` value
   * is relative to the navigation start of the document. To retrieve the current time, you can use
   * `WebMidi.time`. If `time` is not present or is set to a time in the past, the request is to be
   * sent as soon as possible.
   *
   * @return Output Returns the `Output` object so methods can be chained.
   */
  public sendClock = (options: any): Output => {
    options = options || {};
    this.send(
      MIDI_SYSTEM_MESSAGES.clock,
      undefined,
      this._parseTimeParameter(options.time)
    );
    return this;
  };

  /**
   * Sends a *Start* real-time message. A MIDI Start message starts the playback of the current
   * song at beat 0. To start playback elsewhere in the song, use the `sendContinue()` function.
   *
   * @method sendStart
   * @chainable
   *
   * @param Object [options={}]
   *
   * @param DOMHighResTimeStamp|String [options.time=undefined] This value can be one of two
   * things. If the value is a string starting with the + sign and followed by a number, the request
   * will be delayed by the specified number (in milliseconds). Otherwise, the value is considered a
   * timestamp and the request will be scheduled at that timestamp. The `DOMHighResTimeStamp` value
   * is relative to the navigation start of the document. To retrieve the current time, you can use
   * `WebMidi.time`. If `time` is not present or is set to a time in the past, the request is to be
   * sent as soon as possible.
   *
   * @return Output Returns the `Output` object so methods can be chained.
   */
  public sendStart = (options: any): Output => {
    options = options || {};
    this.send(
      MIDI_SYSTEM_MESSAGES.start,
      undefined,
      this._parseTimeParameter(options.time)
    );
    return this;
  };

  /**
   * Sends a *Continue* real-time message. This resumes song playback where it was previously
   * stopped or where it was last cued with a song position message. To start playback from the
   * start, use the `sendStart()` function.
   *
   * @method sendContinue
   * @chainable
   *
   * @param Object [options={}]
   *
   * @param DOMHighResTimeStamp|String [options.time=undefined] This value can be one of two
   * things. If the value is a string starting with the + sign and followed by a number, the request
   * will be delayed by the specified number (in milliseconds). Otherwise, the value is considered a
   * timestamp and the request will be scheduled at that timestamp. The `DOMHighResTimeStamp` value
   * is relative to the navigation start of the document. To retrieve the current time, you can use
   * `WebMidi.time`. If `time` is not present or is set to a time in the past, the request is to be
   * sent as soon as possible.
   *
   * @return  Returns the `WebMidi` object so methods can be chained.
   */
  public sendContinue = (options: any): Output => {
    options = options || {};
    this.send(
      MIDI_SYSTEM_MESSAGES.continue,
      undefined,
      this._parseTimeParameter(options.time)
    );
    return this;
  };

  /**
   * Sends a *Stop* real-time message. This tells the device connected to this port to stop playback
   * immediately (or at the scheduled time).
   *
   * @method sendStop
   * @chainable
   *
   * @param Object [options={}]
   *
   * @param DOMHighResTimeStamp|String [options.time=undefined] This value can be one of two
   * things. If the value is a string starting with the + sign and followed by a number, the request
   * will be delayed by the specified number (in milliseconds). Otherwise, the value is considered a
   * timestamp and the request will be scheduled at that timestamp. The `DOMHighResTimeStamp` value
   * is relative to the navigation start of the document. To retrieve the current time, you can use
   * `WebMidi.time`. If `time` is not present or is set to a time in the past, the request is to be
   * sent as soon as possible.
   *
   * @return Output Returns the `Output` object so methods can be chained.
   */
  public sendStop = (options: any): Output => {
    options = options || {};
    this.send(
      MIDI_SYSTEM_MESSAGES.stop,
      undefined,
      this._parseTimeParameter(options.time)
    );
    return this;
  };

  /**
   * Sends an *Active Sensing* real-time message. This tells the device connected to this port that
   * the connection is still good. Active sensing messages should be sent every 300 ms if there was
   * no other activity on the MIDI port.
   *
   * @method sendActiveSensing
   * @chainable
   *
   * @param Object [options={}]
   *
   * @param DOMHighResTimeStamp|String [options.time=undefined] This value can be one of two
   * things. If the value is a string starting with the + sign and followed by a number, the request
   * will be delayed by the specified number (in milliseconds). Otherwise, the value is considered a
   * timestamp and the request will be scheduled at that timestamp. The `DOMHighResTimeStamp` value
   * is relative to the navigation start of the document. To retrieve the current time, you can use
   * `WebMidi.time`. If `time` is not present or is set to a time in the past, the request is to be
   * sent as soon as possible.
   *
   * @return Output Returns the `Output` object so methods can be chained.
   */
  public sendActiveSensing = (options: any): Output => {
    options = options || {};
    this.send(
      MIDI_SYSTEM_MESSAGES.activesensing,
      [],
      this._parseTimeParameter(options.time)
    );
    return this;
  };

  /**
   * Sends *Reset* real-time message. This tells the device connected to this port that is should
   * reset itself to a default state.
   *
   * @method sendReset
   * @chainable
   *
   * @param Object [options={}]
   *
   * @param DOMHighResTimeStamp|String [options.time=undefined] This value can be one of two
   * things. If the value is a string starting with the + sign and followed by a number, the request
   * will be delayed by the specified number (in milliseconds). Otherwise, the value is considered a
   * timestamp and the request will be scheduled at that timestamp. The `DOMHighResTimeStamp` value
   * is relative to the navigation start of the document. To retrieve the current time, you can use
   * `WebMidi.time`. If `time` is not present or is set to a time in the past, the request is to be
   * sent as soon as possible.
   *
   * @return Output Returns the `Output` object so methods can be chained.
   */
  public sendReset = (options: any): Output => {
    options = options || {};
    this.send(
      MIDI_SYSTEM_MESSAGES.reset,
      undefined,
      this._parseTimeParameter(options.time)
    );
    return this;
  };

  /**
   * Sends a MIDI **note off** message to the specified channel(s) for a single note or multiple
   * simultaneous notes (chord). You can delay the execution of the **note off** command by using
   * the `time` property of the `options` parameter (in milliseconds).
   *
   * @method stopNote
   * @chainable
   *
   * @param note Number|Array|String  The note(s) you wish to stop. The notes can be specified in
   * one of three ways. The first way is by using the MIDI note number (an integer between `0` and
   * `127`). The second way is by using the note name followed by the octave (C3, G#4, F-1, Db7).
   * The octave range should be between -2 and 8. The lowest note is C-2 (MIDI note number 0) and
   * the highest note is G8 (MIDI note number 127). It is also possible to specify an array of note
   * numbers and/or names. The final way is to use the special value `all` to send an 'allnotesoff'
   * channel message.
   *
   * @param [channel=all] Number|Array|String The MIDI channel number (between `1` and `16`) or an
   * array of channel numbers. If the special value `all` is used (default), the message will be
   * sent to all 16 channels.
   *
   * @param Object [options={}]
   *
   * @param Boolean [options.rawVelocity=false] Controls whether the release velocity is set using
   * an integer between `0` and `127` (`true`) or a decimal number between `0` and `1` (`false`,
   * default).
   *
   * @param DOMHighResTimeStamp|String [options.time=undefined] This value can be one of two
   * things. If the value is a string starting with the + sign and followed by a number, the request
   * will be delayed by the specified number (in milliseconds). Otherwise, the value is considered a
   * timestamp and the request will be scheduled at that timestamp. The `DOMHighResTimeStamp` value
   * is relative to the navigation start of the document. To retrieve the current time, you can use
   * `WebMidi.time`. If `time` is not present or is set to a time in the past, the request is to be
   * sent as soon as possible.
   *
   * @param Number [options.velocity=0.5] The velocity at which to release the note (between `0`
   * and `1`). If the `rawVelocity` option is `true`, the value should be specified as an integer
   * between `0` and `127`. An invalid velocity value will silently trigger the default of `0.5`.
   * Note that when the first parameter to `stopNote()` is `all`, the release velocity is silently
   * ignored.
   *
   * @return Output Returns the `Output` object so methods can be chained.
   */
  public stopNote(
    note: number | Array<number | string> | string,
    channel: number | Array<number | string> | string,
    options: any
  ): Output {
    if (note === "all") {
      return this.sendChannelMode("allnotesoff", 0, channel, options);
    }

    let nVelocity = 64;

    options = options || {};

    options.velocity = parseFloat(options.velocity);

    if (options.rawVelocity) {
      if (
        !isNaN(options.velocity) &&
        options.velocity >= 0 &&
        options.velocity <= 127
      ) {
        nVelocity = options.velocity;
      }
    } else {
      if (
        !isNaN(options.velocity) &&
        options.velocity >= 0 &&
        options.velocity <= 1
      ) {
        nVelocity = options.velocity * 127;
      }
    }

    // Send note off messages
    this._convertNoteToArray(note).forEach(item => {
      this._convertChannelToArray(channel).forEach(ch => {
        this.send(
          // tslint:disable-next-line:no-bitwise
          (MIDI_CHANNEL_MESSAGES.noteoff << 4) + (ch - 1),
          [item, Math.round(nVelocity)],
          this._parseTimeParameter(options.time)
        );
      });
    });

    return this;
  }

  /**
   * Requests the playback of a single note or multiple notes on the specified channel(s). You can
   * delay the execution of the **note on** command by using the `time` property of the `options`
   * parameter (milliseconds).
   *
   * If no duration is specified in the `options`, the note will play until a matching **note off**
   * is sent. If a duration is specified, a **note off** will be automatically sent after said
   * duration.
   *
   * Note: As per the MIDI standard, a **note on** event with a velocity of `0` is considered to be
   * a **note off**.
   *
   * @method playNote
   * @chainable
   *
   * @param note {Number|String|Array}  The note(s) you wish to play. The notes can be specified in
   * one of two ways. The first way is by using the MIDI note number (an integer between 0 and 127).
   * The second way is by using the note name followed by the octave (C3, G#4, F-1, Db7). The octave
   * range should be between -2 and 8. The lowest note is C-2 (MIDI note number 0) and the highest
   * note is G8 (MIDI note number 127). It is also possible to specify an array of note numbers
   * and/or names.
   *
   * @param [channel=all] {Number|Array|String} The MIDI channel number (between `1` and `16`) or an
   * array of channel numbers. If the special value **all** is used (default), the message will be
   * sent to all 16 channels.
   *
   * @param Object [options={}]
   *
   * @param Number [options.duration=undefined] The number of milliseconds (integer) to wait
   * before sending a matching **note off** event. If left undefined, only a **note on** message is
   * sent.
   *
   * @param Boolean [options.rawVelocity=false] Controls whether the attack and release velocities
   * are set using integers between `0` and `127` (`true`) or a decimal number between `0` and `1`
   * (`false`, default).
   *
   * @param Number [options.release=0.5] The velocity at which to release the note (between `0`
   * and `1`). If the `rawVelocity` option is `true`, the value should be specified as an integer
   * between `0` and `127`. An invalid velocity value will silently trigger the default of `0.5`.
   * This is only used with the **note off** event triggered when `options.duration` is set.
   *
   * @param DOMHighResTimeStamp|String [options.time=undefined] This value can be one of two
   * things. If the value is a string starting with the + sign and followed by a number, the request
   * will be delayed by the specified number (in milliseconds). Otherwise, the value is considered a
   * timestamp and the request will be scheduled at that timestamp. The `DOMHighResTimeStamp` value
   * is relative to the navigation start of the document. To retrieve the current time, you can use
   * `WebMidi.time`. If `time` is not present or is set to a time in the past, the request is to be
   * sent as soon as possible.
   *
   * @param Number [options.velocity=0.5] The velocity at which to play the note (between `0` and
   * `1`). If the `rawVelocity` option is `true`, the value should be specified as an integer
   * between `0` and `127`. An invalid velocity value will silently trigger the default of `0.5`.
   *
   * @return Output Returns the `Output` object so methods can be chained.
   */
  // tslint:disable-next-line:cyclomatic-complexity
  public playNote(
    note: number | Array<number | string> | string,
    channel: number | Array<number | string> | string,
    options?: any
  ): Output {
    let nVelocity = 64;

    options = options || {};

    options.velocity = parseFloat(options.velocity);

    if (options.rawVelocity) {
      if (
        !isNaN(options.velocity) &&
        options.velocity >= 0 &&
        options.velocity <= 127
      ) {
        nVelocity = options.velocity;
      }
    } else {
      if (
        !isNaN(options.velocity) &&
        options.velocity >= 0 &&
        options.velocity <= 1
      ) {
        nVelocity = options.velocity * 127;
      }
    }

    options.time = this._parseTimeParameter(options.time);

    // Send note on messages
    this._convertNoteToArray(note).forEach(item => {
      this._convertChannelToArray(channel).forEach(ch => {
        this.send(
          // tslint:disable-next-line:no-bitwise
          (MIDI_CHANNEL_MESSAGES.noteon << 4) + (ch - 1),
          [item, Math.round(nVelocity)],
          options.time
        );
      });
    });

    // Send note off messages (only if a valid duration has been defined)
    options.duration = parseFloat(options.duration);

    if (options.duration) {
      if (options.duration <= 0) {
        options.duration = 0;
      }

      let nRelease = 64;

      options.release = parseFloat(options.release);

      if (options.rawVelocity) {
        if (
          !isNaN(options.release) &&
          options.release >= 0 &&
          options.release <= 127
        ) {
          nRelease = options.release;
        }
      } else {
        if (
          !isNaN(options.release) &&
          options.release >= 0 &&
          options.release <= 1
        ) {
          nRelease = options.release * 127;
        }
      }

      this._convertNoteToArray(note).forEach(item => {
        this._convertChannelToArray(channel).forEach(ch => {
          this.send(
            // tslint:disable-next-line:no-bitwise
            (MIDI_CHANNEL_MESSAGES.noteoff << 4) + (ch - 1),
            [item, Math.round(nRelease)],
            (options.time || performance.now()) + options.duration
          );
        });
      });
    }

    return this;
  }

  /**
   * Sends a MIDI `key aftertouch` message to the specified channel(s) at the scheduled time. This
   * is a key-specific aftertouch. For a channel-wide aftertouch message, use
   * {{#crossLink "WebMidi/sendChannelAftertouch:method"}}sendChannelAftertouch(){{/crossLink}}.
   *
   * @method sendKeyAftertouch
   * @chainable
   *
   * @param note {Number|String|Array}  The note for which you are sending an aftertouch value. The
   * notes can be specified in one of two ways. The first way is by using the MIDI note number (an
   * integer between 0 and 127). The second way is by using the note name followed by the octave
   * (C3, G#4, F-1, Db7). The octave range should be between -2 and 8. The lowest note is C-2 (MIDI
   * note number 0) and the highest note is G8 (MIDI note number 127). It is also possible to use
   * an array of note names and/or numbers.
   *
   * @param [channel=all] {Number|Array|String} The MIDI channel number (between 1 and 16) or an
   * array of channel numbers. If the special value "all" is used, the message will be sent to all
   * 16 channels.
   *
   * @param Number [pressure=0.5] The pressure level to send (between 0 and 1).
   *
   * @param Object [options={}]
   *
   * @param DOMHighResTimeStamp|String [options.time=undefined] This value can be one of two
   * things. If the value is a string starting with the + sign and followed by a number, the request
   * will be delayed by the specified number (in milliseconds). Otherwise, the value is considered a
   * timestamp and the request will be scheduled at that timestamp. The `DOMHighResTimeStamp` value
   * is relative to the navigation start of the document. To retrieve the current time, you can use
   * `WebMidi.time`. If `time` is not present or is set to a time in the past, the request is to be
   * sent as soon as possible.
   *
   * @throws {RangeError} The channel must be between 1 and 16.
   *
   * @return Output Returns the `Output` object so methods can be chained.
   */
  public sendKeyAftertouch = (
    note: number | Array<number | string> | string,
    channel: number | Array<number | string> | string,
    pressure: number,
    options: any
  ): Output => {
    options = options || {};

    if (channel < 1 || channel > MIDI_CHANNEL_COUNT) {
      throw new RangeError("The channel must be between 1 and 16.");
    }

    if (isNaN(pressure) || pressure < 0 || pressure > 1) {
      pressure = 0.5;
    }

    const nPressure = Math.round(pressure * 127);

    this._convertNoteToArray(note).forEach(item => {
      this._convertChannelToArray(channel).forEach(ch => {
        this.send(
          // tslint:disable-next-line:no-bitwise
          (MIDI_CHANNEL_MESSAGES.keyaftertouch << 4) + (ch - 1),
          [item, nPressure],
          this._parseTimeParameter(options.time)
        );
      });
    });

    return this;
  };

  /**
   * Sends a MIDI `control change` message to the specified channel(s) at the scheduled time. The
   * control change message to send can be specified numerically or by using one of the following
   * common names:
   *
   *  * `bankselectcoarse` (#0)
   *  * `modulationwheelcoarse` (#1)
   *  * `breathcontrollercoarse` (#2)
   *  * `footcontrollercoarse` (#4)
   *  * `portamentotimecoarse` (#5)
   *  * `dataentrycoarse` (#6)
   *  * `volumecoarse` (#7)
   *  * `balancecoarse` (#8)
   *  * `pancoarse` (#10)
   *  * `expressioncoarse` (#11)
   *  * `effectcontrol1coarse` (#12)
   *  * `effectcontrol2coarse` (#13)
   *  * `generalpurposeslider1` (#16)
   *  * `generalpurposeslider2` (#17)
   *  * `generalpurposeslider3` (#18)
   *  * `generalpurposeslider4` (#19)
   *  * `bankselectfine` (#32)
   *  * `modulationwheelfine` (#33)
   *  * `breathcontrollerfine` (#34)
   *  * `footcontrollerfine` (#36)
   *  * `portamentotimefine` (#37)
   *  * `dataentryfine` (#38)
   *  * `volumefine` (#39)
   *  * `balancefine` (#40)
   *  * `panfine` (#42)
   *  * `expressionfine` (#43)
   *  * `effectcontrol1fine` (#44)
   *  * `effectcontrol2fine` (#45)
   *  * `holdpedal` (#64)
   *  * `portamento` (#65)
   *  * `sustenutopedal` (#66)
   *  * `softpedal` (#67)
   *  * `legatopedal` (#68)
   *  * `hold2pedal` (#69)
   *  * `soundvariation` (#70)
   *  * `resonance` (#71)
   *  * `soundreleasetime` (#72)
   *  * `soundattacktime` (#73)
   *  * `brightness` (#74)
   *  * `soundcontrol6` (#75)
   *  * `soundcontrol7` (#76)
   *  * `soundcontrol8` (#77)
   *  * `soundcontrol9` (#78)
   *  * `soundcontrol10` (#79)
   *  * `generalpurposebutton1` (#80)
   *  * `generalpurposebutton2` (#81)
   *  * `generalpurposebutton3` (#82)
   *  * `generalpurposebutton4` (#83)
   *  * `reverblevel` (#91)
   *  * `tremololevel` (#92)
   *  * `choruslevel` (#93)
   *  * `celestelevel` (#94)
   *  * `phaserlevel` (#95)
   *  * `databuttonincrement` (#96)
   *  * `databuttondecrement` (#97)
   *  * `nonregisteredparametercoarse` (#98)
   *  * `nonregisteredparameterfine` (#99)
   *  * `registeredparametercoarse` (#100)
   *  * `registeredparameterfine` (#101)
   *
   * Note: as you can see above, not all control change message have a matching common name. This
   * does not mean you cannot use the others. It simply means you will need to use their number
   * instead of their name.
   *
   * To view a list of all available `control change` messages, please consult "Table 3 - Control
   * Change Messages" from the
   * [MIDI Messages](https://www.midi.org/specifications/item/table-3-control-change-messages-data-bytes-2)
   * specification.
   *
   * @method sendControlChange
   * @chainable
   *
   * @param controller Number|String The MIDI controller number (0-119) or name.
   *
   * @param [value=0] Number The value to send (0-127).
   *
   * @param [channel=all] Number|Array|String The MIDI channel number (between 1 and 16) or an
   * array of channel numbers. If the special value "all" is used, the message will be sent to all
   * 16 channels.
   *
   * @param Object [options={}]
   *
   * @param DOMHighResTimeStamp|String [options.time=undefined] This value can be one of two
   * things. If the value is a string starting with the + sign and followed by a number, the request
   * will be delayed by the specified number (in milliseconds). Otherwise, the value is considered a
   * timestamp and the request will be scheduled at that timestamp. The `DOMHighResTimeStamp` value
   * is relative to the navigation start of the document. To retrieve the current time, you can use
   * `WebMidi.time`. If `time` is not present or is set to a time in the past, the request is to be
   * sent as soon as possible.
   *
   * @throws {RangeError} Controller numbers must be between 0 and 119.
   * @throws {RangeError} Value must be between 0 and 127.
   *
   * @return Output Returns the `Output` object so methods can be chained.
   */
  public sendControlChange = (
    controller: number | string,
    value: number,
    channel: number | Array<number | string> | string,
    options: any
  ): Output => {
    options = options || {};

    let controllernumber: number;

    if (typeof controller === "string") {
      controllernumber = MIDI_CONTROL_CHANGE_MESSAGES[controller];
      if (!controllernumber) {
        throw new TypeError("Invalid controller name.");
      }
    } else {
      controllernumber = +controller;
      if (!(controllernumber >= 0 && controllernumber <= 119)) {
        throw new RangeError("Controller numbers must be between 0 and 119.");
      }
    }

    value = value || 0;
    if (!(value >= 0 && value <= 127)) {
      throw new RangeError("Controller value must be between 0 and 127.");
    }

    this._convertChannelToArray(channel).forEach(ch => {
      this.send(
        // tslint:disable-next-line:no-bitwise
        (MIDI_CHANNEL_MESSAGES.controlchange << 4) + (ch - 1),
        [controllernumber, value],
        this._parseTimeParameter(options.time)
      );
    });

    return this;
  };

  /**
   * Selects a MIDI registered parameter so it is affected by data entry, data increment and data
   * decrement messages.
   *
   * @method _selectRegisteredParameter
   * @protected
   *
   * @param parameter Array A two-position array specifying the two control bytes (0x65, 0x64)
   * that identify the registered parameter.
   * @param channel
   * @param time
   *
   * @returns Output
   */
  private _selectRegisteredParameter = (
    parameter: number[],
    channel: number | string,
    time
  ): Output => {
    parameter[0] = +parameter[0];
    if (!(parameter[0] >= 0 && parameter[0] <= 127)) {
      throw new RangeError("The control65 value must be between 0 and 127");
    }

    parameter[1] = +parameter[1];
    if (!(parameter[1] >= 0 && parameter[1] <= 127)) {
      throw new RangeError("The control64 value must be between 0 and 127");
    }

    this._convertChannelToArray(channel).forEach(ch => {
      this.sendControlChange(0x65, parameter[0], channel, { time: time });
      this.sendControlChange(0x64, parameter[1], channel, { time: time });
    });

    return this;
  };

  /**
   * Selects a MIDI non-registered parameter so it is affected by data entry, data increment and
   * data decrement messages.
   *
   * @method _selectNonRegisteredParameter
   * @protected
   *
   * @param parameter Array}A two-position array specifying the two control bytes (0x63, 0x62)
   * that identify the registered parameter.
   * @param channel
   * @param time
   *
   * @returns Output
   */
  private _selectNonRegisteredParameter = (
    parameter: number[],
    channel: number | string,
    time
  ): Output => {
    parameter[0] = +parameter[0];
    if (!(parameter[0] >= 0 && parameter[0] <= 127)) {
      throw new RangeError("The control63 value must be between 0 and 127");
    }

    parameter[1] = +parameter[1];
    if (!(parameter[1] >= 0 && parameter[1] <= 127)) {
      throw new RangeError("The control62 value must be between 0 and 127");
    }

    this._convertChannelToArray(channel).forEach(ch => {
      this.sendControlChange(0x63, parameter[0], channel, { time: time });
      this.sendControlChange(0x62, parameter[1], channel, { time: time });
    });

    return this;
  };

  /**
   * Sets the value of the currently selected MIDI registered parameter.
   *
   * @method _setCurrentRegisteredParameter
   * @protected
   *
   * @param data int|Array
   * @param channel
   * @param time
   *
   * @returns Output
   */
  private _setCurrentRegisteredParameter = (
    data: number[],
    channel: number | string,
    time
  ): Output => {
    data[0] = +data[0];
    if (!(data[0] >= 0 && data[0] <= 127)) {
      throw new RangeError("The msb value must be between 0 and 127");
    }

    this._convertChannelToArray(channel).forEach(ch => {
      this.sendControlChange(0x06, data[0], channel, { time: time });
    });

    data[1] = +data[1];
    if (data[1] >= 0 && data[1] <= 127) {
      this._convertChannelToArray(channel).forEach(ch => {
        this.sendControlChange(0x26, data[1], channel, { time: time });
      });
    }

    return this;
  };

  /**
   * Deselects the currently active MIDI registered parameter so it is no longer affected by data
   * entry, data increment and data decrement messages.
   *
   * Current best practice recommends doing that after each call to
   * `_setCurrentRegisteredParameter()`.
   *
   * @method _deselectRegisteredParameter
   * @protected
   *
   * @param channel
   * @param time
   *
   * @returns Output
   */
  private _deselectRegisteredParameter = (
    channel: number | string,
    time
  ): Output => {
    this._convertChannelToArray(channel).forEach(ch => {
      this.sendControlChange(0x65, 0x7f, channel, { time: time });
      this.sendControlChange(0x64, 0x7f, channel, { time: time });
    });

    return this;
  };

  /**
   * Sets the specified MIDI registered parameter to the desired value. The value is defined with
   * up to two bytes of data that each can go from 0 to 127.
   *
   * >Unless you are very familiar with the MIDI standard you probably should favour one of the
   * >simpler to use functions such as: `setPitchbendRange()`, `setModulationRange()`,
   * >`setMasterTuning()`, etc.
   *
   * MIDI registered parameters extend the original list of control change messages. Currently,
   * there are only a limited number of them. Here are the original registered parameters with the
   * identifier that can be used as the first parameter of this function:
   *
   *  * Pitchbend Range (0x00, 0x00): `pitchbendrange`
   *  * Channel Fine Tuning (0x00, 0x01): `channelfinetuning`
   *  * Channel Coarse Tuning (0x00, 0x02): `channelcoarsetuning`
   *  * Tuning Program (0x00, 0x03): `tuningprogram`
   *  * Tuning Bank (0x00, 0x04): `tuningbank`
   *  * Modulation Range (0x00, 0x05): `modulationrange`
   *
   * Note that the **Tuning Program** and **Tuning Bank** parameters are part of the *MIDI Tuning
   * Standard*, which is not widely implemented.
   *
   * Another set of extra parameters have been later added for 3D sound controllers. They are:
   *
   *  * Azimuth Angle (0x3D, 0x00): `azimuthangle`
   *  * Elevation Angle (0x3D, 0x01): `elevationangle`
   *  * Gain (0x3D, 0x02): `gain`
   *  * Distance Ratio (0x3D, 0x03): `distanceratio`
   *  * Maximum Distance (0x3D, 0x04): `maximumdistance`
   *  * Maximum Distance Gain (0x3D, 0x05): `maximumdistancegain`
   *  * Reference Distance Ratio (0x3D, 0x06): `referencedistanceratio`
   *  * Pan Spread Angle (0x3D, 0x07): `panspreadangle`
   *  * Roll Angle (0x3D, 0x08): `rollangle`
   *
   * @method setRegisteredParameter
   * @chainable
   *
   * @param parameter String|Array A string identifying the parameter's name (see above) or a
   * two-position array specifying the two control bytes (0x65, 0x64) that identify the registered
   * parameter.
   *
   * @param [data=[]] Number|Array An single integer or an array of integers with a maximum length
   * of 2 specifying the desired data.
   *
   * @param [channel=all] Number|Array|String The MIDI channel number (between 1 and 16) or an
   * array of channel numbers. If the special value "all" is used, the message will be sent to all
   * 16 channels.
   *
   * @param Object [options={}]
   *
   * @param DOMHighResTimeStamp|String [options.time=undefined] This value can be one of two
   * things. If the value is a string starting with the + sign and followed by a number, the request
   * will be delayed by the specified number (in milliseconds). Otherwise, the value is considered a
   * timestamp and the request will be scheduled at that timestamp. The `DOMHighResTimeStamp` value
   * is relative to the navigation start of the document. To retrieve the current time, you can use
   * `WebMidi.time`. If `time` is not present or is set to a time in the past, the request is to be
   * sent as soon as possible.
   *
   * @returns Output Returns the `Output` object so methods can be chained.
   */
  public setRegisteredParameter = (
    parameter: number[] | string,
    data: number | number[],
    channel: number | string,
    options: any
  ): Output => {
    options = options || {};

    let parameterArray: number[];

    if (typeof parameter === "string") {
      if (!MIDI_REGISTERED_PARAMETER[parameter]) {
        throw new Error("The specified parameter is not available.");
      }
      const parameterNumber = MIDI_REGISTERED_PARAMETER[parameter];
      parameterArray = Helper.toArray(parameterNumber);
    } else {
      parameterArray = parameter;
    }

    const dataArray = [].concat(data);

    this._convertChannelToArray(channel).forEach(ch => {
      this._selectRegisteredParameter(parameterArray, channel, options.time);
      this._setCurrentRegisteredParameter(dataArray, channel, options.time);
      this._deselectRegisteredParameter(channel, options.time);
    });

    return this;
  };

  /**
   * Sets a non-registered parameter to the specified value. The NRPN is selected by passing in a
   * two-position array specifying the values of the two control bytes. The value is specified by
   * passing in an single integer (most cases) or an array of two integers.
   *
   * NRPNs are not standardized in any way. Each manufacturer is free to implement them any way
   * they see fit. For example, according to the Roland GS specification, you can control the
   * **vibrato rate** using NRPN (1, 8). Therefore, to set the **vibrato rate** value to **123** you
   * would use:
   *
   *     WebMidi.outputs[0].setNonRegisteredParameter([1, 8], 123);
   *
   * Obviously, you should select a channel so the message is not sent to all channels. For
   * instance, to send to channel 1 of the first output port, you would use:
   *
   *     WebMidi.outputs[0].setNonRegisteredParameter([1, 8], 123, 1);
   *
   * In some rarer cases, you need to send two values with your NRPN messages. In such cases, you
   * would use a 2-position array. For example, for its **ClockBPM** parameter (2, 63), Novation
   * uses a 14-bit value that combines an MSB and an LSB (7-bit values). So, for example, if the
   * value to send was 10, you could use:
   *
   *     WebMidi.outputs[0].setNonRegisteredParameter([2, 63], [0, 10]);
   *
   * For further implementation details, refer to the manufacturer's documentation.
   *
   * @method setNonRegisteredParameter
   * @chainable
   *
   * @param parameter {Array} A two-position array specifying the two control bytes (0x63,
   * 0x62) that identify the non-registered parameter.
   *
   * @param [data=[]] {Number|Array} An integer or an array of integers with a length of 1 or 2
   * specifying the desired data.
   *
   * @param [channel=all] {Number|Array|String} The MIDI channel number (between 1 and 16) or an
   * array of channel numbers. If the special value "all" is used, the message will be sent to all
   * 16 channels.
   *
   * @param Object [options={}]
   *
   * @param DOMHighResTimeStamp|String [options.time=undefined] This value can be one of two
   * things. If the value is a string starting with the + sign and followed by a number, the request
   * will be delayed by the specified number (in milliseconds). Otherwise, the value is considered a
   * timestamp and the request will be scheduled at that timestamp. The `DOMHighResTimeStamp` value
   * is relative to the navigation start of the document. To retrieve the current time, you can use
   * `WebMidi.time`. If `time` is not present or is set to a time in the past, the request is to be
   * sent as soon as possible.
   *
   * @returns Output Returns the `Output` object so methods can be chained.
   */
  public setNonRegisteredParameter = (
    parameter: number[],
    data: number | number[],
    channel: number | string,
    options: any
  ): Output => {
    options = options || {};

    if (
      !(parameter[0] >= 0 && parameter[0] <= 127) ||
      !(parameter[1] >= 0 && parameter[1] <= 127)
    ) {
      throw new Error(
        "Position 0 and 1 of the 2-position parameter array must both be between 0 and 127."
      );
    }

    const dataArray = [].concat(data);

    this._convertChannelToArray(channel).forEach(ch => {
      this._selectNonRegisteredParameter(parameter, channel, options.time);
      this._setCurrentRegisteredParameter(dataArray, channel, options.time);
      this._deselectRegisteredParameter(channel, options.time);
    });

    return this;
  };

  /**
   * Increments the specified MIDI registered parameter by 1. For more specific MIDI usage
   * information, check out [RP-18](http://dev.midi.org/techspecs/rp18.php) regarding the usage of
   * increment and decrement controllers.
   *
   * >Unless you are very familiar with the MIDI standard you probably should favour one of the
   * >simpler to use functions such as: `setPitchbendRange()`, `setModulationRange()`,
   * >`setMasterTuning()`, etc.
   *
   * Here is the full list of parameter names that can be used with this function:
   *
   *  * Pitchbend Range (0x00, 0x00): `pitchbendrange`
   *  * Channel Fine Tuning (0x00, 0x01): `channelfinetuning`
   *  * Channel Coarse Tuning (0x00, 0x02): `channelcoarsetuning`
   *  * Tuning Program (0x00, 0x03): `tuningprogram`
   *  * Tuning Bank (0x00, 0x04): `tuningbank`
   *  * Modulation Range (0x00, 0x05): `modulationrange`
   *  * Azimuth Angle (0x3D, 0x00): `azimuthangle`
   *  * Elevation Angle (0x3D, 0x01): `elevationangle`
   *  * Gain (0x3D, 0x02): `gain`
   *  * Distance Ratio (0x3D, 0x03): `distanceratio`
   *  * Maximum Distance (0x3D, 0x04): `maximumdistance`
   *  * Maximum Distance Gain (0x3D, 0x05): `maximumdistancegain`
   *  * Reference Distance Ratio (0x3D, 0x06): `referencedistanceratio`
   *  * Pan Spread Angle (0x3D, 0x07): `panspreadangle`
   *  * Roll Angle (0x3D, 0x08): `rollangle`
   *
   * @method incrementRegisteredParameter
   * @chainable
   *
   * @param parameter String|Array A string identifying the parameter's name (see above) or a
   * two-position array specifying the two control bytes (0x65, 0x64) that identify the registered
   * parameter.
   *
   * @param [channel=all] {uint|Array|String} The MIDI channel number (between 1 and 16) or an
   * array of channel numbers. If the special value "all" is used, the message will be sent to all
   * 16 channels.
   *
   * @param Object [options={}]
   *
   * @param DOMHighResTimeStamp|String [options.time=undefined] This value can be one of two
   * things. If the value is a string starting with the + sign and followed by a number, the request
   * will be delayed by the specified number (in milliseconds). Otherwise, the value is considered a
   * timestamp and the request will be scheduled at that timestamp. The `DOMHighResTimeStamp` value
   * is relative to the navigation start of the document. To retrieve the current time, you can use
   * `WebMidi.time`. If `time` is not present or is set to a time in the past, the request is to be
   * sent as soon as possible.
   *
   * @throws Error The specified parameter is not available.
   *
   * @returns Output Returns the `Output` object so methods can be chained.
   */
  public incrementRegisteredParameter = (
    parameter: number[] | string,
    channel: number | string,
    options: any
  ): Output => {
    options = options || {};

    let parameterArray: number[];
    if (typeof parameter === "string") {
      if (!MIDI_REGISTERED_PARAMETER[parameter]) {
        throw new Error("The specified parameter is not available.");
      }
      const parameterNumber = MIDI_REGISTERED_PARAMETER[parameter];
      parameterArray = Helper.toArray(parameterNumber);
    } else {
      parameterArray = parameter;
    }

    this._convertChannelToArray(channel).forEach(ch => {
      this._selectRegisteredParameter(parameterArray, channel, options.time);
      this.sendControlChange(0x60, 0, channel, { time: options.time });
      this._deselectRegisteredParameter(channel, options.time);
    });

    return this;
  };

  /**
   * Decrements the specified MIDI registered parameter by 1. For more specific MIDI usage
   * information, check out [RP-18](http://dev.midi.org/techspecs/rp18.php) regarding the usage of
   * increment and decrement controllers.
   *
   * >Unless you are very familiar with the MIDI standard you probably should favour one of the
   * >simpler to use functions such as: `setPitchbendRange()`, `setModulationRange()`,
   * >`setMasterTuning()`, etc.
   *
   * Here is the full list of parameter names that can be used with this function:
   *
   *  * Pitchbend Range (0x00, 0x00): `pitchbendrange`
   *  * Channel Fine Tuning (0x00, 0x01): `channelfinetuning`
   *  * Channel Coarse Tuning (0x00, 0x02): `channelcoarsetuning`
   *  * Tuning Program (0x00, 0x03): `tuningprogram`
   *  * Tuning Bank (0x00, 0x04): `tuningbank`
   *  * Modulation Range (0x00, 0x05): `modulationrange`
   *  * Azimuth Angle (0x3D, 0x00): `azimuthangle`
   *  * Elevation Angle (0x3D, 0x01): `elevationangle`
   *  * Gain (0x3D, 0x02): `gain`
   *  * Distance Ratio (0x3D, 0x03): `distanceratio`
   *  * Maximum Distance (0x3D, 0x04): `maximumdistance`
   *  * Maximum Distance Gain (0x3D, 0x05): `maximumdistancegain`
   *  * Reference Distance Ratio (0x3D, 0x06): `referencedistanceratio`
   *  * Pan Spread Angle (0x3D, 0x07): `panspreadangle`
   *  * Roll Angle (0x3D, 0x08): `rollangle`
   *
   * @method decrementRegisteredParameter
   * @chainable
   *
   * @param parameter String|Array A string identifying the parameter's name (see above) or a
   * two-position array specifying the two control bytes (0x65, 0x64) that identify the registered
   * parameter.
   *
   * @param [channel=all] Number|Array|String The MIDI channel number (between 1 and 16) or an
   * array of channel numbers. If the special value "all" is used, the message will be sent to all
   * 16 channels.
   *
   * @param Object [options={}]
   *
   * @param DOMHighResTimeStamp|String [options.time=undefined] This value can be one of two
   * things. If the value is a string starting with the + sign and followed by a number, the request
   * will be delayed by the specified number (in milliseconds). Otherwise, the value is considered a
   * timestamp and the request will be scheduled at that timestamp. The `DOMHighResTimeStamp` value
   * is relative to the navigation start of the document. To retrieve the current time, you can use
   * `WebMidi.time`. If `time` is not present or is set to a time in the past, the request is to be
   * sent as soon as possible.
   *
   * @throws TypeError The specified parameter is not available.
   *
   * @returns Output Returns the `Output` object so methods can be chained.
   */
  public decrementRegisteredParameter = (
    parameter: number[] | string,
    channel: number | string,
    options: any
  ): Output => {
    options = options || {};

    let parameterArray: number[];
    if (typeof parameter === "string") {
      if (!MIDI_REGISTERED_PARAMETER[parameter]) {
        throw new Error("The specified parameter is not available.");
      }
      const parameterNumber = MIDI_REGISTERED_PARAMETER[parameter];
      parameterArray = Helper.toArray(parameterNumber);
    } else {
      parameterArray = parameter;
    }

    this._convertChannelToArray(channel).forEach(ch => {
      this._selectRegisteredParameter(parameterArray, channel, options.time);
      this.sendControlChange(0x61, 0, channel, { time: options.time });
      this._deselectRegisteredParameter(channel, options.time);
    });

    return this;
  };

  /**
   * Sends a pitch bend range message to the specified channel(s) at the scheduled time so that they
   * adjust the range used by their pitch bend lever. The range can be specified with the `semitones`
   * parameter, the `cents` parameter or by specifying both parameters at the same time.
   *
   * @method setPitchBendRange
   * @chainable
   *
   * @param [semitones=0] Number The desired adjustment value in semitones (integer between
   * 0-127). While nothing imposes that in the specification, it is very common for manufacturers to
   * limit the range to 2 octaves (-12 semitones to 12 semitones).
   *
   * @param [cents=0] Number The desired adjustment value in cents (integer between 0-127).
   *
   * @param [channel=all] Number|Array|String The MIDI channel number (between 1 and 16) or an
   * array of channel numbers. If the special value "all" is used, the message will be sent to all
   * 16 channels.
   *
   * @param Object [options={}]
   *
   * @param DOMHighResTimeStamp|String [options.time=undefined] This value can be one of two
   * things. If the value is a string starting with the + sign and followed by a number, the request
   * will be delayed by the specified number (in milliseconds). Otherwise, the value is considered a
   * timestamp and the request will be scheduled at that timestamp. The `DOMHighResTimeStamp` value
   * is relative to the navigation start of the document. To retrieve the current time, you can use
   * `WebMidi.time`. If `time` is not present or is set to a time in the past, the request is to be
   * sent as soon as possible.
   *
   * @throws {RangeError} The semitones value must be between 0 and 127.
   * @throws {RangeError} The cents value must be between 0 and 127.
   *
   * @return Output Returns the `Output` object so methods can be chained.
   */
  public setPitchBendRange = (
    semitones: number,
    cents: number,
    channel: number | string | Array<number | string>,
    options: any
  ): Output => {
    options = options || {};

    semitones = +semitones || 0;
    if (!(semitones >= 0 && semitones <= 127)) {
      throw new RangeError("The semitones value must be between 0 and 127");
    }

    cents = +cents || 0;
    if (!(cents >= 0 && cents <= 127)) {
      throw new RangeError("The cents value must be between 0 and 127");
    }

    this._convertChannelToArray(channel).forEach(ch => {
      this.setRegisteredParameter("pitchbendrange", [semitones, cents], ch, {
        time: options.time
      });
    });

    return this;
  };

  /**
   * Sends a modulation depth range message to the specified channel(s) so that they adjust the
   * depth of their modulation wheel's range. The range can be specified with the `semitones`
   * parameter, the `cents` parameter or by specifying both parameters at the same time.
   *
   * @method setModulationRange
   * @chainable
   *
   * @param [semitones=0] {Number} The desired adjustment value in semitones (integer between
   * 0-127).
   *
   * @param [cents=0] {Number} The desired adjustment value in cents (0-127).
   *
   * @param [channel=all] {Number|Array|String} The MIDI channel number (between 1 and 16) or an
   * array of channel numbers. If the special value "all" is used, the message will be sent to all
   * 16 channels.
   *
   * @param Object [options={}]
   *
   * @param DOMHighResTimeStamp|String [options.time=undefined] This value can be one of two
   * things. If the value is a string starting with the + sign and followed by a number, the request
   * will be delayed by the specified number (in milliseconds). Otherwise, the value is considered a
   * timestamp and the request will be scheduled at that timestamp. The `DOMHighResTimeStamp` value
   * is relative to the navigation start of the document. To retrieve the current time, you can use
   * `WebMidi.time`. If `time` is not present or is set to a time in the past, the request is to be
   * sent as soon as possible.
   *
   * @throws {RangeError} The semitones value must be between 0 and 127.
   * @throws {RangeError} The cents value must be between 0 and 127.
   *
   * @return Output Returns the `Output` object so methods can be chained.
   */
  public setModulationRange = (
    semitones: number,
    cents: number,
    channel: number | string | Array<number | string>,
    options: any
  ): Output => {
    options = options || {};

    semitones = semitones || 0;
    if (!(semitones >= 0 && semitones <= 127)) {
      throw new RangeError("The semitones value must be between 0 and 127");
    }

    cents = cents || 0;
    if (!(cents >= 0 && cents <= 127)) {
      throw new RangeError("The cents value must be between 0 and 127");
    }

    this._convertChannelToArray(channel).forEach(ch => {
      this.setRegisteredParameter("modulationrange", [semitones, cents], ch, {
        time: options.time
      });
    });

    return this;
  };

  /**
   * Sends a master tuning message to the specified channel(s). The value is decimal and must be
   * larger than -65 semitones and smaller than 64 semitones.
   *
   * >Because of the way the MIDI specification works, the decimal portion of the value will be
   * >encoded with a resolution of 14bit. The integer portion must be between -64 and 63
   * >inclusively. For those familiar with the MIDI protocol, this function actually generates
   * >**Master Coarse Tuning** and **Master Fine Tuning** RPN messages.
   *
   * @method setMasterTuning
   * @chainable
   *
   * @param [value=0.0] {Number} The desired decimal adjustment value in semitones (-65 < x < 64)
   *
   * @param [channel=all] {Number|Array|String} The MIDI channel number (between 1 and 16) or an
   * array of channel numbers. If the special value "all" is used, the message will be sent to all
   * 16 channels.
   *
   * @param Object [options={}]
   *
   * @param DOMHighResTimeStamp|String [options.time=undefined] This value can be one of two
   * things. If the value is a string starting with the + sign and followed by a number, the request
   * will be delayed by the specified number (in milliseconds). Otherwise, the value is considered a
   * timestamp and the request will be scheduled at that timestamp. The `DOMHighResTimeStamp` value
   * is relative to the navigation start of the document. To retrieve the current time, you can use
   * `WebMidi.time`. If `time` is not present or is set to a time in the past, the request is to be
   * sent as soon as possible.
   *
   * @throws {RangeError} The value must be a decimal number between larger than -65 and smaller
   * than 64.
   *
   * @return Output Returns the `Output` object so methods can be chained.
   */
  public setMasterTuning = (
    value: number,
    channel: number | string | Array<string | number>,
    options: any
  ): Output => {
    options = options || {};

    value = value || 0.0;

    if (value <= -65 || value >= 64) {
      throw new RangeError(
        "The value must be a decimal number larger than -65 and smaller than 64."
      );
    }

    const coarse = Math.floor(+value) + 64;
    let fine = value - Math.floor(+value);

    // Calculate MSB and LSB for fine adjustment (14bit resolution)
    fine = Math.round((fine + 1) / 2 * 16383);
    const msb = (fine >> 7) & 0x7f;
    const lsb = fine & 0x7f;

    this._convertChannelToArray(channel).forEach(ch => {
      this.setRegisteredParameter("channelcoarsetuning", coarse, ch, {
        time: options.time
      });
      this.setRegisteredParameter("channelfinetuning", [msb, lsb], ch, {
        time: options.time
      });
    });

    return this;
  };

  /**
   * Sets the MIDI tuning program to use. Note that the **Tuning Program** parameter is part of the
   * *MIDI Tuning Standard*, which is not widely implemented.
   *
   * @method setTuningProgram
   * @chainable
   *
   * @param value Number The desired tuning program (0-127).
   *
   * @param [channel=all] {Number|Array|String} The MIDI channel number (between 1 and 16) or an
   * array of channel numbers. If the special value "all" is used, the message will be sent to all
   * 16 channels.
   *
   * @param Object [options={}]
   *
   * @param DOMHighResTimeStamp|String [options.time=undefined] This value can be one of two
   * things. If the value is a string starting with the + sign and followed by a number, the request
   * will be delayed by the specified number (in milliseconds). Otherwise, the value is considered a
   * timestamp and the request will be scheduled at that timestamp. The `DOMHighResTimeStamp` value
   * is relative to the navigation start of the document. To retrieve the current time, you can use
   * `WebMidi.time`. If `time` is not present or is set to a time in the past, the request is to be
   * sent as soon as possible.
   *
   * @throws {RangeError} The program value must be between 0 and 127.
   *
   * @return Output Returns the `Output` object so methods can be chained.
   */
  public setTuningProgram = (
    value: number,
    channel: number | string | Array<number | string>,
    options: any
  ): Output => {
    options = options || {};

    value = +value;
    if (!(value >= 0 && value <= 127)) {
      throw new RangeError("The program value must be between 0 and 127");
    }

    this._convertChannelToArray(channel).forEach(ch => {
      this.setRegisteredParameter("tuningprogram", value, ch, {
        time: options.time
      });
    });

    return this;
  };

  /**
   * Sets the MIDI tuning bank to use. Note that the **Tuning Bank** parameter is part of the
   * *MIDI Tuning Standard*, which is not widely implemented.
   *
   * @method setTuningBank
   * @chainable
   *
   * @param value Number The desired tuning bank (0-127).
   *
   * @param [channel=all] {Number|Array|String} The MIDI channel number (between 1 and 16) or an
   * array of channel numbers. If the special value "all" is used, the message will be sent to all
   * 16 channels.
   *
   * @param Object [options={}]
   *
   * @param DOMHighResTimeStamp|String [options.time=undefined] This value can be one of two
   * things. If the value is a string starting with the + sign and followed by a number, the request
   * will be delayed by the specified number (in milliseconds). Otherwise, the value is considered a
   * timestamp and the request will be scheduled at that timestamp. The `DOMHighResTimeStamp` value
   * is relative to the navigation start of the document. To retrieve the current time, you can use
   * `WebMidi.time`. If `time` is not present or is set to a time in the past, the request is to be
   * sent as soon as possible.
   *
   * @throws {RangeError} The bank value must be between 0 and 127.
   *
   * @return Output Returns the `Output` object so methods can be chained.
   */
  public setTuningBank = (
    value: number,
    channel: number | string | Array<number | string>,
    options: any
  ): Output => {
    options = options || {};

    value = +value || 0;
    if (!(value >= 0 && value <= 127)) {
      throw new RangeError("The bank value must be between 0 and 127");
    }

    this._convertChannelToArray(channel).forEach(ch => {
      this.setRegisteredParameter("tuningbank", value, ch, {
        time: options.time
      });
    });

    return this;
  };

  /**
   * Sends a MIDI `channel mode` message to the specified channel(s). The channel mode message to send can be specified
   * numerically or by using one of the following common names:
   *
   *   * `allsoundoff` (#120)
   *   * `resetallcontrollers` (#121)
   *   * `localcontrol` (#122)
   *   * `allnotesoff` (#123)
   *   * `omnimodeoff` (#124)
   *   * `omnimodeon` (#125)
   *   * `monomodeon` (#126)
   *   * `polymodeon` (#127)
   *
   * It should be noted that, per the MIDI specification, only `localcontrol` and `monomodeon` may require a value
   * that's not zero. For that reason, the `value` parameter is optional and defaults to 0.
   *
   * @method sendChannelMode
   * @chainable
   *
   * @param command Number|String The numerical identifier of the channel mode message (integer between 120-127) or
   * its name as a string.
   * @param [value=0] {Number} The value to send (integer between 0-127).
   * @param [channel=all] {Number|Array|String} The MIDI channel number (between 1 and 16) or an array of channel
   * numbers. If the special value "all" is used, the message will be sent to all 16 channels.
   * @param Object [options={}]
   * @param DOMHighResTimeStamp|String [options.time=undefined] This value can be one of two things. If the value is
   * a string starting with the + sign and followed by a number, the request will be delayed by the specified number
   * (in milliseconds). Otherwise, the value is considered a timestamp and the request will be scheduled at that
   * timestamp. The `DOMHighResTimeStamp` value is relative to the navigation start of the document. To retrieve the
   * current time, you can use `WebMidi.time`. If `time` is not present or is set to a time in the past, the request is
   * to be sent as soon as possible.
   *
   * @throws {TypeError} Invalid channel mode message name.
   * @throws {RangeError} Channel mode controller numbers must be between 120 and 127.
   * @throws {RangeError} Value must be an integer between 0 and 127.
   *
   * @return Output Returns the `Output` object so methods can be chained.
   *
   */
  public sendChannelMode = (
    command: number | string,
    value: number,
    channel: number | string | Array<number | string>,
    options: any
  ): Output => {
    options = options || {};
    const com: number = +command;

    if (typeof command === "string") {
      command = MIDI_CHANNEL_MODE_MESSAGES[command];

      if (!command) {
        throw new TypeError("Invalid channel mode message name.");
      }
    } else {
      if (!(com >= 120 && com <= 127)) {
        throw new RangeError(
          "Channel mode numerical identifiers must be between 120 and 127."
        );
      }
    }

    value = value || 0;

    if (value < 0 || value > 127) {
      throw new RangeError("Value must be an integer between 0 and 127.");
    }

    this._convertChannelToArray(channel).forEach(ch => {
      this.send(
        // tslint:disable-next-line:no-bitwise
        (MIDI_CHANNEL_MESSAGES.channelmode << 4) + (ch - 1),
        [com, value],
        this._parseTimeParameter(options.time)
      );
    });

    return this;
  };

  /**
   * Sends a MIDI `program change` message to the specified channel(s) at the scheduled time.
   *
   * @method sendProgramChange
   * @chainable
   *
   * @param program Number The MIDI patch (program) number (0-127)
   *
   * @param [channel=all] Number|Array|String The MIDI channel number (between 1 and 16) or an
   * array of channel numbers. If the special value "all" is used, the message will be sent to all
   * 16 channels.
   *
   * @param Object [options={}]
   *
   * @param DOMHighResTimeStamp|String [options.time=undefined] This value can be one of two
   * things. If the value is a string starting with the + sign and followed by a number, the request
   * will be delayed by the specified number (in milliseconds). Otherwise, the value is considered a
   * timestamp and the request will be scheduled at that timestamp. The `DOMHighResTimeStamp` value
   * is relative to the navigation start of the document. To retrieve the current time, you can use
   * `WebMidi.time`. If `time` is not present or is set to a time in the past, the request is to be
   * sent as soon as possible.
   *
   * @throws {RangeError} Program numbers must be between 0 and 127.
   *
   * @return Output Returns the `Output` object so methods can be chained.
   *
   */
  public sendProgramChange = (
    program: number,
    channel: number | string | Array<number | string>,
    options: any
  ): Output => {
    options = options || {};

    if (isNaN(program) || program < 0 || program > 127) {
      throw new RangeError("Program numbers must be between 0 and 127.");
    }

    this._convertChannelToArray(channel).forEach(ch => {
      this.send(
        // tslint:disable-next-line:no-bitwise
        (MIDI_CHANNEL_MESSAGES.programchange << 4) + (ch - 1),
        [program],
        this._parseTimeParameter(options.time)
      );
    });

    return this;
  };

  /**
   * Sends a MIDI `channel aftertouch` message to the specified channel(s). For key-specific
   * aftertouch, you should instead use `sendKeyAftertouch()`.
   *
   * @method sendChannelAftertouch
   * @chainable
   *
   * @param [pressure=0.5] Number The pressure level (between 0 and 1). An invalid pressure value
   * will silently trigger the default behaviour.
   *
   * @param [channel=all] Number|Array|String  The MIDI channel number (between 1 and 16) or
   * an array of channel numbers. If the special value "all" is used, the message will be sent to
   * all 16 channels.
   *
   * @param Object [options={}]
   *
   * @param DOMHighResTimeStamp|String [options.time=undefined] This value can be one of two
   * things. If the value is a string starting with the + sign and followed by a number, the request
   * will be delayed by the specified number (in milliseconds). Otherwise, the value is considered a
   * timestamp and the request will be scheduled at that timestamp. The `DOMHighResTimeStamp` value
   * is relative to the navigation start of the document. To retrieve the current time, you can use
   * `WebMidi.time`. If `time` is not present or is set to a time in the past, the request is to be
   * sent as soon as possible.
   *
   * @return Output Returns the `Output` object so methods can be chained.
   */
  public sendChannelAftertouch = (
    pressure: number,
    channel: number | string | Array<number | string>,
    options: any
  ): Output => {
    options = options || {};

    if (isNaN(pressure) || pressure < 0 || pressure > 1) {
      pressure = 0.5;
    }

    const nPressure = Math.round(pressure * 127);

    this._convertChannelToArray(channel).forEach(ch => {
      this.send(
        // tslint:disable-next-line:no-bitwise
        (MIDI_CHANNEL_MESSAGES.channelaftertouch << 4) + (ch - 1),
        [nPressure],
        this._parseTimeParameter(options.time)
      );
    });

    return this;
  };

  /**
   * Sends a MIDI `pitch bend` message to the specified channel(s) at the scheduled time.
   *
   * @method sendPitchBend
   * @chainable
   *
   * @param bend Number The intensity level of the bend (between -1 and 1). A value of zero means
   * no bend.
   *
   * @param [channel=all] Number|Array|String  The MIDI channel number (between 1 and 16) or an
   * array of channel numbers. If the special value "all" is used, the message will be sent to all
   * 16 channels.
   *
   * @param Object [options={}]
   *
   * @param DOMHighResTimeStamp|String [options.time=undefined] This value can be one of two
   * things. If the value is a string starting with the + sign and followed by a number, the request
   * will be delayed by the specified number (in milliseconds). Otherwise, the value is considered a
   * timestamp and the request will be scheduled at that timestamp. The `DOMHighResTimeStamp` value
   * is relative to the navigation start of the document. To retrieve the current time, you can use
   * `WebMidi.time`. If `time` is not present or is set to a time in the past, the request is to be
   * sent as soon as possible.
   *
   * @throws {RangeError} Pitch bend value must be between -1 and 1.
   *
   * @return Output Returns the `Output` object so methods can be chained.
   */
  public sendPitchBend = (
    bend: number,
    channel: number | string | Array<number | string>,
    options: any
  ): Output => {
    options = options || {};

    if (isNaN(bend) || bend < -1 || bend > 1) {
      throw new RangeError("Pitch bend value must be between -1 and 1.");
    }

    const nLevel = Math.round((bend + 1) / 2 * 16383);
    // tslint:disable-next-line:no-bitwise
    const msb = (nLevel >> 7) & 0x7f;
    // tslint:disable-next-line:no-bitwise
    const lsb = nLevel & 0x7f;

    this._convertChannelToArray(channel).forEach(ch => {
      this.send(
        // tslint:disable-next-line:no-bitwise
        (MIDI_CHANNEL_MESSAGES.pitchbend << 4) + (ch - 1),
        [lsb, msb],
        this._parseTimeParameter(options.time)
      );
    });

    return this;
  };

  /**
   * Returns a timestamp, relative to the navigation start of the document, derived from the `time`
   * parameter. If the parameter is a string starting with the "+" sign and followed by a number,
   * the resulting value will be the sum of the current timestamp plus that number. Otherwise, the
   * value will be returned as is.
   *
   * If the calculated return value is 0, less than zero or an otherwise invalid value, `undefined`
   * will be returned.
   *
   * @method _parseTimeParameter
   * @param [time] Number|String
   * @return DOMHighResTimeStamp
   * @protected
   */
  private _parseTimeParameter = (time: number | string): number => {
    let parsed, value;

    if (typeof time === "string" && time.substring(0, 1) === "+") {
      parsed = parseFloat(time);
      if (parsed && parsed > 0) {
        value = performance.now() + parsed;
      }
    } else {
      parsed = +time;
      if (parsed > performance.now()) {
        value = parsed;
      }
    }

    return value;
  };

  /**
   * Converts an input value (which can be a uint, a string or an array of the previous two) to an
   * array of MIDI note numbers.
   *
   * @method _convertNoteToArray
   * @param [note] Number|Array|String
   * @returns Array
   * @protected
   */
  private _convertNoteToArray = (
    note: number | string | Array<number | string>
  ): number[] => {
    const notes = [];

    if (!Array.isArray(note)) {
      note = [note];
    }

    note.forEach(item => {
      notes.push(MidiService.guessNoteNumber(item));
    });

    return notes;
  };

  /**
   * Converts an input value (which can be an int, an array or the value "all" to an array of valid
   * MIDI channels. If `undefined` is provided as the channel, an array of all channels will be
   * returned.
   *
   * @method _convertChannelToArray
   * @param [channel] {uint|Array}
   * @returns Array
   * @protected
   */
  private _convertChannelToArray = (
    channel: string | number | Array<string | number>
  ): number[] => {
    if (channel === "all" || channel === undefined) {
      channel = ["all"];
    }

    if (!Array.isArray(channel)) {
      channel = [channel];
    }

    if (channel.indexOf("all") > -1) {
      channel = [];
      for (let i = 1; i <= MIDI_CHANNEL_COUNT; i++) {
        channel.push(i);
      }
    }

    channel.forEach(ch => {
      if (!(ch >= 1 && ch <= 16)) {
        throw new RangeError("MIDI channels must be between 1 and 16.");
      }
    });

    return <number[]>channel;
  };

  /**
   * @method _onMidiMessage
   * @protected
   */
  public _onMidiMessage = e => {
    // Not implemented.
  };

  // tslint:disable-next-line:max-file-line-count
}
