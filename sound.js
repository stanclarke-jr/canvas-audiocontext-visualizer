import { hslToRGB } from './utils';

const WIDTH = 1500;
const HEIGHT = 1500;
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
canvas.width = WIDTH;
canvas.height = HEIGHT;
let analyser;
let bufferLength;

function handleError(error) {
  console.log('Please provide access to your microphone if you want to proceed.');
}

function drawTimeData(timeData) {
  // Inject time data into the timeData array
  analyser.getByteTimeDomainData(timeData);
  // Visualize given data
  // 1. Clear canvas
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  // 2. Setup some canvas drawing
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#f40058';
  ctx.beginPath();
  const sliceWidth = WIDTH / bufferLength;
  let x = 0;
  timeData.forEach((data, i) => {
    const v = data / 128;
    const y = (v * HEIGHT) / 2.3;
    // Draw lines
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
    x += sliceWidth;
  });
  ctx.stroke();
  // Call itself as soon as possible
  requestAnimationFrame(() => drawTimeData(timeData));
}

function drawFrequencyData(frequencyData) {
  // Inject frequency data into frequencyData array
  analyser.getByteFrequencyData(frequencyData);
  // Bar width
  const barWidth = (WIDTH / bufferLength) * 2.2;
  let x = 0;
  frequencyData.forEach(frequency => {
    // 0 to 255
    const percent = frequency / 255;
    const [h, s, l] = [360 / (percent * 360) - 0.5, 0.8, 0.5];
    const barHeight = (percent * HEIGHT) / 2.6;
    // Convert colour to HSL
    const [r, g, b] = hslToRGB(h, s, l);
    // Draw lines
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fillRect(x, HEIGHT - barHeight, barWidth, barHeight);
    x += barWidth + 2;
  });

  requestAnimationFrame(() => drawFrequencyData(frequencyData));
}

async function getAudio() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true }).catch(handleError);
  const audioCtx = new AudioContext();
  analyser = audioCtx.createAnalyser();
  const source = audioCtx.createMediaStreamSource(stream);
  source.connect(analyser);
  // How much data to collect
  analyser.fftSize = 2 ** 8;
  analyser.smoothingTimeConstant = 0.9;
  // How may pieces of data exist?
  bufferLength = analyser.frequencyBinCount;
  // Capture data from audio
  const timeData = new Uint8Array(bufferLength);
  const frequencyData = new Uint8Array(bufferLength);
  drawTimeData(timeData);
  drawFrequencyData(frequencyData);
}

getAudio();
