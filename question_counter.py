import json
from os.path import join

files = ['questions_science.json', 'questions_general.json', 'questions_rationality.json']

all_questions = []
# combine all the files into one
for f in files:
    # Read JSON data
    with open(join('public', f), 'r') as f:
        data = json.load(f)
        all_questions.extend(data)
        
print(f"There are {len(all_questions)} questions in total.")
