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
    for special_path in specials_to_process:
        print(f"\n--- Processing {special_path} ---")
        
        # Step 1: Run Comedy Detector
        print("Running comedy detector...")
        # os.system(f"python comedy_detector.py {special_path}")
        os.system(f"python src/core_app/optimized-detector.py {special_path}") # Updated path
        
        # Step 2: Run Bit Segmenter (Create Templates)
        print("Running bit segmenter (template creation)...")
        # os.system("python bit-segmenter.py --create-templates")
        os.system("python analysis_engine/comedy_analyzer.py --create-templates") # Updated path

        # Step 3: Run Bit Segmenter (Process)
        print("Running bit segmenter (processing)...")
        # os.system("python bit-segmenter.py --process")
        os.system("python analysis_engine/comedy_analyzer.py --process") # Updated path
        
        # Step 4: Run Final Analysis (if applicable - maybe called by bit-segmenter?)
        # print("Running final analysis...")
        # os.system("python process_and_analyze.py") # Assuming this is the final step

if __name__ == "__main__":
    process_remaining_specials() 