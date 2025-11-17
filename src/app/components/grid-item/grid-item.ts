import { CommonModule } from '@angular/common';
import { Component, ContentChildren, Input, QueryList, TemplateRef, ViewChild } from '@angular/core';
import { ImageDTO } from '../../../types/image';
import moment from 'moment';
import { VideoDTO } from '../../../types/video';
import { VideoContainer } from '../video-container/video-container';

export enum GridItemType {
    None = '',
    Image = 'image',
    Video = 'video',
  }

@Component({
  selector: 'grid-item',
  imports: [CommonModule, VideoContainer],
  templateUrl: './grid-item.html',
  styleUrls: ['./grid-item.scss'],
})
export class GridItem {
  @Input() image: ImageDTO | null = null;
  @Input() video: VideoDTO | null = null;
  hovered: boolean = false;

  @ContentChildren('content', { descendants: true })
  content!: QueryList<any>;

  public setHovered(state: boolean) {
    this.hovered = state;
  }

  public get title(): string {
    switch (this.gridItemType) {
      case GridItemType.Image:
        return this.image!.alt;
      case GridItemType.Video:
        return this.video!.title;
      default:
        return '';
    }
  }

  private get gridItemType(): GridItemType {
    if (this.image) return GridItemType.Image;
    if (this.video) return GridItemType.Video;
    return GridItemType.None;
  }

  public get publishedDate(): string {
    switch (this.gridItemType) {
      case GridItemType.Image:
        return moment(this.image!.publishedAt).format('YYYY/MM/DD');
      case GridItemType.Video:
        return moment(this.video!.publishedAt).format('YYYY/MM/DD');
      default:
        return '';
    }
  }

  public get mediaId(): string {
    switch (this.gridItemType) {
      case GridItemType.Image:
        return this.image!._id;
      case GridItemType.Video:
        return this.video!._id;
      default:
        return '';
    }
  }
}
