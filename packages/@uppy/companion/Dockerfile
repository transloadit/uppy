FROM node:8.11.4-alpine

COPY package.json /app/package.json

WORKDIR /app

# Install node_modules
# * to optionally copy lock files that _might_ _not_ exist
ADD package.json package-*.json yarn.* /tmp/
RUN cd /tmp && apk --update add  --virtual native-dep \
  make gcc g++ python libgcc libstdc++ git && \
  npm install && \
  npm ls && \
  apk del native-dep
RUN mkdir -p /app && cd /app && ln -nfs /tmp/node_modules
RUN apk add bash
COPY . /app
ENV PATH "${PATH}:/app/node_modules/.bin"
RUN npm run build
CMD ["node","/app/bin/companion"]
# This can be overruled later
EXPOSE 3020
