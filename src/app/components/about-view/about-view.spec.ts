import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AboutView } from './about-view';

describe('AboutView', () => {
  let component: AboutView;
  let fixture: ComponentFixture<AboutView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AboutView]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AboutView);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
