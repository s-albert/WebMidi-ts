import { inject, TestBed } from '@angular/core/testing';
import { MidiService } from '../lib/src/services/midi.service';

describe('DemoService', () => {

    // tslint:disable-next-line:no-empty
    beforeEach(() => {
    });

    it('test instantiation',
            () => {
                expect(new MidiService().supported).toBe(true);
            });
});
