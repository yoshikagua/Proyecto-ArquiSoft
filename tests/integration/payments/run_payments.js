const fs = require('fs');
const path = require('path');

const mode = process.argv[2];

const readStdin = () => fs.readFileSync(0, 'utf8');

const outputAndExit = (payload, code = 0) => {
  console.log(JSON.stringify(payload));
  process.exit(code);
};

if (!mode) {
  outputAndExit({ error: 'usage: node run_payments.js <get|post|service> [name]' }, 2);
}

const loadJsonPayload = () => {
  const raw = readStdin().trim();
  return raw ? JSON.parse(raw) : {};
};

const runGet = async () => {
  const router = require(path.join(__dirname, '../../../payments_app/src/routes/payments'));
  const routeLayer = router.stack.find((layer) => layer.route && layer.route.path === '/');

  if (!routeLayer) {
    outputAndExit({ error: 'route_not_found' }, 2);
  }

  const handler = routeLayer.route.stack[0].handle;
  const req = { method: 'GET', headers: { origin: 'http://localhost:8080' } };

  const res = {
    json: (obj) => outputAndExit(obj),
    redirect: (url) => outputAndExit({ redirect: url }),
  };

  try {
    handler(req, res);
  } catch (err) {
    outputAndExit({ error: err.message }, 3);
  }
};

const runPost = async () => {
  const payload = loadJsonPayload();
  const Payment = require(path.join(__dirname, '../../../payments_app/src/models/Payment'));
  Payment.create = async (obj) => ({ id: 'mock-id', ...obj });

  const { processPayment } = require(path.join(__dirname, '../../../payments_app/src/controllers/paymentController'));
  const req = { body: payload, headers: { origin: 'http://localhost:8080' } };
  const captured = {};
  const res = {
    status: (statusCode) => {
      captured.status = statusCode;
      return res;
    },
    json: (obj) => outputAndExit({ status: captured.status, body: obj }),
  };

  try {
    await processPayment(req, res);
  } catch (err) {
    outputAndExit({ error: err.message }, 3);
  }
};

const runService = async () => {
  const serviceName = process.argv[3];
  const serviceMap = {
    mercadopago: require(path.join(__dirname, '../../../payments_app/src/services/mercadopago.service')),
    nequi: require(path.join(__dirname, '../../../payments_app/src/services/nequi.service')),
  };

  const service = serviceMap[serviceName];
  if (!service || typeof service.processPayment !== 'function') {
    outputAndExit({ error: 'service_not_found' }, 2);
  }

  const payload = loadJsonPayload();
  try {
    const result = await service.processPayment(payload);
    outputAndExit(result);
  } catch (err) {
    outputAndExit({ error: err.message }, 3);
  }
};

(async () => {
  if (mode === 'get') return runGet();
  if (mode === 'post') return runPost();
  if (mode === 'service') return runService();
  outputAndExit({ error: 'unknown_mode' }, 2);
})();
