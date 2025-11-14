import { Component } from '@angular/core';
import { ImageDTO } from '../../../types/image';
import { SanityService } from '../../services/sanity';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-image-crawl-view',
  imports: [CommonModule],
  templateUrl: './image-crawl-view.html',
  styleUrl: './image-crawl-view.scss',
})
export class ImageCrawlView {
  public images: ImageDTO[] = [];

  mo: MutationObserver | null = null;

  constructor(private sanity: SanityService) {
  }

  ngOnInit() {
    this.sanity.getAllImages().subscribe((data: ImageDTO[]) => {
      this.images = data;
      this.setupImageObserver();
    });

    document.body.style.setProperty('--fg-color', 'white');
    document.body.style.setProperty('--bg-color', 'black');
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
