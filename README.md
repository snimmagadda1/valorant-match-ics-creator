# Valorant Match .ics Creator 
👋
![Version](https://img.shields.io/badge/version-1.0.0-blue.svg?cacheSeconds=2592000)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](#)

> Super quick tool to export vlr.gg match data to ics for view in personal calendars

I honestly just got tired of checking the schedule and seeing results spoiled online.

## Install

```sh
npm install
```

## Usage

```sh
node index.js
```
verify creation of the file `Vlrgg.ics` in the project root and use!

## FAQ
Currently this is set to grab posted NA & EMEA matches (b/c they're what I can feasibly watch). It can be expanded to other regions/leages by updating the league search keys:

```
const EMEA_TITLE_PREFIX ='Champions Tour 2024: EME';
const NA_TITLE_PREFIX ='Champions Tour 2024: North Americ';
```

and the function `shouldExport(..)`:

```
const shouldExport = (matchInfoElementNodes) => {
  return matchInfoElementNodes.find(
    (c) =>
      c.type === "text" &&
      (c.data.trim().startsWith(EMEA_TITLE_PREFIX) ||
        c.data.trim().startsWith(NA_TITLE_PREFIX))
  );
};
```

## Run tests

```sh
npm run test
```

## Author

👤 **Sai N. Nimmagadda**

* Website: https://s11a.com
* Github: [@snimmagadda1](https://github.com/snimmagadda1)

## Show your support

Give a ⭐️ if this project helped you!


***
_This README was generated with ❤️ by [readme-md-generator](https://github.com/kefranabg/readme-md-generator)_