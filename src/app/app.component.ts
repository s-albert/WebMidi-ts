import { Component, OnInit } from '@angular/core';
import { NgxMidiService } from './ngx-midi.service';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  ngOnInit(): void {
    this.midiService.playNow();
  }
  title = 'ngx-midi';
  result: number = 0;
  constructor(private midiService: NgxMidiService) {

  }
}
