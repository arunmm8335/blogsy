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
const groupId = process.env.KAFKA_NOTIFICATIONS_GROUP_ID || 'blogsy-notifications-group';
const processedKeyPrefix = 'kafka:processed:notifications';

const inMemoryProcessed = new Map();

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

const handleNotificationEvent = async (event) => {
  switch (event.eventType) {
    case 'user.registered': {
      const { email, username } = event.payload || {};
      console.log(`Notification worker: welcome flow for ${username || 'unknown'} (${email || 'no-email'})`);
      break;
    }
    case 'post.created': {
      const { postId, title, authorId } = event.payload || {};
      console.log(`Notification worker: new post ${postId || 'unknown'} by ${authorId || 'unknown'}: ${title || 'untitled'}`);
      break;
    }
    default:
      break;
  }
};

const run = async () => {
  if (!kafkaEnabled || brokers.length === 0) {
    console.log('Notifications worker: Kafka disabled or no brokers configured. Exiting.');
    return;
  }

  const kafka = new Kafka({
    clientId: process.env.KAFKA_NOTIFICATIONS_CLIENT_ID || 'blogsy-notifications-worker',
    brokers,
    logLevel: logLevel.NOTHING,
  });

  const consumer = kafka.consumer({ groupId });
  const producer = kafka.producer();

  await producer.connect();
  await consumer.connect();
  await consumer.subscribe({ topic, fromBeginning: false });

  console.log(`Notifications worker is listening on topic: ${topic}`);

  await consumer.run({
    eachMessage: async ({ partition, message }) => {
      const raw = message.value?.toString();
      if (!raw) {
        return;
      }

      let event;
      try {
        event = JSON.parse(raw);
      } catch (error) {
        await producer.send({
          topic: deadLetterTopic,
          messages: [{
            value: JSON.stringify({
              reason: 'invalid_json',
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
        await handleNotificationEvent(event);
        await markProcessed(eventId);
      } catch (error) {
        await producer.send({
          topic: deadLetterTopic,
          messages: [{
            value: JSON.stringify({
              reason: 'handler_failure',
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
    console.log('Notifications worker shutting down...');
    await consumer.disconnect();
    await producer.disconnect();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};

run().catch((error) => {
  console.error('Notifications worker failed:', error.message);
  process.exit(1);
});
