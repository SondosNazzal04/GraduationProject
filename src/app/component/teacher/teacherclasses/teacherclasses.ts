import { Component } from '@angular/core';

@Component({
  selector: 'app-teacherclasses',
  imports: [],
   standalone: true,
  templateUrl: './teacherclasses.html',
  styleUrl: './teacherclasses.css',
})
export class Teacherclasses {

 classes = [
    {
      name: "Math 101",
      students: 28,
      time: "8:00 AM",
      grade: "10th",
    },
    {
      name: "Math 102",
      students: 25,
      time: "9:30 AM",
      grade: "10th",
    },
    {
      name: "Algebra Advanced",
      students: 22,
      time: "11:00 AM",
      grade: "11th",
    },
    {
      name: "Calculus",
      students: 18,
      time: "1:30 PM",
      grade: "12th",
    }
  ];
}
