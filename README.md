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

L'agent met à jour ses connaissances (la table Q) en utilisant l'équation de Bellman :
 - $$Q(s, a) \leftarrow Q(s, a) + \alpha [R + \gamma \max_{a'} Q(s', a') - Q(s, a)]$$  
  **Détails des termes :**
* **$Q(s, a)$** : La valeur actuelle pour l'action $a$ dans l'état $s$.
* **$\alpha$ (Alpha)** : Le taux d'apprentissage (Learning Rate).
* **$R$** : La récompense immédiate reçue après l'action.
* **$\gamma$ (Gamma)** : Le facteur de réduction pour les récompenses futures.
* **$\max_{a'} Q(s', a')$** : L'estimation de la meilleure valeur future possible dans le prochain état $s'$.
  
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

## 🎮 Utilisation
- Générer : Le système crée un labyrinthe aléatoirement.
- Apprendre : En cliquant sur "Learning", l'IA explore le labyrinthe. Les couleurs changent dans la Heatmap à mesure que les Q-values s'affinent.
- Visualiser : Les heatmaps ansique le pas progressbar affiche la progression vers la fin de l'entraînement.
- Exécuter : Une fois entraînée, l'IA peut parcourir le chemin optimal sans exploration.

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

---

## Détail technique du code 
### 📡 Table des flux de données Kafka

| Topic | Sens du flux | Format des données (JSON) | Description |
| :--- | :--- | :--- | :--- |
| **`map-data`** | `Backend` ➔ `IA Engine` | `{"position": {"x": int, "y": int}, "map": int, "endTry": int, ...}` | Envoie la position actuelle, le type de case et l'état (`learning`, `run`, etc.) à l'IA. |
| **`position`** | `IA Engine` ➔ `Backend` | `{"position": {"x": int, "y": int}, "endTry": int}` | L'IA renvoie la nouvelle position après avoir calculé son mouvement. |
| **`charts`** | `IA Engine` ➔ `Backend` | `{"qvalues_mean": [[float]], "policy": [[int]]}` | Envoie les matrices de données pour mettre à jour la Heatmap et les flèches de direction. |


### 🛠️ Correspondance des états (`endTry`)

| Valeur | État | Action de l'IA |
| :--- | :--- | :--- |
| **0** | `Try Learning` | Mode exploration active et mise à jour des Q-values. |
| **1** | `Restart Try` | Réinitialisation de l'agent après un mur ou la sortie. |
| **2** | `Stop` | Arrêt des calculs et mise en attente. |
| **3** | `Run` | Exploitation : l'IA suit le chemin optimal sans apprendre. |

## Limite
Projet fonctionnel mais incomplet. Ce qu'il faudrait faire :
   - Créer des sessions websocket et node 
   - retoucher l'architecture pour faire tourner plusieurs instances d'IA
   - Retoucher l architecture pour accelerer l entrainement ( exploitation par kafka sinon python only )
   - Dockerizer le projetc pour qu'il puisse tourner avec une commande docker
