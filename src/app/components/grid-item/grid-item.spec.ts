import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GridItem } from './grid-item';

describe('GridItem', () => {
  let component: GridItem;
  let fixture: ComponentFixture<GridItem>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GridItem]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GridItem);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
