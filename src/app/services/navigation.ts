import { Injectable } from '@angular/core';
import { BehaviorSubject, filter, Subscription } from 'rxjs';
import { SanityService } from './sanity';

@Injectable({
  providedIn: 'root',
})
export class NavigationService {
    subscribers: Subscription = new Subscription();
    private _projectTitles: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);
    public projectTitles$ = this._projectTitles.asObservable();

    constructor(private sanityService: SanityService) {
    this.sanityService.getAllProjectTitles()
      .pipe(filter((titles) => titles != null))
      .subscribe(titles => {
        this._projectTitles.next(titles);
      });
    }
}
