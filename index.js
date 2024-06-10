import axios from "axios";
import * as cheerio from "cheerio";
import * as ics from "ics";
import * as fs from "fs";

// Constants
const SELECTOR_MATCHES_DATES =
'#wrapper > div.col-container > div > .wf-label';
const SELECTOR_MATCHES_TABLES =
'#wrapper > div.col-container > div > .wf-card:not(.mod-header)';
const SELECTOR_MATCH_LEAGUE_INFO ='match-item-event text-of';
const EMEA_TITLE_PREFIX ='Champions Tour 2024: EME';
const NA_TITLE_PREFIX ='Champions Tour 2024: North Americ';

// match = valorant game
// {date: 'XXXX', elements: []}
const masterDateAndMatchTagEls = [];

// Fetch a vlr.gg page and return all <a> elements that contain match data
const fetchAndParseData = async (page) => {
  const { data } = await axios.get(`https://www.vlr.gg/matches/?page=${page}`);
  const $ = cheerio.load(data);
  console.log(`Fetched page ${page}`);
  const tableElements = $(SELECTOR_MATCHES_TABLES);
  const dateElements = $(SELECTOR_MATCHES_DATES);
  const matches = [];
  tableElements.each((i, el) => {
    const date = dateElements[0].children[0].data.trim();
    const table = $(el);
    const foundMatches = table.find("a");
    matches.push({date: date, matchEls: [...foundMatches]});
  });
  return matches;
};

// Get the league info element from a <a> match element's childNodes
const getLeageInfo = (matchNodes) => {
  return matchNodes.find(
    (c) => c.type === "tag" && c.attribs.class === SELECTOR_MATCH_LEAGUE_INFO
  );
};

// Check if a match should be exported based on the league info element
const shouldExport = (matchInfoElementNodes) => {
  return matchInfoElementNodes.find(
    (c) =>
      c.type === "text" &&
      (c.data.trim().startsWith(EMEA_TITLE_PREFIX) ||
        c.data.trim().startsWith(NA_TITLE_PREFIX))
  );
};

// Create object of interest
const getMatchMetadata = (matchNodes) => {
  const $ = cheerio.load(matchNodes);
  const matchTimeEl = $('.match-item-time')
  const matchTeamsEl = $('.match-item-vs')
  const teamNamesEl = matchTeamsEl.find('.text-of')
  const team1 = teamNamesEl[0].children[2].data.trim()
  const team2 = teamNamesEl[1].children[2].data.trim();

  return {
    time: matchTimeEl[0].children[0].data.trim(),
    title: `${team1} vs ${team2}`
  };
};

// ChatGPT for DTOs ;)
const parseTime = (dateString, timeString) => {
  const date = new Date(`${dateString} ${timeString}`);
  return [
    date.getFullYear(),
    date.getMonth() + 1, // Months are zero-indexed in JavaScript
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
  ];
};

const addHours = (start, hours) => {
  const date = new Date(start[0], start[1] - 1, start[2], start[3], start[4]);
  date.setHours(date.getHours() + hours);
  return [
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
  ];
};

const prepIcsBatch = (matches) => {
  return matches.map((match) => {
    const start = parseTime(match.date, match.time);
    const end = addHours(start, 1);
    return {
      start,
      end,
      title: match.title,
    };
  });
};

// Script start
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
  })
});


const icsBatch = prepIcsBatch(toExport);
const { error, value } = ics.createEvents(icsBatch);

if (error) {
  console.log(error);
}

console.log(value);

fs.writeFileSync(`Vlrgg.ics`, value);