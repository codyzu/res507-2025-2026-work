cat > verification.md << 'EOF'
# Lab 42 – Vérification

## Cœur du TP

- **Déploiement / Service** : Deployment `quote-app` (replicas: 3, readinessProbe /health:3000) et Service ClusterIP `quote-app` (port 80 → targetPort 3000), namespace `quote-lab`.
- **Health via port-forward** : `curl http://127.0.0.1:8080/health` → `{"ok":true}` (evidence-portforward.txt).
- **Health via le Service (in-cluster)** : `kubectl exec service-check -- wget -qO- http://quote-app/health` → `{"ok":true}`. Ce test passe par le DNS et le Service, contrairement au port-forward qui vise un seul pod.
- **Scaling** : `replicas: 3` dans le manifeste ; 3 pods `1/1 Running` (evidence-core.txt).
- **Réconciliation** : pod `quote-app-574875b8c-5b7rh` supprimé, remplacé par `quote-app-574875b8c-pz5x8` (nouveau nom), `1/1` Ready en 8 s. Le ReplicaSet recrée un pod pour revenir à 3.
- **Échec de readiness** : readinessProbe.path = `/does-not-exist`. Nouveau pod `quote-app-7ffd668dd4-hqzxq` en `0/1 Running`, RESTARTS 0 (le conteneur n'est pas redémarré). Event :
  `Readiness probe failed: HTTP probe failed with statuscode: 404`.
  EndpointSlice : `ready=false` pour le nouveau pod, `ready=true` pour les 3 anciens (evidence-readiness.txt).
  Le Service répond toujours `{"ok":true}` : les anciens pods restent servis pendant le rollout bloqué.
- **Récupération** : path remis à `/health`, rollout terminé, 3 pods `1/1`, RESTARTS 0, `/health` OK (evidence-readiness-recovery.txt).

### Symptôme / Cause / Correction

- **Symptôme** : le nouveau pod reste `0/1` Ready, le rollout est bloqué (timeout), mais le Service répond toujours.
- **Cause** : la readinessProbe pointait sur `/does-not-exist`, route inexistante (404). Le pod est considéré non prêt et exclu des endpoints du Service.
- **Correction** : readinessProbe.path remis à `/health` dans `deployment.yaml` puis `kubectl apply`. L'application répond 200 sur `/health`, la sonde passe, le pod devient Ready. La sonde a été conservée.

## Extension – Lane B : liveness probe

- **Manifeste** : `livenessProbe` httpGet `/health:3000`, periodSeconds 5, initialDelaySeconds 3 (même forme que la readiness).
- **Panne volontaire** : livenessProbe.path = `/does-not-exist`.
- **Preuve** : 3 pods en `0/1 CrashLoopBackOff`, RESTARTS = 43 (evidence-liveness.txt). Events :
  `Liveness probe failed: HTTP probe failed with statuscode: 404` puis
  `Container quote-app failed liveness probe, will be restarted`.
- **Logs (`--previous`)** : l'app répond 200 sur `/health` et 404 sur `/does-not-exist` ; le conteneur est tué environ 15 s après son démarrage (3 échecs × 5 s). Exit code 1 car `npm start` relaie le SIGTERM.
- **Restauration** : path remis à `/health`, rollout terminé, 3 pods `1/1`, RESTARTS 0, `/health` OK (evidence-recovery.txt).

## Readiness vs liveness

- **Readiness** : décide si le pod reçoit du trafic du Service. En cas d'échec, le pod est retiré des endpoints (0/1), mais le conteneur n'est PAS redémarré.
- **Liveness** : décide si le conteneur est encore « vivant ». En cas d'échec répété, le kubelet le tue et le redémarre (RESTARTS augmente, puis CrashLoopBackOff si cela se répète).
- Dans le cœur du TP, la readiness cassée a donné `0/1` sans redémarrage (RESTARTS 0) : seul le trafic était concerné. Avec la liveness cassée, les conteneurs sont tués et redémarrés en boucle.

## Ce que ça ne prouve pas

- `/health` ne vérifie pas la base de données : le baseline est « health-only », la persistance et les quotes ne sont pas validées.
- Un mauvais chemin simule une panne, pas un vrai deadlock applicatif.
- Un seul nœud : les 3 replicas ne protègent pas contre la perte de la VM.
EOF