import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-master-detail',
  templateUrl: './master-detail.component.html',
  styleUrls: ['./master-detail.component.scss']
})
export class MasterDetailComponent implements OnInit {

  @Input() showDetail = false;
  

  constructor() { }

  ngOnInit(): void {
  }

}
