'use strict'

const express = require('express');
const http = require('http');
const URL = require('url');
const mongoose = require('mongoose');
const request = require('request-promise');
const cheerio = require('cheerio');

const config = require('./conf');
const scraperSchema = require('./scraper-schema');

const app = express();
app.set("port", process.env.PORT || 3000);

// as per assignment
http.globalAgent.maxSockets = 5;

let mongoCon;

// db connection
const MongoURI = process.env.MONGO_URL || config.MongoURI;
mongoose.createConnection(MongoURI)
  .then(conn => {
    mongoCon = conn.model('Scraperdata', scraperSchema);
    // console.log('==xx ',mongoCon);
  })
  .catch(err => {
    console.error('err', err);
    process.exit(1);
  })

let scrap = async function (req, res) {
  try {
    let arr = [];
    let uri = 'https://medium.com/';

    let html = await request.get(uri);
    let $ = cheerio.load(html.toString());
    // console.log($);
    // filter url and its params from all links 
    $("a").each((i, link) => {
      let allHref = URL.parse($(link).attr("href"), true);
      // console.log(allHref);
      let qArr = Object.keys(allHref['query']);
      // console.log(qArr);
      let url = allHref['href'].split('?')[0];
      // console.log(url, qArr);
      arr.push({ url, qArr });
    });
    // console.log(arr);

    let urlsArr = arr.map(x => x['url']);
    // console.log(urlsArr);
    let urlsSet = new Set(urlsArr);
    // console.log(urlsSet);

    // filter unique url and its count
    let arrObj = [...urlsSet].map(url => {
      return {
        url: url,
        totalRef: arr.filter(e => e['url'] === url).length,
        params: arr.find(e => e['url'] === url).qArr,
      }
    });

    // console.log(arrObj);

    let mongoRes = await mongoCon.collection.insertMany(arrObj);
    // console.log('==========',mongoRes);
    res.status(200).jsonp({ "total_URL_count": mongoRes['result']['n'], "scrapData": mongoRes['ops'] });
  } catch (err) {
    console.error(err);
    res.status(500).jsonp({ 'msg': 'internal server error', 'err': err });
  }
};


// start scraping
app.get('/', scrap);

// Server starts.
app.listen(app.get("port"), () => {
  console.log(
    "  App is running at port %d",
    app.get("port")
  );
  console.log("  Press CTRL-C to stop\n");
});

