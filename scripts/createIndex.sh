curl -s -X POST "https://api.pinecone.io/indexes" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Api-Key: edca8e9f-16a6-46f0-89d7-9b92c2cf558f" \
  -d '{
         "name": "langchain",
         "dimension": 1536,
         "metric": "cosine",
         "spec": {
            "pod": {
               "environment": "gcp-starter",
               "pod_type": "p1.x1",
               "pods": 1
            }
         }
      }'
