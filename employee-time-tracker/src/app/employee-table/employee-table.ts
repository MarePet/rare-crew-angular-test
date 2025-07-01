import { Component, OnInit, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseChartDirective } from 'ng2-charts';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import type { ChartType } from 'chart.js';

interface TimeEntry {
  Id: string;
  EmployeeName: string;
  StarTimeUtc: string;
  EndTimeUtc: string;
  EntryNotes: string;
  DeletedOn: string | null;
}

interface EmployeeTotal {
  employeeName: string;
  totalHours: number;
}

@Component({
  selector: 'app-employee-table',
  templateUrl: './employee-table.html',
  styleUrl: './employee-table.css',
  standalone: true,
  imports: [CommonModule, BaseChartDirective]
})
export class EmployeeTable implements OnInit {
  employees: EmployeeTotal[] = [];
  loading = false;
  error: string | null = null;
  pieChartLabels: string[] = [];
  pieChartData: any = {};
  pieChartType: ChartType = 'pie';
  isBrowser = false;
  pieChartOptions: any = {};

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.fetchEmployeeData();
  }

  fetchEmployeeData() {
    this.loading = true;
    this.error = null;
    const apiUrl = 'https://rc-vault-fap-live-1.azurewebsites.net/api/gettimeentries?code=vO17RnE8vuzXzPJo5eaLLjXjmRW07law99QTD90zat9FfOQJKKUcgQ==';
    this.http.get<TimeEntry[]>(apiUrl).subscribe({
      next: (data) => {
        const totals: { [name: string]: EmployeeTotal } = {};
        data.forEach(entry => {
          if (!entry.EmployeeName) return;
          // Calculate duration in hours
          const start = new Date(entry.StarTimeUtc);
          const end = new Date(entry.EndTimeUtc);
          let hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
          if (isNaN(hours) || hours <= 0) return;
          if (!totals[entry.EmployeeName]) {
            totals[entry.EmployeeName] = {
              employeeName: entry.EmployeeName,
              totalHours: 0
            };
          }
          totals[entry.EmployeeName].totalHours += hours;
        });
        this.employees = Object.values(totals).map(e => ({
          ...e,
          totalHours: Math.round(e.totalHours * 100) / 100
        })).sort((a, b) => b.totalHours - a.totalHours);
        const colors = this.employees.map(() => `hsl(${Math.floor(Math.random()*360)}, 70%, 60%)`);
        this.pieChartData = {
          labels: this.employees.map(e => e.employeeName),
          datasets: [{
            data: this.employees.map(e => e.totalHours),
            backgroundColor: colors
          }]
        };
        this.pieChartOptions = {
          responsive: true,
          plugins: {
            legend: { position: 'right' },
            tooltip: {
              callbacks: {
                label: (context: any) => {
                  const value = context.parsed;
                  const total = context.chart._metasets[0].total || context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                  const percent = total ? ((value / total) * 100).toFixed(2) : '0.00';
                  return `${context.label}: ${value} hrs (${percent}%)`;
                }
              }
            }
          }
        };
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('API error:', err);
        this.error = 'Failed to load employee data.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  isLowHours(total: number): boolean {
    return total < 100;
  }
}
