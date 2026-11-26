# Lab 52 – Architecture notes

Lab 42 results (health paths, 3 replicas, Pod replacement, readiness failure/recovery):
[../42-kubernetes/verification.md](../42-kubernetes/verification.md)

## Diagram of the current setup

Nested boxes = "runs inside" (containment). Solid arrows = request traffic.
Dashed arrows = configuration / storage references.

```mermaid
flowchart TB
  subgraph HW["Host hardware – university PC (Windows)"]
    USER["Terminal / curl (laptop reaches VM over SSH, port 2222)"]
    subgraph HV["Hypervisor – VirtualBox (NAT)"]
      subgraph VM["Ubuntu 26.04 VM = single Kubernetes node (one guest Linux kernel)"]
        subgraph K3S["k3s v1.36.5 – namespace quote-lab"]
          PF["kubectl port-forward 8080 -> svc/quote-app (temporary, selects ONE Pod)"]
          CHK["Pod service-check (busybox) – in-cluster client"]
          SVCAPP["Service quote-app ClusterIP :80"]
          subgraph DEPAPP["Deployment quote-app (3 replicas)"]
            A1["Pod -> container quote-app :3000"]
            A2["Pod -> container quote-app :3000"]
            A3["Pod -> container quote-app :3000"]
          end
          SVCDB["Service quote-db ClusterIP :5432"]
          subgraph DEPDB["Deployment quote-db (1 replica, Recreate)"]
            DB["Pod -> container postgres:18 :5432"]
          end
          SEC[("Secret quote-db-secret")]
          CM[("ConfigMap quote-db-init (init.sql)")]
          PVC[("PVC quote-db-data 1Gi, local-path")]
        end
        DISK[("VM disk: /var/lib/rancher/k3s/storage/pvc-50f5e2f0...")]
      end
    end
  end

  USER -->|HTTP 127.0.0.1:8080| PF
  PF -->|direct to one Pod| A1
  CHK -->|DNS quote-app -> Service| SVCAPP
  SVCAPP -->|load-balances to Ready Pods| A1 & A2 & A3
  A1 & A2 & A3 -->|DATABASE_URL -> quote-db:5432| SVCDB
  SVCDB --> DB
  SEC -.->|DATABASE_URL| DEPAPP
  SEC -.->|POSTGRES_USER / PASSWORD / DB| DB
  CM -.->|/docker-entrypoint-initdb.d| DB
  DB -.->|/var/lib/postgresql| PVC
  PVC -.->|local-path folder| DISK
```

## Database checks

| Check | Result |
|---|---|
| PVC | `quote-db-data` **Bound**, 1Gi, RWO, `local-path` |
| DB Pod before | `quote-db-796c9c9d49-79d4h` 1/1 Ready |
| Quote inserted via app | marker `res509-1794906420` returned by `GET /` |
| Replacement | `kubectl rollout restart deployment/quote-db` |
| DB Pod after | `quote-db-586ccdcb8c-lqmz9` 1/1 Ready (new Pod, same PVC) |
| Quote after replacement | `res509-1794906420` still returned by `GET /` |

```
# before
quote-db-796c9c9d49-79d4h   1/1   Running
    <div>res509-1794906420</div>
# after
quote-db-586ccdcb8c-lqmz9   1/1   Running
    <div>res509-1794906420</div>
quote-db-data   Bound   pvc-50f5e2f0-ad63-449e-89d3-0648fa968696   1Gi   RWO   local-path
```

Credentials live only in the Secret `quote-db-secret`; manifests reference it
(`envFrom.secretRef` for PostgreSQL, `secretKeyRef` for the app). No Secret export is committed.

## Boundary notes

- **Shared kernel:** the app containers and the PostgreSQL container are processes isolated by
  namespaces and cgroups, but they all run on the Ubuntu VM's single guest kernel. The hypervisor
  (VirtualBox) provides the VM boundary; Kubernetes only manages workloads inside that VM.
- **Persistence boundary:** app Pods are disposable because they hold no state. The quote survived the
  database Pod replacement because the data lives on the PVC, not in the container. But the PVC is a
  `local-path` folder on this one VM's disk, so three app replicas plus this storage give no recovery
  from VM or disk loss; that would need backups and multi-node or replicated storage.

## Main limitation / next action

- Single node and single database instance: replacing the DB Pod causes a short outage (Recreate), and
  losing the VM or its disk loses all data. Next action: add a database backup (e.g. a scheduled
  `pg_dump` stored outside the VM) and discuss multi-node storage in Lab 62.
- Environment note: the university network blocks `get.k3s.io` and Docker Hub, so k3s was installed in
  airgap mode from GitHub release assets (checksums verified), and base images were pulled from
  `public.ecr.aws/docker/library`.
