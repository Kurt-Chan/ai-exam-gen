import { HuggingFaceInferenceEmbeddings } from '@langchain/community/embeddings/hf';
import dotenv from 'dotenv'
dotenv.config();
 
// Embedding Model using HuggingFace
const client = new HuggingFaceInferenceEmbeddings({
  apiKey: process.env.HF_ACCESSTOKEN, // In Node.js defaults to process.env.HUGGINGFACEHUB_API_KEY
  model: "sentence-transformers/all-MiniLM-L6-v2",
});

export const generateEmbedding = async (text: string) => {
    const embedding = await client.embedQuery(text)

    return embedding;
}
