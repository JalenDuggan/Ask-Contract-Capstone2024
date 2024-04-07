import express from "express";
import cors from "cors";
import logger from "morgan";
import winston from "winston";

import multer from "multer"
import * as fs from 'fs';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { makeChain } from './utils/makeChain.js';
import { pinecone } from './utils/pinecone-client.js';
import { PINECONE_INDEX_NAME } from './config/pinecone.js';

const app = express();
const port = process.env.PORT || 8080 ; // default port to listen
const upload = multer({ dest: 'uploads/' });
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

// Endpoint for handling file uploads
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    // Read the uploaded file from the temporary location
    const fileData = req.file.buffer; // Assuming multer saves the file data in req.file.buffer

    // Define the destination directory to save the file
    const destinationDir = 'C:/Users/drrai/Documents/GitHub/capstone2024-ver2/app/docs';

    // Ensure the destination directory exists
    if (!fs.existsSync(destinationDir)) {
      fs.mkdirSync(destinationDir, { recursive: true });
    }

    // Define the file path for saving the uploaded file
    const filePath = `${destinationDir}${req.file.originalname}`;

    // Write the file data to the destination directory
    fs.writeFileSync(filePath, fileData);

    // Respond with success message
    res.status(200).send('File uploaded successfully.');
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).send('Error uploading file.');
  }
});
// start the Express server
app.listen( port, () => {
    winston.log({
      level: 'info',
      message: `server started at http://localhost:${ port }`
    });
} );