import { AfterViewInit, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { VideoDTO } from '../../../types/video';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'video-container',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './video-container.html',
  styleUrls: ['./video-container.scss'],
})
export class VideoContainer implements AfterViewInit {
  @ViewChild('videoOutlet', { read: ElementRef }) videoOutlet?: ElementRef<HTMLDivElement>;

  private _data: VideoDTO | null = null;

  @Input()
  set data(value: VideoDTO | null) {
    this._data = value;
    this.setVideoSource();
  }

  get data(): VideoDTO | null {
    return this._data;
  }

  ngAfterViewInit(): void {
    this.setVideoSource();
  }

  private setVideoSource() {
    if (this.data && this.videoOutlet) {
      const videoElement = document.createElement('video');
      videoElement.src = this.data.videoUrl;
      videoElement.autoplay = true;
      videoElement.muted = true;
      videoElement.playsInline = true;
      videoElement.loop = true;

      this.videoOutlet.nativeElement.innerHTML = '';
      this.videoOutlet.nativeElement.appendChild(videoElement);

      videoElement.play().catch(err => console.warn('Autoplay blocked:', err));
    }
  }
}
