import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

import { CardComponent } from 'src/app/theme/shared/components/card/card.component';
import { ContactsService } from 'src/app/core/contacts/contacts.service';
import { ContactView } from 'src/app/core/contacts/contacts.types';



@Component({
  selector: 'app-contacts',
  imports: [CommonModule, CardComponent],
  templateUrl: './contacts.component.html',
  styleUrls: ['./contacts.component.scss']
})
export class ContactsComponent {
export class ContactsComponent implements OnInit {
  contacts: ContactView[] = [];

  constructor(private readonly contactsService: ContactsService) {}

  ngOnInit(): void {
    this.loadContacts();
  }

  private loadContacts(): void {
    this.contactsService.list().subscribe({
      next: (contacts) => {
        this.contacts = contacts;
      },
      error: () => {
        this.contacts = [];
      }
    });
  }
}
