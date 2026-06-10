import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Atenciones } from './atenciones';

describe('Atenciones', () => {
  let component: Atenciones;
  let fixture: ComponentFixture<Atenciones>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Atenciones]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Atenciones);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
