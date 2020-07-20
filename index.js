const IORedis = require('ioredis');

function getMeta(client) {
  return {
    description: client._getDescription(),
    status: client.status || '[empty]'
  };
}

function bindEvents(client, logger) {
  client.on('connect', () =>
    logger.debug('redis connection established', getMeta(client))
  );
  client.on('ready', () =>
    logger.debug('redis connection ready', getMeta(client))
  );
  client.on('error', (err) => logger.error(err, getMeta(client)));
  client.on('close', () =>
    logger.debug('redis connection closed', getMeta(client))
  );
  client.on('reconnecting', (time) =>
    logger.debug('redis reconnecting', { time, ...getMeta(client) })
  );
  client.on('end', () =>
    logger.debug('redis connection ended', getMeta(client))
  );
  client.on('+node', () =>
    logger.debug('redis node connected', getMeta(client))
  );
  client.on('-node', () =>
    logger.debug('redis node disconnected', getMeta(client))
  );
  client.on('node error', (err, address) =>
    logger.error(err, { address, ...getMeta(client) })
  );
}

function Redis(config = {}, logger = console, monitor = false) {
  const client = new IORedis(config);
  // https://github.com/luin/ioredis#monitor
  if (monitor) {
    client.monitor((err, monitor) => {
      if (err) return logger.error(err, getMeta(client));
      logger.debug('redis monitor instance created', {
        ...getMeta(client),
        monitor
      });
      client._monitor = monitor;
      monitor.on('monitor', (time, args, source, database) =>
        logger.debug('redis monitor', {
          ...getMeta(client),
          time,
          args,
          source,
          database
        })
      );
      bindEvents(monitor, logger);
    });
  }

  bindEvents(client, logger);
  return client;
}

module.exports = Redis;
