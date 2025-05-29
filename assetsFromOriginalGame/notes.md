- montrer une grille blanche uniquement pendant le placement d'une tour
- montrer l'écran de selection des tours au tout debut de la partie
- les ennemis apparaissent sur le chemin dans la map, au centre de la case
- les ennemis disparaissent des qu'ils sont sur la case finale 
- mode accéléré = vitesse x 2
- quand on tue, l'argent généré apparait en petit niveau du cadavre et monte pendant 1 seconde

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
- footman takes <= 2 hits from archery 1 in wave [1;7]
- footman takes > 2 hits from archery 1 in wave [8;[
- heavy takes > 3 hits from archery 1 in wave [5;9[

# vagues
| vague | composition | time in empireDefense1to50.mp4 |
|-------|-------------|--------------------------------|
| 1     | 1S          | 1:35                           |
| 2     | 3S          | 1:40                           |
| 3     | 4S          | 1:50                           |
| 4     | 5S          |                                |
| 5     | 1F 5S       | 2:16                           |
| 6     | 8S          | 2:30                           |
| 7     | 10S         | 2:50                           |
| 8     | 12S         | 3:05                           |
| 9     | 5F          | 3:30                           |
| 10    | 6S 3F 10S   | 3:50                           |
| 11    | 5F          | 4:15                           |
| 12    | 2C          | 4:40                           |
| 13    | 8F          | 5:00                           |
| 14    | 10F         | 5:25                           |
| 15    | 17S 2C 5F   | 6:00                           |
| 16    | 4C          | 6:52                           |
| 17    | 10F         | 7:25                           |
| 18    | 20S         | 7:48                           |
| 19    | 1K          |                                |
| 20    | 2K 10S      | 8:11                           |
| 21    | 25S         | 8:20                           |
| 22    | 20F         |                                |
| 23    | 1B          | 9:00                           |
| 24    | 6C          | 9:30                           |
| 25    | 25S         | 9:50                           |
| 26    | 20F         | 10:05                          |
| 27    | 5K          | 10:30                          |
| 28    | 8C          |                                |
| 29    | 2H          | 10:50                          |
| 30    | 1Y          | 10:55                          |
| 31    | 1B 4F       | 11:05                          |
| 32    | 5K          | 11:35                          |
|       |             |                                |
|       |             |                                |
|       |             |                                |
|       |             |                                |
|       |             |                                |
|       | 3Y 2K       |                                |
|       |             |                                |
|       |             |                                |
|       |             |                                |
|       |             |                                |
|       |             |                                |
|       |             |                                |
|       |             |                                |
|       |             |                                |
|       |             |                                |
|       |             |                                | 
|       | 1E          |                                |


## debut des vagues
- la premiere vague commence quand la premiere tour est posée
- une fleche rouge indique les spawns utilisés, des fléches vertes indiquent les sorties utilisés
- clignotement des fleches pendant 5 secondes puis spawn

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
  - tour verte
- montre le cercle de portée de la tour
  - cercle blanc
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
