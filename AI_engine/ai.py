import numpy as np 
import json
import time
from random import randrange
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
Qvalues_charts_value = np.mean(Qvalues, axis=2)
Qvalues_charts_id = np.argmax(Qvalues, axis=2)

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
    "auto.offset.reset": "earliest",   # ← lit seulement les nouveaux messages
}
consumer = Consumer(consumer_config)

## synchronisation
print(f"En attente de la création du topic")
while not topic_exists("position-reward"):
    time.sleep(2)  # attend 2 secondes avant de réessayer
consumer.subscribe(["position-reward"])
print(f"Topic syncronisé")

## Init valeurs
iteration = 0
x = [1,1]
previous_x = [0,1]
lambd= 0.9
chemin = 1
alpha=0.1
exploration = 1

while iteration <6000 :

    ## send message position
    value = json.dumps(x).encode("utf-8")
    producer.produce(
        topic="position",
        value=value
        ##callback=delivery_report
    )
    producer.flush()

    ## wait for response 
    msg = None
    while msg==None:
        msg = consumer.poll(1.0)
        if msg is None:
            continue
        if msg.error():
            print("❌ Error:", msg.error())
            continue
        else:
            value = msg.value().decode("utf-8")
            order = json.loads(value)
            ##print(order)

    ## actualisation x avec message recu 
    x = order['position']
    print(f"position recu {x} | previous_position {previous_x}")

    if(order['reward']==50):
        exploration = exploration+1;
    ## Actualisation Qvalue a partir du reward message
    Qvalues[previous_x[0]][previous_x[1]][chemin] = alpha*(order['reward']+lambd*np.max(Qvalues[x[0]][x[1]]) - Qvalues[previous_x[0]][previous_x[1]][chemin])
    Qvalues_charts_value = np.max(Qvalues, axis=2)
    Qvalues_charts_id = np.argmax(Qvalues, axis=2)

    ## Mouvement IA
    ## Exploration ou decision 
    ##if (iteration%exploration==0):
    if(all(x == 0 for x in Qvalues[x[0]][x[1]])):
        chemin  = randrange(4)
        Qvalues_charts_id[x[0]][x[1]] = chemin
    else :
        chemin = np.argmax(Qvalues[x[0]][x[1]])

    ## actualisation de la position précédante juste avant le mouvement
    previous_x = x[:]
    print(f"position {x} | previous_position {previous_x} | chemin  {chemin}")

    ## mouvement en fonction du chemin choisi
    if chemin == 0 :
        x[1] = x[1]-1
    elif chemin == 1 :
        x[1] = x[1]+1
    elif chemin == 2 :
        x[0] = x[0]-1
    elif chemin == 3 :
        x[0] = x[0]+1
    print(f" Mouvement: position {x} | previous_position {previous_x} | chemin  {chemin}")

    ## Envoie des charts 
    charts = {
        "qvalues_charts_value":Qvalues_charts_value.tolist(),
        "qvalues_charts_id":Qvalues_charts_id.tolist(),
    }
    charts_value = json.dumps(charts).encode("utf-8")
    producer.produce(
        topic="qvalues",
        value=charts_value
        ##callback=delivery_report
    )
    print("envoie qvalues")
    producer.flush()

    iteration =iteration+1
    time.sleep(0.2)
    