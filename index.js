const IORedis = require('ioredis');

function getMeta(client, hideMeta) {
  return {
    description: client._getDescription(),
    status: client.status || '[empty]',
    ...(hideMeta ? { [hideMeta]: true } : {})
  };
}

function bindEvents(client, logger, hideMeta) {
  client.on('connect', () =>
    logger.debug('redis connection established', getMeta(client, hideMeta))
  );
  client.on('ready', () =>
    logger.debug('redis connection ready', getMeta(client, hideMeta))
  );
  client.on('error', (error) => logger.error(error, getMeta(client, hideMeta)));
  client.on('close', () =>
    logger.debug('redis connection closed', getMeta(client, hideMeta))
  );
  client.on('reconnecting', (time) =>
    logger.debug('redis reconnecting', { time, ...getMeta(client, hideMeta) })
  );
  client.on('end', () =>
    logger.debug('redis connection ended', getMeta(client, hideMeta))
  );
  client.on('+node', () =>
    logger.debug('redis node connected', getMeta(client, hideMeta))
  );
  client.on('-node', () =>
    logger.debug('redis node disconnected', getMeta(client, hideMeta))
  );
  client.on('node error', (error, address) =>
    logger.error(error, { address, ...getMeta(client, hideMeta) })
  );
}

// eslint-disable-next-line max-params
function Redis(
  config = {},
  logger = console,
  monitor = false,
  maxListeners = 15,
  _bindEvents = true,
  hideMeta = 'hide_meta'
) {
  const client = new IORedis(config);
  client.setMaxListeners(maxListeners);
  // https://github.com/luin/ioredis#monitor
  if (monitor) {
    client.monitor((error, monitor) => {
      if (error) {
        return logger.error(error, getMeta(client, hideMeta));
      }

      logger.debug('redis monitor instance created', {
        ...getMeta(client, hideMeta),
        monitor
      });
      client._monitor = monitor;
      monitor.on('monitor', (time, args, source, database) =>
        logger.debug('redis monitor', {
          ...getMeta(client, hideMeta),
          time,
          args,
          source,
          database
        })
      );
      bindEvents(monitor, logger, hideMeta);
    });
  }

  if (_bindEvents) {
    bindEvents(client, logger, hideMeta);
  }

  return client;
}

module.exports = Redis;
