import { Observable } from "rxjs/Observable";
import {
  MIDI_SYSTEM_MESSAGES,
  MIDI_CHANNEL_MESSAGES,
  Notes,
  MIDI_CONTROL_CHANGE_MESSAGES,
  MIDI_CHANNEL_MODE_MESSAGES,
  MIDI_CHANNEL_COUNT,
  SEMITONE_COUNT,
  CHANNEL_SPECIFIC_MESSAGE
} from "./enums";
import { MidiService } from "./midi.service";

export class Input {
  private _userHandlers = { channel: {}, system: {} };

  /**
   * The `Input` object represents a MIDI input port on the host system. This object is created by
   * the MIDI subsystem and cannot be instantiated directly.
   *
   * You will find all available `Input` objects in the `WebMidi.inputs` array.
   *
   * @param midiInput `MIDIInput` object
   */
  constructor(private midiService: MidiService, public _midiInput: any) {
    this._initializeUserHandlers();
  }

  /**
   * [read-only] Status of the MIDI port's connection (`pending`, `open` or `closed`)
   *
   * @property connection
   */
  public get connection(): string {
    return this._midiInput.connection;
  }

  /**
   * [read-only] ID string of the MIDI port. The ID is host-specific. Do not expect the same ID
   * on different platforms. For example, Google Chrome and the Jazz-Plugin report completely
   * different IDs for the same port.
   *
   * @property id
   */
  public get id(): string {
    return this._midiInput.id;
  }

  /**
   * [read-only] Name of the manufacturer of the device that makes this port available.
   *
   * @property manufacturer
   */
  public get manufacturer(): string {
    return this._midiInput.manufacturerd;
  }

  /**
   * [read-only] Name of the MIDI port
   *
   * @property name
   */
  public get name(): string {
    return this._midiInput.name;
  }

  /**
   * [read-only] State of the MIDI port (`connected` or `disconnected`)
   *
   * @property state
   */
  public get state(): string {
    return this._midiInput.state;
  }

  /**
   * [read-only] Type of the MIDI port (`input`)
   *
   * @property type
   */
  public get type(): string {
    return this._midiInput.type;
  }

  /**
   * Adds an event listener to the `Input` that will trigger a function callback when the specified
   * event happens on the specified channel(s). Here is a list of events that are dispatched by
   * `Input` objects and that can be listened to.
   *
   * Channel-specific MIDI events:
   *
   *    * {{#crossLink "Input/noteoff:event"}}noteoff{{/crossLink}}
   *    * {{#crossLink "Input/noteon:event"}}noteon{{/crossLink}}
   *    * {{#crossLink "Input/keyaftertouch:event"}}keyaftertouch{{/crossLink}}
   *    * {{#crossLink "Input/controlchange:event"}}controlchange{{/crossLink}}
   *    * {{#crossLink "Input/channelmode:event"}}channelmode{{/crossLink}}
   *    * {{#crossLink "Input/programchange:event"}}programchange{{/crossLink}}
   *    * {{#crossLink "Input/channelaftertouch:event"}}channelaftertouch{{/crossLink}}
   *    * {{#crossLink "Input/pitchbend:event"}}pitchbend{{/crossLink}}
   *
   * Device-wide MIDI events:
   *
   *    * {{#crossLink "Input/sysex:event"}}sysex{{/crossLink}}
   *    * {{#crossLink "Input/timecode:event"}}timecode{{/crossLink}}
   *    * {{#crossLink "Input/songposition:event"}}songposition{{/crossLink}}
   *    * {{#crossLink "Input/songselect:event"}}songselect{{/crossLink}}
   *    * {{#crossLink "Input/tuningrequest:event"}}tuningrequest{{/crossLink}}
   *    * {{#crossLink "Input/clock:event"}}clock{{/crossLink}}
   *    * {{#crossLink "Input/start:event"}}start{{/crossLink}}
   *    * {{#crossLink "Input/continue:event"}}continue{{/crossLink}}
   *    * {{#crossLink "Input/stop:event"}}stop{{/crossLink}}
   *    * {{#crossLink "Input/activesensing:event"}}activesensing{{/crossLink}}
   *    * {{#crossLink "Input/reset:event"}}reset{{/crossLink}}
   *    * {{#crossLink "Input/unknownsystemmessage:event"}}unknownsystemmessage{{/crossLink}}
   *
   * For device-wide events, the `channel` parameter will be silently ignored. You can simply use
   * `undefined` in that case.
   *
   * @method addListener
   * @chainable
   *
   * @param type String The type of the event.
   *
   * @param channel Number|Array|String The MIDI channel to listen on (integer between 1 and 16).
   * You can also specify an array of channel numbers or the value 'all'.
   *
   * @param listener Function A callback function to execute when the specified event is detected.
   * This function will receive an event parameter object. For details on this object's properties,
   * check out the documentation for the various events (links above).
   *
   * @throws {RangeError} The 'channel' parameter is invalid.
   * @throws {TypeError} The 'listener' parameter must be a function.
   * @throws {TypeError} The specified event type is not supported.
   *
   * @return WebMidi Returns the `WebMidi` object so methods can be chained.
   */
  public addListener = (
    type: string,
    channel: number | Array<number | string> | string,
    listener: () => void
  ): Input => {
    let channelArray: Array<number | string>;

    if (channel === undefined) {
      channelArray = ["all"];
    }
    if (!Array.isArray(channel)) {
      channelArray = [channel];
    }

    // Check if channel entries are valid
    channelArray.forEach(item => {
      if (item !== "all" && !(item >= 1 && item <= MIDI_CHANNEL_COUNT)) {
        throw new RangeError("The 'channel' parameter is invalid.");
      }
    });

    if (typeof listener !== "function") {
      throw new TypeError("The 'listener' parameter must be a function.");
    }

    if (MIDI_SYSTEM_MESSAGES[type]) {
      if (!this._userHandlers.system[type]) {
        this._userHandlers.system[type] = [];
      }

      this._userHandlers.system[type].push(listener);
    } else if (MIDI_CHANNEL_MESSAGES[type]) {
      // If "all" is present anywhere in the channel array, use all 16 channels
      if (channelArray.indexOf("all") > -1) {
        channelArray = [];
        for (let j = 1; j <= MIDI_CHANNEL_COUNT; j++) {
          channelArray.push(j);
        }
      }

      if (!this._userHandlers.channel[type]) {
        this._userHandlers.channel[type] = [];
      }

      // Push all channel listeners in the array
      channelArray.forEach(ch => {
        if (!this._userHandlers.channel[type][ch]) {
          this._userHandlers.channel[type][ch] = [];
        }

        this._userHandlers.channel[type][ch].push(listener);
      });
    } else {
      throw new TypeError("The specified event type is not supported.");
    }

    return this;
  };

  /**
   * This is an alias to the {{#crossLink "Input/addListener"}}Input.addListener(){{/crossLink}}
   * function.
   *
   * @method on
   * @since 2.0.0
   */
  // tslint:disable-next-line:member-ordering
  public on = this.addListener;

  /**
   * Checks if the specified event type is already defined to trigger the listener function on the
   * specified channel(s). If more than one channel is specified, the function will return `true`
   * only if all channels have the listener defined.
   *
   * For device-wide events (`sysex`, `start`, etc.), the `channel` parameter is silently ignored.
   * We suggest you use `undefined` in such cases.
   *
   * @method hasListener
   *
   * @param type String The type of the event.
   * @param channel Number|Array|String The MIDI channel to check on (between 1 and 16). You
   * can also specify an array of channel numbers or the string 'all'.
   * @param listener Function The callback function to check for.
   *
   * @throws {TypeError} The 'listener' parameter must be a function.
   *
   * @return Boolean Boolean value indicating whether or not the channel(s) already have this
   * listener defined.
   */
  // tslint:disable-next-line:cyclomatic-complexity
  public hasListener = (
    type: string,
    channel: number | Array<number | string> | string,
    listener: () => void
  ): boolean => {
    let channelArray: Array<number | string>;

    if (typeof listener !== "function") {
      throw new TypeError("The 'listener' parameter must be a function.");
    }

    if (channel === undefined) {
      channelArray = ["all"];
    }
    if (!Array.isArray(channel)) {
      channelArray = [channel];
    }

    if (MIDI_SYSTEM_MESSAGES[type]) {
      for (let o = 0; o < this._userHandlers.system[type].length; o++) {
        if (this._userHandlers.system[type][o] === listener) {
          return true;
        }
      }
    } else if (MIDI_CHANNEL_MESSAGES[type]) {
      // If "all" is present anywhere in the channel array, use all 16 channels
      if (channelArray.indexOf("all") > -1) {
        channel = [];
        for (let j = 1; j <= MIDI_CHANNEL_COUNT; j++) {
          channelArray.push(j);
        }
      }

      if (!this._userHandlers.channel[type]) {
        return false;
      }

      // Go through all specified channels
      return channelArray.every(chNum => {
        const listeners = this._userHandlers.channel[type][chNum];
        return listeners && listeners.indexOf(listener) > -1;
      });
    }

    return false;
  };

  /**
   * Removes the specified listener from the specified channel(s). If the `listener` parameter is
   * left undefined, all listeners for the specified `type` will be removed from all channels. If
   * the `channel` is also omitted, all listeners of the specified type will be removed from all
   * channels. If no parameters are defined, all listeners attached to any channel of the `Input`
   * will be removed.
   *
   * For device-wide events (`sysex`, `start`, etc.), the `channel` parameter is silently ignored.
   * You can use `undefined` in such cases.
   *
   * @method removeListener
   * @chainable
   *
   * @param [type] {String} The type of the event.
   * @param [channel] {Number|String|Array} The MIDI channel(s) to check on. It can be a uint
   * (between 1 and 16) an array of channel numbers or the special value "all".
   * @param [listener] {Function} The callback function to check for.
   *
   * @throws {TypeError} The specified event type is not supported.
   * @throws {TypeError} The 'listener' parameter must be a function..
   *
   * @return Input The `Input` object for easy method chaining.
   */
  // tslint:disable-next-line:cyclomatic-complexity
  public removeListener = (
    type: string,
    channel: number | Array<number | string> | string,
    listener: () => void
  ): Input => {
    let channelArray: Array<number | string>;
    if (listener !== undefined && typeof listener !== "function") {
      throw new TypeError("The 'listener' parameter must be a function.");
    }

    if (channel === undefined) {
      channelArray = ["all"];
    }
    if (!Array.isArray(channel)) {
      channelArray = [channel];
    }

    if (MIDI_SYSTEM_MESSAGES[type]) {
      if (listener === undefined) {
        this._userHandlers.system[type] = [];
      } else {
        for (let o = 0; o < this._userHandlers.system[type].length; o++) {
          if (this._userHandlers.system[type][o] === listener) {
            this._userHandlers.system[type].splice(o, 1);
          }
        }
      }
    } else if (MIDI_CHANNEL_MESSAGES[type]) {
      // If "all" is present anywhere in the channel array, use all 16 channels
      if (channelArray.indexOf("all") > -1) {
        channel = [];
        for (let j = 1; j <= MIDI_CHANNEL_COUNT; j++) {
          channel.push(j);
        }
      }

      if (!this._userHandlers.channel[type]) {
        return this;
      }

      // Go through all specified channels
      channelArray.forEach(chNum => {
        const listeners = this._userHandlers.channel[type][chNum];
        if (!listeners) {
          return;
        }

        if (listener === undefined) {
          this._userHandlers.channel[type][chNum] = [];
        } else {
          for (let l = 0; l < listeners.length; l++) {
            if (listeners[l] === listener) {
              listeners.splice(l, 1);
            }
          }
        }
      });
    } else if (type === undefined) {
      this._initializeUserHandlers();
    } else {
      throw new TypeError("The specified event type is not supported.");
    }

    return this;
  };

  /**
   * @method _initializeUserHandlers
   * @protected
   */
  private _initializeUserHandlers = (): void => {
    for (const prop1 in MIDI_CHANNEL_MESSAGES) {
      if (MIDI_CHANNEL_MESSAGES.hasOwnProperty(prop1)) {
        // ??????????????????????
        this._userHandlers.channel[prop1] = {};
      }
    }

    for (const prop2 in MIDI_SYSTEM_MESSAGES) {
      if (MIDI_SYSTEM_MESSAGES.hasOwnProperty(prop2)) {
        this._userHandlers.system[prop2] = [];
      }
    }
  };

  /**
   * @method _onMidiMessage
   * @protected
   */
  public _onMidiMessage = e => {
    if (e.data[0] <= CHANNEL_SPECIFIC_MESSAGE) {
      // channel-specific message
      this._parseChannelEvent(e);
    } else if (e.data[0] <= 255) {
      // system message
      this._parseSystemEvent(e);
    }
  };

  /**
   * @method _parseChannelEvent
   * @param e Event
   * @protected
   */
  // tslint:disable-next-line:cyclomatic-complexity
  private _parseChannelEvent = e => {
    // tslint:disable-next-line:no-bitwise
    const command = e.data[0] >> 4;
    // tslint:disable-next-line:no-bitwise
    const channel = (e.data[0] & 0) + 1;
    let data1, data2;

    if (e.data.length > 1) {
      data1 = e.data[1];
      data2 = e.data.length > 2 ? e.data[2] : undefined;
    }

    // Returned event
    const event = {
      target: this,
      data: e.data,
      timestamp: e.timeStamp,
      channel: channel,
      type: "",
      note: {},
      rawVelocity: 0,
      velocity: 0,
      value: 0,
      controller: {}
    };

    if (
      command === MIDI_CHANNEL_MESSAGES.noteoff ||
      (command === MIDI_CHANNEL_MESSAGES.noteon && data2 === 0)
    ) {
      /**
       * Event emitted when a note off MIDI message has been received on a specific device and
       * channel.
       *
       * @event noteoff
       *
       * @param {Object} event
       * @param {Input} event.target The `Input` that triggered the event.
       * @param {Uint8Array} event.data The raw MIDI message as an array of 8 bit values.
       * @param {Number} event.receivedTime The time when the event occurred (in milliseconds since
       * start).
       * @param {uint} event.timestamp The timestamp when the event occurred (in milliseconds since
       * the [Unix Epoch](https://en.wikipedia.org/wiki/Unix_time)).
       * @param {uint} event.channel The channel where the event occurred (between 1 and 16).
       * @param {String} event.type The type of event that occurred.
       * @param {Object} event.note
       * @param {uint} event.note.number The MIDI note number.
       * @param {String} event.note.name The usual note name (C, C#, D, D#, etc.).
       * @param {uint} event.note.octave The octave (between -2 and 8).
       * @param {Number} event.velocity The release velocity (between 0 and 1).
       * @param {Number} event.rawVelocity The attack velocity expressed as a 7-bit integer (between
       * 0 and 127).
       */
      event.type = "noteoff";
      event.note = {
        number: data1,
        name: Notes[data1 % SEMITONE_COUNT],
        octave: MidiService.getOctave(data1)
      };
      event.velocity = data2 / 127;
      event.rawVelocity = data2;
    } else if (command === MIDI_CHANNEL_MESSAGES.noteon) {
      /**
       * Event emitted when a note on MIDI message has been received on a specific device and
       * channel.
       *
       * @event noteon
       *
       * @param {Object} event
       * @param {Input} event.target The `Input` that triggered the event.
       * @param {Uint8Array} event.data The raw MIDI message as an array of 8 bit values.
       * @param {Number} event.receivedTime The time when the event occurred (in milliseconds since
       * start).
       * @param {uint} event.timestamp The timestamp when the event occurred (in milliseconds since
       * the [Unix Epoch](https://en.wikipedia.org/wiki/Unix_time)).
       * @param {uint} event.channel The channel where the event occurred (between 1 and 16).
       * @param {String} event.type The type of event that occurred.
       * @param {Object} event.note
       * @param {uint} event.note.number The MIDI note number.
       * @param {String} event.note.name The usual note name (C, C#, D, D#, etc.).
       * @param {uint} event.note.octave The octave (between -2 and 8).
       * @param {Number} event.velocity The attack velocity (between 0 and 1).
       * @param {Number} event.rawVelocity The attack velocity expressed as a 7-bit integer (between
       * 0 and 127).
       */
      event.type = "noteon";
      event.note = {
        number: data1,
        name: Notes[data1 % SEMITONE_COUNT],
        octave: MidiService.getOctave(data1)
      };
      event.velocity = data2 / 127;
      event.rawVelocity = data2;
    } else if (command === MIDI_CHANNEL_MESSAGES.keyaftertouch) {
      /**
       * Event emitted when a key-specific aftertouch MIDI message has been received on a specific
       * device and channel.
       *
       * @event keyaftertouch
       *
       * @param {Object} event
       * @param {Input} event.target The `Input` that triggered the event.
       * @param {Uint8Array} event.data The raw MIDI message as an array of 8 bit values.
       * @param {Number} event.receivedTime The time when the event occurred (in milliseconds since
       * start).
       * @param {uint} event.timestamp The timestamp when the event occurred (in milliseconds since
       * the [Unix Epoch](https://en.wikipedia.org/wiki/Unix_time)).
       * @param {uint} event.channel The channel where the event occurred (between 1 and 16).
       * @param {String} event.type The type of event that occurred.
       * @param {Object} event.note
       * @param {uint} event.note.number The MIDI note number.
       * @param {String} event.note.name The usual note name (C, C#, D, D#, etc.).
       * @param {uint} event.note.octave The octave (between -2 and 8).
       * @param {Number} event.value The aftertouch amount (between 0 and 1).
       */
      event.type = "keyaftertouch";
      event.note = {
        number: data1,
        name: Notes[data1 % SEMITONE_COUNT],
        octave: MidiService.getOctave(data1)
      };
      event.value = data2 / 127;
    } else if (
      command === MIDI_CHANNEL_MESSAGES.controlchange &&
      data1 >= 0 &&
      data1 <= 119
    ) {
      /**
       * Event emitted when a control change MIDI message has been received on a specific device and
       * channel.
       *
       * @event controlchange
       *
       * @param {Object} event
       * @param {Input} event.target The `Input` that triggered the event.
       * @param {Uint8Array} event.data The raw MIDI message as an array of 8 bit values.
       * @param {Number} event.receivedTime The time when the event occurred (in milliseconds since
       * start).
       * @param {uint} event.timestamp The timestamp when the event occurred (in milliseconds since
       * the [Unix Epoch](https://en.wikipedia.org/wiki/Unix_time)).
       * @param {uint} event.channel The channel where the event occurred (between 1 and 16).
       * @param {String} event.type The type of event that occurred.
       * @param {Object} event.controller
       * @param {uint} event.controller.number The number of the controller.
       * @param {String} event.controller.name The usual name or function of the controller.
       * @param {uint} event.value The value received (between 0 and 127).
       */
      event.type = "controlchange";
      event.controller = {
        number: data1,
        name: this.getCcNameByNumber(data1)
      };
      event.value = data2;
    } else if (
      command === MIDI_CHANNEL_MESSAGES.channelmode &&
      data1 >= 120 &&
      data1 <= 127
    ) {
      /**
       * Event emitted when a channel mode MIDI message has been received on a specific device and
       * channel.
       *
       * @event channelmode
       *
       * @param {Object} event
       * @param {Input} event.target The `Input` that triggered the event.
       * @param {Uint8Array} event.data The raw MIDI message as an array of 8 bit values.
       * @param {Number} event.receivedTime The time when the event occurred (in milliseconds since
       * start).
       * @param {uint} event.timestamp The timestamp when the event occurred (in milliseconds since
       * the [Unix Epoch](https://en.wikipedia.org/wiki/Unix_time)).
       * @param {uint} event.channel The channel where the event occurred (between 1 and 16).
       * @param {String} event.type The type of event that occurred.
       * @param {Object} event.controller
       * @param {uint} event.controller.number The number of the controller.
       * @param {String} event.controller.name The usual name or function of the controller.
       * @param {uint} event.value The value received (between 0 and 127).
       */
      event.type = "channelmode";
      event.controller = {
        number: data1,
        name: this.getChannelModeByNumber(data1)
      };
      event.value = data2;
    } else if (command === MIDI_CHANNEL_MESSAGES.programchange) {
      /**
       * Event emitted when a program change MIDI message has been received on a specific device and
       * channel.
       *
       * @event programchange
       *
       * @param {Object} event
       * @param {Input} event.target The `Input` that triggered the event.
       * @param {Uint8Array} event.data The raw MIDI message as an array of 8 bit values.
       * @param {Number} event.receivedTime The time when the event occurred (in milliseconds since
       * start).
       * @param {uint} event.timestamp The timestamp when the event occurred (in milliseconds since
       * the [Unix Epoch](https://en.wikipedia.org/wiki/Unix_time)).
       * @param {uint} event.channel The channel where the event occurred (between 1 and 16).
       * @param {String} event.type The type of event that occurred.
       * @param {uint} event.value The value received (between 0 and 127).
       */
      event.type = "programchange";
      event.value = data1;
    } else if (command === MIDI_CHANNEL_MESSAGES.channelaftertouch) {
      /**
       * Event emitted when a channel-wide aftertouch MIDI message has been received on a specific
       * device and channel.
       *
       * @event channelaftertouch
       *
       * @param {Object} event
       * @param {Input} event.target The `Input` that triggered the event.
       * @param {Uint8Array} event.data The raw MIDI message as an array of 8 bit values.
       * @param {Number} event.receivedTime The time when the event occurred (in milliseconds since
       * start).
       * @param {uint} event.timestamp The timestamp when the event occurred (in milliseconds since
       * the [Unix Epoch](https://en.wikipedia.org/wiki/Unix_time)).
       * @param {uint} event.channel The channel where the event occurred (between 1 and 16).
       * @param {String} event.type The type of event that occurred.
       * @param {Number} event.value The aftertouch value received (between 0 and 1).
       */
      event.type = "channelaftertouch";
      event.value = data1 / 127;
    } else if (command === MIDI_CHANNEL_MESSAGES.pitchbend) {
      /**
       * Event emitted when a pitch bend MIDI message has been received on a specific device and
       * channel.
       *
       * @event pitchbend
       *
       * @param {Object} event
       * @param {Input} event.target The `Input` that triggered the event.
       * @param {Uint8Array} event.data The raw MIDI message as an array of 8 bit values.
       * @param {Number} event.receivedTime The time when the event occurred (in milliseconds since
       * start).
       * @param {uint} event.timestamp The timestamp when the event occurred (in milliseconds since
       * the [Unix Epoch](https://en.wikipedia.org/wiki/Unix_time)).
       * @param {uint} event.channel The channel where the event occurred (between 1 and 16).
       * @param {String} event.type The type of event that occurred.
       * @param {Number} event.value The pitch bend value received (between -1 and 1).
       */
      event.type = "pitchbend";
      // tslint:disable-next-line:no-bitwise
      event.value = ((data2 << 7) + data1 - 8192) / 8192;
    } else {
      event.type = "unknownchannelmessage";
    }

    // If some callbacks have been defined for this event, on that device and channel, execute them.
    if (
      this._userHandlers.channel[event.type] &&
      this._userHandlers.channel[event.type][channel]
    ) {
      this._userHandlers.channel[event.type][channel].forEach(callback => {
        callback(event);
      });
    }
  };

  /**
   * Returns the name of a control change message matching the specified number. If no match is
   * found, the function returns `undefined`.
   *
   * @method getCcNameByNumber
   *
   * @param number The number of the control change message.
   * @returns String|undefined The matching control change name or `undefined`.
   *
   * @throws RangeError The control change number must be between 0 and 119.
   *
   * @since 2.0.0
   */
  public getCcNameByNumber = (num: number): string|undefined => {
    if (!(num >= 0 && num <= 119)) {
      throw new RangeError(
        "The control change number must be between 0 and 119."
      );
    }

    for (const cc in MIDI_CONTROL_CHANGE_MESSAGES) {
      if (num === Number(cc)) {
        return MIDI_CONTROL_CHANGE_MESSAGES[cc];
      }
    }

    return undefined;
  };

  /**
   * Returns the channel mode name matching the specified number. If no match is found, the function
   * returns `undefined`.
   *
   * @method getChannelModeByNumber
   *
   * @param number Number The number of the channel mode message.
   * @returns String|undefined The matching channel mode message's name or `undefined`;
   *
   * @throws RangeError The channel mode number must be between 120 and 127.
   *
   * @since 2.0.0
   */
  public getChannelModeByNumber = (num: number): string|undefined => {
    if (!(num >= 120 && num <= 127)) {
      throw new RangeError(
        "The control change number must be between 120 and 127."
      );
    }

    for (const cm in MIDI_CHANNEL_MODE_MESSAGES) {
      if (num === Number(cm)) {
        return MIDI_CHANNEL_MODE_MESSAGES[cm];
      }
    }
  };

  /**
   * @method _parseSystemEvent
   * @protected
   */
  // tslint:disable-next-line:cyclomatic-complexity
  private _parseSystemEvent = e => {
    const command = e.data[0];

    // Returned event
    const event = {
      target: this,
      data: e.data,
      timestamp: e.timeStamp,
      type: "",
      song: 0
    };

    if (command === MIDI_SYSTEM_MESSAGES.sysex) {
      /**
       * Event emitted when a system exclusive MIDI message has been received. You should note that,
       * to receive `sysex` events, you must call the `WebMidi.enable()` method with a second
       * parameter set to `true`:
       *
       *     WebMidi.enable(function(err) {
       *
       *        if (err) {
       *          console.log("WebMidi could not be enabled.");
       *        }
       *
       *        var input = WebMidi.inputs[0];
       *
       *        input.addListener('sysex', "all", function (e) {
       *          console.log(e);
       *        });
       *
       *     }, true);
       *
       * @event sysex
       *
       * @param {Object} event
       * @param {Input} event.target The `Input` that triggered the event.
       * @param {Uint8Array} event.data The raw MIDI message as an array of 8 bit values.
       * @param {Number} event.receivedTime The time when the event occurred (in milliseconds since
       * start).
       * @param {uint} event.timestamp The timestamp when the event occurred (in milliseconds since
       * the epoch).
       * @param {String} event.type The type of event that occurred.
       *
       */
      event.type = "sysex";
    } else if (command === MIDI_SYSTEM_MESSAGES.timecode) {
      /**
       * Event emitted when a system MIDI time code quarter frame message has been received.
       *
       * @event timecode
       *
       * @param {Object} event
       * @param {Input} event.target The `Input` that triggered the event.
       * @param {Uint8Array} event.data The raw MIDI message as an array of 8 bit values.
       * @param {Number} event.receivedTime The time when the event occurred (in milliseconds since
       * start).
       * @param {uint} event.timestamp The timestamp when the event occurred (in milliseconds since
       * the epoch).
       * @param {String} event.type The type of event that occurred.
       */
      event.type = "timecode";

      // @todo calculate time values and make them directly available
    } else if (command === MIDI_SYSTEM_MESSAGES.songposition) {
      /**
       * Event emitted when a system song position pointer MIDI message has been received.
       *
       * @event songposition
       *
       * @param {Object} event
       * @param {Input} event.target The `Input` that triggered the event.
       * @param {Uint8Array} event.data The raw MIDI message as an array of 8 bit values.
       * @param {Number} event.receivedTime The time when the event occurred (in milliseconds since
       * start).
       * @param {uint} event.timestamp The timestamp when the event occurred (in milliseconds
       * since the epoch).
       * @param {String} event.type The type of event that occurred.
       */
      event.type = "songposition";

      // @todo calculate position value and make it directly available
    } else if (command === MIDI_SYSTEM_MESSAGES.songselect) {
      /**
       * Event emitted when a system song select MIDI message has been received.
       *
       * @event songselect
       *
       * @param {Object} event
       * @param {Input} event.target The `Input` that triggered the event.
       * @param {Uint8Array} event.data The raw MIDI message as an array of 8 bit values.
       * @param {Number} event.receivedTime The time when the event occurred (in milliseconds since
       * start).
       * @param {uint} event.timestamp The timestamp when the event occurred (in milliseconds since
       * the epoch).
       * @param {String} event.type The type of event that occurred.
       * @param {String} event.song Song (or sequence) number to select.
       */
      event.type = "songselect";
      event.song = e.data[1];
    } else if (command === MIDI_SYSTEM_MESSAGES.tuningrequest) {
      /**
       * Event emitted when a system tune request MIDI message has been received.
       *
       * @event tuningrequest
       *
       * @param {Object} event
       * @param {Input} event.target The `Input` that triggered the event.
       * @param {Uint8Array} event.data     The raw MIDI message as an array of 8 bit
       *                                    values.
       * @param {Number} event.receivedTime The time when the event occurred (in
       *                                    milliseconds since start).
       * @param {uint} event.timestamp      The timestamp when the event occurred
       *                                    (in milliseconds since the epoch).
       * @param {String} event.type         The type of event that occurred.
       */
      event.type = "tuningrequest";
    } else if (command === MIDI_SYSTEM_MESSAGES.clock) {
      /**
       * Event emitted when a system timing clock MIDI message has been received.
       *
       * @event clock
       *
       * @param {Object} event
       * @param {Input} event.target The `Input` that triggered the event.
       * @param {Uint8Array} event.data     The raw MIDI message as an array of 8 bit
       *                                    values.
       * @param {Number} event.receivedTime The time when the event occurred (in
       *                                    milliseconds since start).
       * @param {uint} event.timestamp      The timestamp when the event occurred
       *                                    (in milliseconds since the epoch).
       * @param {String} event.type         The type of event that occurred.
       */
      event.type = "clock";
    } else if (command === MIDI_SYSTEM_MESSAGES.start) {
      /**
       * Event emitted when a system start MIDI message has been received.
       *
       * @event start
       *
       * @param {Object} event
       * @param {Input} event.target The `Input` that triggered the event.
       * @param {Uint8Array} event.data     The raw MIDI message as an array of 8 bit
       *                                    values.
       * @param {Number} event.receivedTime The time when the event occurred (in
       *                                    milliseconds since start).
       * @param {uint} event.timestamp      The timestamp when the event occurred
       *                                    (in milliseconds since the epoch).
       * @param {String} event.type         The type of event that occurred.
       */
      event.type = "start";
    } else if (command === MIDI_SYSTEM_MESSAGES.continue) {
      /**
       * Event emitted when a system continue MIDI message has been received.
       *
       * @event continue
       *
       * @param {Object} event
       * @param {Input} event.target The `Input` that triggered the event.
       * @param {Uint8Array} event.data     The raw MIDI message as an array of 8 bit
       *                                    values.
       * @param {Number} event.receivedTime The time when the event occurred (in
       *                                    milliseconds since start).
       * @param {uint} event.timestamp      The timestamp when the event occurred
       *                                    (in milliseconds since the epoch).
       * @param {String} event.type         The type of event that occurred.
       */
      event.type = "continue";
    } else if (command === MIDI_SYSTEM_MESSAGES.stop) {
      /**
       * Event emitted when a system stop MIDI message has been received.
       *
       * @event stop
       *
       * @param {Object} event
       * @param {Input} event.target The `Input` that triggered the event.
       * @param {Uint8Array} event.data     The raw MIDI message as an array of 8 bit
       *                                    values.
       * @param {Number} event.receivedTime The time when the event occurred (in
       *                                    milliseconds since start).
       * @param {uint} event.timestamp      The timestamp when the event occurred
       *                                    (in milliseconds since the epoch).
       * @param {String} event.type         The type of event that occurred.
       */
      event.type = "stop";
    } else if (command === MIDI_SYSTEM_MESSAGES.activesensing) {
      /**
       * Event emitted when a system active sensing MIDI message has been received.
       *
       * @event activesensing
       *
       * @param {Object} event
       * @param {Input} event.target The `Input` that triggered the event.
       * @param {Uint8Array} event.data     The raw MIDI message as an array of 8 bit values.
       * @param {Number} event.receivedTime The time when the event occurred (in milliseconds since
       * start).
       * @param {uint} event.timestamp      The timestamp when the event occurred (in milliseconds
       * since the epoch).
       * @param {String} event.type         The type of event that occurred.
       */
      event.type = "activesensing";
    } else if (command === MIDI_SYSTEM_MESSAGES.reset) {
      /**
       * Event emitted when a system reset MIDI message has been received.
       *
       * @event reset
       *
       * @param {Object} event
       * @param {Input} event.target The `Input` that triggered the event.
       * @param {Uint8Array} event.data     The raw MIDI message as an array of 8 bit values.
       * @param {Number} event.receivedTime The time when the event occurred (in milliseconds since
       * start).
       * @param {uint} event.timestamp      The timestamp when the event occurred (in milliseconds
       * since the epoch).
       * @param {String} event.type         The type of event that occurred.
       */
      event.type = "reset";
    } else {
      /**
       * Event emitted when an unknown system MIDI message has been received. It could be, for
       * example, one of the undefined/reserved messages.
       *
       * @event unknownsystemmessage
       *
       * @param {Object} event
       * @param {Input} event.target The `Input` that triggered the event.
       * @param {Uint8Array} event.data The raw MIDI message as an array of 8 bit values.
       * @param {Number} event.receivedTime The time when the event occurred (in milliseconds since
       * start).
       * @param {uint} event.timestamp The timestamp when the event occurred (in milliseconds since
       * the epoch).
       *
       * @param {String} event.type The type of event that occurred.
       */
      event.type = "unknownsystemmessage";
    }

    // If some callbacks have been defined for this event, execute them.
    if (this._userHandlers.system[event.type]) {
      this._userHandlers.system[event.type].forEach(callback => {
        callback(event);
      });
    }
  };
}
// tslint:disable-next-line:max-file-line-count
