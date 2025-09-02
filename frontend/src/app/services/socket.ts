import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket;

  constructor() {
    // Adresse de ton backend
    this.socket = io('http://localhost:4000');
  }

  // --- Écouteurs ---
  onRoundStart(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('round:start', data => observer.next(data));
    });
  }

  onRoundTick(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('round:tick', data => observer.next(data));
    });
  }

  onRoundEnd(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('round:end', data => observer.next(data));
    });
  }

  onAnswersUpdate(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('answers:update', data => observer.next(data));
    });
  }

  // --- Émetteurs ---
  submitAnswer(teamId: 'blue' | 'red', answer: string) {
    this.socket.emit('answer:submit', { teamId, answer });
  }
}
