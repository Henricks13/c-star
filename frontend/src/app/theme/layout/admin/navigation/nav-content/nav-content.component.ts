// Angular import
import { Component, OnInit, output, inject } from '@angular/core';
import { Location } from '@angular/common';
import { RouterModule } from '@angular/router';

// project import
import { NavigationItem, NavigationItems } from '../navigation';
import { AuthService } from 'src/app/core/auth/auth.service';

import { NavCollapseComponent } from './nav-collapse/nav-collapse.component';
import { NavGroupComponent } from './nav-group/nav-group.component';
import { NavItemComponent } from './nav-item/nav-item.component';

// NgScrollbarModule
import { SharedModule } from 'src/app/theme/shared/shared.module';

@Component({
  selector: 'app-nav-content',
  imports: [RouterModule, NavCollapseComponent, NavGroupComponent, NavItemComponent, SharedModule],
  templateUrl: './nav-content.component.html',
  styleUrl: './nav-content.component.scss'
})
export class NavContentComponent implements OnInit {
  private location = inject(Location);
  private authService = inject(AuthService);

  // public props
  NavCollapsedMob = output();
  SubmenuCollapse = output();

  navigations!: NavigationItem[];
  windowWidth: number;

  // Constructor
  constructor() {
    this.navigations = this.filterNavigationByAccess(NavigationItems);
    this.windowWidth = window.innerWidth;
  }

  // Life cycle events
  ngOnInit() {
    if (this.windowWidth < 1025) {
      setTimeout(() => {
        (document.querySelector('.coded-navbar') as HTMLDivElement).classList.add('menupos-static');
      }, 500);
    }
  }

  fireOutClick() {
    let current_url = this.location.path();
    // eslint-disable-next-line
    // @ts-ignore
    if (this.location['_baseHref']) {
      // eslint-disable-next-line
      // @ts-ignore
      current_url = this.location['_baseHref'] + this.location.path();
    }
    const link = "a.nav-link[ href='" + current_url + "' ]";
    const ele = document.querySelector(link);
    if (ele !== null && ele !== undefined) {
      const parent = ele.parentElement;
      const up_parent = parent?.parentElement?.parentElement;
      const last_parent = up_parent?.parentElement;
      if (parent?.classList.contains('coded-hasmenu')) {
        parent.classList.add('coded-trigger');
        parent.classList.add('active');
      } else if (up_parent?.classList.contains('coded-hasmenu')) {
        up_parent.classList.add('coded-trigger');
        up_parent.classList.add('active');
      } else if (last_parent?.classList.contains('coded-hasmenu')) {
        last_parent.classList.add('coded-trigger');
        last_parent.classList.add('active');
      }
    }
  }

  private filterNavigationByAccess(items: NavigationItem[]): NavigationItem[] {
    const canManageUsers = this.canManageUsers();

    return items
      .map((item) => ({
        ...item,
        children: item.children ? this.filterNavigationByAccess(item.children) : undefined
      }))
      .filter((item) => {
        if (item.id === 'users') {
          return canManageUsers;
        }

        if (item.type === 'collapse' && item.children && item.children.length === 0) {
          return false;
        }

        return true;
      });
  }

  private canManageUsers(): boolean {
    const user = this.authService.currentUser();
    if (!user) {
      return false;
    }

    const email = (user.email || '').trim().toLowerCase();
    const roles = (user.roles || []).map((role) => (role || '').trim().toUpperCase());

    return email === 'carol@gmail.com' || roles.includes('DEV_SUPORTE') || roles.includes('MASTER_ADMIN');
  }
}
