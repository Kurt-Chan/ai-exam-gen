import * as playwright from 'playwright';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

export const scrape = async (url: string) => {
        const browser = await playwright.chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(url, { waitUntil: 'domcontentloaded' });

    // get the text in the body
    const text = await page.innerText('body');
    await browser.close();

    // Replaces all \n with spaces
    const cleanedText = text.replace(/\n/g, ' ');

    // Split scraped data into chunks
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 512,
        chunkOverlap: 100,
    });

    // Create documents out of the chunk texts
    const output = await splitter.createDocuments([cleanedText]);

    console.log("Scraped text into chunks: ", output)
    // return output.map((doc) => ({ text: doc.pageContent, url }));
    return output.map((doc) => ({ text: doc.pageContent, url }));
}