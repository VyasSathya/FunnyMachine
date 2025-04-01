import asyncio
import json
import uuid
from datetime import datetime, timezone
from urllib.parse import urlparse
import os # Added for path operations

from crawl4ai import AsyncWebCrawler
from bs4 import BeautifulSoup # Added for parsing

# List of target websites from documentation
TARGET_URLS = [
    "https://www.jokesblogger.com/",
    "https://humornama.com/jokes/",
    "https://punandjokes.com/",
    "http://www.funnyshortjokes.com/",
    "https://badkidsjokes.tumblr.com/",
    "https://laughbreak.com/",
    "https://www.super-funny.com/",
    "https://acornyjokeaday.tumblr.com/",
    "http://modest-jokes.blogspot.com/p/home.html",
    # "http://slay.me/", # Placeholder - requires specific handling/inspection
    "https://coinfoxx.com/",
    "https://somejokeshere.blogspot.com/",
    "https://www.laffgaff.com/",
    "https://jewel92.com/joke-of-the-day/",
    "https://jokeswala.com/",
    "https://funnyhindi.com/",
    "https://www.laughfactory.com/jokes",
    "https://www.reddit.com/r/Jokes/",
    "https://www.reddit.com/r/funny/",
    # "https://www.9gag.com/", # Placeholder - likely requires advanced handling (dynamic content)
    # "https://www.cracked.com/", # Placeholder - more article based?
    # "https://www.theonion.com/", # Placeholder - satire news, not jokes?
    "https://www.humorapi.com/", # This is an API, not a site to scrape directly this way
    "https://www.pun.me/",
    "https://www.rd.com/jokes/",
    "https://jokesoftheday.net/",
    # "https://www.homestarrunner.com/", # Placeholder - different format
    # "https://www.eelslap.com/", # Placeholder - interactive site
    # "https://cantnottweetthis.com/", # Placeholder - social media feed?
    # "https://cat-bounce.com/" # Placeholder - interactive site
]

OUTPUT_FILE = "../data/raw/scraped_jokes.jsonl" # Store in the main raw data folder


def get_site_specific_selectors(url):
    """Returns CSS selectors needed to extract joke data for a given site."""
    domain = urlparse(url).netloc
    selectors = {
        'punandjokes.com': {
            # Guessed selectors for punandjokes.com - NEEDS VERIFICATION
            'joke_container': 'article.post', # Selector for the element containing each joke post
            'text': 'div.entry-content p', # Selector for paragraphs within the main content area
            'tags': 'span.post-tags a', # Selector for tags (if any)
            'author': None, # Likely no specific author per joke
            'rating': None # Likely no rating
        },
        # Add entries for other domains here after inspection...
        # 'www.jokesblogger.com': {
        #     'joke_container': '.post-body',
        #     'text': 'p',
        #     'tags': '.post-tags a',
        # },
    }
    return selectors.get(domain)

async def scrape_site(crawler, url):
    """Scrapes a single website for jokes."""
    print(f"Attempting to scrape: {url}")
    domain = urlparse(url).netloc
    site_selectors = get_site_specific_selectors(url)

    if not site_selectors:
        print(f"Skipping {url} - No selectors defined.")
        return

    # Request HTML content from crawl4ai
    try:
        # Ask crawl4ai for the raw HTML content
        result = await crawler.arun(url=url, output_format="html") 
    except Exception as e:
        print(f"Error crawling {url}: {e}")
        return

    if not result or not result.html:
        print(f"No HTML content extracted from {url}")
        return

    # --- Extraction Logic using BeautifulSoup --- 
    extracted_jokes = []
    try:
        soup = BeautifulSoup(result.html, 'html.parser')
        
        # Find all joke containers on the page
        joke_containers = soup.select(site_selectors['joke_container'])
        if not joke_containers:
            print(f"Warning: No joke containers found on {url} using selector '{site_selectors['joke_container']}'")
            # Try falling back to selecting text elements directly if no containers found?
            # This depends heavily on site structure.
            # For now, we just proceed if containers are found.
        
        for container in joke_containers:
            joke_text_elements = container.select(site_selectors['text'])
            if joke_text_elements:
                # Join the text from selected elements, preserving line breaks
                joke_text = '\n'.join(p.get_text(strip=True) for p in joke_text_elements)
                
                # Basic filtering (optional, can be improved)
                if not joke_text or len(joke_text) < 10: # Skip very short texts
                    continue

                # Extract optional data (example for tags)
                tags = []
                if site_selectors.get('tags'):
                    tag_elements = container.select(site_selectors['tags'])
                    tags = [tag.get_text(strip=True) for tag in tag_elements]
                
                # TODO: Add extraction for author, rating if selectors are defined

                extracted_jokes.append({
                    'text': joke_text,
                    'tags': tags if tags else None, # Store as None if empty
                    'rating': None, # Placeholder
                    'author': None  # Placeholder
                })
            else:
                print(f"Warning: No joke text found within a container on {url} using selector '{site_selectors['text']}'")

    except Exception as e:
        print(f"Error parsing HTML or extracting jokes from {url}: {e}")
        # Optionally log the error and the HTML content for debugging
        # with open(f"error_{domain}.html", "w", encoding="utf-8") as f_err:
        #     f_err.write(result.html)

    # --- Format and Save --- 
    if extracted_jokes:
        print(f"Extracted {len(extracted_jokes)} potential jokes from {url}")
        # Ensure the directory exists before writing
        output_dir = os.path.dirname(OUTPUT_FILE)
        if not os.path.exists(output_dir):
            try:
                os.makedirs(output_dir)
            except OSError as e:
                print(f"Error creating output directory {output_dir}: {e}")
                return # Cannot save if directory creation fails
                
        with open(OUTPUT_FILE, 'a', encoding='utf-8') as f:
            for joke_data in extracted_jokes:
                record = {
                    "id": str(uuid.uuid4()),
                    "text": joke_data.get('text'),
                    "source_url": url,
                    "source_website": domain,
                    "scraped_timestamp": datetime.now(timezone.utc).isoformat(timespec='seconds').replace('+00:00', 'Z'),
                    "tags": joke_data.get('tags'),
                    "rating": joke_data.get('rating'),
                    "author": joke_data.get('author')
                }
                record = {k: v for k, v in record.items() if v is not None}
                f.write(json.dumps(record) + '\n')
    else:
         print(f"No jokes extracted cleanly from {url} (using current logic).")


async def main():
    # Ensure the output directory exists (moved check inside scrape_site for per-site writing)
    
    # Clear the output file at the start of a run (optional)
    # Consider clearing only if the script runs successfully for all sites?
    # Or maybe append with timestamps/run IDs?
    # For now, let's clear it.
    try:
        output_dir = os.path.dirname(OUTPUT_FILE)
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            pass # Creates or clears the file
        print(f"Cleared output file: {OUTPUT_FILE}")
    except OSError as e:
        print(f"Error preparing output file {OUTPUT_FILE}: {e}")
        return # Stop if we cannot prepare the output file

    print(f"Starting crawl. Output will be saved to {OUTPUT_FILE}")
    # Limit concurrency to avoid overwhelming sites or getting blocked
    async with AsyncWebCrawler(concurrency_limit=3) as crawler:
        tasks = [scrape_site(crawler, url) for url in TARGET_URLS]
        await asyncio.gather(*tasks)
    print("Crawling finished.")

if __name__ == "__main__":
    # Note: On Windows, the default asyncio event loop policy might need changing
    # if running into Proactor Loop errors with libraries like httpx used by crawl4ai.
    # Uncomment the following lines if you encounter such issues:
    # if os.name == 'nt':
    #    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main()) 