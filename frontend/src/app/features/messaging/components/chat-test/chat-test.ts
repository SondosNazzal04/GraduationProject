import { Component } from '@angular/core';

@Component({
  selector: 'app-chat-test',
  templateUrl: './chat-test.html',
  styleUrls: ['./chat-test.css']
})
export class ChatTestComponent {

  // This function runs when you click the button
  sendMessage(text: string) {
    if (text) {
      console.log('Button clicked! Message content:', text);
      alert('You sent: ' + text); // Simple alert so you know it works
    } else {
      console.log('Input was empty');
    }
  }
}
