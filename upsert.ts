import { PineconeStore } from "@langchain/pinecone";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import dotenv from 'dotenv'
dotenv.config();

interface Document {
    id: number,
    text: string,
    $vector: number[],
    url: string
}

export const client = new PineconeClient({apiKey: `${process.env.PINECONE_API_KEY}`});
export const indexName ="pinecone-index-1"

// Check the existing index, create if none
const createPineconeIndex = async () => {
    const existingIndexes = await client.listIndexes();
    if(!existingIndexes.indexes?.find((a) => a.name.includes(indexName))){
        console.log(`Creating "${indexName}"...`);

        const createClient = await client.createIndex({
          name: indexName,
          dimension: 384, // vector dimension for model `sentence-transformers/all-MiniLM-L6-v2`
          metric: 'cosine', // Replace with your model metric
          spec: { 
            serverless: { 
              cloud: 'aws', 
              region: 'us-east-1' 
            }
          } 
        })

        console.log(`Created with client:`, createClient);
        // Wait 60 seconds for index initialization
        await new Promise((resolve) => setTimeout(resolve, 60000));
    }
    else{
        console.log(`"${indexName}" already exists.`);
    }
}

export const upsert = async (docs: Document[]) => {
    createPineconeIndex(); // create index
    const index = client.Index(indexName);
    // Batch the chunks
    const batchSize = 100;
    let batch = [];

    for (let i = 0; i < docs.length; i++) {
        const vector = {
            id: `${docs[i].id}_${docs[i].url}`,
            values: docs[i].$vector,
            metadata: {
                text: docs[i].text,
                url: docs[i].url
            },
        };
        batch.push(vector)
    
        if (batch.length === batchSize || i === docs.length -1) {
            await index.upsert(batch)
            // Empty the batch
            batch = []
        }
    }
    console.log(`Pinecone index updated with ${docs.length} vectors`);
}