FROM node:14.15.4
RUN mkdir -p /usr/code
WORKDIR /usr/code
COPY . .
RUN rm -rf node_modules
RUN yarn
RUN yarn build
EXPOSE 4000
CMD ["yarn", "start"]