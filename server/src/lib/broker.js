// ============================================================
// MESSAGE BROKER ABSTRACTION
// Memory-based for dev, swappable to RabbitMQ / Kafka
// All events → Analytics Pipeline ($16.2)
// ============================================================
import { CONFIG } from "../config/index.js";

class Broker {
  constructor() {
    this.type = CONFIG.BROKER.TYPE;
    this.handlers = new Map();
    this.messageQueue = new Map(); // topic → messages[]
    this.consumers = new Map();    // topic → consumer[]
  }

  async init() {
    console.log(`  📡 Broker: ${this.type}`);
    if (this.type === "rabbitmq") {
      console.warn("  ⚠ RabbitMQ not configured — using in-memory broker");
      this.type = "memory";
    }
    if (this.type === "kafka") {
      console.warn("  ⚠ Kafka not configured — using in-memory broker");
      this.type = "memory";
    }
  }

  // Emit event to topic
  emit(topic, message) {
    const enriched = { ...message, _brokerTs: Date.now(), _topic: topic };
    if (!this.messageQueue.has(topic)) this.messageQueue.set(topic, []);
    const queue = this.messageQueue.get(topic);
    queue.push(enriched);
    if (queue.length > 10000) queue.shift(); // Prevent memory leak

    // Notify consumers
    const consumers = this.consumers.get(topic) || [];
    for (const handler of consumers) {
      try { handler(enriched); } catch (e) { console.error(`Consumer error on ${topic}:`, e); }
    }
  }

  // Subscribe consumer to topic
  subscribe(topic, handler) {
    if (!this.consumers.has(topic)) this.consumers.set(topic, []);
    this.consumers.get(topic).push(handler);
    console.log(`  ✓ Consumer subscribed to ${topic}`);
    return () => {
      const list = this.consumers.get(topic) || [];
      this.consumers.set(topic, list.filter((h) => h !== handler));
    };
  }

  // Flush messages for a topic (for analytics pull)
  flush(topic) {
    const messages = this.messageQueue.get(topic) || [];
    this.messageQueue.set(topic, []);
    return messages;
  }

  // Get message count per topic
  status() {
    return Object.fromEntries([...this.messageQueue.entries()].map(([topic, msgs]) => [topic, msgs.length]));
  }
}

export const broker = new Broker();

export async function initBroker() {
  await broker.init();

  // Built-in analytics consumers
  broker.subscribe("sa.battle.events", (event) => {
    // In production: these go to Kafka → Analytics pipeline
    if (CONFIG.SERVER.NODE_ENV !== "production") {
      // Dev: just log
      if (event.type === "result") {
        console.log(`  ⚡ Battle result: ${event.result} | Score: ${event.score} | Player: ${event.playerId}`);
      }
    }
  });

  broker.subscribe("sa.errors", (event) => {
    console.log(`  📋 Error logged: ${event.errorId} | Player: ${event.playerId}`);
  });
}
