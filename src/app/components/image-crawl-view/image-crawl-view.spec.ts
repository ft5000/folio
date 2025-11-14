import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImageCrawlView } from './image-crawl-view';

describe('ImageCrawlView', () => {
  let component: ImageCrawlView;
  let fixture: ComponentFixture<ImageCrawlView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImageCrawlView]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImageCrawlView);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
