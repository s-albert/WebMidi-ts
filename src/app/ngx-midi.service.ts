import { Injectable } from "@angular/core";
import { MidiService } from 'ngx-midi';

@Injectable()
export class NgxMidiService {
  public playNow(): void {

    const midiService = new MidiService();

    midiService.enable((err) => {

      if (err) {
        console.log('WebMidi could not be enabled.', err);
      }

      // Viewing available inputs and outputs
      console.log(midiService.inputs);
      console.log(midiService.outputs);

      // Display the current time
     // console.log(midiService.time);

      // Retrieving an output port/device using its id, name or index

      const output = midiService.outputs[0];

      // Play a note on all channels of the selected output
      // output.playNote('C3');

      // // Play a note on channel 3
      // output.playNote('Gb4', 3);

      // Play a chord on all available channels
      // output.playNote(['C3', 'D#3', 'G3']);

      // Play a chord on channel 7
      // output.playNote(['C3', 'D#3', 'G3'], 7);

      // // Play a note at full velocity on all channels)
      // output.playNote('F#-1', 'all', {velocity: 1});

      // // Play a note on channel 16 in 2 seconds (relative time)
      // output.playNote('F5', 16, {time: '+2000'});

      // // Play a note on channel 1 at an absolute time in the future
      // output.playNote('F5', 16, {time: WebMidi.time + 3000});

      // // Play a note for a duration of 2 seconds (will send a note off message in 2 seconds). Also use
      // // a low attack velocity
      // output.playNote('Gb2', 10, {duration: 2000, velocity: 0.25});

      // // Stop a playing note on all channels
      // output.stopNote('C-1');

      // // Stopping a playing note on channel 11
      // output.stopNote('F3', 11);

      // // Stop a playing note on channel 11 and use a high release velocity
      // output.stopNote('G8', 11, {velocity: 0.9});

      // // Stopping a playing note in 2.5 seconds
      // output.stopNote('Bb2', 11, {time: '+2500'});

      // // Send polyphonic aftertouch message to channel 8
      // output.sendKeyAftertouch('C#3', 8, 0.25);

      // // Send pitch bend (between -1 and 1) to channel 12
      // output.sendPitchBend(-1, 12);

      // You can chain most method calls
      output.playNote('G5', 12)
        .sendPitchBend(-0.5, 12, {time: 400}) // After 400 ms.
        .sendPitchBend(0.5, 12, {time: 800})  // After 800 ms.
        .stopNote('G5', 12, {time: 1200});    // After 1.2 s.
  });
}

  public play(): void {
// Check if the Web MIDI API is supported by the browser
if (navigator['requestMIDIAccess']) {

  // Try to connect to the MIDI interface.
  navigator['requestMIDIAccess']().then(onSuccess, onFailure);

} else {
  console.log('Web MIDI API not supported!');
}

// Function executed on successful connection
function onSuccess(data) {

  let noteon,
      noteoff;
  const outputs = [];

  // Grab an array of all available devices
  const iter = data.outputs.values();
  for (let i = iter.next(); i && !i.done; i = iter.next()) {
    outputs.push(i.value);
  }

  // Craft 'note on' and 'note off' messages (channel 3, note number 60 [C3], max velocity)
  noteon = [0x92, 60, 127];
  noteoff = [0x82, 60, 127];

  // Send the 'note on' and schedule the 'note off' for 1 second later
  outputs[0].send(noteon);
  setTimeout(
    function() {
      outputs[0].send(noteoff);
    },
    1000
  );

}

// Function executed on failed connection
function onFailure(error) {
  console.log('Could not connect to the MIDI interface');

  }
}
}
