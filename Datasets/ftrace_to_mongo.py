import sys
import pymongo
from pymongo import MongoClient
import re



def parse_ftrace_data(file_path):
    ftrace_data = []
    with open(file_path, 'r') as file:
        for line in file:
            if not line.strip() or line.startswith('#'):
                continue
            match = re.search(r'(\S+)-(\d+)\s+\[(\d+)\]\s+\.\.\.\.\.\s+(\d+\.\d+):\s+(\w+):\s+page=(\S+)\s+pfn=(\S+)\s+order=(\d+)\s+migratetype=(\d+)\s+gfp_flags=(\S+)', line)
            if match:
                temp_flags = match.group(10).split('|')
                data = {
                    'task': match.group(1),
                    'pid': int(match.group(2)),
                    'timestamp': float(match.group(4)),
                    'function': match.group(5),
                    'page': match.group(6),
                    'pfn': match.group(7),
                    'order': int(match.group(8)),
                    'migratetype': int(match.group(9)),
                    'gfp_flags': temp_flags
                }
                ftrace_data.append(data)
    print(len(ftrace_data))
    return ftrace_data


def save_data_to_mongodb(collection_name, data):
    collection = db[collection_name]
    for item in data:
        collection.insert_one(item)

if __name__ == '__main__':
    if len(sys.argv) != 2:
        print("사용 방법: python script.py ftrace_output_file")
        sys.exit(1)
    
    client = MongoClient("mongodb://localhost:27107/")
    db = client['ftrace_data']
    file_path = sys.argv[1]
    temp = file_path.split('.')[0]
    collection_name = f'{temp[len("ftrace_output_"):]}'
    ftrace_data = parse_ftrace_data(file_path)
    save_data_to_mongodb(collection_name, ftrace_data)
    print(f"{collection_name} 콜렉션에 {len(ftrace_data)}개의 데이터가 저장되었습니다.")
