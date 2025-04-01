import os
import json
import glob
from pathlib import Path

def process_segmented_audio(special_name, audio_dir):
    """
    Process a special that's already split into audio segments.
    Creates appropriate tracklist and processes each segment.
    """
    # Get all MP3 files in the directory
    audio_files = sorted(glob.glob(os.path.join(audio_dir, "*.mp3")))
    
    if not audio_files:
        print(f"No MP3 files found in {audio_dir}")
        return
    
    # Create tracklist based on filenames
    tracklist = []
    for i, audio_file in enumerate(audio_files):
        # Extract bit name from filename (remove number prefix and .mp3)
        bit_name = os.path.basename(audio_file)
        bit_name = bit_name.split(' ', 1)[1] if ' ' in bit_name else bit_name
        bit_name = os.path.splitext(bit_name)[0]
        
        tracklist.append({
            "title": bit_name,
            "start_time": i * 300  # Approximate start time (5 minutes per bit)
        })
    
    # Save tracklist
    # tracklist_dir = "tracklists" # Old path relative to execution dir
    tracklist_dir = "data/raw/tracklists" # Updated path relative to project root
    os.makedirs(tracklist_dir, exist_ok=True)
    tracklist_file = os.path.join(tracklist_dir, f"{special_name}_tracklist.json")
    
    with open(tracklist_file, 'w', encoding='utf-8') as f:
        json.dump(tracklist, f, indent=4)
    
    print(f"Created tracklist: {tracklist_file}")
    
    # Process each audio file
    for audio_file in audio_files:
        print(f"Processing {audio_file}...")
        # Run the detector on each segment
        # TODO: Update path if comedy_detector.py is not in the root/PATH. File seems missing.
        os.system(f"python src/core_app/optimized-detector.py {audio_file}")

def main():
    # Process Hannibal special
    # TODO: Ensure this input directory path is correct relative to project root
    # hannibal_dir = "mp3_files" 
    hannibal_dir = "data/raw/mp3_files" # Updated path based on search
    process_segmented_audio("hannibal", hannibal_dir)
    
    # After processing, run the bit segmenter
    # TODO: Update path if bit-segmenter.py is not in the root/PATH. File seems missing.
    os.system("python analysis_engine/comedy_analyzer.py --process")
    
    # Finally, run the analysis script (located in the same 'scripts' directory)
    # Assumes this script (process_segmented_audio.py) is run from the project root
    os.system("python scripts/process_and_analyze.py")

if __name__ == "__main__":
    main() 