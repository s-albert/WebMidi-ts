
export const MIDI_CHANNEL_COUNT = 16;
export const SEMITONE_COUNT = 16;
export const CHANNEL_SPECIFIC_MESSAGE = 239; // <= 239

export enum MIDI_SYSTEM_MESSAGES {
  // System common messages
  sysex =  0xF0,            // 240
  timecode = 0xF1,         // 241
  songposition = 0xf2, // 242
  songselect = 0xf3, // 243
  tuningrequest = 0xf6, // 246
  sysexend = 0xf7, // 247 (never actually received - simply ends a sysex)

  // System real-time messages
  clock = 0xf8, // 248
  start = 0xfa, // 250
  continue = 0xfb, // 251
  stop = 0xfc, // 252
  activesensing = 0xfe, // 254
  reset = 0xff, // 255
  unknownsystemmessage = -1
}

export enum MIDI_CHANNEL_MESSAGES {
  noteoff = 0x8, // 8
  noteon = 0x9, // 9
  keyaftertouch = 0xa, // 10
  controlchange = 0xb, // 11
  channelmode = 0xb, // 11
  programchange = 0xc, // 12
  channelaftertouch = 0xd, // 13
  pitchbend = 0xe // 14
}

export enum MIDI_REGISTERED_PARAMETER {
  pitchbendrange = 0x0000,
  channelfinetuning = 0x0001,
  channelcoarsetuning = 0x0002,
  tuningprogram = 0x0003,
  tuningbank = 0x0004,
  modulationrange = 0x0005,

  azimuthangle = 0x3d00,
  elevationangle = 0x3d01,
  gain = 0x3d02,
  distanceratio = 0x3d03,
  maximumdistance = 0x3d04,
  maximumdistancegain = 0x3d05,
  referencedistanceratio = 0x3d06,
  panspreadangle = 0x3d07,
  rollangle = 0x3d08
}

export enum MIDI_CONTROL_CHANGE_MESSAGES {
  bankselectcoarse = 0,
  modulationwheelcoarse = 1,
  breathcontrollercoarse = 2,
  footcontrollercoarse = 4,
  portamentotimecoarse = 5,
  dataentrycoarse = 6,
  volumecoarse = 7,
  balancecoarse = 8,
  pancoarse = 10,
  expressioncoarse = 11,
  effectcontrol1coarse = 12,
  effectcontrol2coarse = 13,
  generalpurposeslider1 = 16,
  generalpurposeslider2 = 17,
  generalpurposeslider3 = 18,
  generalpurposeslider4 = 19,
  bankselectfine = 32,
  modulationwheelfine = 33,
  breathcontrollerfine = 34,
  footcontrollerfine = 36,
  portamentotimefine = 37,
  dataentryfine = 38,
  volumefine = 39,
  balancefine = 40,
  panfine = 42,
  expressionfine = 43,
  effectcontrol1fine = 44,
  effectcontrol2fine = 45,
  holdpedal = 64,
  portamento = 65,
  sustenutopedal = 66,
  softpedal = 67,
  legatopedal = 68,
  hold2pedal = 69,
  soundvariation = 70,
  resonance = 71,
  soundreleasetime = 72,
  soundattacktime = 73,
  brightness = 74,
  soundcontrol6 = 75,
  soundcontrol7 = 76,
  soundcontrol8 = 77,
  soundcontrol9 = 78,
  soundcontrol10 = 79,
  generalpurposebutton1 = 80,
  generalpurposebutton2 = 81,
  generalpurposebutton3 = 82,
  generalpurposebutton4 = 83,
  reverblevel = 91,
  tremololevel = 92,
  choruslevel = 93,
  celestelevel = 94,
  phaserlevel = 95,
  databuttonincrement = 96,
  databuttondecrement = 97,
  nonregisteredparametercoarse = 98,
  nonregisteredparameterfine = 99,
  registeredparametercoarse = 100,
  registeredparameterfine = 101
}

/**
 * [read-only] List of MIDI channel mode messages as defined in the official MIDI
 * specification.
 *
 * @property MIDI_CHANNEL_MODE_MESSAGES
 * @since 2.0.0
 */
export enum MIDI_CHANNEL_MODE_MESSAGES {
  allsoundoff = 120,
  resetallcontrollers = 121,
  localcontrol = 122,
  allnotesoff = 123,
  omnimodeoff = 124,
  omnimodeon = 125,
  monomodeon = 126,
  polymodeon = 127
}

// Notes and semitones for note guessing
export const Notes = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B"
];

/**
 * Semitones
 */
export enum Semitones {
  C = 0,
  D = 2,
  E = 4,
  F = 5,
  G = 7,
  A = 9,
  B = 11
}
