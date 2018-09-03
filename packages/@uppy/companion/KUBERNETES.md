### Run companion on kuberenetes

You can use our docker container to run companion on kubernetes with the following configuration.
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

> companion-env.yml
```yaml
apiVersion: v1
data:
  COMPANION_CLIENT_ORIGINS: "localhost:3452,uppy.io"
  COMPANION_DATADIR: "PATH/TO/DOWNLOAD/DIRECTORY"
  COMPANION_DOMAIN: "YOUR SERVER DOMAIN"
  COMPANION_DOMAINS: "sub1.domain.com,sub2.domain.com,sub3.domain.com"
  COMPANION_PROTOCOL: "YOUR SERVER PROTOCOL"
  COMPANION_REDIS_URL: redis://:superSecretPassword@uppy-redis.uppy.svc.cluster.local:6379
  COMPANION_SECRET: "shh!Issa Secret!"
  COMPANION_DROPBOX_KEY: "YOUR DROPBOX KEY"
  COMPANION_DROPBOX_SECRET: "YOUR DROPBOX SECRET"
  COMPANION_GOOGLE_KEY: "YOUR GOOGLE KEY"
  COMPANION_GOOGLE_SECRET: "YOUR GOOGLE SECRET"
  COMPANION_INSTAGRAM_KEY: "YOUR INSTAGRAM KEY"
  COMPANION_INSTAGRAM_SECRET: "YOUR INSTAGRAM SECRET"
  COMPANION_AWS_KEY: "YOUR AWS KEY"
  COMPANION_AWS_SECRET: "YOUR AWS SECRET"
  COMPANION_AWS_BUCKET: "YOUR AWS S3 BUCKET"
  COMPANION_AWS_REGION: "AWS REGION"
  COMPANION_OAUTH_DOMAIN: "sub.domain.com"
  COMPANION_UPLOAD_URLS: "http://master.tus.io/files/,https://master.tus.io/files/"
kind: Secret
metadata:
  name: companion-env
  namespace: uppy
type: Opaque
```

> companion-deployment.yml
```yaml
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  name: companion
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
        app: companion
    spec:
      containers:
      - image: docker.io/transloadit/companion:latest
        imagePullPolicy: ifNotPresent
        name: companion        
        resources:
          limits:
            memory: 150Mi
          requests:
            memory: 100Mi
        envFrom:
        - secretRef:
            name: companion-env
        ports:
        - containerPort: 3020
        volumeMounts:
        - name: companion-data
          mountPath: /mnt/companion-data
      volumes:
      - name: companion-data
        emptyDir: {}
```

`kubectl apply -f companion-deployment.yml`

> companion-service.yml

```yaml
apiVersion: v1
kind: Service
metadata:
  name: companion
  namespace: uppy
spec:
  ports:
  - port: 80
    targetPort: 3020
    protocol: TCP
  selector:
    app: companion
```

`kubectl apply -f companion-service.yml`

## Logging

You can check the production logs for the production pod using: 

```bash
kubectl logs my-pod-name 
```
