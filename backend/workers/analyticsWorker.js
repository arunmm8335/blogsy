import dotenv from 'dotenv';
import { Kafka, logLevel } from 'kafkajs';
import cacheService from '../services/cacheService.js';

dotenv.config();

const kafkaEnabled = process.env.KAFKA_ENABLED === 'true';
const brokers = (process.env.KAFKA_BROKERS || '')
  .split(',')
  .map((broker) => broker.trim())
  .filter(Boolean);

const topic = process.env.KAFKA_TOPIC || 'blogsy.events';
const deadLetterTopic = process.env.KAFKA_DLT_TOPIC || `${topic}.dlt`;
const groupId = process.env.KAFKA_ANALYTICS_GROUP_ID || 'blogsy-analytics-group';
const processedKeyPrefix = 'kafka:processed:analytics';
const metricsPrefix = 'analytics:events';

const inMemoryProcessed = new Map();
const inMemoryCounters = new Map();

const incrementCounter = async (key) => {
  const current = inMemoryCounters.get(key) || 0;
  inMemoryCounters.set(key, current + 1);

  const cached = await cacheService.get(key);
  const numeric = Number(cached || 0);
  await cacheService.set(key, numeric + 1, 30 * 24 * 60 * 60);
};

const hasProcessed = async (eventId) => {
  if (!eventId) return false;

  const redisKey = `${processedKeyPrefix}:${eventId}`;
  const cached = await cacheService.get(redisKey);
  if (cached) return true;

  const memoryEntry = inMemoryProcessed.get(eventId);
  if (!memoryEntry) return false;

  if (Date.now() > memoryEntry.expiresAt) {
    inMemoryProcessed.delete(eventId);
    return false;
  }

  return true;
};

const markProcessed = async (eventId) => {
  if (!eventId) return;

  const ttlSeconds = 24 * 60 * 60;
  const redisKey = `${processedKeyPrefix}:${eventId}`;
  await cacheService.set(redisKey, true, ttlSeconds);

  inMemoryProcessed.set(eventId, {
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
};

const trackEvent = async (event) => {
  const dateKey = new Date().toISOString().slice(0, 10);
  const eventType = event.eventType || 'unknown';

  await incrementCounter(`${metricsPrefix}:total`);
  await incrementCounter(`${metricsPrefix}:type:${eventType}`);
  await incrementCounter(`${metricsPrefix}:daily:${dateKey}:total`);
  await incrementCounter(`${metricsPrefix}:daily:${dateKey}:type:${eventType}`);

  console.log(`Analytics worker: tracked ${eventType}`);
};

const run = async () => {
  if (!kafkaEnabled || brokers.length === 0) {
    console.log('Analytics worker: Kafka disabled or no brokers configured. Exiting.');
    return;
  }

  const kafka = new Kafka({
    clientId: process.env.KAFKA_ANALYTICS_CLIENT_ID || 'blogsy-analytics-worker',
    brokers,
    logLevel: logLevel.NOTHING,
  });

  const consumer = kafka.consumer({ groupId });
  const producer = kafka.producer();

  await producer.connect();
  await consumer.connect();
  await consumer.subscribe({ topic, fromBeginning: false });

  console.log(`Analytics worker is listening on topic: ${topic}`);

  await consumer.run({
    eachMessage: async ({ partition, message }) => {
      const raw = message.value?.toString();
      if (!raw) return;

      let event;
      try {
        event = JSON.parse(raw);
      } catch (error) {
        await producer.send({
          topic: deadLetterTopic,
          messages: [{
            value: JSON.stringify({
              reason: 'analytics_invalid_json',
              raw,
              failedAt: new Date().toISOString(),
            }),
          }],
        });
        return;
      }

      const eventId = event.eventId;
      if (await hasProcessed(eventId)) {
        return;
      }

      try {
        await trackEvent(event);
        await markProcessed(eventId);
      } catch (error) {
        await producer.send({
          topic: deadLetterTopic,
          messages: [{
            value: JSON.stringify({
              reason: 'analytics_handler_failure',
              error: error.message,
              event,
              partition,
              failedAt: new Date().toISOString(),
            }),
          }],
        });
      }
    },
  });

  const shutdown = async () => {
    console.log('Analytics worker shutting down...');
    await consumer.disconnect();
    await producer.disconnect();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};

run().catch((error) => {
  console.error('Analytics worker failed:', error.message);
  process.exit(1);
});
