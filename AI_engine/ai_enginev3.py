import numpy as np 
import json
import time
import random as random
from confluent_kafka import Producer
from confluent_kafka import Consumer
from confluent_kafka.admin import AdminClient


# =====================
# Kafka 
# =====================

# Create admin client 
admin_client = AdminClient({'bootstrap.servers': 'localhost:9092'})

# define useful function
def delivery_report(err, msg):
    if err:
        print(f"❌ Delivery failed: {err}")
    else:
        print(f"✅ Envoye {msg.value().decode("utf-8")} to {msg.topic()}")

def topic_exists(topic_name):
    """Vérifie si le topic existe sur le cluster Kafka"""
    md = admin_client.list_topics(timeout=5)
    return topic_name in md.topics

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
while not topic_exists("map-data"):
    time.sleep(2)  # attend 2 secondes avant de réessayer
consumer.subscribe(["map-data"])
print(f"Topic syncronisé")




# =====================
# AI 
# =====================

## intilize action space 
action = ["gauche","droite","haut","bas"]
reward = [0,-10,50] # 0:vide - 1:mur - 2:sortie

## Some data
current_position = {"x":1,"y":1}
previous_position = {"x":1,"y":1}
way = 1
Qvalues = np.array([])

# hyper parameter

step=0
max_steps=5000
iteration = 0
max_iteration =80

gamma = 0.5
epsilon = 1
alpha = 1

# walking 
def walking(way,x):
    match way:
        case 0:
            x["x"] = x["x"]-1
        case 1:
            x["x"] = x["x"]+1
        case 2:
            x["y"] = x["y"]-1
        case 3:
            x["y"] = x["y"]+1
    return x

while True:
    msg = None
    while msg==None:
            msg = consumer.poll(1.0)
            if msg is None:
                # print("Rien ???")
                continue
            if msg.error():
                print("❌ Error:", msg.error())
                continue
            else:
                # print("Reçu")
                value = msg.value().decode("utf-8")
                position = json.loads(value)
                # print(position)
                if(Qvalues.size == 0):
                    Qvalues = np.zeros((position['mapHeigh'],position['mapWidth'],len(action)))
                
                if(position['endTry']==1):
                    ## hyper parameters update
                    iteration = iteration+1
                    step=0
                    alpha = alpha* np.exp((-0.0001*iteration))
                    epsilon = epsilon*np.exp((-0.0001*iteration))
                    # print(f"epsilon:{epsilon}")
                    # print(f"alpha:{alpha}")
                    print(f"iteration:{iteration}")
                    position['endTry'] = 0

                if(position['endTry']==0):
                    if(iteration<max_iteration):#prevent infinite discrepancy 
                        if(step<max_steps):
                            current_position = position['position']
                            # print("Start resonning)")
                            # We refresh previous position value with the current position value and the current position reward
                            Qvalues[previous_position["y"]][previous_position["x"]][way] = Qvalues[previous_position["y"]][previous_position["x"]][way]+ alpha*(reward[position["map"]]+(gamma*(np.max(Qvalues[current_position["y"]][current_position["x"]]) - Qvalues[previous_position["y"]][previous_position["x"]][way])))
                            ## refresh previous_position x and current_position x before moving
                            previous_position = current_position.copy()
                            
                            ## Exploration / exploitation
                            if (random.random()<epsilon):
                                way = random.randrange(4)
                            else :
                                ## choose the way
                                way = np.argmax(Qvalues[current_position["y"]][current_position["x"]])
                            
                            ## moving 
                            current_position = walking(way,current_position)
                            step = step+1
                            ## send
                        else:
                            position['endTry'] = 1
                    else:
                        position['endTry'] = 2
                        iteration = 0 #de trop
                        
                    ## send
                    response = {"position":current_position,"endTry":position['endTry'],"qvalues_mean":np.mean(Qvalues, axis=2).tolist(),"policy":np.argmax(Qvalues, axis=2).tolist(),"iteration":iteration,"max_iteration":max_iteration}
                    producer.produce(
                        topic="position",
                        value=json.dumps(response).encode("utf-8")
                        # callback=delivery_report
                    )
                    producer.flush()
                if(position['endTry']==3):
                    current_position = position['position']
                    # We refresh previous position value with the current position value and the current position reward
                    Qvalues[previous_position["y"]][previous_position["x"]][way] = Qvalues[previous_position["y"]][previous_position["x"]][way]+ alpha*(reward[position["map"]]+(gamma*(np.max(Qvalues[current_position["y"]][current_position["x"]]) - Qvalues[previous_position["y"]][previous_position["x"]][way])))
                    ## refresh previous_position x and current_position x before moving
                    previous_position = current_position.copy()
                    ## choose the way
                    way = np.argmax(Qvalues[current_position["y"]][current_position["x"]])
                    ## moving 
                    current_position = walking(way,current_position)
                    ## send
                    response = {"position":current_position,"endTry":position['endTry']}
                    producer.produce(
                        topic="position",
                        value=json.dumps(response).encode("utf-8")
                        ##callback=delivery_report
                    )
                    producer.flush()


    
