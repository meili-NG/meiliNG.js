FROM node:14-alpine
EXPOSE 3000

WORKDIR /app
COPY . /app
COPY config.env.js config.js
RUN apk add --update --no-cache \
  python3 gcc make g++ zlib-dev \
  libtool autoconf automake && \
  yarn && yarn build && \
  yarn --prod=true && \
  rm -rf src

CMD yarn start