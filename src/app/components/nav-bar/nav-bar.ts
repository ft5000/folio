import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { TreeItem } from '../tree-item/tree-item';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscriber, Subscription } from 'rxjs';
import { SanityService } from '../../services/sanity';

export enum NavItem {
  About = 'About',
  Projects = 'Projects',
  Sketches = 'Sketches',
  Crawl = 'Image Crawl'
}

@Component({
  selector: 'nav-bar',
  imports: [CommonModule, TreeItem],
  templateUrl: './nav-bar.html',
  styleUrl: './nav-bar.scss',
})
export class NavBar implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('tree') tree!: ElementRef;

  public NavItem = NavItem;
  public isMouseInside: boolean = false;
  public expanded: boolean = false;

  public projectTitles: string[] = [];

  subscribers: Subscription = new Subscription();

  constructor(private router: Router, private sanityService: SanityService) {
  }

  ngOnDestroy(): void {
    this.subscribers.unsubscribe();
  }

  ngOnInit(): void {
    this.subscribers.add(this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.expanded = false;
    }));
    this.sanityService.getAllProjectTitles()
      .pipe(filter((titles) => titles != null))
      .subscribe(titles => {
        this.projectTitles = titles;
      });
  }

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent) {
    if (this.expanded && !this.tree.nativeElement.contains(event.target) && !(event.target as HTMLElement).closest('.nav-button')) {
      this.expanded = false;
    }
  }

  ngAfterViewInit() {
    this.tree.nativeElement.addEventListener('mouseenter', () => {
      this.isMouseInside = true;
    });

    this.tree.nativeElement.addEventListener('mouseleave', () => {
      this.isMouseInside = false;
    });
  }

  public toggleExpand() {
    this.expanded = !this.expanded;
  }

  public getProjectLink(title: string): string {
    return '/projects/' + title.toLowerCase().replace(/ /g, '-');
  }
}
