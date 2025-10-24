import numpy as np 
import json
import time
from confluent_kafka import Producer
from confluent_kafka import Consumer
from confluent_kafka.admin import AdminClient

# Crée un client admin pour interroger Kafka
admin_client = AdminClient({'bootstrap.servers': 'localhost:9092'})

def delivery_report(err, msg):
    if err:
        print(f"❌ Delivery failed: {err}")
    else:
        print(f"✅ Delivered {msg.value().decode("utf-8")} to {msg.topic()}")

def topic_exists(topic_name):
    """Vérifie si le topic existe sur le cluster Kafka"""
    md = admin_client.list_topics(timeout=5)
    return topic_name in md.topics

## initialisation

action = ["gauche","droite","haut","bas"]
ligne = 9
colonne = 10

## brain 
Svalue = [[0,0,0,0,0,0,0,0,0,0],
         [0,0,0,0,0,0,0,0,0,0],
         [0,0,0,0,0,0,0,0,0,0],
         [0,0,0,0,0,0,0,0,0,0],
         [0,0,0,0,0,0,0,0,0,0],
         [0,0,0,0,0,0,0,0,0,0],
         [0,0,0,0,0,0,0,0,0,0],
         [0,0,0,0,0,0,0,0,0,0],
         [0,0,0,0,0,0,0,0,0,0]
         ]
Qvalues = np.zeros((ligne,colonne,len(action)))

## valeurs
iteration = 0
x = [1,1]
previous_x = [1,1]
lambd= 0.5
##x[0] = x[0]+1 ## bas
##x[0] = x[0]-1 ## haut
##x[1] = x[1]+1 ## droite
##x[1] = x[1]-1 ## gauche

## init producer 
producer_config = {
    "bootstrap.servers": "localhost:9092"
}
producer = Producer(producer_config)

## init consumer 
consumer_config = {
    "bootstrap.servers": "localhost:9092",
    "group.id": "order-tracker",
    "auto.offset.reset": "earliest"
}
consumer = Consumer(consumer_config)

## synchronisation

while iteration <150 :
    chemin = np.argmax(Qvalues[x[0]][x[1]])
    previous_x = x[:]

    if(chemin) == 0 :x[1] = x[1]-1
    elif(chemin) == 1 :x[1] = x[1]+1
    elif(chemin) == 2 :x[0] = x[0]-1
    elif(chemin) == 3 :x[0] = x[0]+1

    ## Send position value to kafka topic position 
    value = json.dumps(x).encode("utf-8")

    ## send message
    producer.produce(
        topic="position",
        value=value,
        callback=delivery_report
    )
    producer.flush()
    ## Attente subscrition
    if (iteration==0):
        print(f"En attente de la création du topic")
        while not topic_exists("position-reward"):
            time.sleep(2)  # attend 2 secondes avant de réessayer
        consumer.subscribe(["position-reward"])
        print(f"Topic syncronisé")
    ## wait for response 
    msg = None
    while msg==None:
        msg = consumer.poll(1.0)
        if msg is None:
            continue
        if msg.error():
            print("❌ Error:", msg.error())
            continue
        value = msg.value().decode("utf-8")
        order = json.loads(value)
        print(order)
        print(f"📦  pos: {order['position']} reward:{order['reward']}")
    
    Svalue[previous_x[0]][previous_x[1]] = order['reward']+lambd*Svalue[x[0]][x[1]]
    Qvalues[previous_x[0]][previous_x[1]][chemin] = order['reward']+lambd*Svalue[x[0]][x[1]]

    x = order['position']
    iteration =iteration+1
    time.sleep(1.5)
    