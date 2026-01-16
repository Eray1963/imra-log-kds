const db = require('../db/mysql_connect');

const getEfficiency = async (req, res) => {
  try {
    const employeeId = req.params.id;
    const { date, from, to } = req.query;
    let sql = 'SELECT SUM(tasks_completed) AS tasks, SUM(work_minutes) AS minutes FROM work_logs WHERE employee_id = ?';
    const params = [employeeId];
    if (date) {
      sql += ' AND date = ?';
      params.push(date);
    } else if (from && to) {
      sql += ' AND date BETWEEN ? AND ?';
      params.push(from, to);
    }
    const [rows] = await db.execute(sql, params);
    const tasks = rows[0].tasks || 0;
    const minutes = rows[0].minutes || 0;
    const efficiency = minutes === 0 ? 0 : tasks / minutes;
    return res.json({ employee_id: Number(employeeId), tasks, minutes, efficiency });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Sunucu hatası' });
  }
};

module.exports = { getEfficiency };
