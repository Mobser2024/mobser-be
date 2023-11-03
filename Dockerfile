FROM node:16 as development

WORKDIR /app
COPY package.json .
RUN npm install 
RUN npm install pm2 -g
COPY . .
EXPOSE 3000
CMD ["npm","start"]

FROM node:16 as production

WORKDIR /app
COPY package.json .
RUN npm install --only=production
RUN npm install pm2 -g
COPY . .
EXPOSE 3000
CMD ["npm","run","start:prod"]