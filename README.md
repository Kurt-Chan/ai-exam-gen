
## My First RAG (Retrieval-Augmented Generation) App

My way of learning things is through hands-on approach. This projects was a product of my journey in learning LLMs using RAG (Retrieval-Augmented Generation).

**THE PROBLEM**
When I was a part time teacher. One of the main problem I always encounter was creating exam papers. Mainly because we have to create test questions that will align to the Bloom's Taxonomy. 

**THE IDEA** 
-
Using LLMs from HuggingFace, I developed a website that will generate questions based on the Bloom's Taxonomy Levels. [Nexar](https://nexar.kurtchan.com) is the base and very rough concept I made to help create questions that aligns with Bloom's Taxonomy. It was working pretty fine.

**THE PROBLEM ABOUT NEXAR**
-
It is just mainly a prompt, a very long huge prompt that will help you to generate questions based on what Bloom's Taxonomy level you want to generate. The AI only have a few idea about Bloom's Taxonomy.

**THE SOLUTION**
-
**RAG (Retrieval-Augmented)** approach was my go-to. Using NodeJS, Pinecone as my vector database and Qwen as my LLM. I managed to let the LLM to have more understanding about Bloom's Taxonomy and generate a more accurate questions.

**Code Workflow**

 1. Scrape texts from URLs about Bloom's Taxonomy
 2. Chunks the scraped texts and convert it to vectorized chunks of data
 3. Upsert this data to the Pinecone index
 4. When a user wants to generate a question based on the given level, user query will be embedded
 5. Query this to the Pinecone index
 6. Generate the questions.

**Tech Stack**

 - NodeJs
 - [Pinecone](https://docs.pinecone.io/guides/get-started/overview)
 - [Huggingface](https://huggingface.co/)
 
 **Future Plan**
 
 To make this a full stack application using NextJS, which is a framework I am not familiar with (but I have knowledge about it).
 
Thanks!
