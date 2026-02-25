import numpy as np 
import json
import time
import random as random
from confluent_kafka import Producer
from confluent_kafka import Consumer
from confluent_kafka.admin import AdminClient

## intilize action space 
action = ["gauche","droite","haut","bas"]

# walking 
def walking(way,x):
    match way:
        case 0:
            x[0] = x[0]-1
        case 1:
            x[0] = x[0]+1
        case 2:
            x[1] = x[1]-1
        case 3:
            x[1] = x[1]+1
    return x


# Create admin client 
admin_client = AdminClient({'bootstrap.servers': 'localhost:9092'})

# define useful function
def delivery_report(err, msg):
    if err:
        print(f"❌ Delivery failed: {err}")
    else:
        print(f"✅ Delivered {msg.value().decode("utf-8")} to {msg.topic()}")

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
while not topic_exists("position-reward"):
    time.sleep(2)  # attend 2 secondes avant de réessayer
consumer.subscribe(["position-reward"])
print(f"Topic syncronisé")

iteration = 0
max_iteration =40
gamma = 0.9
sortie = 50
ligne = 9
colonne = 10 
## initialise Qvalues 
##Qvalues = np.zeros((len(map),len(map[0]),len(action)))
Qvalues = np.zeros((ligne,colonne,len(action)))
## position
# inversion
# current_x = [1,1]
# previous_x = [0,1]
current_x = [1,1]
previous_x = [1,0]
way = 1
## parameters
epsilon = 1
alpha = 1

while iteration<max_iteration:
    ## send message position
    value = json.dumps(current_x).encode("utf-8")
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
    current_x = order['position']      
    Qvalues[previous_x[1]][previous_x[0]][way] = Qvalues[previous_x[1]][previous_x[0]][way]+ alpha*(order['reward']+(gamma*(np.max(Qvalues[current_x[1]][current_x[0]]) - Qvalues[previous_x[1]][previous_x[0]][way])))
    Qvalues_charts_value = np.max(Qvalues, axis=2)
    Qvalues_charts_id = np.argmax(Qvalues, axis=2)
    ## actualise previous x and current x before moving
    previous_x = current_x[:]
    ## Exploration / exploitation
    if (random.random()<epsilon):
        way = random.randrange(4)
    else :
        ## choose the way
        way = np.argmax(Qvalues[current_x[1]][current_x[0]])
    ## moving 
    current_x = walking(way,current_x)
    ## back to previous when moving to wall
    if(order['end']):
        iteration = iteration+1
        alpha = alpha* np.exp((-0.01*iteration))
        epsilon = epsilon*np.exp((-0.01*iteration))
        print(f"epsilon:{epsilon}")
        print(f"alpha:{alpha}")

        ##if(iteration>5):
            ## Envoie des charts 
        # Qvalues_charts_id[Qvalues_charts_id == 0] = 4
        # Qvalues_new_charts_value = Qvalues_charts_value>0
        # Qvalues_charts_id = Qvalues_charts_id*Qvalues_new_charts_value

        ## 0 is high and nothing -> 0 is nothing 4 is high
        Qvalues_charts_id[Qvalues_charts_id == 0] = 4
        Qvalues_charts_id = Qvalues_charts_id*(Qvalues_charts_value>0)  
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
        ##    producer.flush()
    if(iteration>30):
        time.sleep(1) 
        print("slow")
    ##if (iteration%3 ==0):
            ##gamma = gamma-((max_iteration/(max_iteration/10))/100)

    
        