import json

# Read JSON data
with open('public/questions.json', 'r') as f:
    data = json.load(f)

# Open a new text file and write each question to it
with open('questions.txt', 'w') as f:
    for entry in data:
        f.write(entry['question'] + '\n\n')
