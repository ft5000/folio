import { AfterViewInit, Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { P5PathsComponent } from './components/p5-paths.component';
import { NavBar } from './components/nav-bar/nav-bar';
import { combineLatest, filter, map, Observable, Subscription } from 'rxjs';
import { NavLinks } from './components/nav-links/nav-links';
import { SanityService } from './services/sanity';
import { AppService } from './services/app';

const mobileLayoutBreakpoint = 768;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, P5PathsComponent, NavBar],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class App implements OnInit, AfterViewInit, OnDestroy {
  public isMobile: boolean = false;
  public canScrollDown: boolean = false;
  public useMobileLayout: boolean = false;
  public currentRoute: string = '';

  private interval: any;

  subscribers: Subscription = new Subscription();

  public loading$: Observable<boolean> | null = null;

  constructor(private router: Router, private sanityService: SanityService, private appService: AppService) {
    this.loading$ = combineLatest([
      this.sanityService.loading$,
      this.appService.loading$
    ]).pipe(
      map(([sanityLoading, appLoading]) => sanityLoading || appLoading)
    );
  }

  ngOnDestroy(): void {
    clearInterval(this.interval);
    this.subscribers.unsubscribe();
  }

  ngOnInit(): void {
    this.isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);

    this.appService.setIsMobile(this.isMobile);
    
    // Track route changes to force component reconstruction
    this.subscribers.add(
      this.router.events.pipe(
        filter(event => event instanceof NavigationEnd)
      ).subscribe((event: NavigationEnd) => {
        this.currentRoute = event.urlAfterRedirects;
        scrollTo(0, 0);
      })
    );

    this.checkUseMobileLayout();

    this.subscribers.add(this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      setTimeout(() => this.updateCanScrollDown(), 500);
    }));

    this.interval = setInterval(() => {
        const chars = '#$*ft5000_online'
        const title = document.title.split('')
        const idx = Math.floor(Math.random() * title.length)
        if (Math.random() < 0.1) {
          const randomChar = chars[Math.floor(Math.random() * chars.length)]
          title[idx] = randomChar
          document.title = title.join('')
        }
    }, 60);
  }

  @HostListener('window:scroll', [])
  onscroll() {
    this.updateCanScrollDown();
  }

  @HostListener('window:resize', [])
  onresize() {
    this.updateCanScrollDown();
    this.checkUseMobileLayout();
  }

  @HostListener('window:orientationchange', [])
  onorientationchange() {
    this.updateCanScrollDown();
    this.checkUseMobileLayout();
  }

  private checkUseMobileLayout(): void {
    this.useMobileLayout = window.innerWidth < mobileLayoutBreakpoint;
    this.appService.setUseMobileLayout(this.useMobileLayout);
  }
  

  private updateCanScrollDown(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      this.canScrollDown = false;
      return;
    }

    const el = document.scrollingElement || document.documentElement;
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight ?? el.clientHeight;
    const scrollTop = el.scrollTop ?? window.pageYOffset ?? 0;
    const scrollHeight = el.scrollHeight ?? 0;

    const next = scrollTop + viewportHeight < scrollHeight - 1;
    if (next !== this.canScrollDown) this.canScrollDown = next;
  };

  ngAfterViewInit(): void {
    setTimeout(() => this.updateCanScrollDown(), 500);
  }
}
