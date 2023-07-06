import express from 'express'
import crypto from 'crypto'
const app = express();
const currentDate = new Date();
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
    // If 'Authorization' header not present
    if (!req.get('Authorization')) {
        var err = new Error('Not Authenticated!')
        // Set status code to '401 Unauthorized' and 'WWW-Authenticate' header to 'Basic'
        res.status(401).set('WWW-Authenticate', 'Basic')
        next(err)
    }
    // If 'Authorization' header present
    else {
        // Decode the 'Authorization' header Base64 value
        var credentials = Buffer.from(req.get('Authorization').split(' ')[1], 'base64')
            // <Buffer 75 73 65 72 6e 61 6d 65 3a 70 61 73 73 77 6f 72 64>
            .toString()
            // username:password
            .split(':')
        // ['username', 'password']

        username = credentials[0];

        // If credentials are not valid
        if (username == null) {
            var err = new Error('Not Authenticated!')
            // Set status code to '401 Unauthorized' and 'WWW-Authenticate' header to 'Basic'
            res.status(401).set('WWW-Authenticate', 'Basic')
            next(err)
        }
        res.status(200)
        // Continue the execution
        next()
    }
})

app.get('/tickers', (req, res) => {
    const portfolio = tickers.map(ticker => ({
        symbol: ticker,
        price: getPrice(hashDateTime(currentDate, ticker, true))
    }));
    res.json(portfolio);
});

app.get('/tickers/:ticker/history', (req, res) => {
    const ticker = req.params.ticker.toUpperCase();
    if (!tickers.includes(ticker)) {
        res.status(404).json({ error: 'Ticker not found' });
        return;
    }

    const historicalPrices = generateHistoricalPrices(ticker);
    res.json(historicalPrices);
});

function getPrice(hashedValue) {
    const hashInteger = BigInt('0x' + Buffer.from(hashedValue, 'hex').toString('hex'));
    const maxInteger = BigInt('0xffff');
    const doubleValue = Number(hashInteger) % Number(maxInteger);
    return doubleValue;
}

function generateHistoricalPrices(ticker) {
    const historicalPrices = [];
    for (let i = 0; i < 90; i++) {
        const date = new Date(currentDate);
        date.setDate(date.getDate() - i);
        const formattedDate = date.toISOString().split('T')[0];
        historicalPrices.push({
            date: formattedDate,
            price: getPrice(hashDateTime(date, ticker, false))

        });
    }
    return historicalPrices;
}

//Hashes dateTime with Ticker name to create a unique price for that day: important for historical prices.
function hashDateTime(dateTime, inputString, checkPF) {
    let input = `${dateTime.toISOString()}${inputString}`;
    if (checkPF) { input = `${dateTime.toISOString()}${inputString}${username}`; }
    const hash = crypto.createHash('sha256').update(input).digest('hex');
    return hash;
}

function hashPF(){
    const hash = crypto.createHash('sha256').update(username).digest('hex');
    const hashString =  Buffer.from(hash, 'hex').toString();
    //Find out first the num of tickers in portofolio
    //split hash string into num of tickers
    //split hash string -> numbers % 20 to find out which ticker
    return hash;
}

export default app