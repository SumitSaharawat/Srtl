const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index'); 

describe('🔒 Authentication API Automation Suite', () => {
  
  beforeAll(async () => {
    if (mongoose.connection.readyState !== 1) {
      await new Promise((resolve) => mongoose.connection.once('open', resolve));
    }
  });

  it('should REJECT invalid login attempts with 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'wrong_manager',
        password: 'bad_password_2026'
      });
    
    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty('message');
  });

  it('should AUTHORIZE valid initial admin credentials and return a JWT signature', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        username: process.env.INIT_ADMIN_USERNAME,
        password: process.env.INIT_ADMIN_PASSWORD,
      });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token'); 
  });
});

describe('🛡️ Protected Dashboard Route Automation', () => {

  it('should REJECT access to the dashboard if no token is provided', async () => {
      const res = await request(app)
          .get('/api/auth/dashboard');
      
      expect(res.statusCode).toEqual(403); 
      expect(res.body.message).toContain('Token missing');
  });

  // 💡 ADDED: The crucial third test to verify successful entry via a valid JWT
  it('should ALLOW access to the dashboard when a valid JWT token is provided', async () => {
    // 1. Log in to get a fresh, valid token from your backend logic
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        username: process.env.INIT_ADMIN_USERNAME,
        password: process.env.INIT_ADMIN_PASSWORD,
      });

    const validToken = loginRes.body.token;

    // 2. Attempt to access the protected route by attaching the Bearer token
    const res = await request(app)
      .get('/api/auth/dashboard')
      .set('Authorization', `Bearer ${validToken}`); // Sets your req.headers validation key

    // 3. Assert that your verifyAdminToken middleware parsed it and let them through
    expect(res.statusCode).toEqual(200);
  });
});