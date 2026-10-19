## Extension – Lane B : liveness probe

- Manifest : `livenessProbe` httpGet /health:3000, periodSeconds 5 (même forme que la readiness).
- Panne volontaire : livenessProbe.path = /does-not-exist.
- Preuve : RESTARTS passé de 0 à N (sortie de `kubectl get pods`),
  event « Liveness probe failed: HTTP probe failed with statuscode: 404 »
  puis « Container quote-app failed liveness probe, will be restarted ».
- Restauration : path remis à /health, rollout terminé, 3 pods 1/1 Ready.

## Explication : readiness vs liveness

- Readiness : décide si le pod reçoit du trafic du Service. En cas d'échec, le pod est retiré des endpoints (0/1), mais le conteneur n'est PAS redémarré.
- Liveness : décide si le conteneur est encore « vivant ». En cas d'échec répété, kubelet tue et redémarre le conteneur (RESTARTS augmente).
- Dans le cœur du TP, la readiness cassée a donné 0/1 sans redémarrage, car seul le trafic était concerné. Ici la liveness cassée provoque des redémarrages.
- Limite : un mauvais chemin simule une panne, ce n'est pas un vrai deadlock applicatif.