import request from 'supertest';

const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

describe('health integration', () => {
  it('reports all dependencies and suppliers as healthy when outage simulation is unset', async () => {
    expect(process.env.SIMULATE_SUPPLIER_DOWN || 'none').toBe('none');

    const response = await request(baseUrl).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.suppliers.supplierA.status).toBe('up');
    expect(response.body.suppliers.supplierB.status).toBe('up');
  });
});
