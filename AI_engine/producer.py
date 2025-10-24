import json
import uuid

from confluent_kafka import Producer
from confluent_kafka import Consumer

## Producer
producer_config = {
    "bootstrap.servers": "localhost:9092"
}

producer = Producer(producer_config)

def delivery_report(err, msg):
    if err:
        print(f"❌ Delivery failed: {err}")
    else:
        print(f"✅ Delivered {msg.value().decode("utf-8")} to {msg.topic()}")

##order = {
##    "order_id": str(uuid.uuid4()),
##    "position":[1,1]
##}

order=[1,1]
value = json.dumps(order).encode("utf-8")

producer.produce(
    topic="position",
    value=value,
    callback=delivery_report
)
producer.flush()

## Consumer 
consumer_config = {
    "bootstrap.servers": "localhost:9092",
    "group.id": "order-tracker",
    "auto.offset.reset": "earliest"
}

consumer = Consumer(consumer_config)
consumer.subscribe(["position-reward"])

print("🟢 Consumer is running and subscribed to orders topic")

try:
    while True:
        msg = consumer.poll(1.0)
        if msg is None:
            continue
        if msg.error():
            print("❌ Error:", msg.error())
            continue

        value = msg.value().decode("utf-8")
        order = json.loads(value)
        print(f"📦  pos: {order['position']} reward:{order['reward']}")
except KeyboardInterrupt:
    print("\n🔴 Stopping consumer")

finally:
    consumer.close()
