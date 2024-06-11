import axios from "axios";
import * as cheerio from "cheerio";
import { parse, addHours } from "date-fns";

// Constants
export const SELECTOR_MATCHES_DATES =
  "#wrapper > div.col-container > div > .wf-label";
export const SELECTOR_MATCHES_TABLES =
  "#wrapper > div.col-container > div > .wf-card:not(.mod-header)";
export const SELECTOR_MATCH_LEAGUE_INFO = "match-item-event text-of";
export const EMEA_TITLE_PREFIX = "Champions Tour 2024: EME";
export const NA_TITLE_PREFIX = "Champions Tour 2024: North Americ";

// Fetch a vlr.gg page and return all <a> elements that contain match data
export const fetchAndParseData = async (page) => {
  const { data } = await axios.get(`https://www.vlr.gg/matches/?page=${page}`);
  const $ = cheerio.load(data);
  console.log(`Fetched page ${page}`);
  const tableElements = $(SELECTOR_MATCHES_TABLES);
  const dateElements = $(SELECTOR_MATCHES_DATES);
  const matches = [];
  tableElements.each((i, el) => {
    const date = dateElements[i].children[0].data.trim();
    const parsedDate = parse(date, "EEE, MMMM dd, yyyy", new Date());
    const table = $(el);
    const foundMatches = table.find("a");
    matches.push({ date: parsedDate, matchEls: [...foundMatches] });
  });
  return matches;
};

// Get the league info element from a <a> match element's childNodes
export const getLeageInfo = (matchNodes) => {
  return matchNodes.find(
    (c) => c.type === "tag" && c.attribs.class === SELECTOR_MATCH_LEAGUE_INFO
  );
};

// Check if a match should be exported based on the league info element
export const shouldExport = (matchInfoElementNodes) => {
  return matchInfoElementNodes.find(
    (c) =>
      c.type === "text" &&
      (c.data.trim().startsWith(EMEA_TITLE_PREFIX) ||
        c.data.trim().startsWith(NA_TITLE_PREFIX))
  );
};

// Create object of interest
export const getMatchMetadata = (matchNodes) => {
  const $ = cheerio.load(matchNodes);
  const matchTimeEl = $(".match-item-time");
  const matchTeamsEl = $(".match-item-vs");
  const teamNamesEl = matchTeamsEl.find(".text-of");
  const team1 = teamNamesEl[0].children[2].data.trim();
  const team2 = teamNamesEl[1].children[2].data.trim();

  return {
    time: matchTimeEl[0].children[0].data.trim(),
    title: `${team1} vs ${team2}`,
  };
};

export const prepIcsBatch = (matches) => {
  return matches.map((match) => {
    const startTime = parse(match.time, "hh:mm a", new Date());
    const startDate = match.date;
    const startDateAndTime = addHours(startDate, startTime.getHours());
    const endDateAndTime = addHours(startDateAndTime, 2);
    return {
      start: [
        startDateAndTime.getFullYear(),
        startDateAndTime.getMonth() + 1,
        startDateAndTime.getDate(),
        startDateAndTime.getHours(),
        startDateAndTime.getMinutes(),
      ],
      end: [
        endDateAndTime.getFullYear(),
        endDateAndTime.getMonth() + 1,
        endDateAndTime.getDate(),
        endDateAndTime.getHours(),
        endDateAndTime.getMinutes(),
      ],
      title: match.title,
    };
  });
};
