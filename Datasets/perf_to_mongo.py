import pymongo
from pymongo import MongoClient
import json
import re
import sys


def parse_perf_output(file_path):
    with open(file_path, 'r') as file:
        lines = file.readlines()
    current_parent = None
    events = []

    for line in lines:
        line.strip()
        if re.match(r'^\s+\d+\.\d+%', line):
            if current_parent:
                events.append(current_parent)
            current_parent = {'children': []}
            parts = line.split()
            current_parent['percentage'] = parts[0]
            current_parent['self'] = parts[1]
            current_parent['command'] = parts[2]
            current_parent['shared_object'] = parts[3]
            current_parent['symbol'] = ' '.join(parts[4:])
        elif re.match(r'^\s+---', line):
            child = {}
            parts = line.strip().split()
            child['address'] = parts[0].strip('---')
            child['percentage'] = parts[1] if len(parts) > 1 else None
            current_parent['children'].append(child)
        elif re.match(r'^\s+\|\s+', line):
            parts = line.strip().split()
    
    if current_parent:
        events.append(current_parent)
    
    return events

def insert_to_mongodb(events):
    for event in events:
        collection.insert_one(event)

if __name__ == "__main__":
    client = MongoClient('mongodb://localhost:27017/')
    db = client['perf_data']
    collection = db['events']
    file_path = sys.argv[1]
    temp = file_path.split('.')[0]
    collection = db[f'{temp[len("perf_output_"):]}']
    events = parse_perf_output(file_path)
    insert_to_mongodb(events)
    print(f'{len(events)} events have been inserted into MongoDB.')
