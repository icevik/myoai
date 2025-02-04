# build
sudo docker-compose up --build -d

# durdurma temizleme
sudo docker-compose down && sudo docker system prune -f && sudo docker-compose up --build -d

# tüm docker konteynerleri ni durdurur ve siler
sudo docker stop $(sudo docker ps -aq) && sudo docker rm $(sudo docker ps -aq)

# log
sudo docker logs -f frontend

# komple docker komutları
sudo docker-compose down && sudo docker system prune -af && sudo docker-compose up --build -d

sudo docker-compose down && sudo docker-compose up --build -d

# restart
sudo docker-compose restart backend && sudo docker-compose restart frontend

#ban temizleme
sudo docker exec -it chatbot-system_mongo_1 mongosh "mongodb://admin:password123@localhost:27017/chatbot?authSource=admin" --eval 'db.users.updateMany({}, {$set: {loginAttempts: 0, lockUntil: null}})'

# hesap kilidi kaldırma: 
sudo docker exec -it chatbot-system_mongo_1 mongosh "mongodb://admin:password123@localhost:27017/chatbot?authSource=admin" --eval 'db.users.updateOne({email: "admin@yeditepe.edu.tr"}, {$set: {loginAttempts: 0, lockUntil: null}})'

# kullanıcı silme
sudo docker exec -it chatbot-system_mongo_1 mongosh "mongodb://admin:password123@localhost:27017/chatbot?authSource=admin" --eval 'db.users.deleteOne({email: "admin15@yeditepe.edu.tr"})'


# kullanıcı ekleme
sudo docker exec -it chatbot-system_mongo_1 mongosh "mongodb://admin:password123@localhost:27017/chatbot?authSource=admin" --eval 'db.users.insertOne({name: "Admin2", email: "admin2@yeditepe.edu.tr", password: "$2a$12$K8HFqB6zYKr6w0TpQsj7/.Ym9K5L3U1BKW1j7UH0iQ7Ujh.TQNhHi", role: "admin", isApproved: true, loginAttempts: 0, lockUntil: null, createdAt: new Date(), updatedAt: new Date()})'

# kullnıcı oluşturma
curl -X POST http://localhost:5000/auth/register-admin -H "Content-Type: application/json" -d '{"username":"admin3", "password":"Admin123!", "name": "Admin User5", "email": "admin15@yeditepe.edu.tr"}'


curl -X POST http://localhost:5000/api/auth/register-admin -H "Content-Type: application/json" -d '{"username":"admin3", "password":"Admin123!", "name": "Admin User5", "email": "admin8@yeditepe.edu.tr"}'


# kullnıcı oluşturma 2
curl -X POST http://localhost:5000/api/auth/register-admin -H "Content-Type: application/json" -d '{"username":"admin9", "password":"Admin123!", "name": "Admin User5", "email": "admin@yeditepe.edu.tr"}'


# mondb veritabanı temizleme
sudo docker exec -it chatbot-system_mongo_1 mongosh --username admin --password password123 --authenticationDatabase admin

use chatbot; db.users.drop(); exit;
