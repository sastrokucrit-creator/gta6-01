// Round 7: no gameplay change here — header written in-session so the file is witnessed.
// In-car radio: four original stations, each with its own song list. R switches station;
// the HUD shows the station name and the current song. The music engine (audio.js) plays
// a different bassline per station.
import { RADIO } from './config.js';

export function createRadio() {
  return { station: 0, song: 0, songT: 0 };
}

export function radioLabel(radio) {
  const st = RADIO[radio.station];
  return `${st.name} · ${st.songs[radio.song % st.songs.length]}`;
}

// What is playing right now: station + song, for the HUD's NOW PLAYING line.
export function radioNow(radio) {
  const st = RADIO[radio.station];
  return { station: st.name, song: st.songs[radio.song % st.songs.length] };
}

export function nextStation(radio) {
  radio.station = (radio.station + 1) % RADIO.length;
  radio.song = 0;
  radio.songT = 0;
  return radioLabel(radio);
}

export function updateRadio(radio, dt) {
  radio.songT += dt;
  // A song lasts ~24 s, then the next one starts.
  if (radio.songT > 24) {
    radio.songT = 0;
    radio.song = (radio.song + 1) % RADIO[radio.station].songs.length;
  }
}
