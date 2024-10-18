FROM node:20-alpine
WORKDIR /usr/src/app

COPY package.json package-lock.json ./

RUN npm i

COPY . .

# ENV NODE_ENV production

CMD [ "npm", "run", "dev"]
# USER node