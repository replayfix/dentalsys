import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NuevaConsulta } from './nueva-consulta';

describe('NuevaConsulta', () => {
  let component: NuevaConsulta;
  let fixture: ComponentFixture<NuevaConsulta>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NuevaConsulta]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NuevaConsulta);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
