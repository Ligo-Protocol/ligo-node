FROM --platform=linux/amd64 node:16

# Create app directory
WORKDIR /ligo-node

# Install app dependencies
COPY package.json yarn.lock tsconfig.json ./

RUN yarn install

# Bundle app source
COPY . .

EXPOSE 3000
EXPOSE 3001
ENTRYPOINT [ "yarn", "start" ]