### Run uppy-server on kuberenetes

You can use our docker container to run uppy-server on kubernetes with the following configuration.
```bash
kubectl create ns uppy
```
We will need a Redis container that we can get through [helm](https://github.com/kubernetes/helm)

```bash
 helm install --name redis \
  --namespace uppy \
  --set password=superSecretPassword \
    stable/redis
```

> uppy-server-env.yml
```yaml
apiVersion: v1
data:
  UPPY_ENDPOINTS: "localhost:3452,uppy.io"
  UPPYSERVER_DATADIR: "PATH/TO/DOWNLOAD/DIRECTORY"
  UPPYSERVER_DOMAIN: "YOUR SERVER DOMAIN"
  UPPYSERVER_DOMAINS: "sub1.domain.com,sub2.domain.com,sub3.domain.com"
  UPPYSERVER_PROTOCOL: "YOUR SERVER PROTOCOL"
  UPPYSERVER_REDIS_URL: redis://:superSecretPassword@uppy-redis.uppy.svc.cluster.local:6379
  UPPYSERVER_SECRET: "shh!Issa Secret!"
  UPPYSERVER_DROPBOX_KEY: "YOUR DROPBOX KEY"
  UPPYSERVER_DROPBOX_SECRET: "YOUR DROPBOX SECRET"
  UPPYSERVER_GOOGLE_KEY: "YOUR GOOGLE KEY"
  UPPYSERVER_GOOGLE_SECRET: "YOUR GOOGLE SECRET"
  UPPYSERVER_INSTAGRAM_KEY: "YOUR INSTAGRAM KEY"
  UPPYSERVER_INSTAGRAM_SECRET: "YOUR INSTAGRAM SECRET"
  UPPYSERVER_AWS_KEY: "YOUR AWS KEY"
  UPPYSERVER_AWS_SECRET: "YOUR AWS SECRET"
  UPPYSERVER_AWS_BUCKET: "YOUR AWS S3 BUCKET"
  UPPYSERVER_AWS_REGION: "AWS REGION"
  UPPYSERVER_OAUTH_DOMAIN: "sub.domain.com"
  UPPYSERVER_UPLOAD_URLS: "http://master.tus.io/files/,https://master.tus.io/files/"
kind: Secret
metadata:
  name: uppy-server-env
  namespace: uppy
type: Opaque
```

> uppy-server-deployment.yml
```yaml
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  name: uppy-server
  namespace: uppy
spec:
  replicas: 2
  minReadySeconds: 5
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 2
      maxUnavailable: 1
  template:
    metadata:
      labels:
        app: uppy-server
    spec:
      containers:
      - image: docker.io/transloadit/uppy-server:latest
        imagePullPolicy: ifNotPresent
        name: uppy-server        
        resources:
          limits:
            memory: 150Mi
          requests:
            memory: 100Mi
        envFrom:
        - secretRef:
            name: uppy-server-env
        ports:
        - containerPort: 3020
        volumeMounts:
        - name: uppy-server-data
          mountPath: /mnt/uppy-server-data
      volumes:
      - name: uppy-server-data
        emptyDir: {}
```

`kubectl apply -f uppy-server-deployment.yml`

> uppy-server-service.yml

```yaml
apiVersion: v1
kind: Service
metadata:
  name: uppy-server
  namespace: uppy
spec:
  ports:
  - port: 80
    targetPort: 3020
    protocol: TCP
  selector:
    app: uppy-server
```

`kubectl apply -f uppy-server-service.yml`

## Logging

You can check the production logs for the production pod using: 

```bash
kubectl logs my-pod-name 
```
