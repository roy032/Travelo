# Builds the client and serves it from the API server on one origin,
# so the SameSite=strict auth cookie works without cross-site setup.

FROM node:22-slim AS client
WORKDIR /app/client
COPY client/package.json client/package-lock.json ./
RUN npm ci
COPY client/ ./
# Empty API URL: the client calls the API on its own origin
ENV VITE_API_URL=""
# Optional browser error tracking; passed as a build arg (Render does this
# automatically for environment variables with the same name)
ARG VITE_SENTRY_DSN=""
ENV VITE_SENTRY_DSN=$VITE_SENTRY_DSN
# Shown in the footer and on the privacy and terms pages
ARG VITE_SUPPORT_EMAIL=""
ENV VITE_SUPPORT_EMAIL=$VITE_SUPPORT_EMAIL
ARG VITE_OPERATOR_NAME=""
ENV VITE_OPERATOR_NAME=$VITE_OPERATOR_NAME
RUN npm run build

FROM node:22-slim
WORKDIR /app/server
ENV NODE_ENV=production
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev
COPY server/ ./
COPY --from=client /app/client/dist /app/client/dist
ENV CLIENT_DIST=/app/client/dist
EXPOSE 3000
USER node
CMD ["node", "--import", "./src/instrument.js", "src/index.js"]
