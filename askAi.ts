import { generateEmbedding } from "./generateEmbeddings";
import { HuggingFaceInference } from "@langchain/community/llms/hf";
import { RunnableSequence } from "@langchain/core/runnables";
import { ChatPromptTemplate, PromptTemplate } from "@langchain/core/prompts";
import { StructuredOutputParser } from "langchain/output_parsers";
import { client, indexName } from "./upsert";
import {Schema, z} from "zod";
import dotenv from "dotenv";
dotenv.config();

const question = `Generate exactly 5 multiple-choice questions that assess the **Applying** level of Bloom's Taxonomy. The questions should be based solely on the following content or topic:\n    \"Data Structures & Algorithms\"\n\nEach question must:\n- - Start with Number 1.\n- Focus on the Applying level (e.g., Applying behavior).\n- Clearly specify the correct answer.\n\nDo not provide explanations for the answers. Only include the questions and answers in the output.`;

// Initialize the HuggingFace model
const model = new HuggingFaceInference({
  model: process.env.HF_MODEL,
  apiKey: process.env.HF_ACCESSTOKEN,
  temperature: 0.5,
});

const askAi = async () => {
  try {
    // Retrieve the Pinecone Index
    const index = client.Index(indexName);

    // Create query embedding.
    const queryEmbedding = await generateEmbedding(question);

    // Query the Pinecone index and return top 10 matches
    const queryResponse = await index.query({
      vector: queryEmbedding, // Vectorized query
      topK: 10,              // Top 10 matches
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
      // const prompt = ChatPromptTemplate.fromMessages([
      //   [
      //     "system",
      //       `You are an expert teacher assistant specializing in creating examination questions. 
      //                 You will help the user by generating tricky examination questions 
      //                 based on the content, paragraph, or topic they provide and their 
      //                 preferred type of questions (e.g., true or false, short answer, multiple-choice). 
                      
      //                 The user will specify the level of difficulty based on the Revised Bloom's Taxonomy: 
      //                 {content}

      //               **Output Requirements**:
      //                   - Always generate the questions and answers in the following format:
      //                   {format_instructions}

      //                 Instructions:
      //                 - Directly generate the requested questions and answers. 
      //                 - Do not provide any commentary, explanations, or context about the topic or your process.
      //                 - Do not think step-by-step or describe your reasoning.
      //                 - If you encounter unfamiliar content, still generate questions based on the provided instructions.
      //                 - Your output must only include the generated questions and their answers in the exact requested format.`
      //   ],
      //   ["user", "{user_query}"],
      // ]);

      const prompt = PromptTemplate.fromTemplate(`You are an expert teacher assistant specializing in creating examination questions. 
                      You generate tricky examination questions 
                      based on the content, paragraph, or topic they provide and their 
                      preferred type of questions (e.g., true or false, short answer, multiple-choice). 
                      
                      The user will specify the level of difficulty based on the Revised Bloom's Taxonomy:
                      1. **Remembering:** Recall facts and basic concepts.
                      2. **Understanding:** Explain ideas or concepts.
                      3. **Applying:** Use information in new situations.
                      4. **Analyzing:** Break down information into parts.
                      5. **Evaluating:** Make judgments based on criteria and standards.
                      6. **Creating:** Put parts together to form a coherent whole. 
                      {content}

                      {format_instructions} You must always return valid JSON fenced by a markdown code block. Do not return any additional text.
                      
                      Here is the query: {user_query}

                      `);

      // Define the JSON schema for the desired output structure
    const schema = z.object({
      questions: z.array(
        z.object({
          questionNumber: z.number(),
          question: z.string(),
          options: z.object({
            a: z.string(),
            b: z.string(),
            c: z.string(),
            d: z.string(),
          }),
          answer: z.string(),
        })
      ),
    });
      // Create an output parser from the JSON schema
      const parser = StructuredOutputParser.fromZodSchema(schema);

      // Create a RunnableSequence chain with the prompt and the structured model
      const chain = RunnableSequence.from([prompt, model, parser]);

      // Execute the chain with input
      const result = await chain.invoke({
        content: concatenatedPageContent,
        user_query: question,
        format_instructions: parser.getFormatInstructions()
      });

    //   console.log(`Generated Questions:\n${result}`);
      console.log(result);
    } else {
      console.log("No relevant content found. Skipping AI query.");
    }
  } catch (error) {
    console.error("Error occurred:", error);
  }
};

askAi();
