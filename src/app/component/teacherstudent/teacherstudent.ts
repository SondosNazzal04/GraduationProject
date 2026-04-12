import { Component } from '@angular/core';

@Component({
  selector: 'app-teacherstudent',
  imports: [],
  templateUrl: './teacherstudent.html',
  styleUrl: './teacherstudent.css',
})
export class Teacherstudent {

  students = [
    {
      initials: 'AJ',
      name: 'Alex Johnson',
      class: 'Math 101',
      grade: 'A',
      attendance: 95,
      points: 2450
    },
    {
      initials: 'EW',
      name: 'Emma Williams',
      class: 'Math 101',
      grade: 'A+',
      attendance: 98,
      points: 3200
    },
    {
      initials: 'MC',
      name: 'Michael Chen',
      class: 'Math 101',
      grade: 'B+',
      attendance: 92,
      points: 2380
    },
    {
      initials: 'SM',
      name: 'Sarah Miller',
      class: 'Math 101',
      grade: 'A-',
      attendance: 96,
      points: 2150
    },
    {
      initials: 'JT',
      name: 'James Taylor',
      class: 'Math 101',
      grade: 'B',
      attendance: 88,
      points: 2050
    }
  ];
}
