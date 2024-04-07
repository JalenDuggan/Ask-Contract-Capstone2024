import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { pinecone, deleteIndex } from '@/utils/pinecone-client';
import { CustomPDFLoader } from '@/utils/customPDFLoader';
import { PINECONE_INDEX_NAME, PINECONE_NAME_SPACE } from '@/config/pinecone';
import { DirectoryLoader } from 'langchain/document_loaders/fs/directory';
import { exec } from 'child_process'
// import { curl } from 'node-libcurl';




/* Name of directory to retrieve your files from */
const filePath = 'docs';



export const run = async () => {
  try {
    async function deleteIn() {
      // const pinecone = await initializePinecone();
      
      (await pinecone).deleteIndex({indexName: "langchain"})
      
    }
    const i = (await deleteIn());
    console.log("Index deleted... Output:" + i)

    async function postData(url = "", data = {}) {
      // Default options are marked with *
      const response = await fetch(url, {
        method: "POST", // *GET, POST, PUT, DELETE, etc.
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Api-Key": `${process.env.PINECONE_API_KEY}`,
          // 'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: JSON.stringify(data), // body data type must match "Content-Type" header
        
      });
      return response.json(); // parses JSON response into native JavaScript objects
    }
    
    await postData("https://api.pinecone.io/indexes", {
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
    }).then((data) => {
      console.log(data); // JSON data parsed by `data.json()` call
    });
    
    
    /*load raw docs from the all files in the directory */
    const directoryLoader = new DirectoryLoader(filePath, {
      '.pdf': (path) => new CustomPDFLoader(path),
    });

    // const loader = new PDFLoader(filePath);
    const rawDocs = await directoryLoader.load();

    /* Split text into chunks */
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const docs = await textSplitter.splitDocuments(rawDocs);
    console.log('split docs', docs);

    console.log('creating vector store...');
    /*create and store the embeddings in the vectorStore*/
    const embeddings = new OpenAIEmbeddings();
    const index = (await pinecone).Index(PINECONE_INDEX_NAME); //change to your own index name

    


    
    function createI() {
      exec('python ./scripts/createIndex.py', (error, stdout, stderr) => {
        if (error) {
          console.log(`error: ${error.message}`);
        }
        else if (stderr) {
          console.log(`stderr: ${stderr}`);
        }
        else {
          console.log(stdout);
        }
      })
    }

    // try{
    //   await createI();
    // } catch(error){
    //   console.log("error: " + error)
    // }




  
    //embed the PDF documents
    await PineconeStore.fromDocuments(docs, embeddings, {
      pineconeIndex: index,
      // namespace: PINECONE_NAME_SPACE,
      textKey: 'text',
    });
    
  } catch (error) {
    console.log('error', error);
    throw new Error('Failed to ingest your data');
  }
};

(async () => {
  await run();
  console.log('ingestion complete');
})();
