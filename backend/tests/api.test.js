const request = require('supertest');
const app = require('../src/app');

// @test-driven-development: Mocks de la base de datos para no afectar datos reales en tests
jest.mock('../src/models/translationModel', () => ({
  create: jest.fn().mockResolvedValue({
    id: 1,
    original_text: 'Hola',
    translated_text: '[English] Hello | [German] Hallo',
    source_language: 'Spanish',
    target_language: 'English/German',
  }),
  getAll: jest.fn().mockResolvedValue([])
}));

describe('Traductor API Endpoints', () => {
  it('GET /api/health deberia retornar status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });

  it('POST /api/translations deberia crear una traduccion', async () => {
    const res = await request(app)
      .post('/api/translations')
      .send({
        original_text: 'Hola',
        translated_text: '[English] Hello | [German] Hallo',
        source_language: 'Spanish',
        target_language: 'English/German'
      });
      
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data.original_text).toBe('Hola');
  });

  it('POST /api/translations deberia fallar si faltan parametros', async () => {
    const res = await request(app)
      .post('/api/translations')
      .send({
        original_text: 'Hola'
        // faltan parametros intencionalmente
      });
      
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('success', false);
  });
});
