FROM node:22.18.0-alpine AS build

# Create link to node on amd64 so that corepack can find it
RUN if [ "$(uname -m)" == "aarch64" ]; then mkdir -p /usr/local/sbin/ && ln -s /usr/local/bin/node /usr/local/sbin/node; fi

WORKDIR /app

COPY . /app/

RUN apk --update add  --virtual native-dep \
  make gcc g++ python3 libgcc libstdc++ git && \
  (cd /app && corepack yarn workspaces focus @uppy/companion) && \
  apk del native-dep

RUN cd /app && corepack yarn workspace @uppy/companion build

# Now remove all non-prod dependencies for a leaner image
RUN cd /app && corepack yarn workspaces focus @uppy/companion --production

FROM node:22.18.0-alpine

WORKDIR /app

# copy required files from build stage.
COPY --from=build /app/packages/@uppy/companion/bin /app/bin
COPY --from=build /app/packages/@uppy/companion/lib /app/lib
COPY --from=build /app/packages/@uppy/companion/package.json /app/package.json
COPY --from=build /app/packages/@uppy/companion/node_modules /app/node_modules

ENV PATH "${PATH}:/app/node_modules/.bin"

CMD ["node","/app/bin/companion"]
# This can be overruled later
EXPOSE 3020
