import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Student {
  initials: string;
  name: string;
  attendance: number;
  status: 'present' | 'late' | 'absent';
}

@Component({
  selector: 'app-teacherattendance',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './teacherattendance.html',
  styleUrls: ['./teacherattendance.css']
})
export class Teacherattendance {
  date = 'Sunday, December 7, 2025';
  selectedClass = 'Math 101';

  students: Student[] = [
    { initials: 'AJ', name: 'Alex Johnson', attendance: 95, status: 'present' },
    { initials: 'EW', name: 'Emma Williams', attendance: 98, status: 'present' },
    { initials: 'MC', name: 'Michael Chen', attendance: 92, status: 'present' },
    { initials: 'SM', name: 'Sarah Miller', attendance: 96, status: 'present' },
    { initials: 'JT', name: 'James Tacd ylor', attendance: 88, status: 'present' }
  ];

  setStatus(index: number, status: 'present' | 'late' | 'absent') {
    this.students[index].status = status;
  }

  saveAttendance() {
    console.log('saved', this.students);
    alert('Attendance saved!');
  }
}