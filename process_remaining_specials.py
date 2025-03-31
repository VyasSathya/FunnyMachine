import os
import glob
import shutil

def process_remaining_specials():
    """
    Process all remaining specials that aren't pre-segmented.
    """
    # List of files to process (excluding Hannibal's pre-segmented files)
    specials_to_process = [
        "Norm.Macdonald.Me.Doing.Standup.2011.720p.WEBRip.x264.AAC-LAMA.mp3",
        "Nate Bargatze_ Full Time Magic.mp3",
        "Sorry-Louis-CK.mp3",
        "Sincerely-Louis-CK-HD.mp3",
        "Oh_My_God__HD_.mp3",
        "Louis_C.K._at_The_Dolby_(HD).mp3",
        "Live_at_the_Comedy_Store_HD.mp3",
        "Live_at_the_Beacon_Theater.mp3",
        "Hilarious_HD.mp3",
        "Chewed_Up_HD.mp3"
    ]
    
    # Process each special
    for special in specials_to_process:
        special_path = os.path.join("mp3_files", special)
        if os.path.exists(special_path):
            print(f"Processing {special}...")
            # Run the detector
            os.system(f"python comedy_detector.py {special_path}")
            
            # Create tracklist template
            os.system("python bit-segmenter.py --create-templates")
            
            # Process the bits
            os.system("python bit-segmenter.py --process")
    
    # Run the final analysis
    os.system("python process_and_analyze.py")

if __name__ == "__main__":
    process_remaining_specials() 