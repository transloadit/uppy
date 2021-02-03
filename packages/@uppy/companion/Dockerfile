FROM node:14.15.3-alpine as build

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

FROM node:14.15.3-alpine

RUN mkdir -p /app
WORKDIR /app

# copy required files from build stage.
COPY --from=build /app/bin /app/bin
COPY --from=build /app/lib /app/lib
COPY --from=build /app/package.json /app/package.json
COPY --from=build /tmp/node_modules /app/node_modules

ENV PATH "${PATH}:/app/node_modules/.bin"

CMD ["node","/app/bin/companion"]
# This can be overruled later
EXPOSE 3020
