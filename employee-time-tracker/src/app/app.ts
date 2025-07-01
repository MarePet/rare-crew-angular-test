import { Component } from '@angular/core';
import { EmployeeTable } from './employee-table/employee-table';

@Component({
  selector: 'app-root',
  imports: [EmployeeTable],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected title = 'employee-time-tracker';
}
