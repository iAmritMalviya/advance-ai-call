FROM node:20.12.0-alpine3.19

WORKDIR /usr/src/app

COPY package.json package-lock.json tsconfig.json ./

RUN npm install

RUN cd packages/db && npx prisma generate && cd ../..

RUN npm run build

CMD ["npm", "start"]