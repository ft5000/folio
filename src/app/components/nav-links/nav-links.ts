import { Component, OnDestroy } from '@angular/core';
import { TreeItem } from '../tree-item/tree-item';
import { NavigationService } from '../../services/navigation';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';

export enum NavItem {
  About = 'About',
  Projects = 'Projects',
  Sketches = 'Sketches',
  Crawl = 'Image Crawl'
}


@Component({
  selector: 'nav-links',
  imports: [TreeItem, CommonModule],
  templateUrl: './nav-links.html',
  styleUrl: './nav-links.scss',
})
export class NavLinks implements OnDestroy {
  public NavItem = NavItem;
  public projectTitles: string[] = [];

  subscribers: Subscription = new Subscription();

  constructor(private navigationService: NavigationService) {
    this.subscribers.add(this.navigationService.projectTitles$.subscribe(titles => {
      this.projectTitles = titles;
    }));
  }
  
  ngOnDestroy(): void {
    this.subscribers.unsubscribe();
  }

  public getProjectLink(title: string): string {
    return '/projects/' + title.toLowerCase().replace(/ /g, '-');
  }
}
