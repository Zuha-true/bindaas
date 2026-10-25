const fs = require('node:fs');
const path = require('node:path');

const sampleRate = 22_050;
const seconds = 2;
const samples = sampleRate * seconds;
const dataBytes = samples * 2;
const wav = Buffer.alloc(44 + dataBytes);
wav.write('RIFF', 0);
wav.writeUInt32LE(36 + dataBytes, 4);
wav.write('WAVEfmt ', 8);
wav.writeUInt32LE(16, 16);
wav.writeUInt16LE(1, 20);
wav.writeUInt16LE(1, 22);
wav.writeUInt32LE(sampleRate, 24);
wav.writeUInt32LE(sampleRate * 2, 28);
wav.writeUInt16LE(2, 32);
wav.writeUInt16LE(16, 34);
wav.write('data', 36);
wav.writeUInt32LE(dataBytes, 40);

for (let i = 0; i < samples; i += 1) {
  const time = i / sampleRate;
  const cycle = time % 1.2;
  const ringing = cycle < 0.48 || (cycle >= 0.62 && cycle < 1.1);
  const fade = Math.min(1, time * 20, (seconds - time) * 20);
  const tone = (Math.sin(2 * Math.PI * 440 * time) + Math.sin(2 * Math.PI * 660 * time)) * 0.25;
  wav.writeInt16LE(Math.round((ringing ? tone : 0) * fade * 20_000), 44 + i * 2);
}

const output = path.join(__dirname, '..', 'assets', 'sounds', 'ringtone.wav');
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, wav);
console.log(`Generated ${output}`);
