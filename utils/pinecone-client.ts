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

// Wrap the initialization inside an async function and export it
async function getPineconeInstance() {
  return await initializePinecone();
}

export async function deleteIndex() {
  const pinecone = await initializePinecone();
  
  await pinecone.deleteIndex({indexName: "langchain"})
  
}

// Export the promise returned by getPineconeInstance
export const pinecone = getPineconeInstance();
// export const pineconeDelete = deleteIndex();

