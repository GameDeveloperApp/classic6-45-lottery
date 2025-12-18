// api/index.js - простейший тестовый файл
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({ 
    message: 'Lottery API работает!',
    status: 'success',
    timestamp: new Date().toISOString()
  });
}
