# Qlearning

# 🤖 Maze Q-Learning Project

Ce projet est une plateforme de démonstration interactive de **Reinforcement Learning** (Apprentissage par renforcement). Il permet de visualiser comment un agent IA apprend à résoudre un labyrinthe en temps réel via une architecture distribuée.

## 🏗️ Architecture du Système

Le projet est découpé en trois services distincts communiquant via un bus d'événements :

* **IA Engine (Python)** : Utilise `numpy` pour gérer la table de Q-Learning et `confluent-kafka` pour la communication.
* **Backend (Node.js)** : Serveur pivot utilisant `kafkajs` pour le lien avec l'IA et `socket.io` pour la diffusion temps réel vers le web.
* **Frontend (Vue.js 3)** : Interface de visualisation riche (Labyrinthe, Heatmaps de probabilités et de politiques).
* **Infrastructure** : Cluster Kafka (mode KRaft) orchestré par Docker.

---

## 🧠 Spécifications de l'IA (Q-Learning)

L'agent apprend selon les paramètres définis dans `ai_enginev3.py` :

* **Récompenses ($R$)** : 
    * Case vide : `0`.
    * Mur : `-10`.
    * Sortie (Objectif) : `50`.
* **Hyperparamètres** :
    * **Gamma ($\gamma$)** : `0.5` (Facteur de réduction des récompenses futures).
    * **Alpha ($\alpha$)** : Démarre à `1` avec une décroissance exponentielle ($e^{-0.0001 \times \text{iteration}}$).
    * **Epsilon ($\epsilon$)** : Démarre à `1` (100% exploration) avec une décroissance similaire pour favoriser l'exploitation au fil du temps.
* **Espace d'actions** : `["gauche", "droite", "haut", "bas"]`.

---

## 🚀 Installation

### 1. Infrastructure Kafka
Lancer le conteneur Kafka sur le port `9092` :
```bash
docker-compose up -d
