import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavLinks } from './nav-links';

describe('NavLinks', () => {
  let component: NavLinks;
  let fixture: ComponentFixture<NavLinks>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavLinks]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NavLinks);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
