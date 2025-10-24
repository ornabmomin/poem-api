import express from "express";
import puppeteer from "puppeteer";

const app = express();

app.get("/api/poetry-episode", async (req, res) => {
  try {
    console.log("Launching browser...");
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      ],
    });

    const page = await browser.newPage();

    await page.goto(
      "https://www.poetryfoundation.org/podcasts/series/74634/audio-pod",
      { waitUntil: "networkidle2", timeout: 5000 } // Wait for network to settle
    );

    // Get the poem title
    const title = await page.$eval(
      "#mainContent > article > div.flex.flex-col.gap-5.md\\:flex-row-reverse.md\\:gap-8 > div > header > h1 > p",
      (el) => el.textContent
    );

    // Get the description
    const description = await page.$eval(
      "#mainContent > article > div.flex.flex-col.gap-5.md\\:flex-row-reverse.md\\:gap-8 > div > div.flex.flex-col.gap-4.sm\\:flex-row > div > div.copy-large.undefined.rich-text > p",
      (el) => el.textContent
    );

    // Get the page's date
    const date = await page.$eval(
      "#mainContent > article > div.flex.flex-col.gap-5.md\\:flex-row-reverse.md\\:gap-8 > div > header > time",
      (el) => el.textContent
    );

    // Get the audio source URL
    const audioSrc = await page.$eval(
      "#mainContent > article > div.flex.flex-col.gap-5.md\\:flex-row-reverse.md\\:gap-8 > div > div.mb-6.grid.gap-6 > div > div > audio",
      (el) => el.src
    );

    await browser.close();

    res.json({
      title,
      description,
      audioSrc,
      date,
    });
    console.log("Done!");
  } catch (error) {
    console.error("Error:", error.message);
  }
});

app.listen(3000, "0.0.0.0", () => console.log("API running on port 3000"));
