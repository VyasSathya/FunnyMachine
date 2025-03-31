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

    // Handles the upload process
    const handleUpload = async (file) => {
        setIsUploading(true);
        setError('');
        setUploadProgress(0);

        const formData = new FormData();
        formData.append('mediaFile', file); // Key must match multer setup ('mediaFile')

        try {
            console.log(`Uploading file: ${file.name}, Size: ${file.size}`);

            // Use axios or fetch to send the file to the backend
            const response = await fetch('http://localhost:3001/api/upload-media', {
                method: 'POST',
                body: formData,
                // Optional: Add progress tracking using XMLHttpRequest if needed
                // onUploadProgress: (progressEvent) => {
                //     const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                //     setUploadProgress(percentCompleted);
                // }
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || `HTTP error! status: ${response.status}`);
            }

            console.log('Upload successful:', result);
            setUploadProgress(100); // Mark as complete

            // --- TODO: Trigger Transcription --- 
            // Now that the file is uploaded, we can trigger the next step (transcription).
            // We'll pass the 'result.filename' to the transcription process.
            // For now, we can simulate the rest or call the onUploadComplete callback.

            console.log("File uploaded, placeholder for transcription call...");

            // Simulate receiving results (replace with actual transcription call later)
            const mockTranscriptionResult = {
                sourceFilename: result.filename, // Include filename for reference
                transcription: `Simulated transcription for ${result.originalName}. The quick brown fox jumps over the lazy dog. Laughter occurred here, perhaps. And then more talking.`,
            };
            console.log("Transcription complete (simulated).");

            // Call the callback prop with the result
            if (typeof onUploadComplete === 'function') {
                onUploadComplete(mockTranscriptionResult);
            }
            // --- End Simulation ---

        } catch (err) {
            console.error("Upload failed:", err);
            setError(err.message || 'Upload failed. Please try again.');
            setUploadProgress(0); // Reset progress on error
        } finally {
            setIsUploading(false);
            // Don't reset progress here if successful, maybe reset after a short delay or action
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