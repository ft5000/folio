import { AfterViewInit, Component, ElementRef, Input, OnDestroy, ViewChild } from '@angular/core';
import { VideoDTO } from '../../../types/video';
import { CommonModule } from '@angular/common';

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

  private loaded: boolean = false;

  @Input()
  set data(value: VideoDTO | null) {
    this._data = value;
    this.videoEl = this.setVideoSource();
  }

  get data(): VideoDTO | null {
    return this._data;
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  ngAfterViewInit(): void {
    this.setVideoSource();
  }

  private setupItemObserver(videoEl: HTMLVideoElement): void {
    if (!videoEl) return;

    if (this.observer) {
      this.observer.disconnect();
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (videoEl.paused) {
              if (!this.loaded) {
                videoEl.load();
                videoEl.onloadeddata = () => {
                  videoEl
                    .play()
                    .catch((err) =>
                      console.warn('Autoplay blocked or interrupted:', err)
                    );
                  console.log('Playing video after loading data');
                  this.loaded = true;
                };
              } else {
                videoEl
                  .play()
                  .catch((err) =>
                    console.warn('Autoplay blocked or interrupted:', err)
                  );
              }
            }
          } else {
            if (!videoEl.paused) {
              console.log('Pausing video due to exit from viewport');
              videoEl.pause();
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    this.observer.observe(videoEl);
  }

  private setVideoSource(): HTMLVideoElement | undefined {
    if (this.data && this.videoOutlet) {
      this.videoOutlet.nativeElement.innerHTML = '';

      const videoElement = document.createElement('video');
      videoElement.src = this.data.videoUrl;
      videoElement.autoplay = false;
      videoElement.muted = true;
      videoElement.preload = 'none';
      videoElement.playsInline = true;
      videoElement.loop = true;

      this.videoOutlet.nativeElement.appendChild(videoElement);

      this.setupItemObserver(videoElement);
      return videoElement;
    }
    return undefined;
  }
}
