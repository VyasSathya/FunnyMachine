path: src/components/TranscriptionArea.jsx
import React from "react";

/**
 * Displays a controlled textarea for the transcript
 * and lists laughter timestamps.
 *
 * Props:
 *  - transcriptValue: string for the textarea
 *  - setTranscriptValue: function to update the transcript
 *  - laughs: array of laughter marker objects
 */
export default function TranscriptionArea({
  transcriptValue,
  setTranscriptValue,
  laughs
}) {
  return (
    <div style={{ marginTop: "1rem" }}>
      <h4>Transcription</h4>
      <textarea
        className="transcription-box"
        rows={6}
        value={transcriptValue}
        onChange={(e) => setTranscriptValue(e.target.value)}
      />
      <h5>Laughter timestamps</h5>
      {laughs && laughs.length > 0 ? (
        <ul>
          {laughs.map((l, i) => (
            <li key={i}>
              Laugh from {l.timestampStart} to {l.timestampEnd}
            </li>
          ))}
        </ul>
      ) : (
        <p>No laughter detected</p>
      )}
    </div>
  );
}
