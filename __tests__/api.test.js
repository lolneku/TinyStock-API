const request = require('supertest');
const { app } = require('../api');
const crypto = require('crypto');

describe('GET /tickers', () => {
    it('should return an array of tickers', async () => {
        const response = await request(app)
            .get('/tickers')
            .auth('dani', '');
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
    });

    it('should get the same value returned, therefore indicating date is consistent since hash are deterministic', async () => {
        const response = await request(app)
            .get('/tickers')
            .auth('dani', '');
        const today = new Date().toISOString().split('T')[0];
        let input = `${today}${'PFE'}${'dani'}`;
        const hash = crypto.createHash('sha256').update(input).digest('hex')
        const hashInt = BigInt('0x' + Buffer.from(hash, 'hex').toString('hex'));
        const doubleValue = (Number(hashInt) % Number(BigInt('0xffff'))) / 100;
        const value = doubleValue.toFixed(2).toString();
        const json = response.body;

        expect(json[0].price).toEqual(value);
    })
});

describe('GET /tickers/:ticker/history', () => {
    it('should return historical prices for a valid ticker', async () => {
        const ticker = 'AAPL';
        const response = await request(app)
            .get(`/tickers/${ticker}/history`)
            .auth('dani', '');
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.every(entry => entry.hasOwnProperty('date') && entry.hasOwnProperty('price'))).toBe(true);
    });

    it('should return 404 for an invalid ticker', async () => {
        const ticker = 'INVALID';
        const response = await request(app)
            .get(`/tickers/${ticker}/history`)
            .auth('dani', '');
        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'Ticker not found');
    });

    it('should retrieve the date of invocation', async () => {
        const response = await request(app)
            .get('/tickers/AAPL/history')
            .auth('dani', '');
        const json = response.body;
        const today = new Date().toISOString().split('T')[0];

        expect(json[0].date).toEqual(today);
    })
});

