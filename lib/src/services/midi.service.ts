// import { Injectable } from "@angular/core";
import { Observable } from "rxjs/Observable";
import { of } from "rxjs/Observable/of";
import { bindCallback } from "rxjs/Observable/bindCallback";
import { Input } from "./input";
import { Output } from "./output";
import { Semitones } from "./enums";

// @Injectable()
export class MidiService {
  // MIDI inputs and outputs
  private _inputs: Input[] = [];
  private _outputs: Output[] = [];

  // Object to hold all user-defined handlers for interface-wide events (connected, disconnected,
  // etc.)
  private _userHandlers = {};

  // Array of statechange events to process. These events must be parsed synchronously so they do
  // not override each other.
  private _stateChangeQueue = [];

  // Indicates whether we are currently processing a statechange event (in which case new events
  // are to be queued).
  private _processingStateChange = false;

  // Events triggered at the interface level (WebMidi)
  private _midiInterfaceEvents = ["connected", "disconnected"];

  private interface: any = undefined;

  /**
   * [read-only] Indicates whether the environment supports the Web MIDI API or not.
   *
   * Note: in environments that do not offer built-in MIDI support, this will report true if the
   * `navigator.requestMIDIAccess` function is available. For example, if you have installed
   * WebMIDIAPIShim but no plugin, this property will be true even though actual support might
   * not be there.
   *
   * @property supported
   */
  public get supported(): boolean {
    return "requestMIDIAccess" in navigator;
  }

  /**
   * [read-only] Indicates whether the interface to the host's MIDI subsystem is currently
   * enabled.
   *
   * @property enabled
   */
  public get enabled(): boolean {
    return this.interface !== undefined;
  }

  /**
   * [read-only] An array of all currently available MIDI input ports.
   *
   * @property inputs
   */
  public get inputs(): Input[] {
    return this._inputs;
  }

  /**
   * [read-only] An array of all currently available MIDI output ports.
   *
   * @property outputs
   */
  public get outputs(): Output[] {
    return this._outputs;
  }

  /**
   * [read-only] Indicates whether the interface to the host's MIDI subsystem is currently
   * active.
   *
   * @property sysexEnabled
   */
  public get sysexEnabled(): boolean {
    return !!(this.interface && this.interface.sysexEnabled);
  }

  /**
   * Checks if the Web MIDI API is available and then tries to connect to the host's MIDI subsystem.
   * This is an asynchronous operation. When it's done, the specified handler callback will be
   * executed. If an error occurred, the callback function will receive an `Error` object as its
   * sole parameter.
   *
   * To enable the use of system exclusive messages, the `sysex` parameter should be set to true.
   * However, under some environments (e.g. Jazz-Plugin), the sysex parameter is ignored and sysex
   * is always enabled.
   *
   * @method enable

   *
   * @param [callback] {Function} A function to execute upon success. This function will receive an
   * `Error` object upon failure to enable the Web MIDI API.
   * @param [sysex=false] {Boolean} Whether to enable MIDI system exclusive messages or not.
   *
   * @throws Error The Web MIDI API is not supported by your browser.
   * @throws Error Jazz-Plugin must be installed to use WebMIDIAPIShim.
   */
  public enable = (callback, sysex: boolean = false): void => {
    if (this.enabled) {
      return;
    }

    if (!this.supported) {
      throw new Error("The Web MIDI API is not supported by your browser.");
    }

    (<any>navigator).requestMIDIAccess({ sysex: sysex }).then(
      midiAccess => {
        const events = [],
          promises = [];

        this.interface = midiAccess;
        this._resetInterfaceUserHandlers();

        // We setup a temporary `statechange` handler that will catch all events triggered while we
        // setup. Those events will be re-triggered after calling the user's callback. This will
        // allow the user to listen to "connected" events which can be very convenient.
        this.interface.onstatechange = e => {
          events.push(e);
        };

        // Here we manually open the inputs and outputs. Usually, this is optional. When the ports
        // are not explicitely opened, they will be opened automatically (and asynchonously) by
        // setting a listener on `midimessage` (MIDIInput) or calling `send()` (MIDIOutput).
        // However, we do not want that here. We want to be sure that "connected" events will be
        // available in the user's callback. So, what we do is open all input and output ports and
        // wait until all promises are resolved. Then, we re-trigger the events after the user's
        // callback has been executed. This seems like the most sensible and practical way.
        const inputs = midiAccess.inputs.values();
        for (
          let input = inputs.next();
          input && !input.done;
          input = inputs.next()
        ) {
          promises.push(input.value.open());
        }

        const outputs = midiAccess.outputs.values();
        for (
          let output = outputs.next();
          output && !output.done;
          output = outputs.next()
        ) {
          promises.push(output.value.open());
        }

        // Since this library can be used with JazzMidi with no support for promises, we must make
        // sure it still works. The workaround is to use a timer to wait a little. Once the Web MIDI
        // API is well implanted, we'll get rid of that.
        if (Promise) {
          Promise.all(promises)
            .catch(err => {
              console.warn(err);
            })
            .then(onPortsOpen.bind(this));
        } else {
          setTimeout(onPortsOpen.bind(this), 200);
        }

        function onPortsOpen(): void {
          this._updateInputsAndOutputs();
          this.interface.onstatechange = this._onInterfaceStateChange.bind(
            this
          );

          // We execute the callback and then re-trigger the statechange events.
          if (typeof callback === "function") {
            callback.call(this);
          }

          events.forEach(event => {
            this._onInterfaceStateChange(event);
          });
        }

        // When MIDI access is requested, all input and output ports have their "state" set to
        // "connected". However, the value of their "connection" property is "closed".
        //
        // A `MIDIInput` becomes `open` when you explicitely call its `open()` method or when you
        // assign a listener to its `onmidimessage` property. A `MIDIOutput` becomes `open` when you
        // use the `send()` method or when you can explicitely call its `open()` method.
        //
        // Calling `_updateInputsAndOutputs()` attaches listeners to all inputs. As per the spec,
        // this triggers a `statechange` event on MIDIAccess.
      },

      err => {
        if (typeof callback === "function") {
          callback.call(this, err);
        }
      }
    );

    // const callback = () => {
    //   console.log("enabled");
    // };
    // const trace = bindCallback(callback);
    // WebMidi.enable(callback, sysex);
    // return trace();
  };

  /**
   * Completely disables `WebMidi` by unlinking the MIDI subsystem's interface and destroying all
   * `Input` and `Output` objects that may be available. This also means that any listener that may
   * have been defined on `Input` or `Output` objects will be destroyed.
   *
   * @method disable

   *
   * @since 2.0.0
   */
  public disable = (): void => {
    if (!this.supported) {
      throw new Error("The Web MIDI API is not supported by your browser.");
    }

    if (this.interface) {
      this.interface.onstatechange = undefined;
    }

    this.interface = undefined; // also resets enabled, sysexEnabled
    this._inputs = [];
    this._outputs = [];
    this._resetInterfaceUserHandlers();
  };

  /**
   * Adds an event listener on the `WebMidi` object that will trigger a function callback when the
   * specified event happens.
   *
   * WebMidi must be enabled before adding event listeners.
   *
   * Currently, only one event is being dispatched by the `WebMidi` object:
   *
   *    * {{#crossLink "WebMidi/statechange:event"}}statechange{{/crossLink}}
   *
   * @method addListener

   * @chainable
   *
   * @param type String The type of the event.
   *
   * @param listener Function A callback function to execute when the specified event is detected.
   * This function will receive an event parameter object. For details on this object's properties,
   * check out the documentation for the various events (links above).
   *
   * @throws {Error} WebMidi must be enabled before adding event listeners.
   * @throws {TypeError} The specified event type is not supported.
   * @throws {TypeError} The 'listener' parameter must be a function.
   *
   * @return WebMidi Returns the `WebMidi` object so methods can be chained.
   */
  public addListener = (type: string, listener: () => {}): MidiService => {
    if (!this.enabled) {
      throw new Error("WebMidi must be enabled before adding event listeners.");
    }

    if (typeof listener !== "function") {
      throw new TypeError("The 'listener' parameter must be a function.");
    }

    if (this._midiInterfaceEvents.indexOf(type) >= 0) {
      this._userHandlers[type].push(listener);
    } else {
      throw new TypeError("The specified event type is not supported.");
    }

    return this;
  };

  /**
   * Checks if the specified event type is already defined to trigger the specified listener
   * function.
   *
   * @method hasListener

   *
   * @param String type The type of the event.
   * @param Function listener The callback function to check for.
   *
   * @throws {Error} WebMidi must be enabled before checking event listeners.
   * @throws {TypeError} The 'listener' parameter must be a function.
   * @throws {TypeError} The specified event type is not supported.
   *
   * @return Boolean Boolean value indicating whether or not a callback is already defined for
   * this event type.
   */
  public hasListener = (type: string, listener): boolean => {
    if (!this.enabled) {
      throw new Error(
        "WebMidi must be enabled before checking event listeners."
      );
    }

    if (typeof listener !== "function") {
      throw new TypeError("The 'listener' parameter must be a function.");
    }

    if (this._midiInterfaceEvents.indexOf(type) >= 0) {
      for (let o = 0; o < this._userHandlers[type].length; o++) {
        if (this._userHandlers[type][o] === listener) {
          return true;
        }
      }
    } else {
      throw new TypeError("The specified event type is not supported.");
    }

    return false;
  };

  /**
   * Removes the specified listener(s). If the `listener` parameter is left undefined, all listeners
   * for the specified `type` will be removed. If both the `listener` and the `type` parameters are
   * omitted, all listeners attached to the `WebMidi` object will be removed.
   *
   * @method removeListener

   * @chainable
   *
   * @param String [type] The type of the event.
   * @param Function [listener] The callback function to check for.
   *
   * @throws {Error} WebMidi must be enabled before removing event listeners.
   * @throws {TypeError} The 'listener' parameter must be a function.
   * @throws {TypeError} The specified event type is not supported.
   *
   * @return WebMidi The `WebMidi` object for easy method chaining.
   */
  public removeListener = (type: string, listener: () => {}): MidiService => {
    if (!this.enabled) {
      throw new Error(
        "WebMidi must be enabled before removing event listeners."
      );
    }

    if (listener !== undefined && typeof listener !== "function") {
      throw new TypeError("The 'listener' parameter must be a function.");
    }

    if (this._midiInterfaceEvents.indexOf(type) >= 0) {
      if (listener) {
        for (let o = 0; o < this._userHandlers[type].length; o++) {
          if (this._userHandlers[type][o] === listener) {
            this._userHandlers[type].splice(o, 1);
          }
        }
      } else {
        this._userHandlers[type] = [];
      }
    } else if (type === undefined) {
      this._resetInterfaceUserHandlers();
    } else {
      throw new TypeError("The specified event type is not supported.");
    }

    return this;
  };

  /**
   *
   * Returns an `Input` object representing the input port with the specified id.
   *
   * Please note that the IDs change from one host to another. For example, Chrome does not use the
   * same kind of IDs as the Jazz-Plugin.
   *
   * @method getInputById

   *
   * @param id String The id of the port. IDs can be viewed by looking at the `WebMidi.inputs`
   * array.
   *
   * @returns A MIDIInput port matching the specified id. If no matching port
   * can be found, the method returns `false`.
   *
   * @since 2.0.0
   */
  public getInputById = (id: string): Input | undefined => {
    if (!this.enabled) {
      throw new Error("WebMidi is not enabled.");
    }

    for (let i = 0; i < this.inputs.length; i++) {
      if (this.inputs[i].id === id) {
        return this.inputs[i];
      }
    }

    return undefined;
  };

  /**
   *
   * Returns an `Output` object representing the output port matching the specified id.
   *
   * Please note that the IDs change from one host to another. For example, Chrome does not use the
   * same kind of IDs as the Jazz-Plugin.
   *
   * @method getOutputById

   *
   * @param id String The id of the port. Ids can be viewed by looking at the `WebMidi.outputs`
   * array.
   *
   * @returns  A MIDIOutput port matching the specified id. If no matching
   * port can be found, the method returns `false`.
   *
   * @since 2.0.0
   */
  public getOutputById = (id: string): Output | undefined => {
    if (!this.enabled) {
      throw new Error("WebMidi is not enabled.");
    }

    for (let i = 0; i < this.outputs.length; i++) {
      if (this.outputs[i].id === id) {
        return this.outputs[i];
      }
    }

    return undefined;
  };

  /**
   * Returns the first MIDI `Input` whose name *contains* the specified string.
   *
   * Please note that the port names change from one host to another. For example, Chrome does
   * not report port names in the same way as the Jazz-Plugin does.
   *
   * @method getInputByName

   *
   * @param name String The name of a MIDI input port such as those visible in the
   * `WebMidi.inputs` array.
   *
   * @returns The `Input` that was found or `false` if no input matched the specified
   * name.
   *
   * @throws Error WebMidi is not enabled.
   * @throws TypeError The name must be a string.
   *
   * @since 2.0.0
   */
  public getInputByName = (name: string): Input | undefined => {
    if (!this.enabled) {
      throw new Error("WebMidi is not enabled.");
    }

    for (let i = 0; i < this.inputs.length; i++) {
      if (this.inputs[i].name.indexOf(name)) {
        return this.inputs[i];
      }
    }

    return undefined;
  };

  /**
   * Returns the first MIDI `Output` that matches the specified name.
   *
   * Please note that the port names change from one host to another. For example, Chrome does
   * not report port names in the same way as the Jazz-Plugin does.
   *
   * @method getOutputByName

   *
   * @param name The name of a MIDI output port such as those visible in the
   * `WebMidi.outputs` array.
   *
   * @returns The `Output` that was found or `false` if no output matched the
   * specified name.
   *
   * @throws Error WebMidi is not enabled.
   *
   * @since 2.0.0
   */
  public getOutputByName = (name: string): Output | undefined => {
    if (!this.enabled) {
      throw new Error("WebMidi is not enabled.");
    }

    for (let i = 0; i < this.outputs.length; i++) {
      if (this.outputs[i].name.indexOf(name)) {
        return this.outputs[i];
      }
    }

    return undefined;
  };

  /**
   * @method _updateInputsAndOutputs
   * @protected
   */
  private _updateInputsAndOutputs = () => {
    this._updateInputs();
    this._updateOutputs();
  };

  /**
   * @method _updateInputs

   * @protected
   */
  private _updateInputs = () => {
    // Check for items to remove from the existing array (because they are no longer being reported
    // by the MIDI back-end).
    for (let i = 0; i < this._inputs.length; i++) {
      let remove = true;

      const updated = this.interface.inputs.values();
      for (
        let input = updated.next();
        input && !input.done;
        input = updated.next()
      ) {
        if (this._inputs[i]._midiInput === input.value) {
          remove = false;
          break;
        }
      }

      if (remove) {
        this._inputs.splice(i, 1);
      }
    }

    // Check for items to add in the existing inputs array because they just appeared in the MIDI
    // back-end inputs list. We must check for the existence of this.interface because it might
    // have been closed via WebMidi.disable().
    if (this.interface) {
      this.interface.inputs.forEach(nInput => {
        let add = true;

        for (let j = 0; j < this._inputs.length; j++) {
          if (this._inputs[j]._midiInput === nInput) {
            add = false;
          }
        }

        if (add) {
          this._inputs.push(this._createInput(nInput));
        }
      });
    }
  };

  /**
   * @method _updateOutputs
   * @protected
   */
  private _updateOutputs = () => {
    // Check for items to remove from the existing array (because they are no longer being reported
    // by the MIDI back-end).
    for (let i = 0; i < this._outputs.length; i++) {
      let remove = true;

      const updated = this.interface.outputs.values();
      for (
        let output = updated.next();
        output && !output.done;
        output = updated.next()
      ) {
        if (this._outputs[i]._midiOutput === output.value) {
          remove = false;
          break;
        }
      }

      if (remove) {
        this._outputs.splice(i, 1);
      }
    }

    // Check for items to add in the existing inputs array because they just appeared in the MIDI
    // back-end outputs list. We must check for the existence of this.interface because it might
    // have been closed via WebMidi.disable().
    if (this.interface) {
      this.interface.outputs.forEach(nOutput => {
        let add = true;

        for (let j = 0; j < this._outputs.length; j++) {
          if (this._outputs[j]._midiOutput === nOutput) {
            add = false;
          }
        }

        if (add) {
          this._outputs.push(this._createOutput(nOutput));
        }
      });
    }
  };

  /**
   * @method _createInput
   * @returns Input
   * @protected
   */
  private _createInput(midiInput: any): Input {
    const input = new Input(midiInput);
    input._midiInput.onmidimessage = input._onMidiMessage.bind(input);
    return input;
  }

  /**
   * @method _createOutput

   * @returns Output
   * @protected
   */
  private _createOutput(midiOutput: any): Output {
    const output = new Output(this.sysexEnabled, midiOutput);
    output._midiOutput.onmidimessage = output._onMidiMessage.bind(output);
    return output;
  }

  /**
   * @method _onInterfaceStateChange
   * @protected
   */
  private _onInterfaceStateChange = (e: any) => {
    this._updateInputsAndOutputs();

    /**
     * Event emitted when a MIDI port becomes available. This event is typically fired whenever a
     * MIDI device is plugged in. Please note that it may fire several times if a device possesses
     * multiple input/output ports.
     *
     * @event connected
     * @param Object event
     * @param Number event.timestamp The timestamp when the event occurred (in milliseconds since
     * the epoch).
     * @param String event.type The type of event that occurred.
     * @param String event.port The actual `Input` or `Output` object associated to the event.
     */

    /**
     * Event emitted when a MIDI port becomes unavailable. This event is typically fired whenever a
     * MIDI device is unplugged. Please note that it may fire several times if a device possesses
     * multiple input/output ports.
     *
     * @event disconnected
     * @param Object event
     * @param Number event.timestamp The timestamp when the event occurred (in milliseconds since
     * the epoch).
     * @param String event.type The type of event that occurred.
     * @param String event.port An generic object containing details about the port that triggered
     * the event.
     */
    const event = {
      timestamp: e.timeStamp,
      type: e.port.state,
      port: {}
    };

    if (this.interface && e.port.state === "connected") {
      if (e.port.type === "output") {
        event.port = this.getOutputById(e.port.id) || {};
      } else if (e.port.type === "input") {
        event.port = this.getInputById(e.port.id) || {};
      }
    } else {
      event.port = {
        connection: "closed",
        id: e.port.id,
        manufacturer: e.port.manufacturer,
        name: e.port.name,
        state: e.port.state,
        type: e.port.type
      };
    }

    this._userHandlers[e.port.state].forEach(handler => {
      handler(event);
    });
  };

  /**
   * @method _resetInterfaceUserHandlers

   * @protected
   */
  private _resetInterfaceUserHandlers = () => {
    for (let i = 0; i < this._midiInterfaceEvents.length; i++) {
      this._userHandlers[this._midiInterfaceEvents[i]] = [];
    }
  };
}
// tslint:disable-next-line:max-file-line-count
