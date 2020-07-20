const test = require('ava');
const delay = require('delay');
const sinon = require('sinon');

const IORedis = require('ioredis');
const Redis = require('..');

test.beforeEach((t) => {
  t.context.logger = {
    debug: () => {},
    error: () => {}
  };
});

test('creates Redis', (t) => {
  const redis = new Redis();
  t.is(typeof redis, 'object');
});

test('creates Redis with logger', async (t) => {
  t.plan(10);

  const { logger } = t.context;
  logger.debug = (message) => {
    switch (message) {
      case 'redis connection established':
        t.pass();
        break;
      case 'redis connection ready':
        t.pass();
        break;
      case 'redis connection closed':
        t.pass();
        break;
      case 'redis reconnecting':
        t.pass();
        break;
      case 'redis connection ended':
        t.pass();
        break;
      case 'redis node connected':
        t.pass();
        break;
      case 'redis node disconnected':
        t.pass();
        break;
      default:
    }
  };

  logger.error = (message) => {
    switch (message) {
      case 'node error':
        t.pass();
        break;
      case 'error':
        t.pass();
        break;
      default:
    }
  };

  const redis = await new Redis({}, logger);

  t.is(typeof redis, 'object');
  redis.monitor();
  await delay(1000);
  redis.emit('reconnecting');
  redis.emit('+node');
  redis.emit('-node');
  redis.emit('node error', 'node error');
  redis.emit('error', 'error');
  redis.disconnect();
  await delay(1000);
});

test('creates Redis with monitor', async (t) => {
  t.plan(13);

  const { logger } = t.context;
  logger.debug = (message) => {
    // console.debug(message);
    switch (message) {
      case 'redis monitor instance created':
        t.pass();
        break;
      case 'redis monitor':
        t.pass();
        break;
      case 'redis connection established':
        t.pass();
        break;
      case 'redis connection ready':
        t.pass();
        break;
      case 'redis connection closed':
        t.pass();
        break;
      case 'redis reconnecting':
        t.pass();
        break;
      case 'redis connection ended':
        t.pass();
        break;
      case 'redis node connected':
        t.pass();
        break;
      case 'redis node disconnected':
        t.pass();
        break;
      default:
    }
  };

  logger.error = (message) => {
    // console.error(message);
    switch (message) {
      case 'node error':
        t.pass();
        break;
      case 'error':
        t.pass();
        break;
      default:
    }
  };

  const redis = await new Redis({}, logger, true);

  t.is(typeof redis, 'object');
  await delay(1000);
  t.is(redis._monitor.status, 'monitoring');
  redis.emit('reconnecting');
  redis.emit('+node');
  redis.emit('-node');
  redis.emit('node error', 'node error');
  redis.emit('error', 'error');
  redis._monitor.emit('monitor');
  redis.disconnect();
  await delay(1000);
});

test('getMeta > empty status', (t) => {
  t.plan(1);

  const { logger } = t.context;
  logger.debug = (...args) => {
    // console.debug(args);
    if (args[1].status === '[empty]') t.pass();
  };

  const redis = new Redis({}, logger);
  redis.setStatus(undefined);
  redis.emit('connect');
});

test.serial('errors when creating monitor', (t) => {
  t.plan(1);

  const { logger } = t.context;
  logger.error = (message) => {
    if (message === 'error') t.pass();
  };

  const monitor = sinon.stub(IORedis.prototype, 'monitor').returns(() => {});
  monitor.yields('error', null);

  // eslint-disable-next-line no-unused-vars
  const redis = new Redis({}, logger, true);

  sinon.assert.called(monitor);
  sinon.restore();
});

test('creates Redis with logger and does not bind events', async (t) => {
  const { logger } = t.context;
  logger.debug = (message) => {
    switch (message) {
      case 'redis connection established':
        t.fail();
        break;
      case 'redis connection ready':
        t.fail();
        break;
      case 'redis connection closed':
        t.fail();
        break;
      case 'redis reconnecting':
        t.fail();
        break;
      case 'redis connection ended':
        t.fail();
        break;
      case 'redis node connected':
        t.fail();
        break;
      case 'redis node disconnected':
        t.fail();
        break;
      default:
    }
  };

  const redis = await new Redis({}, logger, undefined, undefined, false);

  t.is(typeof redis, 'object');
  redis.monitor();
  await delay(1000);
  redis.emit('reconnecting');
  redis.emit('+node');
  redis.emit('-node');
  redis.emit('node error', 'node error');
  t.throws(() => {
    redis.emit('error', 'error');
  });
  redis.disconnect();
  await delay(1000);
});
