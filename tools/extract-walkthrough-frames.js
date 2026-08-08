const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const projectRoot = path.resolve(__dirname, '..');
const sourceUrl = process.argv[2] || 'http://127.0.0.1:8000/assets/videos/architectural-walkthrough.mp4';
const outputDir = path.resolve(projectRoot, process.argv[3] || 'assets/videos/walkthrough-frames');
const chromePath = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';

function wait(ms){
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getVideoMetadata(page){
  const pageUrl = new URL('/index%20(1).html', sourceUrl).href;
  await page.goto(pageUrl, {waitUntil:'domcontentloaded'});
  return page.evaluate(async (url) => {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.src = url;
    document.body.append(video);
    await new Promise((resolve, reject) => {
      video.addEventListener('loadedmetadata', resolve, {once:true});
      video.addEventListener('error', () => reject(new Error('The walkthrough video could not be loaded.')), {once:true});
    });

    const samples = [];
    if('requestVideoFrameCallback' in video){
      const startedAt = performance.now();
      await new Promise(resolve => {
        const collect = (_now, metadata) => {
          samples.push({mediaTime:metadata.mediaTime, presentedFrames:metadata.presentedFrames});
          if(performance.now() - startedAt >= 900) resolve();
          else video.requestVideoFrameCallback(collect);
        };
        video.requestVideoFrameCallback(collect);
        video.play().catch(resolve);
      });
      video.pause();
    }

    const first = samples[0];
    const last = samples[samples.length - 1];
    const measuredFps = first && last && last.mediaTime > first.mediaTime
      ? (last.presentedFrames - first.presentedFrames) / (last.mediaTime - first.mediaTime)
      : 30;
    const fps = Math.max(1, Math.min(60, Math.round(measuredFps || 30)));
    return {
      duration: video.duration,
      fps,
      width: video.videoWidth,
      height: video.videoHeight
    };
  }, sourceUrl);
}

async function captureFrame(page, time){
  return page.evaluate(async ({time}) => {
    const video = document.querySelector('video');
    video.currentTime = Math.max(0, Math.min(video.duration - 0.001, time));
    await new Promise(resolve => video.addEventListener('seeked', resolve, {once:true}));
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/webp', .86).split(',')[1];
  }, {time});
}

(async()=>{
  fs.mkdirSync(outputDir, {recursive:true});
  const browser = await chromium.launch({headless:true, executablePath:chromePath});
  const page = await browser.newPage();
  const metadata = await getVideoMetadata(page);
  const frameCount = Math.max(2, Math.round(metadata.duration * metadata.fps) + 1);
  const frames = [];

  console.log(`Extracting ${frameCount} frames at ${metadata.fps}fps (${metadata.width}x${metadata.height})...`);
  for(let index = 0; index < frameCount; index++){
    const time = index === frameCount - 1
      ? Math.max(0, metadata.duration - 0.001)
      : (index / (frameCount - 1)) * Math.max(0, metadata.duration - 0.001);
    const base64 = await captureFrame(page, time);
    const filename = `frame-${String(index).padStart(4, '0')}.webp`;
    fs.writeFileSync(path.join(outputDir, filename), Buffer.from(base64, 'base64'));
    frames.push(filename);
    if((index + 1) % 25 === 0 || index === frameCount - 1) console.log(`${index + 1}/${frameCount}`);
  }

  fs.writeFileSync(path.join(outputDir, 'manifest.json'), JSON.stringify({
    source: sourceUrl,
    duration: metadata.duration,
    fps: metadata.fps,
    width: metadata.width,
    height: metadata.height,
    frames
  }, null, 2));

  await browser.close();
  console.log(`Wrote ${frames.length} frames to ${path.relative(projectRoot, outputDir)}`);
})().catch(error => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
