# Qlearning

# 🤖 Maze Q-Learning Project

Ce projet est une plateforme de démonstration interactive de **Reinforcement Learning**. Il permet de visualiser comment un agent IA apprend à résoudre un labyrinthe en temps réel via une architecture distribuée.

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
```
### 2. Serveur Node.js (Backend)
Configure le pont entre Kafka et le Web sur le port 3005 
```bash
npm install
node index.js
```
### 3. Moteur IA (Python)
Le cerveau de l'application :
```bash
pip install numpy confluent-kafka
python ai_enginev3.py
```
### 4. Interface Web (Vue.js)
Lancé sur http://localhost:5173 :
```bash
# Dans le dossier frontend
npm install
npm run dev
```
Topic,Sens du flux,Format des données (JSON),Description du contenu
map-data,Backend ➔ IA Engine,"{ ""position"": { ""x"": int, ""y"": int }, ""map"": int, ""endTry"": int, ""mapHeight"": int, ""mapWidth"": int }","Données d'entrée pour l'IA : Envoie la position actuelle du joueur, la nature de la case (mur/vide) et l'état de la session (0: Apprentissage, 3: Run)."
position,IA Engine ➔ Backend,"{ ""position"": { ""x"": int, ""y"": int }, ""endTry"": int }","Décision de l'IA : Renvoie les nouvelles coordonnées calculées par l'algorithme après avoir choisi une action (Haut, Bas, Gauche, Droite)."
charts,IA Engine ➔ Backend,"{ ""qvalues_mean"": [[float]], ""policy"": [[int]] }",Données de visualisation : Transmet la matrice des Q-values moyennes pour la Heatmap et la matrice des directions optimales (Policy) pour l'affichage des flèches.

## 🎮 Utilisation
- Générer : Le système crée un labyrinthe aléatoirement.
- Apprendre : En cliquant sur "Learning", l'IA explore le labyrinthe. Les couleurs changent dans la Heatmap à mesure que les Q-values s'affinent.
- Visualiser : Les heatmaps ansique le pas progressbar affiche la progression vers la fin de l'entraînement.
- Exécuter : Une fois entraînée, l'IA peut parcourir le chemin optimal sans exploration.
