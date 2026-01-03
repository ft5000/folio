import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AppService {
  private _isMobile: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public isMobile$ = this._isMobile.asObservable();

  private _useMobileLayout: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public useMobileLayout$ = this._useMobileLayout.asObservable();

  setIsMobile(isMobile: boolean): void {
    this._isMobile.next(isMobile);
  }

  setUseMobileLayout(useMobileLayout: boolean): void {
    this._useMobileLayout.next(useMobileLayout);
  }
}
