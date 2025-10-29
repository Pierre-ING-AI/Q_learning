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

## valeurs
iteration = 0
x = [1,1]
previous_x = [0,1]
lambd= 0.9
chemin = 1
alpha=0.1
exploration = 3
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

while iteration <500 :

    ## Attente subscrition
    if (iteration==0):
        producer.produce(
            topic="position",
            value=(json.dumps(x).encode("utf-8"))
            ##callback=delivery_report
        )
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
        print(f"En attente de la création du topic")
        while not topic_exists("position-reward"):
            time.sleep(2)  # attend 2 secondes avant de réessayer
        consumer.subscribe(["position-reward"])
        print(f"Topic syncronisé")
        print(f"position envoyé {x}")
        ## send first message

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

    x = order['position']
    ## Actualisation Qvalue pour prise de decision 
    print(f"position recu {x} | previous_position {previous_x}")

    Qvalues[previous_x[0]][previous_x[1]][chemin] = alpha*(order['reward']+lambd*np.max(Qvalues[x[0]][x[1]]) - Qvalues[previous_x[0]][previous_x[1]][chemin])
    Qvalues_charts_value = np.mean(Qvalues, axis=2)
    Qvalues_charts_id = np.argmax(Qvalues, axis=2)

    ## Decision IA
    if ((iteration<200 or all(val == 0 for val in Qvalues[x[0]][x[1]])) and iteration%exploration==0):
        chemin  = randrange(4)
        Qvalues_charts_id[x[0]][x[1]] = chemin
    else :
        chemin = np.argmax(Qvalues[x[0]][x[1]])

    previous_x = x[:]

    print(f"position {x} | previous_position {previous_x} | chemin  {chemin}")

    if chemin == 0 :
        x[1] = x[1]-1
    elif chemin == 1 :
        x[1] = x[1]+1
    elif chemin == 2 :
        x[0] = x[0]-1
    elif chemin == 3 :
        x[0] = x[0]+1

    print(f" Mouvement: position {x} | previous_position {previous_x} | chemin  {chemin}")

    ## Send position value to kafka topic position 
    value = json.dumps(x).encode("utf-8")
    charts = {
        "qvalues_charts_value":Qvalues_charts_value.tolist(),
        "qvalues_charts_id":Qvalues_charts_id.tolist(),
    }
    charts_value = json.dumps(charts).encode("utf-8")
    ## send message
    producer.produce(
        topic="position",
        value=value
        ##callback=delivery_report
    )
    print("envoie position")
    producer.produce(
        topic="qvalues",
        value=charts_value
        ##callback=delivery_report
    )
    print("envoie qvalues")
    producer.flush()
    
        ##print(f"📦  pos: {order['position']} reward:{order['reward']}")
    
    ##Svalue[previous_x[0]][previous_x[1]] = order['reward']+lambd*Svalue[x[0]][x[1]]
    ##Qvalues[previous_x[0]][previous_x[1]][chemin] = order['reward']+lambd*Svalue[x[0]][x[1]]
    iteration =iteration+1
    time.sleep(1)
    