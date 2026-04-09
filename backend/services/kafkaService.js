import { Kafka, logLevel } from 'kafkajs';
import crypto from 'crypto';

let producer = null;
let kafkaEnabled = false;
let producerConnected = false;

const buildBrokers = () => {
  const raw = process.env.KAFKA_BROKERS || '';
  return raw
    .split(',')
    .map((broker) => broker.trim())
    .filter(Boolean);
};

const getKafkaTopic = () => process.env.KAFKA_TOPIC || 'blogsy.events';

export const isKafkaEnabled = () => kafkaEnabled;

export const initKafka = async () => {
  const brokers = buildBrokers();
  kafkaEnabled = process.env.KAFKA_ENABLED === 'true' && brokers.length > 0;

  if (!kafkaEnabled) {
    console.log('Kafka is disabled. Skipping Kafka initialization.');
    return;
  }

  const kafka = new Kafka({
    clientId: process.env.KAFKA_CLIENT_ID || 'blogsy-backend',
    brokers,
    logLevel: logLevel.NOTHING,
  });

  producer = kafka.producer();

  try {
    await producer.connect();
    producerConnected = true;
    console.log(`Kafka producer connected. Topic: ${getKafkaTopic()}`);
  } catch (error) {
    kafkaEnabled = false;
    producerConnected = false;
    producer = null;
    console.error('Kafka initialization failed. Continuing without Kafka.', error.message);
  }
};

export const emitEvent = async (eventType, payload = {}) => {
  if (!kafkaEnabled || !producer || !producerConnected) {
    return;
  }

  const event = {
    eventId: crypto.randomUUID(),
    eventType,
    version: 1,
    source: 'blogsy-backend',
    payload,
    emittedAt: new Date().toISOString(),
  };

  try {
    await producer.send({
      topic: getKafkaTopic(),
      messages: [{ value: JSON.stringify(event) }],
    });
  } catch (error) {
    console.error(`Failed to publish Kafka event: ${eventType}`, error.message);
  }
};

export const disconnectKafka = async () => {
  if (!producer || !producerConnected) {
    return;
  }

  try {
    await producer.disconnect();
    producerConnected = false;
    console.log('Kafka producer disconnected.');
  } catch (error) {
    console.error('Error disconnecting Kafka producer:', error.message);
  }
};
