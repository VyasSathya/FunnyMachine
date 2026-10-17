# Data Scraping Requirements: Jokes

## 1. Objective

Use a web scraping tool (like `crawl4ai`) to extract individual jokes from various online sources to populate the `FunnyMachine` dataset.

## 2. Scraping Tool

The primary tool intended for this task is `crawl4ai`.

## 3. Target Websites

The following websites have been identified as potential sources for jokes:

*   https://www.jokesblogger.com/
*   https://humornama.com/jokes/
*   https://punandjokes.com/
*   http://www.funnyshortjokes.com/
*   https://badkidsjokes.tumblr.com/
*   https://laughbreak.com/
*   https://www.super-funny.com/
*   https://acornyjokeaday.tumblr.com/
*   http://modest-jokes.blogspot.com/p/home.html
*   http://slay.me/
*   https://coinfoxx.com/
*   https://somejokeshere.blogspot.com/
*   https://www.laffgaff.com/
*   https://jewel92.com/joke-of-the-day/
*   https://jokeswala.com/
*   https://funnyhindi.com/
*   https://www.laughfactory.com/jokes
*   https://www.reddit.com/r/Jokes/
*   https://www.reddit.com/r/funny/
*   https://www.9gag.com/
*   https://www.cracked.com/
*   https://www.theonion.com/
*   https://www.humorapi.com/
*   https://www.pun.me/
*   https://www.rd.com/jokes/
*   https://jokesoftheday.net/
*   https://www.homestarrunner.com/
*   https://www.eelslap.com/
*   https://cantnottweetthis.com/
*   https://cat-bounce.com/

## 4. Output Format

The output should be in **JSON Lines (JSONL)** format. Each line in the output file must be a single, valid JSON object representing one scraped joke.

## 5. Data Schema per Joke

Each JSON object must contain the following fields:

**Required Fields:**

*   `id` (String): A unique identifier for the joke. Using UUID is preferred.
*   `text` (String): The full text content of the joke. Preserve original line breaks using `\n`. Extract only the joke text, minimizing surrounding page content.
*   `source_url` (String): The exact URL from which the joke was scraped.
*   `source_website` (String): The base domain name of the source website (e.g., "jokesblogger.com", "reddit.com").
*   `scraped_timestamp` (String): The timestamp indicating when the scraping occurred, in ISO 8601 format (e.g., "YYYY-MM-DDTHH:MM:SSZ").

**Optional Fields (Include if readily available and parseable):**

*   `tags` (Array of Strings): Any categories, tags, or keywords associated with the joke on the source page.
*   `rating` (Number): Any numerical rating, score, or upvotes associated with the joke.
*   `author` (String): The username or author attributed to the joke (e.g., on platforms like Reddit).

## 6. Example Output Line (JSONL)

```json
{"id": "unique-joke-uuid-123", "text": "Why don't scientists trust atoms?\nBecause they make up everything!", "source_url": "https://punandjokes.com/some-joke-page", "source_website": "punandjokes.com", "scraped_timestamp": "2024-05-16T10:30:00Z", "tags": ["science", "puns"], "rating": 150, "author": "JokeSubmitter99"}
```

## 7. Scraping Notes

*   Focus on extracting individual jokes.
*   Skip items that are clearly not jokes (e.g., articles, navigation links, advertisements).
*   Handle parsing errors gracefully; do not include error messages or malformed data in the final output file.
*   Aim for accuracy in extracting the joke text, preserving formatting like line breaks where appropriate.

## 8. Data Type Considerations (Text vs. Audio)

For this specific web scraping task targeting the listed websites, all extracted data will be **text-based jokes**.

*   Therefore, adding a `data_type: "text"` field to each scraped JSON object is currently **not necessary** and would be redundant for this batch of data.
*   The system should handle different data types (like audio recordings from the app/UI, video sources) when those data ingestion pathways are implemented. This typically involves linking metadata specific to that medium (e.g., `audioMetadata` containing duration, filename, laughter timestamps) to the joke record.
*   For now, the schema defined in Section 5 is sufficient for text scraped from these web sources. 