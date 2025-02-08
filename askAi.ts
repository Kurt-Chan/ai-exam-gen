import { generateEmbedding } from "./generateEmbeddings";
import { HuggingFaceInference } from "@langchain/community/llms/hf";
import { RunnableSequence } from "@langchain/core/runnables";
import { Document } from "@langchain/core/documents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { client, indexName } from "./upsert";
import dotenv from "dotenv";
dotenv.config();

const question = `Generate exactly 5 Multiple-choice questions that assess the Understanding level of Bloom's Taxonomy. The questions should be based solely on the following content or topic:
    "Data Structures & Algorithms"

Each question must:
- Start with Number 1.
- Focus on the Understanding level (e.g., Understanding behavior).
- Clearly specify the correct answer.`;

// Initialize the HuggingFace model
const model = new HuggingFaceInference({
  model: "Qwen/QwQ-32B-Preview",
  apiKey: process.env.HF_ACCESSTOKEN,
});

const askAi = async () => {
  try {
    // Retrieve the Pinecone Index
    const index = client.Index(indexName);

    // Create query embedding.
    const queryEmbedding = await generateEmbedding(question);

    //Query the pinecone index and return top 10 matches
    const queryResponse = await index.query({
      vector: queryEmbedding, // Vectorized Query
      topK: 10, // Top 10 matches
      includeMetadata: true,
      includeValues: true,
    });

    console.log(`Found ${queryResponse.matches.length} matches...`);
    console.log("Asking question...");

    if (queryResponse.matches.length) {
      // Concatenate matched documents into a single string
      const concatenatedPageContent = queryResponse.matches
        .map((match) => match.metadata?.text)
        .join(" ");

      // Create a chat-based prompt template
      const prompt = ChatPromptTemplate.fromMessages([
        [
          "system",
          `You are an expert teacher assistant specializing in creating examination questions. 
          You will generate questions based on a provided topic and the Revised Bloom's Taxonomy level.
          Refer to this context about Revised Bloom's Taxonomy and how to create questions using Revised Bloom's Taxonomy: {content}
            
          **Output Format**:
          \`\`\`
          1. **Question**: [Your question here] \n
            a) Option 1 \n
            b) Option 2 \n
            c) Option 3 \n
            d) Option 4 \n\n

            **Answer: [Correct option]**
          \`\`\`
          
          Instructions:
          - Directly generate the requested questions and answers.
          - No explanations, only the formatted questions and answers.
          `,
        ],
        ["user", "{user_query}"],
      ]);

      // Create a RunnableSequence with the prompt and model
      const chain = RunnableSequence.from([prompt, model]);

      // Execute the chain with input
      const result = await chain.invoke({
        content: concatenatedPageContent,
        user_query: question,
      });

      console.log(`Generated Questions:\n${result}`);
    } else {
      console.log("No relevant content found. Skipping AI query.");
    }
  } catch (error) {
    console.error("Error occurred:", error);
  }
};

askAi();
