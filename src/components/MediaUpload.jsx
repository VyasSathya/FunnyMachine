// src/components/MediaUpload.jsx
import React, { useState, useRef } from 'react';

// Receives a callback function to execute when upload/transcription is complete
const MediaUpload = ({ onUploadComplete }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0); // For visual feedback
    const [error, setError] = useState('');
    const fileInputRef = useRef(null); // Ref to access the hidden file input

    // Triggered when a file is selected
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            // Validate file type/size if necessary
            // const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'video/mp4', 'video/quicktime'];
            // if (!allowedTypes.includes(file.type)) {
            //     setError(`Unsupported file type: ${file.type}`);
            //     return;
            // }
            // if (file.size > 50 * 1024 * 1024) { // Example: 50MB limit
            //     setError('File size exceeds limit.');
            //     return;
            // }
            handleUpload(file);
        }
        // Reset file input value so the same file can be selected again
        if (event.target) event.target.value = null;
    };

    // Handles the upload process (currently placeholder)
    const handleUpload = async (file) => {
        setIsUploading(true);
        setError('');
        setUploadProgress(0);

        // --- Placeholder for Backend Transcription API Call ---
        // 1. Upload the file (e.g., using FormData) to your backend '/api/transcribe' endpoint.
        // 2. Backend sends file to transcription service (e.g., AssemblyAI).
        // 3. Backend polls service or uses webhooks for results.
        // 4. Backend sends results back to frontend, or frontend gets them via another request.

        try {
            console.log(`Uploading file: ${file.name}, Size: ${file.size}`);

            // --- Simulate Upload & Transcription ---
            for (let p = 0; p <= 100; p += 15) { // Simulate progress
                setUploadProgress(p);
                await new Promise(res => setTimeout(res, 100));
            }
            setUploadProgress(100);
            console.log("Simulating transcription process...");
            await new Promise(res => setTimeout(res, 2500 + Math.random() * 2000)); // Simulate delay

            // Simulate receiving results
            const mockTranscriptionResult = {
                transcription: `Simulated transcription for ${file.name}. The quick brown fox jumps over the lazy dog. Laughter occurred here, perhaps. And then more talking.`,
                // Optional: Include structured timestamp data if service provides it
                // words: [ { text: "The", start_ms: 100, end_ms: 300 }, ... ],
                // laughter_timestamps: [ { start_s: 5.2, end_s: 6.8, confidence: 0.9 } ]
            };
            console.log("Transcription complete (simulated).");

            // Call the callback prop with the result
            if (typeof onUploadComplete === 'function') {
                onUploadComplete(mockTranscriptionResult);
            }
            // --- End Simulation ---

        } catch (err) {
            console.error("Upload/Transcription failed:", err);
            setError('Upload or transcription failed. Please try again.');
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    // Opens the hidden file input dialog
    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="media-upload-container">
            {/* Hidden actual file input */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
                accept="audio/*, video/*" // Specify acceptable file types
                disabled={isUploading}
            />
            {/* Button visible to the user */}
            <button
                className="btn upload-btn"
                onClick={triggerFileInput}
                disabled={isUploading}
                title="Upload audio or video file for transcription"
            >
                 {isUploading ? `Uploading (${uploadProgress}%)` : '📁 Upload Media'}
            </button>
            {/* Display errors */}
            {error && <p className="error-message" style={{marginTop:'5px', marginBottom: 0}}>{error}</p>}
        </div>
    );
};

export default MediaUpload;