import { generateEmbedding } from "./generateEmbeddings";
import { scrape } from "./scrape";
import { upsert } from "./upsert";

// urls to scrape
const urls = [
    'https://www.coloradocollege.edu/other/assessment/how-to-assess-learning/learning-outcomes/blooms-revised-taxonomy.html', 
    'https://whatfix.com/blog/blooms-taxonomy/'
 ];

async function ingest() {
    let chunks: {id:number, text: string; $vector: number[]; url: string }[] = [];

    await Promise.all(
        urls.map(async (url) => {
            let data = await scrape(url);

            // Embed the scraped data chunks
            const embeddings = await(Promise.all(data.map(async(doc) => {
                return await generateEmbedding(doc.text)
            })))

            // Return the values with the vectorized chunks data
            chunks = chunks.concat(data.map((doc, index) => {
                return {
                    id: index + 1,
                    text: doc.text,
                    $vector: embeddings[index],
                    url: doc.url
                }
            }))
        })
    );
    // upsert the chunks to Pinecone
    await upsert(chunks)
    console.log("Vectorized Chunks", chunks)
}

// ingest().catch((error) => console.error(error));