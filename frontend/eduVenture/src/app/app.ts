import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { ChatTestComponent } from './features/messaging/components/chat-test/chat-test';
import 'bootstrap/dist/css/bootstrap.min.css';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet,
            // RouterLink,
            // ChatTestComponent
          ],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  protected readonly title = signal('eduVenture');
}
