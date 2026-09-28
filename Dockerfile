FROM node:26.10.0-alpine AS build

# Create link to node on amd64 so that corepack can find it
RUN if [ "$(uname -m)" = 'aarch64' ]; then mkdir -p /usr/local/sbin/ && ln -s /usr/local/bin/node /usr/local/sbin/node; fi

RUN apk add --no-cache --virtual .build-deps build-base python3 libgcc libstdc++ git

RUN npm install --global corepack@latest
RUN corepack enable

COPY . /app/

WORKDIR /app

# Install only build-time dependencies using a named virtual package.
RUN corepack yarn workspaces focus @uppy/companion
RUN corepack yarn workspace @uppy/companion build

# Now remove all non-prod dependencies for a leaner image
RUN corepack yarn workspaces focus @uppy/companion --production

FROM node:26.10.0-alpine

WORKDIR /app

# copy required files from build stage.
COPY --from=build /app/packages/@uppy/companion/dist /app/dist
COPY --from=build /app/packages/@uppy/companion/package.json /app/package.json
COPY --from=build /app/packages/@uppy/companion/node_modules /app/node_modules

ENV PATH="${PATH}:/app/node_modules/.bin"

CMD ["node","/app/dist/bin/companion.js"]
# This can be overruled later
EXPOSE 3020
USER node
