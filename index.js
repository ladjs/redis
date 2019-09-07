const IORedis = require('ioredis');

function getMeta(client) {
  return {
    description: client._getDescription(),
    status: client.status || '[empty]'
  };
}

function Redis(config = {}, logger = console, monitor = false) {
  const client = new IORedis(config);
  // https://github.com/luin/ioredis#monitor
  if (monitor) {
    client.monitor((err, monitor) => {
      if (err) return logger.error(err, getMeta(client));
      logger.debug('redis monitor established', {
        ...getMeta(client),
        monitor
      });
      monitor.on('monitor', (time, args, source, database) =>
        logger.debug('redis monitor', {
          ...getMeta(client),
          time,
          args,
          source,
          database
        })
      );
    });
  }

  client.on('connect', () =>
    logger.debug('redis connection established', getMeta(client))
  );
  client.on('ready', () =>
    logger.debug('redis connection ready', getMeta(client))
  );
  client.on('error', err => logger.error(err, getMeta(client)));
  client.on('close', () =>
    logger.debug('redis connection closed', getMeta(client))
  );
  client.on('reconnecting', () =>
    logger.debug('redis reconnecting', getMeta(client))
  );
  client.on('end', () =>
    logger.debug('redis conection ended', getMeta(client))
  );
  return client;
}

module.exports = Redis;
