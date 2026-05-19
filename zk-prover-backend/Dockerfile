FROM node:20-bookworm-slim

WORKDIR /app

# Backend service
COPY zk-prover-backend/package.json ./zk-prover-backend/package.json
WORKDIR /app/zk-prover-backend
RUN npm install --omit=dev

# EncryptedERC project and dependencies needed by hardhat script
WORKDIR /app
COPY EncryptedERC ./EncryptedERC
WORKDIR /app/EncryptedERC
RUN npm install

# Build circuits/artifacts once in image build
RUN npx hardhat compile
RUN npx hardhat zkit make --force
RUN npx hardhat zkit verifiers

# Return to backend runtime
WORKDIR /app/zk-prover-backend
COPY zk-prover-backend/server.mjs ./server.mjs
COPY zk-prover-backend/router.mjs ./router.mjs
COPY zk-prover-backend/zk-functions ./zk-functions

ENV ENCRYPTED_ERC_ROOT=/app/EncryptedERC
ENV PORT=8080
EXPOSE 8080

CMD ["npm", "start"]
