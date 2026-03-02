import jwt from 'jsonwebtoken';

const token = jwt.sign({ id: 1, role: 'super_admin' }, process.env.JWT_SECRET || 'your-secret-key');

fetch('http://localhost:3000/api/admin/users?page=1&size=20&status=', {
  headers: { Authorization: `Bearer ${token}` }
})
.then(res => res.json())
.then(console.log)
.catch(console.error);
