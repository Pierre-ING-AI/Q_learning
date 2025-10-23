import numpy as np 

action = ["gauche","droite","haut","bas"]
hauteur = 5
largeur = 8


map = [[-50,-50,-50,-50,-50,-50,-50,-50,-50,-50],
        [-50,-1,-1,-1,-1,-1,20,-50,-1,-50],
       [-50,-1,-1,-1,-50,-50,-50,-50,-1,-50],
       [-50,-1,-50,-1,-1,20,-10,-1,-1,-50],
       [-50,-1,-50,-1,-50,-1,-50,-1,-1,-50],
       [-50,-1,-1,-1,-50,-1,-1,-1,40,-50],
       [-50,-50,-50,-50,-50,-50,-50,-50,-50,-50],
       ]

Svalue = [[0,0,0,0,0,0,0,0,],
         [0,0,0,0,0,0,0,0,],
         [0,0,0,0,0,0,0,0,],
         [0,0,0,0,0,0,0,0,],
         ]

print(len(action))
Qvalues = np.zeros((hauteur,largeur,len(action)))
iteration = 0
x = [1,1]
previous_x = [1,1]
lambd= 0.5
##x[0] = x[0]+1 ## bas
##x[0] = x[0]-1 ## haut
##x[1] = x[1]+1 ## droite
##x[1] = x[1]-1 ## gauche
while iteration <300 :
    chemin = np.argmax(Qvalues[x[0]][x[1]])
    previous_x = x[:]

    if(chemin) == 0 :x[1] = x[1]-1
    elif(chemin) == 1 :x[1] = x[1]+1
    elif(chemin) == 2 :x[0] = x[0]-1
    elif(chemin) == 3 :x[0] = x[0]+1


    Svalue[previous_x[0]][previous_x[1]] = map[x[0]][x[1]]+lambd*Svalue[x[0]][x[1]]
    Qvalues[previous_x[0]][previous_x[1]][chemin] = map[x[0]][x[1]]+lambd*Svalue[x[0]][x[1]]

    ##if (((x[0]>5) or (x[0]<1)) or ((x[1]>9) or (x[1]<1))):
    if (map[x[0]][x[1]]==-50):
        x = previous_x[:]
    else : map[previous_x[0]][previous_x[1]] = -10
    iteration =iteration+1

print (map)