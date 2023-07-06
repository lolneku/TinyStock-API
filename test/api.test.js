import supertest from 'supertest'
import app from '../index.js';

describe('TinyStock API', () => {
    let token;

    beforeAll(() => {
        // Generate a valid token for authentication
        const credentials = Buffer.from('username:password').toString('base64');
        token = `Basic ${credentials}`;
    });

    it('should return 401 Unauthorized if Authorization header is missing', async () => {
        const response = await request(app).get('/tickers');
        expect(response.status).toBe(401);
        expect(response.header['www-authenticate']).toBe('Basic');
    });

    it('should return 401 Unauthorized if credentials are invalid', async () => {
        const response = await request(app)
            .get('/tickers')
            .set('Authorization', 'Basic invalid_token');
        expect(response.status).toBe(401);
        expect(response.header['www-authenticate']).toBe('Basic');
    });

    it('should return the portfolio with valid credentials', async () => {
        const response = await request(app)
            .get('/tickers')
            .set('Authorization', token);
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return 404 Not Found for invalid ticker history', async () => {
        const response = await request(app)
            .get('/tickers/INVALID/history')
            .set('Authorization', token);
        expect(response.status).toBe(404);
        expect(response.body.error).toBe('Ticker not found');
    });

    it('should return historical prices for a valid ticker', async () => {
        const ticker = 'AAPL';
        const response = await request(app)
            .get(`/tickers/${ticker}/history`)
            .set('Authorization', token);
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(90);
        expect(response.body[0].date).toBeTruthy();
        expect(response.body[0].price).toBeTruthy();
    });
});
