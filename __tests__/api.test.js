const request = require('supertest');
const app = require('../api');

describe('GET /tickers', () => {
    it('should return an array of tickers', async () => {
        const response = await request(app)
            .get('/tickers')
            .auth('dani', '');
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
    });
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
});

