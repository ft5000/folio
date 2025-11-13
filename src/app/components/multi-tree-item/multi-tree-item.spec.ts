import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MultiTreeItem } from './multi-tree-item';

describe('MultiTreeItem', () => {
  let component: MultiTreeItem;
  let fixture: ComponentFixture<MultiTreeItem>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MultiTreeItem]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MultiTreeItem);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
