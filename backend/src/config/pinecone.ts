/*
  Change the namespace to the requied format of pinecone
 */
import dotenv from "dotenv";

dotenv.config();

if (!process.env.PINECONE_INDEX_NAME) {
  throw new Error('Missing Pinecone index name in .env file');
}

const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME ?? '';

export { PINECONE_INDEX_NAME };
