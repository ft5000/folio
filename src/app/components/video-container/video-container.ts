import { AfterViewInit, Component, ElementRef, Input, OnDestroy, ViewChild } from '@angular/core';
import { VideoDTO, VideoThumbnailDTO } from '../../../types/video';
import { CommonModule } from '@angular/common';
import { SanityService } from '../../services/sanity';

@Component({
  selector: 'video-container',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './video-container.html',
  styleUrls: ['./video-container.scss'],
})
export class VideoContainer implements AfterViewInit, OnDestroy {
  @ViewChild('videoOutlet', { read: ElementRef }) videoOutlet?: ElementRef<HTMLDivElement>;
  videoEl: HTMLVideoElement | undefined;

  private observer: IntersectionObserver | undefined;

  private _data: VideoDTO | null = null;
  private _thumbnailDto: VideoThumbnailDTO | null = null;

  public loading: boolean = false;
  public hideThumbnail: boolean = false;

  @Input()
  set thumbnailDto(value: VideoThumbnailDTO | null) {
    this._thumbnailDto = value;
    console.log('thumbnailDto set:', value);
  }

  @Input()
  set data(value: VideoDTO | null) {
    this._data = value;
    // this.loaded = false;
  }

  public get hasThumbnail(): boolean {
    return this._thumbnailDto !== null;
  }

  get thumbnailUrl(): string {
    return this._thumbnailDto ? this._thumbnailDto.thumbnailUrl : "";
  }

  get data(): VideoDTO | null {
    return this._data;
  }

  constructor(private sanityService: SanityService) {
    
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    if (this.videoEl) {
      this.videoEl.src = '';
      this.videoEl.load();
      this.videoEl = undefined;
    }
  }

  ngAfterViewInit(): void {
    if (this._thumbnailDto && !this.data && this.videoOutlet?.nativeElement) {
      // Check if image is already in the DOM (most common case)
      const existingImg = this.videoOutlet.nativeElement.querySelector('img');
      
      if (existingImg) {
        console.log('Image already in DOM');
        if (existingImg.complete && existingImg.naturalHeight > 0) {
          // Image already loaded
          this.setupItemObserver(this.videoOutlet.nativeElement);
          console.log('Thumbnail already loaded, setting up observer.');
        } else {
          // Wait for image to load
          existingImg.addEventListener('load', () => {
            if (this.videoOutlet?.nativeElement) {
              this.setupItemObserver(this.videoOutlet.nativeElement);
              console.log('Thumbnail loaded, setting up observer.');
            }
          }, { once: true });
        }
      } else {
        // Fallback: Use MutationObserver if image not yet in DOM
        console.log('Setting up MutationObserver');
        const mutationObserver = new MutationObserver((mutations) => {
          const img = this.videoOutlet?.nativeElement.querySelector('img');
          
          if (img) {
            console.log('MutationObserver detected image');
            mutationObserver.disconnect();
            
            if (img.complete && img.naturalHeight > 0) {
              this.setupItemObserver(this.videoOutlet!.nativeElement);
              console.log('Thumbnail already loaded, setting up observer.');
            } else {
              img.addEventListener('load', () => {
                if (this.videoOutlet?.nativeElement) {
                  this.setupItemObserver(this.videoOutlet.nativeElement);
                  console.log('Thumbnail loaded, setting up observer.');
                }
              }, { once: true });
            }
          }
        });

        mutationObserver.observe(this.videoOutlet.nativeElement, {
          childList: true,
          subtree: true
        });
      }
    }
  }

  private setupItemObserver(outlet: HTMLElement): void {
    if (!outlet) return;

    if (this.observer) {
      this.observer.disconnect();
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (!this.data) {
              this.loading = true;
              this.sanityService.getVideoById(this._thumbnailDto?._id).subscribe({
                next: (videoData: VideoDTO) => {
                  this.data = videoData;
                  this.videoEl = this.setVideoSource();
                },
                complete: () => {
  
                }
              });
            }
            if (this.videoEl && this.videoEl.paused) {
              if (this.loading) {
                this.videoEl.load();
                
                const onLoadedData = () => {
                  this.videoEl!
                    .play()
                    .catch((err: any) =>
                      console.warn('Autoplay blocked or interrupted:', err)
                    );
                  this.loading = false;
                  this.videoEl!.removeEventListener('loadeddata', onLoadedData);
                  this.videoEl!.removeEventListener('error', onError);
                };

                const onError = () => {
                  console.warn('Video failed to load:', this.data?.videoUrl);
                  this.loading = false;
                  this.videoEl!.removeEventListener('loadeddata', onLoadedData);
                  this.videoEl!.removeEventListener('error', onError);
                };

                this.videoEl.addEventListener('loadeddata', onLoadedData);
                this.videoEl.addEventListener('error', onError);
              } else {
                this.videoEl
                  .play()
                  .catch((err: any) =>
                    console.warn('Autoplay blocked or interrupted:', err)
                  );
              }
            }
          } else {
            if (this.videoEl && !this.videoEl.paused) {
              this.videoEl.pause();
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    this.observer.observe(outlet);
  }

  private setVideoSource(): HTMLVideoElement | undefined {
    if (this.data && this.videoOutlet) {
      if (this.videoEl) {
        this.observer?.disconnect();
        this.videoEl.pause();
        this.videoEl.src = '';
        this.videoEl.load();
      }

      const videoElement = document.createElement('video');
      videoElement.src = this.data.videoUrl;
      videoElement.autoplay = false;
      videoElement.muted = true;
      videoElement.preload = 'auto';
      videoElement.playsInline = true;
      videoElement.loop = true;
      
      videoElement.style.transform = 'translateZ(0)';
      videoElement.style.willChange = 'transform';

      // Wait for video to be fully loaded before appending
      videoElement.addEventListener('loadeddata', () => {
        if (this.videoOutlet) {
          this.hideThumbnail = true;
          this.videoOutlet.nativeElement.appendChild(videoElement);
          this.loading = false;
          
          // Start playing
          videoElement.play().catch((err: any) =>
            console.warn('Autoplay blocked or interrupted:', err)
          );
        }
      }, { once: true });

      // Start loading
      videoElement.load();

      return videoElement;
    }
    return undefined;
  }
}
