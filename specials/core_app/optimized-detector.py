import os
import asyncio
import json
import numpy as np
import librosa
import ffmpeg
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from faster_whisper import WhisperModel
import argparse
import torch
import subprocess

# Configure folders
MP4_FOLDER = "mp4_files"          # Folder with your MP4 files
MP3_FOLDER = "mp3_files"          # Folder with your MP3 files
OUTPUT_FOLDER = "json_outputs"    # Folder to store JSON outputs
TRAINING_FOLDER = "training_data" # Folder for AI-ready training data

# Performance optimization parameters
NUM_WORKERS = 4  # Number of parallel processes for audio processing

async def extract_audio(mp4_path, mp3_path):
    """Extract audio from MP4 asynchronously using subprocess."""
    if not os.path.exists(mp3_path):
        print(f"Extracting audio: {mp4_path} -> {mp3_path}")
        try:
            loop = asyncio.get_running_loop()
            cmd = ['ffmpeg', '-i', mp4_path, '-f', 'mp3', '-acodec', 'libmp3lame', '-ar', '16000', '-y', mp3_path]
            
            # Run ffmpeg as a subprocess
            process = await loop.run_in_executor(
                None,
                lambda: subprocess.run(cmd, capture_output=True, text=True)
            )
            
            if process.returncode != 0:
                print(f"FFMPEG Error: {process.stderr}")
                return False
                
            print(f"Audio extraction complete: {mp3_path}")
            return True
        except Exception as e:
            print(f"Error extracting audio: {str(e)}")
            return False
    else:
        print(f"MP3 already exists for {mp4_path}")
        return True


def transcribe_audio(audio_path, model):
    """Transcribe audio using faster-whisper."""
    print(f"Transcribing: {audio_path}")
    try:
        # Use a larger beam size for more accurate transcriptions
        segments, info = model.transcribe(
            audio_path, 
            beam_size=5,
            vad_filter=True,      # Filter out non-speech
            vad_parameters=dict(
                min_silence_duration_ms=500  # Minimum silence duration to split segments
            ),
            word_timestamps=True  # Get timestamps for each word for more precise alignment
        )
        
        segment_list = list(segments)
        transcript = " ".join(segment.text for segment in segment_list)
        
        print(f"Transcription complete. Language: {info.language}, Probability: {info.language_probability:.2f}")
        print(f"Found {len(segment_list)} segments")
        
        return transcript, segment_list
    except Exception as e:
        print(f"Transcription error: {e}")
        return "", []

def detect_laughter(audio_path, segment_length=0.5, threshold=0.55):
    """Detect laughter using audio characteristics."""
    print(f"Detecting laughter in: {audio_path}")
    try:
        # Load audio file with librosa
        y, sr = librosa.load(audio_path, sr=16000)  # Use 16kHz for efficiency
        
        # Calculate frame length
        frame_length = int(segment_length * sr)
        hop_length = frame_length // 2  # 50% overlap for better detection
        
        # Create empty list for laughter segments
        laughter_segments = []
        
        # Process audio in segments with overlap
        for i in range(0, len(y) - frame_length, hop_length):
            segment = y[i:i+frame_length]
            start_time = i / sr
            end_time = (i + frame_length) / sr
            
            # Extract features
            # 1. Spectral contrast (good for distinguishing voiced vs unvoiced)
            contrast = np.mean(librosa.feature.spectral_contrast(y=segment, sr=sr))
            
            # 2. Zero crossing rate (high for laughter)
            zcr = np.mean(librosa.feature.zero_crossing_rate(segment))
            
            # 3. RMS energy (laughter often has specific energy pattern)
            rms = np.mean(librosa.feature.rms(y=segment))
            
            # 4. Spectral bandwidth (laughter has wider bandwidth)
            bandwidth = np.mean(librosa.feature.spectral_bandwidth(y=segment, sr=sr))
            
            # 5. Spectral flatness (laughter is often "noisier")
            flatness = np.mean(librosa.feature.spectral_flatness(y=segment))
            
            # 6. Spectral centroid (laughter often has different centroid)
            centroid = np.mean(librosa.feature.spectral_centroid(y=segment, sr=sr))
            
            # 7. MFCC variation (laughter has specific patterns)
            mfccs = librosa.feature.mfcc(y=segment, sr=sr, n_mfcc=13)
            mfcc_var = np.mean(np.var(mfccs, axis=1))
            
            # Simple rule-based detection with improved weights
            laughter_score = 0
            
            if zcr > 0.1:  # High zero crossing rate
                laughter_score += 0.15
            
            if contrast > 20:  # High spectral contrast
                laughter_score += 0.15
            
            if rms > 0.05 and rms < 0.3:  # Decent volume but not too loud
                laughter_score += 0.15
            
            if bandwidth > 2000:  # Wide bandwidth
                laughter_score += 0.15
            
            if flatness > 0.2:  # Noisy rather than tonal
                laughter_score += 0.15
                
            if centroid > 1200 and centroid < 2500:  # Typical range for laughter
                laughter_score += 0.15
                
            if mfcc_var > 20:  # High variation in MFCCs
                laughter_score += 0.1
            
            # Store features for training data
            features = {
                "zcr": float(zcr),
                "contrast": float(contrast),
                "rms": float(rms),
                "bandwidth": float(bandwidth),
                "flatness": float(flatness),
                "centroid": float(centroid),
                "mfcc_var": float(mfcc_var),
                "score": float(laughter_score)
            }
            
            # If score exceeds threshold, mark as laughter
            if laughter_score >= threshold:
                laughter_segments.append({
                    "start": start_time,
                    "end": end_time,
                    "confidence": laughter_score,
                    "features": features
                })
            
            # Also keep a random sample of non-laughter segments (1 in 20)
            # This is useful for training data
            elif np.random.random() < 0.05:
                laughter_segments.append({
                    "start": start_time,
                    "end": end_time,
                    "confidence": laughter_score,
                    "features": features,
                    "non_laughter_sample": True
                })
        
        # Merge adjacent laughter segments
        if laughter_segments:
            # First filter out the non-laughter samples from merging
            laugh_only = [s for s in laughter_segments if s.get("non_laughter_sample") is not True]
            non_laughs = [s for s in laughter_segments if s.get("non_laughter_sample") is True]
            
            if laugh_only:
                # Sort by start time
                laugh_only.sort(key=lambda x: x["start"])
                
                merged_segments = [laugh_only[0]]
                for segment in laugh_only[1:]:
                    last_segment = merged_segments[-1]
                    # If this segment starts right after the last one ends (or with small gap)
                    if segment["start"] - last_segment["end"] < 0.3:
                        # Merge by extending the end time and using max confidence
                        last_segment["end"] = segment["end"]
                        last_segment["confidence"] = max(last_segment["confidence"], segment["confidence"])
                    else:
                        merged_segments.append(segment)
                
                # Filter out very short segments (likely false positives)
                merged_segments = [s for s in merged_segments if (s["end"] - s["start"]) > 0.5]
                
                # Add back the non-laughter samples
                return merged_segments + non_laughs
            else:
                return non_laughs
        else:
            return []
            
    except Exception as e:
        print(f"Laughter detection error: {e}")
        return []

def create_joke_segments(segments_data, laughter_segments):
    """
    Create joke segments separated by laughter.
    Each joke segment contains all the text that led up to laughter.
    """
    # Sort text segments by start time
    sorted_segments = sorted(segments_data, key=lambda x: x["start"])
    
    # Sort laughter segments by start time (ignore non-laughter samples)
    sorted_laughter = sorted(
        [l for l in laughter_segments if not l.get("non_laughter_sample")],
        key=lambda x: x["start"]
    )
    
    if not sorted_laughter:
        # If no laughter detected, treat the whole thing as one segment
        if sorted_segments:
            return [{
                "joke_text": " ".join([s["text"] for s in sorted_segments]),
                "start_time": sorted_segments[0]["start"],
                "end_time": sorted_segments[-1]["end"],
                "duration": sorted_segments[-1]["end"] - sorted_segments[0]["start"],
                "laughter": None
            }]
        return []
    
    joke_segments = []
    current_joke_text = []
    last_laugh_end = 0
    
    # Helper function to create a joke segment
    def finalize_joke_segment(text_segments, laughter):
        if not text_segments:
            return None
            
        # Join all text segments
        full_text = " ".join([s["text"] for s in text_segments])
        
        # Calculate start and end times
        joke_start = text_segments[0]["start"]
        joke_end = text_segments[-1]["end"]
        
        return {
            "joke_text": full_text,
            "start_time": joke_start,
            "end_time": joke_end,
            "duration": joke_end - joke_start,
            "laughter": laughter
        }
    
    # Iterate through all the laughs
    for laugh_idx, laugh in enumerate(sorted_laughter):
        # Find all text segments that come before this laugh
        joke_text_segments = []
        
        for segment in sorted_segments:
            # If segment ends before this laugh starts or slightly overlaps
            if segment["end"] <= laugh["start"] + 1:
                # And if it's after the last laugh we processed
                if segment["start"] >= last_laugh_end - 1:
                    joke_text_segments.append(segment)
            # If we found a segment that's beyond this laugh, stop looking
            elif segment["start"] > laugh["start"]:
                break
        
        # If we found text segments for this joke
        if joke_text_segments:
            joke = finalize_joke_segment(joke_text_segments, {
                "start": laugh["start"],
                "end": laugh["end"],
                "duration": laugh["end"] - laugh["start"],
                "confidence": laugh["confidence"]
            })
            
            if joke:
                joke_segments.append(joke)
        
        # Update the last laugh position
        last_laugh_end = laugh["end"]
    
    # Handle text after the last laugh
    final_segments = [s for s in sorted_segments if s["start"] >= last_laugh_end - 1]
    if final_segments:
        joke = finalize_joke_segment(final_segments, None)
        if joke:
            joke_segments.append(joke)
    
    return joke_segments

def save_results(transcript, segments, laughter_segments, base_filename):
    """Save transcription and laughter segments to JSON."""
    os.makedirs(OUTPUT_FOLDER, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_filename = os.path.join(OUTPUT_FOLDER, f"{base_filename}_{timestamp}.json")
    
    # Convert segments to dictionaries
    segments_data = []
    for segment in segments:
        segment_dict = {
            "start": segment.start,
            "end": segment.end,
            "text": segment.text
        }
        segments_data.append(segment_dict)
    
    # Create joke segments divided by laughter
    joke_segments = create_joke_segments(segments_data, laughter_segments)
    
    # Traditional joke-laugh pairs for backward compatibility
    joke_laugh_pairs = []
    for laugh in [l for l in laughter_segments if not l.get("non_laughter_sample")]:
        # Find text segments that occur right before this laughter
        preceding_text = ""
        for segment in segments_data:
            # If text segment ends right before or overlaps with laugh start (within 2 seconds)
            if abs(segment["end"] - laugh["start"]) < 2:
                preceding_text = segment["text"]
                joke_laugh_pairs.append({
                    "joke_text": preceding_text,
                    "laugh_start": laugh["start"],
                    "laugh_end": laugh["end"],
                    "laugh_duration": laugh["end"] - laugh["start"],
                    "laugh_confidence": laugh["confidence"]
                })
                break
    
    data = {
        "transcript": transcript,
        "segments": segments_data,
        "laughter_segments": laughter_segments,
        "joke_laugh_pairs": joke_laugh_pairs,
        "joke_segments": joke_segments
    }
    
    with open(output_filename, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"Saved results to {output_filename}")
    return output_filename

def create_training_data(output_files):
    """Create AI-ready training data from processed outputs."""
    os.makedirs(TRAINING_FOLDER, exist_ok=True)
    
    # Arrays to store data
    all_joke_segments = []
    all_features = []
    all_labels = []
    
    # Process each output file
    for output_file in output_files:
        with open(output_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Collect joke segments
        if "joke_segments" in data:
            all_joke_segments.extend(data["joke_segments"])
        
        # Collect features and labels for audio classifier
        for segment in data["laughter_segments"]:
            if "features" in segment:
                features_list = [
                    segment["features"]["zcr"],
                    segment["features"]["contrast"],
                    segment["features"]["rms"],
                    segment["features"]["bandwidth"],
                    segment["features"]["flatness"]
                ]
                
                if "centroid" in segment["features"]:
                    features_list.append(segment["features"]["centroid"])
                
                if "mfcc_var" in segment["features"]:
                    features_list.append(segment["features"]["mfcc_var"])
                
                all_features.append(features_list)
                
                # 1 for laughter, 0 for non-laughter
                if segment.get("non_laughter_sample"):
                    all_labels.append(0)
                else:
                    all_labels.append(1)
    
    # Save joke segments (for text-based humor analysis)
    jokes_file = os.path.join(TRAINING_FOLDER, "joke_segments.json")
    with open(jokes_file, 'w', encoding='utf-8') as f:
        json.dump(all_joke_segments, f, ensure_ascii=False, indent=2)
    
    # Save features and labels (for audio-based laughter detection)
    features_file = os.path.join(TRAINING_FOLDER, "audio_features.npz")
    np.savez(
        features_file,
        features=np.array(all_features),
        labels=np.array(all_labels)
    )
    
    # Create a clean dataset of just jokes with laughter
    jokes_with_laughter = [j for j in all_joke_segments if j["laughter"] is not None]
    laughter_jokes_file = os.path.join(TRAINING_FOLDER, "jokes_with_laughter.json")
    with open(laughter_jokes_file, 'w', encoding='utf-8') as f:
        json.dump(jokes_with_laughter, f, ensure_ascii=False, indent=2)
    
    print(f"Created training data:")
    print(f"- {len(jokes_with_laughter)}/{len(all_joke_segments)} joke segments with laughter")
    print(f"- Clean dataset of {len(jokes_with_laughter)} jokes that got laughs saved to {laughter_jokes_file}")
    print(f"- {len(all_features)} audio samples ({sum(all_labels)} laughter, {len(all_labels) - sum(all_labels)} non-laughter)")


async def process_file(file, model):
    """Process a single MP4 file: extract audio, transcribe, detect laughter."""
    mp4_path = os.path.join(MP4_FOLDER, file)
    base_name = os.path.splitext(file)[0]
    mp3_filename = f"{base_name}.mp3"
    mp3_path = os.path.join(MP3_FOLDER, mp3_filename)

    # Check if output file already exists for this base name
    existing_outputs = [f for f in os.listdir(OUTPUT_FOLDER) if f.startswith(base_name + "_") and f.endswith(".json")]
    
    if existing_outputs:
        print(f"Output already exists for {base_name}, skipping processing")
        # Return the path to the most recent output file
        most_recent = sorted(existing_outputs)[-1]
        return os.path.join(OUTPUT_FOLDER, most_recent)
    
    if await extract_audio(mp4_path, mp3_path):
        # Transcribe and detect laughter
        transcript, segments = transcribe_audio(mp3_path, model)
        laughter_segments = detect_laughter(mp3_path)
        
        # Save results
        output_file = save_results(transcript, segments, laughter_segments, base_name)
        print(f"Found {len([s for s in laughter_segments if not s.get('non_laughter_sample')])} potential laughter segments in {base_name}")
        return output_file
    return None

async def process_mp4_files(model_size="medium", device="cpu"):
    """Process all MP4 files asynchronously."""
    # Ensure necessary folders exist
    for folder in [MP4_FOLDER, MP3_FOLDER, OUTPUT_FOLDER, TRAINING_FOLDER]:
        os.makedirs(folder, exist_ok=True)

    # Load Whisper model
    print(f"Loading Whisper model '{model_size}' on {device}...")
    compute_type = "int8"
    model = WhisperModel(model_size, device=device, compute_type=compute_type)
    print("Model loaded successfully")

    # Gather MP4 files
    mp4_files = [f for f in os.listdir(MP4_FOLDER) if f.lower().endswith('.mp4')]
    if not mp4_files:
        print(f"No MP4 files found in {MP4_FOLDER}")
        return

    print(f"Found {len(mp4_files)} MP4 file(s) to process")

    # Process files concurrently
    tasks = [process_file(file, model) for file in mp4_files]
    output_files = await asyncio.gather(*tasks)
    output_files = [f for f in output_files if f]
    
    # Create training data from all processed files
    if output_files:
        create_training_data(output_files)

def process_mp3_directly(mp3_path, model_size="medium", device="cpu"):
    """Process a single MP3 file directly."""
    print(f"Processing MP3 file: {mp3_path}")
    
    # Load Whisper model
    print(f"Loading Whisper model '{model_size}' on {device}...")
    compute_type = "int8"
    model = WhisperModel(model_size, device=device, compute_type=compute_type)
    print("Model loaded successfully")
    
    base_name = os.path.splitext(os.path.basename(mp3_path))[0]
    
    # Transcribe and detect laughter
    transcript, segments = transcribe_audio(mp3_path, model)
    laughter_segments = detect_laughter(mp3_path)
    
    # Save results
    output_file = save_results(transcript, segments, laughter_segments, base_name)
    print(f"Found {len([s for s in laughter_segments if not s.get('non_laughter_sample')])} potential laughter segments in {base_name}")
    print(f"Results saved to {output_file}")
    
    # Create training data
    create_training_data([output_file])

def process_all_mp3_files(model_size="medium", device="cpu"):
    """Process all MP3 files in the MP3_FOLDER."""
    print(f"Processing all MP3 files in {MP3_FOLDER}")
    
    # Ensure necessary folders exist
    for folder in [MP3_FOLDER, OUTPUT_FOLDER, TRAINING_FOLDER]:
        os.makedirs(folder, exist_ok=True)
    
    # Load Whisper model
    print(f"Loading Whisper model '{model_size}' on {device}...")
    compute_type = "int8"
    model = WhisperModel(model_size, device=device, compute_type=compute_type)
    print("Model loaded successfully")
    
    # Gather MP3 files
    mp3_files = [f for f in os.listdir(MP3_FOLDER) if f.lower().endswith('.mp3')]
    if not mp3_files:
        print(f"No MP3 files found in {MP3_FOLDER}")
        return
    
    print(f"Found {len(mp3_files)} MP3 file(s) to process")
    
    output_files = []
    for mp3_file in mp3_files:
        mp3_path = os.path.join(MP3_FOLDER, mp3_file)
        base_name = os.path.splitext(mp3_file)[0]
        
        # Check if output file already exists for this base name
        existing_outputs = [f for f in os.listdir(OUTPUT_FOLDER) if f.startswith(base_name + "_") and f.endswith(".json")]
        
        if existing_outputs:
            print(f"Output already exists for {base_name}, skipping processing")
            # Add the most recent output file to the list
            most_recent = sorted(existing_outputs)[-1]
            output_files.append(os.path.join(OUTPUT_FOLDER, most_recent))
            continue
        
        # Transcribe and detect laughter
        transcript, segments = transcribe_audio(mp3_path, model)
        laughter_segments = detect_laughter(mp3_path)
        
        # Save results
        output_file = save_results(transcript, segments, laughter_segments, base_name)
        print(f"Found {len([s for s in laughter_segments if not s.get('non_laughter_sample')])} potential laughter segments in {base_name}")
        print(f"Results saved to {output_file}")
        
        output_files.append(output_file)
    
    # Create training data from all processed files
    if output_files:
        create_training_data(output_files)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Performance-Optimized Laughter Detection")
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--mp3", help="Process a single MP3 file directly")
    group.add_argument("--all-mp3", action="store_true", help="Process all MP3 files in mp3_files folder")
    
    # Model parameters
    parser.add_argument("--model", choices=["tiny", "base", "small", "medium", "large-v2"], default="medium", 
                      help="Whisper model size to use (default: medium)")
    parser.add_argument("--device", choices=["cpu", "cuda"], default="cuda" if torch.cuda.is_available() else "cpu",
                      help=f"Device to use (default: {'cuda' if torch.cuda.is_available() else 'cpu'})")
    parser.add_argument("--threshold", type=float, default=0.55,
                      help="Threshold for laughter detection (default: 0.55)")
    
    args = parser.parse_args()
    
    if args.mp3:
        if os.path.exists(args.mp3) and args.mp3.lower().endswith('.mp3'):
            process_mp3_directly(args.mp3, args.model, args.device)
        else:
            print(f"Error: File not found or not an MP3 file: {args.mp3}")
    elif args.all_mp3:
        process_all_mp3_files(args.model, args.device)
    else:
        asyncio.run(process_mp4_files(args.model, args.device))