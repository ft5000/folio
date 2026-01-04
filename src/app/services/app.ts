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

  private _loading: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public loading$ = this._loading.asObservable();

  setIsMobile(isMobile: boolean): void {
    this._isMobile.next(isMobile);
  }

  setUseMobileLayout(useMobileLayout: boolean): void {
    this._useMobileLayout.next(useMobileLayout);
  }

  public set loading(value: boolean) {
    this._loading.next(value);
  }
}
