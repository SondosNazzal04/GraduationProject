const fs = require('fs');

const files = [
  'student/venture-shop/venture-shop.html',
  'student/student-grades/student-grades.html',
  'shared/direct-messages/direct-messages.html',
  'features/notification/notification.html',
  'component/student-dashboard/student-dashboard.html',
  'component/activity/take-activity/take-activity.html',
  'component/student-activities/student-activities.html',
  'component/student-classes/student-classes.html'
];

files.forEach(f => {
  const file = 'd:/uni work/graduation_project/GraduationProject/frontend/src/app/' + f;
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/\s*\[?level\]?="[^"]*"/g, '');
    fs.writeFileSync(file, content);
    console.log('Updated', file);
  } else {
    console.log('Not found', file);
  }
});
