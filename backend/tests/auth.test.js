const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index'); // Export your express 'app' from server.js

describe('🔒 Authentication API Automation Suite', () => {
  
  // Clean up database connections after tests finish
  afterAll(async () => {
    await mongoose.connection.close();
  });

  it(' should REJECT invalid login attempts with 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'wrong_manager',
        password: 'bad_password_2026'
      });
    
    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty('message');
  });

  it(' should AUTHORIZE valid initial admin credentials and return a JWT signature', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        username: process.env.INIT_ADMIN_USERNAME,
        password: process.env.INIT_ADMIN_PASSWORD,
      });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token'); // Verifies token generation pipeline
  });
});