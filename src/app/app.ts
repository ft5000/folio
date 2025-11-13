import { Component, OnInit, signal, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SanityService } from './services/sanity';
import { CommonModule } from '@angular/common';
import { ImageDTO } from '../types/image';
import { VideoDTO } from '../types/video';
import { VideoContainer } from './components/video-container/video-container';
import { P5PathsComponent } from './components/p5-paths.component';
import { NavBar } from './components/nav-bar/nav-bar';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, VideoContainer, P5PathsComponent, NavBar],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class App implements OnInit {
  public images: ImageDTO[] = [];
  public video: VideoDTO | null = null;

  mo: MutationObserver | null = null;

  constructor(private sanity: SanityService) {
  }

  ngOnInit() {
    this.sanity.getAllImages().subscribe((data: ImageDTO[]) => {
      this.images = data;
      this.setupImageObserver();
    });
    this.sanity.getAllVideos().subscribe((data: VideoDTO[]) => {
      console.log('Videos:', data);
      this.video = data[0];
    });
  }

  private setupImageObserver() {
    setTimeout(() => {
      const images = document.querySelectorAll('.blog-image');
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).classList.add('show');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });

      images.forEach(img => observer.observe(img));
    });
  }
}
