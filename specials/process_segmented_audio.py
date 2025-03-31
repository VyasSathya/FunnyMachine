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
    tracklist_dir = "tracklists"
    os.makedirs(tracklist_dir, exist_ok=True)
    tracklist_file = os.path.join(tracklist_dir, f"{special_name}_tracklist.json")
    
    with open(tracklist_file, 'w', encoding='utf-8') as f:
        json.dump(tracklist, f, indent=4)
    
    print(f"Created tracklist: {tracklist_file}")
    
    # Process each audio file
    for audio_file in audio_files:
        print(f"Processing {audio_file}...")
        # Run the detector on each segment
        os.system(f"python comedy_detector.py {audio_file}")

def main():
    # Process Hannibal special
    hannibal_dir = "mp3_files"
    process_segmented_audio("hannibal", hannibal_dir)
    
    # After processing, run the bit segmenter
    os.system("python bit-segmenter.py --process")
    
    # Finally, run the analysis
    os.system("python process_and_analyze.py")

if __name__ == "__main__":
    main() 