import express from "express";
import cors from "cors";
import loggerM from "morgan";
import winston from "winston";
import path from "path";

import multer from "multer"
import * as fs from 'fs';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { makeChain } from './utils/makeChain.js';
import { pinecone } from './utils/pinecone-client.js';
import { PINECONE_INDEX_NAME } from './config/pinecone.js';

const app = express();
const port = process.env.PORT || 8080 ; // default port to listen
// const upload = multer({ dest: 'uploads/' });
app.use(loggerM('dev'));
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

// Configure Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Route to handle file upload
app.post("/api/upload", (req, res) => {
  // Specify the directory where files should be saved
  const destinationDir = "../app/docs";

  // Delete existing files in the directory before uploading new files
  fs.readdir(destinationDir, (err, files) => {
    if (err) {
      logger.error("Error reading directory:", err);
      res.status(500).json({ error: "Failed to delete existing files" });
      return;
    }

    // Delete each file in the directory
    files.forEach((file) => {
      fs.unlink(path.join(destinationDir, file), (err) => {
        if (err) {
          logger.error("Error deleting file:", err);
          res.status(500).json({ error: "Failed to delete existing files" });
          return;
        }
      });
    });

    // Multer configuration
    const storage = multer.diskStorage({
      destination (req, file, cb) {
        fs.mkdir(destinationDir, { recursive: true }, function (err) {
          if (err) {
            logger.error("Error creating destination directory:", err);
            // Pass error to callback
            cb(err, destinationDir);
          } else {
            // Directory created successfully, proceed
            cb(null, destinationDir);
          }
        });
      },
      filename (req, file, cb) {
        // Generate unique file name
        cb(null, `${Date.now()}-${file.originalname}`);
      },
    });

    const upload = multer({ storage }).single("file");

    // Handle file upload
    upload(req, res, (err) => {
      if (err) {
        logger.error("Error uploading file:", err);
        res.status(500).json({ error: "Failed to upload file" });
        return;
      }

      // File has been uploaded successfully
      res.status(200).json({ message: "File uploaded successfully" });
    });
  });
});

// start the Express server
app.listen( port, () => {
    winston.log({
      level: 'info',
      message: `server started at http://localhost:${ port }`
    });
} );