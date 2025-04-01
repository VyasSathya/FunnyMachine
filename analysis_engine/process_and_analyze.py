# process_and_analyze.py (Conceptual - Requires Python + requests library)

import os
import json
import re
import uuid
import requests # For making HTTP requests (pip install requests)
import time
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# --- Configuration ---
# Relative paths from the script's location (scripts/)
SEGMENTED_BITS_DIR = '../data/processed/segmented_bits/'  # Input folder
OUTPUT_DIR = '../data/processed/'  # Output directory
OUTPUT_FILE = os.path.join(OUTPUT_DIR, 'jokes_with_ai_analysis.jsonl') # Output file
API_ENDPOINT = os.getenv('API_ENDPOINT', 'http://localhost:4321/api/analyze-jokes-batch')
BATCH_SIZE = 10 # Adjust based on typical joke length and API limits
MODEL_TO_USE = os.getenv('MODEL_TO_USE', 'gpt-4')
MAX_RETRIES = 3
RETRY_DELAY = 5  # seconds

# --- Helper Functions ---
def generate_temp_id(prefix="batch-joke"):
    """Generate a temporary unique ID"""
    return f"{prefix}-{uuid.uuid4().hex[:8]}"

def make_api_request(payload, retry_count=0):
    """Make API request with retries"""
    try:
        response = requests.post(API_ENDPOINT, json=payload, timeout=180)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        if retry_count < MAX_RETRIES:
            print(f"Request failed, retrying in {RETRY_DELAY} seconds... (Attempt {retry_count + 1}/{MAX_RETRIES})")
            time.sleep(RETRY_DELAY)
            return make_api_request(payload, retry_count + 1)
        else:
            print(f"Max retries exceeded. Error: {e}")
            return None

# --- Main Processing Logic ---
def process_and_analyze_files():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    all_extracted_jokes = [] # Collect all jokes from all files first

    # --- Step 1: Extract Jokes from Files ---
    print(f"Looking for JSON files in {os.path.abspath(SEGMENTED_BITS_DIR)}")
    if not os.path.isdir(SEGMENTED_BITS_DIR):
        print(f"ERROR: Input directory not found: {SEGMENTED_BITS_DIR}")
        return

    bit_files = [f for f in os.listdir(SEGMENTED_BITS_DIR) if f.endswith('_bits.json')]
    if not bit_files:
        print(f"No *_bits.json files found in {SEGMENTED_BITS_DIR}")
        return

    print(f"Found {len(bit_files)} bit files to process...")
    for filename in bit_files:
         filepath = os.path.join(SEGMENTED_BITS_DIR, filename)
         special_name = filename.replace('_bits.json', '') # Infer special name
         try:
             with open(filepath, 'r', encoding='utf-8') as f: bits_data = json.load(f)
             for bit_index, bit in enumerate(bits_data):
                 for joke_index, joke_obj in enumerate(bit.get("jokes", [])):
                     if joke_obj.get("joke_text"):
                         # Add essential info for analysis + temp ID
                         joke_to_process = {
                             "tempId": generate_temp_id(),
                             "text": joke_obj.get("joke_text"),
                             "laughter": joke_obj.get("laughter", {}),
                             # Keep original context if useful later
                             "original_joke_data": joke_obj,
                             "source_file": filename,
                             "special_name": special_name,
                             "bit_title": bit.get("title", f"Bit {bit_index+1}"),
                             "bit_index": bit_index,
                             "joke_index": joke_index
                         }
                         all_extracted_jokes.append(joke_to_process)
         except Exception as e: print(f"Error reading or parsing {filename}: {e}")

    print(f"Extracted {len(all_extracted_jokes)} total jokes.")
    if not all_extracted_jokes: return

    # --- Step 2 & 3: Batch Jokes and Call Analysis API ---
    processed_data_with_ai = []
    total_jokes = len(all_extracted_jokes)
    for i in range(0, total_jokes, BATCH_SIZE):
        batch = all_extracted_jokes[i : min(i + BATCH_SIZE, total_jokes)]
        print(f"\nProcessing batch {i // BATCH_SIZE + 1} ({len(batch)} jokes)...")

        # Prepare payload for the backend API
        payload = {
            "jokes": [ # Send data needed for analysis prompt
                {
                    "tempId": j.get("tempId"),
                    "text": j.get("text"),
                    "laughter": j.get("laughter")
                } for j in batch
            ],
            "selectedModel": MODEL_TO_USE
        }

        # Make the API request with retries
        results = make_api_request(payload)
        if not results:
            print(f"Failed to process batch {i // BATCH_SIZE + 1} after {MAX_RETRIES} retries")
            # Append original batch data without AI analysis
            processed_data_with_ai.extend([{**j, "ai_analysis": {"error": "api_failed"}} for j in batch])
            continue

        # --- Step 4: Merge Results ---
        results_map = {res.get('tempId'): res.get('analysis') for res in results.get('results', [])}

        for original_joke in batch:
            temp_id = original_joke.get('tempId')
            ai_analysis = results_map.get(temp_id)
            if ai_analysis:
                # Combine original joke data with the AI analysis received
                enhanced_joke = {
                    **original_joke, # Keep all original fields + context
                    "ai_analysis": ai_analysis # Add the structured analysis
                }
                processed_data_with_ai.append(enhanced_joke)
            else:
                print(f"Warning: No AI analysis returned for joke {temp_id}")
                # Append original even if AI fails for this item
                processed_data_with_ai.append({**original_joke, "ai_analysis": None})

        print(f"Batch {i // BATCH_SIZE + 1} processed successfully.")
        # Optional: Add delay between batches to avoid rate limits
        if i + BATCH_SIZE < total_jokes:
             print("Waiting 2 seconds before next batch...")
             time.sleep(2)

    # --- Step 5: Save Enhanced Data ---
    if processed_data_with_ai:
       try:
           with open(OUTPUT_FILE, 'w', encoding='utf-8') as f_out:
               for entry in processed_data_with_ai:
                   # Convert complex objects (like datetime) if necessary before dump
                   f_out.write(json.dumps(entry, default=str) + '\n')
           print(f"\nSaved {len(processed_data_with_ai)} enhanced joke entries to {OUTPUT_FILE}")
       except Exception as e: print(f"Error saving output file: {e}")
    else: print("No data processed or saved.")

if __name__ == "__main__":
    process_and_analyze_files()