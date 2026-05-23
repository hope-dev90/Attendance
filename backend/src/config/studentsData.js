const path = require('path');

const students = require(path.resolve(
  __dirname,
  '../../../attendance/attendance/src/data/students.json',
));

const getClassNamesFromJson = () => {
  const names = new Set();
  for (const student of students) {
    if (student.class) {
      names.add(String(student.class).trim());
    }
  }
  return [...names].sort();
};

module.exports = { students, getClassNamesFromJson };
