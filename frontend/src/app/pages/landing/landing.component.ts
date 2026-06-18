import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css'
})
export class LandingComponent {
  faqs = [
    {
      question: 'How do I get an account?',
      answer: 'EduVenture is exclusive to partner schools. Administrators manage all users, so please contact your school\'s IT department or Office to receive your login credentials.'
    },
    {
      question: 'Can parents track their child\'s progress?',
      answer: 'Yes! Parents have a dedicated portal to view attendance, grades, and monitor activity logs in real-time.'
    },
    {
      question: 'How does the "VentureShop" work?',
      answer: 'Students earn VenturePoints by completing activities and maintaining good attendance. These points can be redeemed in the shop for rewards set by the school admin.'
    },
    {
      question: 'Is it difficult for teachers to set up?',
      answer: 'Not at all. Teachers can easily create activities, input grades, and view class analytics from a simple dashboard.'
    }
  ];
}

