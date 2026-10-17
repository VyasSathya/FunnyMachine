from comedy_detector import detect_jokes_from_transcript, detect_bits_from_jokes
import json

# Real transcript data from Louis CK's special
test_transcript = '''
I called him a faggot.  I miss that word, you know?
[Laughter]

When I was a kid, I didn't know what gay was.
[Laughter]

I had no fucking idea.  Faggot didn't mean gay when I was a kid.
[Laughter]

because they're being a faggot, you know?
[Laughter]

Man, it's supposed to use those for that.
[Laughter]

Shut up, faggot.
[Laughter]

unless he's being a faggot.
[Laughter]

and I don't know why I'm watching them do it,
[Laughter]

blowing one another on their respective panacea,
[Laughter]

I would, you know, hello, gentlemen, whatever, you know?
[Laughter]

But if one of them took the dick out of his mouth
[Laughter]

or something like that.
[Laughter]

I'd be like, hey, shut up, faggot.
[Laughter]

Faggot!
[Laughter]

Never call somebody a mean name  because they're a suck at it.
[Laughter]

Because if you can suck a dick, man, that's awesome.
[Laughter]

I mean, I haven't tried and failed.
[Laughter]

and I couldn't do it because I'm afraid.  That's the only reason.
[Laughter]

I think that there's a strength in being able to do that.  I believe that.
[Laughter]

comes easily to anybody.
[Laughter]

Grrr!
[Laughter]

Grrr!  Okay, here we go.
[Laughter]

Suck ya.  Waaah.
[Laughter]

to hurt other people and then they become bad.  They become hard to use.  There's words that I love that I can't use  because other people use them wrong to hurt other people.
[Laughter]
'''

if __name__ == "__main__":
    print("Testing comedy detector with real transcript data...")
    
    # Detect individual jokes
    detected_jokes = detect_jokes_from_transcript(test_transcript)
    print(f"\nDetected {len(detected_jokes)} individual jokes.")
    
    # Group into bits
    detected_bits = detect_bits_from_jokes(detected_jokes)
    print(f"\nGrouped into {len(detected_bits)} bits:")
    
    # Helper functions for JSON serialization (copied from comedy_detector.py)
    def bit_to_dict(bit):
        return {
            "id": bit.id,
            "title": bit.title,
            "keywords": bit.keywords,
            "theme_strength": bit.theme_strength,
            "jokes": [joke_to_dict(joke) for joke in bit.jokes],
            "callbacks_within": bit.callbacks_within
        }
    
    def joke_to_dict(joke):
        return {
            "id": joke.id,
            "setup": {
                "text": joke.setup.text,
                "has_act_out": joke.setup.has_act_out,
                "act_out_text": joke.setup.act_out_text,
                "delivery_cues": joke.setup.delivery_cues
            },
            "punchline": {
                "text": joke.punchline.text,
                "has_act_out": joke.punchline.has_act_out,
                "act_out_text": joke.punchline.act_out_text,
                "delivery_cues": joke.punchline.delivery_cues
            },
            "tags": [{
                "text": tag.text,
                "has_act_out": tag.has_act_out,
                "act_out_text": tag.act_out_text,
                "delivery_cues": tag.delivery_cues
            } for tag in joke.tags],
            "techniques": [tech.value for tech in joke.techniques],
            "callbacks_to": joke.callbacks_to,
            "audience_reactions": [
                [reaction.value, conf] for reaction, conf in joke.audience_reactions
            ],
            "has_crowd_work": joke.has_crowd_work,
            "crowd_work_text": joke.crowd_work_text,
            "source_lines": joke.source_lines
        }
    
    # Output the results
    output = json.dumps([bit_to_dict(bit) for bit in detected_bits], indent=2)
    
    # Save to file
    with open("detector_results.json", "w") as f:
        f.write(output)
    
    print("\nResults have been saved to detector_results.json")
    print("\nFirst bit preview:")
    print(json.dumps(bit_to_dict(detected_bits[0]), indent=2)) 