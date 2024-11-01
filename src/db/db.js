import mysql from 'mysql2/promise';

export async function connectToDatabase() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });
        console.log('MariaDB에 성공적으로 연결되었습니다.');
        return connection;
    } catch (error) {
        console.error('MariaDB 연결 실패:', error);
        throw error;
    }
}
