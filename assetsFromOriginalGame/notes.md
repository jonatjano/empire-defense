- montrer une grille blanche uniquement pendant le placement d'une tour
- montrer l'écran de selection des tours au tout debut de la partie
- les enemis apparaissent sur le chemin dans la map
- mode accéléré = vitesse x 2

# init
money: 20
vies: 20
crystal: 0

# enemies
| nom           | Id | base hp | speed       | reward | crystal |
|---------------|----|---------|-------------|--------|---------|
| squire        | S  | 100     | 1           | 1      | 1       |
| footman       | F  |         | 1           | 1      | 1       |
| cannon        | C  |         | 0.75 ou 0.8 | 2      | 2       |
| knight        | K  |         |             | 2      | 2       |
| battering ram | B  |         |             | 6      | 5       |
| champion      | H  |         |             | 3      | 2       |
| harpy         | Y  |         |             | 5      | 5       |
| elephant      | E  |         |             |        |         |

## hp notes
- footman takes 2 hits from archery 1 in wave [1;7]
- footman takes 2.1 hits from archery 1 in wave [8;[
- heavy takes 3.1 hits from archery 1 in wave [5;9..[

# vagues
| vague | composition |
|-------|-------------|
| 1     | 1S          |
| 2     | 3S          |
| 3     | 4S          |
| 4     |             |
| 5     | 1F 5S       |
| 6     | 8S          |
| 7     | 10S         |
| 8     | 12S         |
| 9     | 5F          |
| 10    | 6S 3F 10S   |
| 11    | 5F          |
| 12    | 2C          |
| 13    | 8F          | 
| 14    | 10F         |
| 15    | 18S 2C 5F   |
| 16    |             |
| 17    |             |
| 18    | 1K          |
| 19    | 2K          |
| 20    | 2K 10S      |
| 21    |             |
| 22    |             |
| 23    | 1B          |
| 24    |             |
| 25    |             |
| 26    |             |
| 27    | 3K          |
| 28    | 8C          |
| 29    | 2H          |
| 30    | 1Y          |
| 31    | 1B 4F       |
| 32    | 5K          |
| 33    |             |
| 34    |             |
| 35    |             |
| 36    |             |
| 37    |             |
| 38    | 3Y 2K       |
| 39    |             |
| 40    |             |
| 41    |             |
| 42    |             |
| 43    |             |
| 44    |             |
| 45    |             |
| 46    |             |
| 47    |             |
| 48    |             |
| 49    |             |
| 50    | 1E          |


## debut des vagues
- la premiere vague commence quand la premiere tour est posée
- une fleche rouge indique les spawns utilisés, des fléches vertes indiquent les sorties utilisés

# tours
| tour    | level | cout | vente | temps | portée | dégats       | speed | hit ground | hit air | crystals | crystal penality |
|---------|-------|------|-------|-------|--------|--------------|-------|------------|---------|----------|------------------|
| archery | 1     | 5    | 2     |       | 1      |              |       | 1          | 1       | 2        | 50               |
|         | 2     | 4    | 2     |       | 1      |              |       | 1          | 1       |          |                  |
|         | 3     | 4    | 2     |       | 1      |              |       | 1          | 1       |          |                  |
| cannon  | 1     | 20   | 10    |       | 2      |              |       | 1          | 0       |          |                  |
|         | 2     | 20   | 10    |       | 2      |              |       | 1          | 0       |          |                  |
|         | 3     | 20   | 10    |       | 2      |              |       | 1          | 0       |          |                  |
| ice     | 1     | 10   | 5     |       | 1      | 0 (50% slow) |       |            |         |          |                  |
|         | 2     | 8    | 5     |       | 1      | 0 (% slow)   |       |            |         |          |                  |
|         | 3     | 8    | 5     |       | 1      | 0 (% slow)   |       |            |         |          |                  |
| arbalet | 1     | 25   | 10    |       | 1      |              |       | 0          | 1       |          |                  |
|         | 2     | 20   | 10    |       | 1      |              |       | 0          | 1       |          |                  |
|         | 3     | 20   | 10    |       | 2      |              |       | 0          | 1       |          |                  |
| speed   | 1     | 50   |       |       |        | 0 (% boost)  |       | 0          | 0       |          |                  |

## construction
- montre la tour en transparence à l'endroit visé
- montre le cercle de portée de la tour
- ajoute un filtre rouge sur la position ne convients pas
- impossible de construire si cela bloque des unités

## amelioration
- lors de l'amelioration, la tour prend directement le skin du niveau suivant avec une transparence
- elle n'attaque pas
- un disque de chargement se rempli pour donner une idée de l'avancée de la construction

## selection
- la tour est selectionnée si on clique directement dessus
- on affiche la portée de la tour selectionnée via un disque plein (bleu clair) centré sur la tour
- voir image options de tour
