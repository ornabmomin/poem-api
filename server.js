import express from "express";
import puppeteer from "puppeteer";

const app = express();

let browserInstance = null;

const CONSTANTS = {
  potD: {
    url: "https://www.poetryfoundation.org/",
    titleSelector:
      "#mainContent > main > div > section.my-4.mb-7.border-t-4.border-gray-300.py-4 > div > div.col-span-full.flex.flex-col.md\\:col-span-3.md\\:gap-3 > div:nth-child(1) > h3 > div > a > span",
    descriptionSelector:
      "#mainContent > main > div > section.my-4.mb-7.border-t-4.border-gray-300.py-4 > div > div.col-span-full.flex.flex-col.md\\:col-span-3.md\\:gap-3 > div.type-kappa.text-gray-600",
    audioSelector:
      "#mainContent > main > div > section.my-4.mb-7.border-t-4.border-gray-300.py-4 > div > div.col-span-full.flex.flex-col.md\\:col-span-3.md\\:gap-3 > div.type-xi.flex.flex-wrap.gap-2.leading-\\[\\.8\\].text-black > div > div > audio",
    listenLinkSelector:
      "#mainContent > main > div > section.my-4.mb-7.border-t-4.border-gray-300.py-4 > div > div.col-span-full.flex.flex-col.md\\:col-span-3.md\\:gap-3 > div.type-xi.flex.flex-wrap.gap-2.leading-\\[\\.8\\].text-black > button > span",
  },
  audioPoTD: {
    url: "https://www.poetryfoundation.org/podcasts/series/74634/audio-pod",
    titleSelector:
      "#mainContent > article > div.flex.flex-col.gap-5.md\\:flex-row-reverse.md\\:gap-8 > div > header > h1 > p",
    descriptionSelector:
      "#mainContent > article > div.flex.flex-col.gap-5.md\\:flex-row-reverse.md\\:gap-8 > div > div.flex.flex-col.gap-4.sm\\:flex-row > div > div.copy-large.undefined.rich-text > p",
    dateSelector:
      "#mainContent > article > div.flex.flex-col.gap-5.md\\:flex-row-reverse.md\\:gap-8 > div > header > time",
    audioSelector:
      "#mainContent > article > div.flex.flex-col.gap-5.md\\:flex-row-reverse.md\\:gap-8 > div > div.mb-6.grid.gap-6 > div > div > audio",
  },
};

const handleCloseBrowser = async (browser) => {
  if (!browser) return;

  try {
    const pages = await browser.pages();
    await Promise.all(pages.map((page) => page.close()));

    await browser.close();
  } catch (error) {
    console.error("Error closing browser:", error.message);

    if (browser.process()) {
      browser.process().kill("SIGKILL");
    }
  }
};

const getPoemOfTheDayAudio = async (page) => {
  await page.goto(CONSTANTS.potD.url, {
    waitUntil: "networkidle2",
    timeout: 5000,
  });

  const title = await page
    .$eval(CONSTANTS.potD.titleSelector, (el) => el.textContent?.trim())
    .catch(() => null);

  const description = await page
    .$eval(CONSTANTS.potD.descriptionSelector, (el) => el.textContent?.trim())
    .catch(() => null);

  const listenButton = await page.$(CONSTANTS.potD.listenLinkSelector);

  if (!listenButton) {
    console.log("Listen link does not exist for Poem of the Day.");
    return { title, description, audioSrc: null };
  }

  await listenButton.click();
  const audioElement = await page
    .waitForSelector(CONSTANTS.potD.audioSelector, { timeout: 5000 })
    .catch(() => null);

  const audioSrc = audioElement
    ? await page.$eval(CONSTANTS.potD.audioSelector, (el) => el.src)
    : null;

  return { type: "Poem of the Day", title, description, audioSrc };
};

const getAudioPoemOfTheDayAudio = async (page) => {
  await page.goto(
    CONSTANTS.audioPoTD.url,
    { waitUntil: "networkidle2", timeout: 5000 } // Wait for network to settle
  );

  // Get the poem title
  const title = await page.$eval(
    CONSTANTS.audioPoTD.titleSelector,
    (el) => el.textContent
  );

  // Get the description
  const description = await page
    .$eval(CONSTANTS.audioPoTD.descriptionSelector, (el) =>
      el.textContent?.trim()
    )
    .catch(() => null);

  // Get the page's date
  const date = await page.$eval(
    CONSTANTS.audioPoTD.dateSelector,
    (el) => el.textContent
  );

  // Get the audio source URL
  const audioSrc = await page.$eval(
    CONSTANTS.audioPoTD.audioSelector,
    (el) => el.src
  );

  console.log(`Audio Poem of the Day found: ${title} ${description}`);

  return {
    type: "Audio Poem of the Day",
    title,
    description,
    audioSrc,
    date,
  };
};

app.get("/api/poetry-episode", async (req, res) => {
  let browser;
  try {
    console.log("Launching browser...");
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      ],
    });

    browserInstance = browser;

    const page = await browser.newPage();

    const poemOfTheDay = await getPoemOfTheDayAudio(page);
    const audioPoemOfTheDay = await getAudioPoemOfTheDayAudio(page);

    if (!poemOfTheDay.audioSrc && !audioPoemOfTheDay.audioSrc) {
      res.status(404).json({ error: "No audio poems found" });
      return;
    }

    const response = [];

    if (poemOfTheDay.audioSrc) {
      response.push(poemOfTheDay);
    }

    if (audioPoemOfTheDay.audioSrc) {
      response.push(audioPoemOfTheDay);
    }

    res.json(response);
    console.log("Done!");
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: "Failed to fetch poetry data" });
  } finally {
    await handleCloseBrowser(browser);
    browserInstance = null;
  }
});

const shutDown = async (signal) => {
  console.log(`Received ${signal}. Closing browser...`);
  if (browserInstance) {
    await handleCloseBrowser(browserInstance);
    console.log("Browser closed.");
  }
  process.exit(0);
};

process.on("SIGINT", () => shutDown("SIGINT"));
process.on("SIGTERM", () => shutDown("SIGTERM"));

app.listen(3000, "0.0.0.0", () => console.log("API running on port 3000"));
