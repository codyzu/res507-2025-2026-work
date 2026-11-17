tetras@devops-vm:~/res507-2025-2026-work/labs/42-kubernetes$ kubectl describe pod quote-app-c85d74c4-9wjvm
Name:             quote-app-c85d74c4-9wjvm
Namespace:        quote-lab
Priority:         0
Service Account:  default
Node:             devops-vm/10.0.2.15
Start Time:       Mon, 19 Oct 2026 08:28:15 +0000
Labels:           app=quote-app
                  pod-template-hash=c85d74c4
Annotations:      <none>
Status:           Running
IP:               10.42.0.21
IPs:
  IP:           10.42.0.21
Controlled By:  ReplicaSet/quote-app-c85d74c4
Containers:
  quote-app:
    Container ID:   containerd://3fd34f8f7ac3bc7f988ef70be447ba6659481c9c3a9c20254c76b682aba2cef5
    Image:          quote-app:local
    Image ID:       sha256:e03d70d6f901b0f4dadb1f1cd97cb2d274af05a86e4c650c33dca25758af247e
    Port:           3000/TCP
    Host Port:      0/TCP
    State:          Waiting
      Reason:       CrashLoopBackOff
    Last State:     Terminated
      Reason:       Error
      Exit Code:    1
      Started:      Mon, 19 Oct 2026 08:30:16 +0000
      Finished:     Mon, 19 Oct 2026 08:30:46 +0000
    Ready:          False
    Restart Count:  4
    Liveness:       http-get http://:3000/does-not-exist delay=5s timeout=1s period=10s #success=1 #failure=3
    Readiness:      http-get http://:3000/health delay=3s timeout=1s period=5s #success=1 #failure=3
    Environment:    <none>
    Mounts:
      /var/run/secrets/kubernetes.io/serviceaccount from kube-api-access-r8qz5 (ro)
Conditions:
  Type                        Status
  PodReadyToStartContainers   True 
  Initialized                 True 
  Ready                       False 
  ContainersReady             False 
  PodScheduled                True 
Volumes:
  kube-api-access-r8qz5:
    Type:                    Projected (a volume that contains injected data from multiple sources)
    TokenExpirationSeconds:  3607
    ConfigMapName:           kube-root-ca.crt
    Optional:                false
    DownwardAPI:             true
QoS Class:                   BestEffort
Node-Selectors:              <none>
Tolerations:                 node.kubernetes.io/not-ready:NoExecute op=Exists for 300s
                             node.kubernetes.io/unreachable:NoExecute op=Exists for 300s
Events:
  Type     Reason     Age                  From               Message
  ----     ------     ----                 ----               -------
  Normal   Scheduled  2m35s                default-scheduler  Successfully assigned quote-lab/quote-app-c85d74c4-9wjvm to devops-vm
  Normal   Pulled     34s (x5 over 2m34s)  kubelet            spec.containers{quote-app}: Container image "quote-app:local" already present on machine and can be accessed by the pod
  Normal   Created    34s (x5 over 2m34s)  kubelet            spec.containers{quote-app}: Container created
  Normal   Started    34s (x5 over 2m34s)  kubelet            spec.containers{quote-app}: Container started
  Warning  Unhealthy  5s (x15 over 2m25s)  kubelet            spec.containers{quote-app}: Liveness probe failed: HTTP probe failed with statuscode: 404
  Normal   Killing    5s (x5 over 2m5s)    kubelet            spec.containers{quote-app}: Container quote-app failed liveness probe, will be restarted
  Warning  Unhealthy  4s (x2 over 94s)     kubelet            spec.containers{quote-app}: Readiness probe failed: Get "http://10.42.0.21:3000/health": dial tcp 10.42.0.21:3000: connect: connection refused
  Warning  BackOff    3s (x2 over 4s)      kubelet            spec.containers{quote-app}: Back-off restarting failed container quote-app in pod quote-app-c85d74c4-9wjvm_quote-lab(56591cbc-ba45-4fe5-89de-c78a57286b70)