// @ts-nocheck
import * as cheerio from "cheerio";
import puppeteerExtra from "puppeteer-extra";
import stealthPlugin from "puppeteer-extra-plugin-stealth";

async function searchGoogleMaps(maxRestaurants = 5) {
  try {
    const start = Date.now();
    puppeteerExtra.use(stealthPlugin());

    const browser = await puppeteerExtra.launch({
      headless: false,
    });

    const page = await browser.newPage();
    const query = "Restaurant in Satdobato";
    const url = `https://www.google.com/maps/search/${query
      .split(" ")
      .join("+")}`;

    await page.goto(url, {
      waitUntil: "domcontentloaded",
    });

    await page.waitForSelector('div[role="feed"]', { timeout: 10000 });

    // Scroll through the results page to load more data
    await autoScroll(page, 'div[role="feed"]');

    const html = await page.content();
    const $ = cheerio.load(html);
    const aTags = $("a");
    const parents = [];

    aTags.each((i, el) => {
      const href = $(el).attr("href");
      if (!href) return;
      if (href.includes("/maps/place/")) {
        parents.push($(el).parent());
      }
    });

    const businesses = [];
    let count = 0;

    for (const parent of parents) {
      if (count >= maxRestaurants) break;

      const url = parent.find("a").attr("href");
      const website = parent.find('a[data-value="Website"]').attr("href");
      const storeName = parent.find("div.fontHeadlineSmall").text();
      const ratingText = parent
        .find("span.fontBodyMedium > span")
        .attr("aria-label");

      const bodyDiv = parent.find("div.fontBodyMedium").first();
      const children = bodyDiv.children();
      const lastChild = children.last();
      const firstOfLast = lastChild.children().first();
      const lastOfLast = lastChild.children().last();

      let stars = null;
      let numberOfReviews = null;

      if (ratingText) {
        stars = parseFloat(ratingText.split("stars")[0].trim());
        const reviewString = ratingText
          .split("stars")[1]
          ?.replace("Reviews", "")
          ?.trim();
        numberOfReviews = reviewString
          ? Number(reviewString.replace(/,/g, ""))
          : null;
      }

      const businessDetails = {
        placeId: `ChI${url?.split("?")?.[0]?.split("ChI")?.[1]}`,
        address: firstOfLast?.text()?.split("·")?.[1]?.trim(),
        category: firstOfLast?.text()?.split("·")?.[0]?.trim(),
        phone: lastOfLast?.text()?.split("·")?.[1]?.trim(),
        googleUrl: url,
        bizWebsite: website,
        storeName,
        ratingText,
        stars,
        numberOfReviews,
      };

      if (numberOfReviews > 0) {
        businessDetails.reviews = await extractReviewsFromDetailPage(
          browser,
          businessDetails.googleUrl
        );
      } else {
        businessDetails.reviews = [];
      }

      businesses.push(businessDetails);
      count++; // Increment the counter after processing a restaurant
    }

    console.log(JSON.stringify(businesses, null, 2));
    const end = Date.now();
    console.log(`Time in seconds: ${Math.floor((end - start) / 1000)}`);

    await browser.close();
    return businesses;
  } catch (error) {
    console.log("Error in Google Maps search:", error.message);
  }
}

async function extractReviewsFromDetailPage(browser, url) {
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded" });

    // Clicking the 'Reviews' button
    let reviewButton = await page.$('button[jslog="145620; track:click;"]');
    if (reviewButton) {
      console.log("Found 'Reviews' button, clicking it...");
      await reviewButton.click();

      await page.waitForSelector('div[jslog="26354;mutable:true;"]', {
        timeout: 20000,
      });
    } else {
      console.log("Reviews button not found.");
    }

    await autoScroll(page, 'div[jslog="26354;mutable:true;"]');

    // Extracting the reviews
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

    console.log(`Extracted ${reviews.length} reviews.`);
    await page.close();
    return reviews;
  } catch (error) {
    console.log("Error extracting reviews:", error.message);
    return [];
  }
}

async function scrollAllReviews(page, selector) {
  let previousReviewsCount = 0;
  let currentReviewsCount = 0;
  let retries = 0;
  const maxRetries = 5;

  try {
    while (true) {
      // Scroll the reviews section to the bottom
      await page.evaluate((selector) => {
        const reviewSection = document.querySelector(selector);
        if (reviewSection)
          reviewSection.scrollBy(0, reviewSection.scrollHeight);
      }, selector);

      // Wait for new reviews to load
      await page.waitForTimeout(2000);

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
      if (retries >= maxRetries) break;
    }
  } catch (error) {
    console.log("Error while scrolling through reviews:", error.message);
  }
}

async function autoScroll(page, selector) {
  let previousHeight;
  try {
    while (true) {
      previousHeight = await page.evaluate((selector) => {
        const element = document.querySelector(selector);
        return element.scrollHeight;
      }, selector);

      await page.evaluate((selector) => {
        const element = document.querySelector(selector);
        element.scrollBy(0, element.scrollHeight);
      }, selector);

      await page.evaluate(
        () => new Promise((resolve) => setTimeout(resolve, 2000))
      );

      let currentHeight = await page.evaluate((selector) => {
        const element = document.querySelector(selector);
        return element.scrollHeight;
      }, selector);

      if (currentHeight === previousHeight) break;
    }
  } catch (error) {
    console.log("Error while scrolling:", error.message);
  }
}

const review = await searchGoogleMaps();
console.log({ review });
