const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DB_FILE = path.join(__dirname, 'attendance.json');

app.use(cors());
app.use(express.json({ limit: '10mb' }));

function readDb() {
  if (!fs.existsSync(DB_FILE)) {
    return { employees: [], attendance: [] };
  }
  const data = fs.readFileSync(DB_FILE, 'utf-8');
  return JSON.parse(data);
}

function writeDb(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function initDb() {
  const data = readDb();
  if (data.employees.length === 0) {
    data.employees = [
      { id: 1, name: '张三', department: '技术部' },
      { id: 2, name: '李四', department: '市场部' },
      { id: 3, name: '王五', department: '人事部' }
    ];
    writeDb(data);
    console.log('初始化员工数据已创建');
  }
  console.log('数据库文件路径:', DB_FILE);
}

app.post('/api/attendance', (req, res) => {
  try {
    const formData = req.body;
    const data = readDb();

    const record = {
      id: Date.now(),
      year: formData.year,
      month: formData.month,
      day: formData.day,
      weekday: formData.weekday,
      period: formData.period,
      checker: formData.checker,
      leaveVerified: formData.leaveVerified,
      records: formData.records || [],
      submittedAt: new Date().toISOString()
    };

    data.attendance.push(record);
    writeDb(data);

    res.json({ success: true, message: '考勤记录已保存', data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误', error: error.message });
  }
});

app.get('/api/attendance', (req, res) => {
  try {
    const data = readDb();
    const { date, employeeId } = req.query;

    let result = data.attendance;
    if (date) {
      result = result.filter(r => r.date === date);
    }
    if (employeeId) {
      result = result.filter(r => r.employeeId === parseInt(employeeId));
    }

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误', error: error.message });
  }
});

app.get('/api/employees', (req, res) => {
  try {
    const data = readDb();
    res.json({ success: true, data: data.employees });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误', error: error.message });
  }
});

app.get('/api/stats', (req, res) => {
  try {
    const data = readDb();
    const today = new Date().toISOString().split('T')[0];

    const todayRecords = data.attendance.filter(r => r.date === today);
    const totalEmployees = data.employees.length;
    const presentCount = todayRecords.length;
    const absentCount = totalEmployees - presentCount;

    res.json({
      success: true,
      data: {
        totalEmployees,
        presentCount,
        absentCount,
        todayRecords
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误', error: error.message });
  }
});

initDb();

app.listen(PORT, () => {
  console.log(`考勤服务已启动，监听端口: ${PORT}`);
  console.log(`数据库文件: ${DB_FILE}`);
});