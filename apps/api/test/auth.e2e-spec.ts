import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/v1/auth/login — succès', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@example.com', password: 'ChangeMe123!' })
      .expect(200);

    expect(res.body).toHaveProperty('accessToken');
    expect(res.body.user.role).toBe('SUPER_ADMIN');
  });

  it('POST /api/v1/auth/login — mauvais mot de passe', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@example.com', password: 'wrongpassword' })
      .expect(401);
  });

  it('POST /api/v1/auth/login — email inexistant', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@example.com', password: 'ChangeMe123!' })
      .expect(401);
  });

  it('GET /api/v1/time-entries — sans token → 401', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/time-entries')
      .expect(401);
  });

  it('GET /api/v1/time-entries — avec token → 200', async () => {
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@example.com', password: 'ChangeMe123!' });

    const token = loginRes.body.accessToken;

    await request(app.getHttpServer())
      .get('/api/v1/time-entries')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });
});