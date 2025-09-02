import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SocketService } from '../services/socket.service';

@Component({
  selector: 'app-player',
  template: `
    <h2>Joueur (équipe: {{teamId}})</h2>
    <input [(ngModel)]="answer" placeholder="Votre réponse" />
    <button (click)="sendAnswer()">Envoyer</button>

    <div *ngIf="remainingMs > 0">
      Temps restant: {{ remainingMs / 1000 | number:'1.0-0' }}s
    </div>
  `
})
export class PlayerComponent {
  teamId: 'blue' | 'red' = 'blue';
  answer = '';
  remainingMs = 0;

  constructor(private route: ActivatedRoute, private socketService: SocketService) {
    this.teamId = (this.route.snapshot.queryParamMap.get('team') as 'blue' | 'red') || 'blue';

    this.socketService.onRoundTick().subscribe(data => {
      this.remainingMs = data.remainingMs;
    });
  }

  sendAnswer() {
    this.socketService.submitAnswer(this.teamId, this.answer);
    this.answer = '';
  }
}
