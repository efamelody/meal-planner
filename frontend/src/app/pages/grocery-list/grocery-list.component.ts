import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { GroceryService } from '../../services/grocery.service';
import { GroceryItem } from '../../models/grocery-item.model';

@Component({
  selector: 'app-grocery-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatCheckboxModule, MatListModule, MatDividerModule
  ],
  templateUrl: './grocery-list.component.html',
  styleUrl: './grocery-list.component.css'
})
export class GroceryListComponent implements OnInit {
  items: GroceryItem[] = [];
  weekStart = '';

  constructor(private groceryService: GroceryService) {}

  ngOnInit(): void {
    this.weekStart = this.getMondayString();
    this.loadList();
  }

  loadList(): void {
    this.groceryService.getList(this.weekStart).subscribe(data => {
      this.items = data;
    });
  }

  get checkedCount(): number {
    return this.items.filter(i => i.checked).length;
  }

  clearChecked(): void {
    this.items = this.items.filter(i => !i.checked);
  }

  private getMondayString(): string {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d.toISOString().split('T')[0];
  }
}
