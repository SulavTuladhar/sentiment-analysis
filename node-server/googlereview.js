// @ts-nocheck
import * as cheerio from "cheerio";
import puppeteerExtra from "puppeteer-extra";
import stealthPlugin from "puppeteer-extra-plugin-stealth";

puppeteerExtra.use(stealthPlugin());

const browser = await puppeteerExtra.launch({
  headless: false,
});

const page = await browser.newPage();
const testUrl =
  "https://www.google.com/maps/place/Chasuwa+Restaurant+%26+Sekuwa+Ghar/data=!4m7!3m6!1s0x39eb17168ea9544d:0x8821914bcb8cc150!8m2!3d27.6567315!4d85.3218254!16s%2Fg%2F11n5br622m!19sChIJTVSpjhYX6zkRUMGMy0uRIYg?authuser=0&hl=en&rclk=1";

async function extractReviewsFromDetailPage(browser, url) {
  try {
    const page = await browser.newPage();
    await page.goto(testUrl, { waitUntil: "domcontentloaded" });

    // Locate and click the 'Reviews' button
    let reviewButton = await page.$('button[jslog="145620; track:click;"]');
    if (reviewButton) {
      console.log("Found 'Reviews' button, clicking it...");
      await reviewButton.click();
      await page.waitForSelector("div.m6QErb.XiKgde", { timeout: 10000 });
    } else {
      console.log("Reviews button not found.");
    }

    // Scroll and load all reviews
    await scrollAndLoadAllReviews(page, "div.m6QErb.XiKgde");

    // Extract all the review texts
    const html = await page.content();
    const $ = cheerio.load(html);
    const reviews = [];

    $("span.wiI7pd").each((i, el) => {
      const reviewText = $(el).text().trim();
      if (reviewText) {
        reviews.push({
          reviewText,
        });
      }
    });

    await page.close();
    return reviews;
  } catch (error) {
    console.log("Error extracting reviews:", error.message);
    return [];
  }
}

// Function to continuously scroll until all reviews are loaded (infinite scroll)
async function scrollAndLoadAllReviews(page, selector) {
  let previousReviewsCount = 0;
  let currentReviewsCount = 0;
  let retries = 0;
  const maxRetries = 15; // Increased retries

  try {
    while (true) {
      // Scroll the reviews section multiple times to trigger loading
      await page.evaluate((selector) => {
        const reviewSection = document.querySelector(selector);
        if (reviewSection)
          reviewSection.scrollBy(0, reviewSection.scrollHeight * 2); // Scroll twice the height
      }, selector);

      // Wait longer for new reviews to load
      await new Promise((resolve) => setTimeout(resolve, 5000)); // 5 seconds timeout

      // Count the number of reviews loaded so far
      currentReviewsCount = await page.evaluate((selector) => {
        const reviews = document.querySelectorAll(`${selector} .wiI7pd`);
        return reviews.length;
      }, selector);

      console.log(`Current review count: ${currentReviewsCount}`);

      // Check if no new reviews are being loaded
      if (currentReviewsCount === previousReviewsCount) {
        retries++;
      } else {
        retries = 0; // Reset retry count if new reviews are loaded
        previousReviewsCount = currentReviewsCount; // Update the review count
      }

      // Stop if no more reviews are loaded after max retries
      if (retries >= maxRetries) {
        console.log("No more reviews to load, stopping...");
        break;
      }
    }
  } catch (error) {
    console.log(
      "Error while scrolling and loading more reviews:",
      error.message
    );
  }
}

// Call the function to extract reviews
const reviews = await extractReviewsFromDetailPage(browser, testUrl);
console.log({ reviews });
