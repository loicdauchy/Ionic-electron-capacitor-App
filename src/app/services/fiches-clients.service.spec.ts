import { TestBed } from '@angular/core/testing';

import { FichesClientsService } from './fiches-clients.service';

describe('FichesClientsService', () => {
  let service: FichesClientsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FichesClientsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
