FROM node:14

ENV NODE_ENV=production
WORKDIR /appf
COPY ["package.json", "yarn.lock", "./"]
# RUN npm install --production
RUN yarn
RUN yarn add --dev typescript
RUN yarn add graphql-tag
COPY . .
RUN yarn build
EXPOSE 3000
CMD ["yarn", "start"]
