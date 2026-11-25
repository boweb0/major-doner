FROM node:22-alpine
WORKDIR /app
COPY . .
ENV PORT=3000
EXPOSE 3000
# Kalıcı olması için bu iki klasörü volume olarak bağlayın
VOLUME ["/app/data", "/app/uploads"]
CMD ["node", "server.js"]
