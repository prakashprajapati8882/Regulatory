FROM node:16-stretch

# Create app directory
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
COPY  ".env" .
EXPOSE 443 80
CMD ["node", "index.js"]