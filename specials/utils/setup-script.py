import os
import json

# Create tracklists directory if it doesn't exist
os.makedirs("tracklists", exist_ok=True)
print("Created tracklists directory")

# Define all the tracklists directly in the script
tracklists = {
    "Chewed_Up_HD": [
        {"title": "Intro", "start_time": 0},
        {"title": "Being White", "start_time": 74},
        {"title": "Cell Phones", "start_time": 255},
        {"title": "Gay Marriage", "start_time": 505},
        {"title": "Being a Parent", "start_time": 691},
        {"title": "Divorce", "start_time": 928},
        {"title": "The N-Word", "start_time": 1223},
        {"title": "Outro", "start_time": 1475}
    ],
    
    "Hilarious_HD": [
        {"title": "Intro", "start_time": 0},
        {"title": "The Best Life", "start_time": 87},
        {"title": "Divorce", "start_time": 324},
        {"title": "Being a Dad", "start_time": 603},
        {"title": "Eating and Drinking", "start_time": 786},
        {"title": "Kids and Technology", "start_time": 1043},
        {"title": "Outro", "start_time": 1280}
    ],
    
    "Live_at_the_Beacon_Theater": [
        {"title": "Of Course... But Maybe", "start_time": 0},
        {"title": "My Religion", "start_time": 402},
        {"title": "The Ugly Man's Guide to Beautiful Women", "start_time": 706},
        {"title": "Being Broke", "start_time": 942},
        {"title": "Divorce", "start_time": 1168},
        {"title": "Parenting", "start_time": 1409},
        {"title": "Killing Yourself", "start_time": 1617},
        {"title": "The Best Ever", "start_time": 1912}
    ],
    
    "Oh_My_God__HD_": [
        {"title": "Intro", "start_time": 0},
        {"title": "Being a God", "start_time": 66},
        {"title": "Divorce", "start_time": 325},
        {"title": "Parenting", "start_time": 608},
        {"title": "Getting Older", "start_time": 835},
        {"title": "Animals", "start_time": 1078},
        {"title": "Outro", "start_time": 1297}
    ],
    
    "Live_at_the_Comedy_Store_HD": [
        {"title": "Intro", "start_time": 0},
        {"title": "The Mexican", "start_time": 190},
        {"title": "Vaginer", "start_time": 292},
        {"title": "Reallocated Noises", "start_time": 469},
        {"title": "First & Last Time Having Sex", "start_time": 689},
        {"title": "Subway Crazy Person", "start_time": 785},
        {"title": "Babies on a Plane", "start_time": 901},
        {"title": "Being a Good Dad", "start_time": 1246},
        {"title": "Lying", "start_time": 1505},
        {"title": "Trading Notes About Race", "start_time": 1690},
        {"title": "13 & 9 Years Old", "start_time": 1875},
        {"title": "Everybody Dies", "start_time": 2203},
        {"title": "The Dog", "start_time": 2494},
        {"title": "Bats", "start_time": 2745},
        {"title": "Rat Sex", "start_time": 3180},
        {"title": "Bad Girlfriend", "start_time": 3470},
        {"title": "Wizard of Oz", "start_time": 3723},
        {"title": "Outro", "start_time": 3873}
    ],
    
    "Sincerely-Louis-CK-HD": [
        {"title": "Let's Get Started", "start_time": 0},
        {"title": "The Whole Thing", "start_time": 429},
        {"title": "My Phone", "start_time": 844},
        {"title": "The Meal", "start_time": 1298},
        {"title": "The Funeral", "start_time": 1733},
        {"title": "The N-word", "start_time": 2167},
        {"title": "The Clown", "start_time": 2792}
    ],
    
    "Sorry-Louis-CK": [
        {"title": "Let's Laugh", "start_time": 0},
        {"title": "The Worst Year", "start_time": 394},
        {"title": "The Virus", "start_time": 845},
        {"title": "Being Canceled", "start_time": 1312},
        {"title": "The Plane Story", "start_time": 1813},
        {"title": "The Best Part", "start_time": 2277}
    ],
    
    "Louis_C.K._at_The_Dolby_(HD)": [
        {"title": "Confidence", "start_time": 0},
        {"title": "Homeless People", "start_time": 442},
        {"title": "Jesus", "start_time": 706},
        {"title": "Hell / Hitler", "start_time": 1528},
        {"title": "A Gay Man's Sperm", "start_time": 1689},
        {"title": "Divorce", "start_time": 1769},
        {"title": "Slow and Steady", "start_time": 1949},
        {"title": "Abortion", "start_time": 2105},
        {"title": "Murder", "start_time": 2278},
        {"title": "You're Going to Die", "start_time": 2622},
        {"title": "Porn", "start_time": 2895},
        {"title": "Dating", "start_time": 3144}
    ]
}

# Save each tracklist to the appropriate file
for special_name, tracklist_content in tracklists.items():
    # Save to the tracklists directory
    output_file = os.path.join("tracklists", f"{special_name}_tracklist.json")
    with open(output_file, 'w') as f:
        json.dump(tracklist_content, f, indent=4)
    
    print(f"Created tracklist for {special_name}")

print("\nAll tracklists created. Now run: python bit-segmenter.py --process")
