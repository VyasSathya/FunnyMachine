path: whisperTranscriber.js
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

/**
 * Uses the Whisper CLI to transcribe the given audio/video file.
 * If Whisper fails, returns a dummy transcript.
 *
 * Requirements:
 *  - Python package Whisper installed:
 *      pip install git+https://github.com/openai/whisper.git
 *  - FFmpeg installed and in PATH.
 */
function transcribeWithWhisper(filePath) {
  return new Promise((resolve) => {
    const outBase = path.join(
      path.dirname(filePath),
      path.basename(filePath, path.extname(filePath))
    );
    const command = `whisper "${filePath}" --language en --model base --output_dir "${path.dirname(filePath)}" --verbose False --no-progress-bar`;
    console.log("Executing command:", command);
    
    exec(command, (err, stdout, stderr) => {
      if (err) {
        console.error("Whisper exec error:", err);
        // Fallback: return dummy transcript on error
        return resolve({
          transcript: "Dummy transcript: Unable to transcribe file.",
          laughs: []
        });
      }
      console.log("Whisper stdout:", stdout);
      console.log("Whisper stderr:", stderr);
      const txtPath = `${outBase}.txt`;
      if (!fs.existsSync(txtPath)) {
        console.error("Transcription file not found.");
        return resolve({
          transcript: "Dummy transcript: No transcription file generated.",
          laughs: []
        });
      }
      const transcript = fs.readFileSync(txtPath, "utf8");
      // Remove the generated transcription file after reading it
      fs.unlinkSync(txtPath);
      // Naive laughter detection: look for "ha" in transcript text
      const laughs = [];
      const lower = transcript.toLowerCase();
      let idx = lower.indexOf("ha");
      while (idx !== -1) {
        laughs.push({ timestampStart: "N/A", timestampEnd: "N/A" });
        idx = lower.indexOf("ha", idx + 2);
      }
      resolve({ transcript, laughs });
    });
  });
}

module.exports = { transcribeWithWhisper };
