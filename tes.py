import requests

url = "https://open.bigmodel.cn/api/llm-application/open/knowledge"

payload = {
    "embedding_id": 3,
    "name": "test",
    "embedding_model": "Embedding-2",
    "contextual": 0,
    "description": "a test norDB",
    "background": "blue",
    "icon": "book"
}
headers = {
    "Authorization": "Bearer c2439cdf7e154563968cc68f513285cd.xDG6fLbdqcZSDHtb",
    "Content-Type": "application/json"
}

response = requests.post(url, json=payload, headers=headers)

print(response.text)