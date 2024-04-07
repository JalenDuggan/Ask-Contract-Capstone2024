import express from "express";
import cors from "cors";
import logger from "morgan";
import winston from "winston";

import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { makeChain } from './utils/makeChain.js';
import { pinecone } from './utils/pinecone-client.js';
import { PINECONE_INDEX_NAME } from './config/pinecone.js';

const app = express();
const port = process.env.PORT || 8080 ; // default port to listen
app.use(logger('dev'));
app.use(express.json());
app.use(cors());

// ----------------- API ----------------- //

// define a route handler for the default home page
app.post( "/api/chat", ( req, res ) => {

  (async () => {

    const { question, history } = req.body;
    console.log(history)
    winston.log({
      level: 'info',
      message: `${ question }`
    });

    // only accept post requests
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    if (!question) {
      return res.status(400).json({ message: 'No question in the request' });
    }
    // OpenAI recommends replacing newlines with spaces for best results
    const sanitizedQuestion = question.trim().replaceAll('\n', ' ');

    try {
      const index = await pinecone.Index(PINECONE_INDEX_NAME);

      /* create vectorstore*/
      const vectorStore = await PineconeStore.fromExistingIndex(
        new OpenAIEmbeddings({}),
        {
          pineconeIndex: index,
          textKey: 'text',
          // namespace: PINECONE_NAME_SPACE, //namespace comes from your config folder
        },
      );

      // create chain
      const chain = makeChain(vectorStore);
      // Ask a question using chat history
      const response = await chain.call({
        question: sanitizedQuestion,
        chat_history: history || [],
      });

      console.log('response', response);
      res.status(200).json(response);
    } catch (error: any) {
      console.log('error', error);
      res.status(500).json({ error: error.message || 'Something went wrong' });
    }
  }) ();
} );

// start the Express server
app.listen( port, () => {
    winston.log({
      level: 'info',
      message: `server started at http://localhost:${ port }`
    });
} );