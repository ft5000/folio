import { AfterViewInit, Component, ElementRef, Input, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VideoDTO, VideoThumbnailDTO } from '../../../types/video';
import { SanityService } from '../../services/sanity';

@Component({
  selector: 'video-container',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './video-container.html',
  styleUrls: ['./video-container.scss'],
})
export class VideoContainer implements AfterViewInit, OnDestroy {
  @ViewChild('videoElement') videoElement?: ElementRef<HTMLVideoElement>;
  @ViewChild('wrapper', { read: ElementRef }) wrapper?: ElementRef<HTMLDivElement>;
  @Input() thumbnailDto: VideoThumbnailDTO | null = null;
  @Input() data: VideoDTO | null = null;

  hideThumbnail: boolean = false;
  loading: boolean = false;
  private observer?: IntersectionObserver;

  constructor(private sanityService: SanityService) {}

  ngAfterViewInit(): void {
    if (this.wrapper?.nativeElement) {
      if (this.thumbnailDto) {
        const img = this.wrapper.nativeElement.querySelector('img');
        if (img) {
          if (img.complete && img.naturalHeight > 0) {
            this.setupObserver();
          } else {
            img.addEventListener('load', () => {
              this.setupObserver();
            }, { once: true });
          }
        }
      } else {
        this.setupObserver();
      }
    }
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  private setupObserver(): void {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (!this.data && this.thumbnailDto && !this.loading) {
              this.loadVideo();
            }
            else if (this.videoElement?.nativeElement && this.videoElement.nativeElement.paused) {
              this.videoElement.nativeElement.play().catch((err) => 
                console.warn('Autoplay blocked:', err)
              );
            }
          } else {
            if (this.videoElement?.nativeElement && !this.videoElement.nativeElement.paused) {
              this.videoElement.nativeElement.pause();
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    this.observer.observe(this.wrapper!.nativeElement);
  }

  get hasThumbnail(): boolean {
    return !!this.thumbnailDto;
  }

  get thumbnailUrl(): string {
    return this.thumbnailDto?.thumbnailUrl || '';
  }

  private loadVideo(): void {
    this.loading = true;
    this.sanityService.getVideoById(this.thumbnailDto!._id).subscribe({
      next: (video) => {
        this.data = video;
        // Wait for video element to be created by Angular
        setTimeout(() => {
          if (this.videoElement?.nativeElement) {
            const videoEl = this.videoElement.nativeElement;
            videoEl.src = video.videoUrl;
            videoEl.load();
            videoEl.addEventListener('loadeddata', () => {
              this.loading = false;
              this.hideThumbnail = true;
              videoEl.play().catch((err) => console.warn('Autoplay blocked:', err));
            }, { once: true });
          }
        }, 0);
      },
      error: (err) => {
        console.error('Video load failed:', err);
        this.loading = false;
      },
    });
  }
}
