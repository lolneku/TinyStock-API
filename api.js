const express = require('express');
const crypto = require('crypto');
const app = express();
const currentDate = new Date();
const port = process.env.PORT || 8080;
var username;

const tickers = [
    "AAPL",
    "MSFT",
    "GOOG",
    "AMZN",
    "FB",
    "TSLA",
    "NVDA",
    "JPM",
    "BABA",
    "JNJ",
    "WMT",
    "PG",
    "PYPL",
    "DIS",
    "ADBE",
    "PFE",
    "V",
    "MA",
    "CRM",
    "NFLX"
];

app.use((req, res, next) => {
    // If auth header not present
    if (!req.get('Authorization')) {
        var err = new Error('Not Authenticated!')
        // Set status code to '401 Unauthorized' and 'WWW-Authenticate' header to 'Basic'
        res.status(401).set('WWW-Authenticate', 'Basic')
        next(err)
    }
    // If auth header present
    else {
        // Decode the auth header
        var credentials = Buffer.from(req.get('Authorization').split(' ')[1], 'base64')
            .toString()
            .split(':')

        username = credentials[0];

        // If credentials are not valid
        if (username == null) {
            var err = new Error('Not Authenticated!')
            res.status(401).set('WWW-Authenticate', 'Basic')
            next(err)
        }
        res.status(200)
        next()
    }
})

app.get('/tickers', (req, res) => {
    res.json(hashPF());
});

app.get('/tickers/:ticker/history', (req, res) => {
    const ticker = req.params.ticker.toUpperCase();
    if (!tickers.includes(ticker)) {
        res.status(404).json({ error: 'Ticker not found' });
        return;
    }
    res.json(generateHistoricalPrices(ticker));
});

//Get a double from a hash input then % by maxInt
function getValue(hashedValue, maxInt) {
    const hashInteger = BigInt('0x' + Buffer.from(hashedValue, 'hex').toString('hex'));
    const doubleValue = Number(hashInteger) % Number(maxInt);
    return doubleValue;
}

function generateHistoricalPrices(ticker) {
    const historicalPrices = [];
    for (let i = 0; i < 90; i++) {
        const date = new Date(currentDate);
        date.setDate(date.getDate() - i);
        historicalPrices.push({
            date: date.toISOString().split('T')[0],
            price: getValue(hashDateTime(date, ticker, false), BigInt('0xffff'))
        });
    }
    return historicalPrices;
}

//Hashes dateTime with Ticker name to create a unique price for that ticker on that day; important for historical prices.
function hashDateTime(dateTime, inputString, checkPF) {
    let input = `${dateTime.toISOString()}${inputString}`;
    if (checkPF) { input = `${dateTime.toISOString()}${inputString}${username}`; }
    const hash = crypto.createHash('sha256').update(input).digest('hex');
    return hash;
}

//Creates portfolio, uses a BigInt from the hash value of username to generate the tickers which will display in portfolio
function hashPF() {
    const hashUser = crypto.createHash('sha256').update(username).digest('hex');
    var tickerAmount = getValue(hashUser, 10) + 1;
    const hashInt = BigInt('0x' + Buffer.from(hashUser, 'hex').toString('hex'))
    const hashString = hashInt.toString();
    const regex = new RegExp(`.{1,${sizeInt}}`, 'g');
    var arr = hashString.match(regex);
    arr = arr.map(item => (
        (Number(item) % 20)
    ));
    if (tickerAmount > arr.length) { tickerAmount = arr.length; }
    arr = arr.slice(0, (tickerAmount + 1));
    arr = Array.from(countUnique(arr));

    const portfolio = arr.map(ticker => ({
        symbol: tickers[ticker],
        price: getValue(hashDateTime(currentDate, tickers[ticker], true), BigInt('0xffff'))
    }));

    return portfolio;
}

function countUnique(iterable) {
    return new Set(iterable);
}

app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});

module.exports = app;