# Notes d'Architecture - Lab 52

## 1. Schéma de l'architecture actuelle

[ Navigateur Web ]
       | 
       | (Port-forward / Service ClusterIP)
       v
+---------------------------------------------------------+
|                Machine Virtuelle (Ubuntu)               |
|                                                         |
|  [ Déploiement Quote-App ]                              |
|  (3 Pods / Replicas)                                    |
|          |                                              |
|          | (DATABASE_URL / Secret)                      |
|          v                                              |
|  [ Déploiement Quote-DB ]                               |
|  (1 Pod PostgreSQL)                                     |
|          |                                              |
|          | (VolumeMount)                                |
|          v                                              |
|  [ Stockage Persistant (PVC : quote-db-data) ]          |
|  (Dossier physique géré via local-path)                 |
+---------------------------------------------------------+

2. Noyau partagé (Shared kernel)
Tous nos conteneurs (les instances de notre application web et le pod PostgreSQL) tournent sur la même machine virtuelle. Ils partagent donc tous le même noyau Linux (celui de notre VM Ubuntu) pour interagir avec les ressources matérielles (CPU, mémoire, disque).

3. Limite de persistance (Persistence boundary)
Grâce au PersistentVolumeClaim (PVC), les données de la base survivent si le pod PostgreSQL plante ou est supprimé (test validé avec succès).
Cependant, la limite de cette persistance réside dans le StorageClass utilisé : local-path. Le volume étant physiquement stocké sur le disque de la machine virtuelle locale, si la VM entière est détruite, toutes les données de la base sont définitivement perdues.

4. Prochaine limitation / Tâche non résolue
La base de données représente actuellement un SPOF (Single Point of Failure). Alors que notre application web a 3 réplicas pour la haute disponibilité, PostgreSQL n'en a qu'un seul. En cas de crash du nœud ou du pod de la base de données, l'application subit une coupure de service (erreur 500) le temps que Kubernetes redémarre le pod.