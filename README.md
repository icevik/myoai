Kurulum
sudo apt install npm -y && curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh && sudo usermod -aG docker $USER && newgrp docker

# Docker Build ve Çalıştırma
sudo docker-compose up --build -d  # Konteynerleri oluşturur ve arka planda çalıştırır

# Docker Temizlik ve Yeniden Build
sudo docker-compose down && sudo docker system prune -f && sudo docker-compose up --build -d  # Konteynerleri durdurur, gereksiz dosyaları temizler ve yeniden build eder

# Tüm Docker Konteynerlerini Durdurma ve Silme
sudo docker stop $(sudo docker ps -aq) && sudo docker rm $(sudo docker ps -aq)

# Frontend Log İzleme
sudo docker logs -f frontend  # Frontend konteynerinin loglarını canlı olarak gösterir

# Tam Docker Temizlik ve Yeniden Build
sudo docker-compose down && sudo docker system prune -af && sudo docker-compose up --build -d  # Tüm konteynerleri ve imajları temizler, yeniden build eder

# Hızlı Yeniden Build
sudo docker-compose down && sudo docker-compose up --build -d

# Backend ve Frontend Yeniden Başlatma
sudo docker-compose restart backend && sudo docker-compose restart frontend

# MongoDB İşlemleri

## Tüm Kullanıcıların Ban Durumunu Temizleme
sudo docker exec -it chatbot-system_mongo_1 mongosh "mongodb://admin:password123@localhost:27017/chatbot?authSource=admin" \
--eval 'db.users.updateMany({}, {$set: {loginAttempts: 0, lockUntil: null}})'

## Belirli Bir Kullanıcının Hesap Kilidini Kaldırma
sudo docker exec -it chatbot-system_mongo_1 mongosh "mongodb://admin:password123@localhost:27017/chatbot?authSource=admin" \
--eval 'db.users.updateOne({email: "admin@yeditepe.edu.tr"}, {$set: {loginAttempts: 0, lockUntil: null}})'

## Kullanıcı Silme
sudo docker exec -it chatbot-system_mongo_1 mongosh "mongodb://admin:password123@localhost:27017/chatbot?authSource=admin" \
--eval 'db.users.deleteOne({email: "admin15@yeditepe.edu.tr"})'

## MongoDB Üzerinden Kullanıcı Ekleme
sudo docker exec -it chatbot-system_mongo_1 mongosh "mongodb://admin:password123@localhost:27017/chatbot?authSource=admin" \
--eval 'db.users.insertOne({
    name: "Admin2", 
    email: "admin2@yeditepe.edu.tr", 
    password: "$2a$12$K8HFqB6zYKr6w0TpQsj7/.Ym9K5L3U1BKW1j7UH0iQ7Ujh.TQNhHi", 
    role: "admin", 
    isApproved: true, 
    loginAttempts: 0, 
    lockUntil: null, 
    createdAt: new Date(), 
    updatedAt: new Date()
})'

# API Üzerinden Kullanıcı Oluşturma
## Metod 1
curl -X POST http://localhost:5000/auth/register-admin \
-H "Content-Type: application/json" \
-d '{"username":"admin3", "password":"Admin123!", "name": "Admin User5", "email": "admin15@yeditepe.edu.tr"}'

## Metod 2
curl -X POST http://localhost:5000/api/auth/register-admin \
-H "Content-Type: application/json" \
-d '{"username":"admin3", "password":"Admin123!", "name": "Admin User5", "email": "admin8@yeditepe.edu.tr"}'

## Metod 3
curl -X POST http://localhost:5000/api/auth/register-admin \
-H "Content-Type: application/json" \
-d '{"username":"admin9", "password":"Admin123!", "name": "Admin User5", "email": "admin@yeditepe.edu.tr"}'

# MongoDB Veritabanı Temizleme
sudo docker exec -it chatbot-system_mongo_1 mongosh --username admin --password password123 --authenticationDatabase admin
use chatbot; db.users.drop(); exit;

# MongoDB Veritabanı İçeriğini Görüntüleme
sudo docker exec -it chatbot-system_mongo_1 mongosh --username admin --password password123 --authenticationDatabase admin
use chatbot; db.users.find(); exit;


