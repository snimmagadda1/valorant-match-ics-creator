import * as ics from "ics";
import * as fs from "fs";
import {
  fetchAndParseData,
  getLeageInfo,
  shouldExport,
  getMatchMetadata,
  prepIcsBatch,
} from "./util.js";

// Script start
// match = valorant game
// {date: 'XXXX', elements: []}
const masterDateAndMatchTagEls = [];
const pagePromises = [];
for (let page = 1; page <= 10; page++) {
  pagePromises.push(fetchAndParseData(page));
}

const allMatches = await Promise.all(pagePromises);
allMatches.forEach((matches) => {
  masterDateAndMatchTagEls.push(...matches);
});

// Filter out matches that I can feasibly watch (EMEA and NA)
const toExport = [];
masterDateAndMatchTagEls.forEach(({ date, matchEls }) => {
  matchEls.forEach((match) => {
    const matchInfoElement = getLeageInfo(match.childNodes);
    if (shouldExport(matchInfoElement.childNodes)) {
      const metadata = getMatchMetadata(match.childNodes);
      metadata.date = date;
      toExport.push(metadata);
    }
  });
});

const icsBatch = prepIcsBatch(toExport);
const { error, value } = ics.createEvents(icsBatch);

if (error) {
  console.log(error);
}

console.log(value);

fs.writeFileSync(`Vlrgg.ics`, value);
