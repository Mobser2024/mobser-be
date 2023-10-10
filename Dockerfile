FROM node:16 as development

WORKDIR /app
COPY package.json .
RUN npm install 
COPY . .
EXPOSE 8000
CMD ["npm","start"]

FROM node:16 as production

WORKDIR /app
COPY package.json .
RUN npm install --only=production
COPY . .
EXPOSE 8000
CMD ["npm","run","start:prod"]