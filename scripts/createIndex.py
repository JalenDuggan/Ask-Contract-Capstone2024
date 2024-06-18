from pinecone import Pinecone, PodSpec
import time

# # Set the timer for 5 seconds
# delay_in_seconds = 5
# print("Timer started...")
# time.sleep(delay_in_seconds)
# print("Timer expired after 5 seconds!")


pc = Pinecone(api_key="edca8e9f-16a6-46f0-89d7-9b92c2cf558f")

pc.create_index(
  name="langchain",
  dimension=1536,
  metric="cosine",
  spec=PodSpec(
    environment="gcp-starter"
  )
)
