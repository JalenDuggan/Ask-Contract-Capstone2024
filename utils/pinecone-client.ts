import { PineconeClient } from '@pinecone-database/pinecone';

if (!process.env.PINECONE_ENVIRONMENT || !process.env.PINECONE_API_KEY) {
  throw new Error('Pinecone environment or api key vars missing');
}

async function initializePinecone() {
  try {
    const pinecone = new PineconeClient();

    await pinecone.init({
      environment: process.env.PINECONE_ENVIRONMENT ?? '', //this is in the dashboard
      apiKey: process.env.PINECONE_API_KEY ?? '',
    });

    return pinecone;
  } catch (error) {
    console.log('error', error);
    throw new Error('Failed to initialize Pinecone Client');
  }
}



export async function deleteAllRecords() {
  // Default options are marked with *
  const response = await fetch(`https://langchain-89ghesm.svc.gcp-starter.pinecone.io/vectors/delete`, {
    method: "POST", 
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Api-Key": "edca8e9f-16a6-46f0-89d7-9b92c2cf558f"
    },
    body: JSON.stringify({
      deleteAll: true
      // namespace: "{ Default }"
    }),
  });
  return response.json(); // parses JSON response into native JavaScript objects
}

// Export the promise returned by getPineconeInstance
export const pinecone = initializePinecone();
// export const pineconeDelete = deleteIndex();

    