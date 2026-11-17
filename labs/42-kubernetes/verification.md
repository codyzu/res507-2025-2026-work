# Lab 42 – Kubernetes Deployment and Runtime Validation

## Environment
- k3s `v1.36.5+k3s1`, single node `devops-vm`, runtime `containerd://2.3.4-k3s1.36`
- Ubuntu 26.04.1 LTS, 2 CPU / 3.3 GiB RAM
- Namespace: `quote-lab`
- Image `docker.io/library/quote-app:local` built with Docker and imported into k3s containerd (86.4 MiB)

## 1. Health requests
```
# port-forward: kubectl port-forward svc/quote-app 8080:80
$ curl http://127.0.0.1:8080/health
{"ok":true}

# in-cluster, through Service DNS (busybox client Pod)
$ kubectl exec service-check -- wget -qO- http://quote-app/health
{"ok":true}
```
Port-forward reaches a single Pod; the in-cluster request validates DNS + Service selector + Ready endpoints.

## 2. Three Ready replicas (`replicas: 3` saved in deployment.yaml)
```
NAME                         READY   STATUS    RESTARTS
quote-app-69fbbcff49-djt6r   1/1     Running   0
quote-app-69fbbcff49-s9ds7   1/1     Running   0
quote-app-69fbbcff49-vlw8n   1/1     Running   0
```

## 3. Pod replacement (reconciliation)
- Deleted: `quote-app-69fbbcff49-nbcj7`
- Replacement: `quote-app-69fbbcff49-vlw8n`, same ReplicaSet hash, new name, became `1/1`
- The ReplicaSet saw 2/3 Pods and recreated one from the same template.

## 4. Deliberate readiness failure
Readiness probe path changed `/health` -> `/does-not-exist`:
```
NAME                         READY   STATUS    RESTARTS
quote-app-57b88c776b-bn82r   0/1     Running   0      <- new ReplicaSet, never Ready
quote-app-69fbbcff49-djt6r   1/1     Running   0      <- old replicas keep serving
quote-app-69fbbcff49-s9ds7   1/1     Running   0
quote-app-69fbbcff49-vlw8n   1/1     Running   0

Warning  Unhealthy  pod/quote-app-57b88c776b-bn82r
  Readiness probe failed: HTTP probe failed with statuscode: 404
```
`kubectl rollout status` timed out as expected: the rolling update added 1 new Pod
(maxSurge 25% -> 1) and kept all 3 old ones (maxUnavailable 25% -> 0).
The container was not restarted (RESTARTS 0).

## 5. Recovery
```
deployment "quote-app" successfully rolled out
NAME                   DESIRED   CURRENT   READY
quote-app-57b88c776b   0         0         0
quote-app-69fbbcff49   3         3         3
```

### Symptom / Cause / Fix
- **Symptom:** new Pod `Running` but `0/1` Ready, rollout stalled; the 3 old Pods kept serving `/health`.
- **Cause:** readiness probe path set to `/does-not-exist`; the app answers 404, so the kubelet marks the Pod not Ready and the Service excludes it from its endpoints.
- **Fix:** restored the readiness path to `/health`, which returns 200 `{"ok":true}`. The probe passes, the template matches the healthy ReplicaSet again, and the rollout completes with 3 Ready Pods. The probe was kept, not removed.

## 6. Extension – Lane B: liveness probe
**Change:** added a `livenessProbe` on `/health` (initialDelaySeconds 5, periodSeconds 5, failureThreshold 3).
With the healthy probe: 3 Pods `1/1`, `RESTARTS 0`.

**Verification:** liveness path changed to `/does-not-exist` (readiness kept on `/health`):
```
Warning  Unhealthy  Liveness probe failed: HTTP probe failed with statuscode: 404
Normal   Killing    Container quote-app failed liveness probe, will be restarted
```
Restart count increased on the same Pod name, then `CrashLoopBackOff` (growing back-off between restarts).
After restoring `/health`: new Pods `1/1`, `RESTARTS 0`, stable.

**Demonstrates:** liveness restarts the container after 3 consecutive failures; readiness only removes
the Pod from Service traffic. That is why the readiness failure in section 4 caused `0/1` with no restart.
The bad URL simulates a failed check, not a real application deadlock.

## What this evidence leaves untested
- `/health` does not query the database: quote retrieval and insertion are not validated (Lab 52).
- All replicas run on one VM: no protection against node failure.
- Port-forward targets one Pod; only the in-cluster request proves the Service path.
