import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-admin',
  template: `
    <h2>Admin Panel</h2>
    <button (click)="startRound()">Lancer une manche</button>
  `
})
export class AdminComponent {
  constructor(private http: HttpClient) {}

  // Méthode pour démarrer une nouvelle manche
  startRound() {
    this.http.post('http://localhost:4000/start-round', {}).subscribe({
      next: res => console.log('Round démarré', res),
      error: err => console.error(err)
    });
  }
}
