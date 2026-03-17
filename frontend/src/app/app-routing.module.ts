import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/auth/auth.guard';
import { AdminComponent } from './theme/layout/admin/admin.component';
import { GuestComponent } from './theme/layout/guest/guest.component';

const routes: Routes = [
  {
    path: '',
    component: AdminComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        redirectTo: '/contacts',
        pathMatch: 'full'
      },
      {
        path: 'default',
        loadComponent: () => import('./demo/dashboard/default/default.component').then((c) => c.DefaultComponent)
      },
      {
        path: 'typography',
        loadComponent: () => import('./demo/elements/typography/typography.component').then((c) => c.TypographyComponent)
      },
      {
        path: 'color',
        loadComponent: () => import('./demo/elements/element-color/element-color.component').then((c) => c.ElementColorComponent)
      },
      {
        path: 'sample-page',
        loadComponent: () => import('./demo/other/sample-page/sample-page.component').then((c) => c.SamplePageComponent)
      },
      {
        path: 'contacts',
        redirectTo: '/contacts/geral',
        pathMatch: 'full'
      },
      {
        path: 'contacts/geral',
        loadComponent: () => import('./demo/pages/contacts/contacts.component').then((c) => c.ContactsComponent)
      },
      {
        path: 'contacts/nao-lidas',
        loadComponent: () => import('./demo/pages/contacts/contacts.component').then((c) => c.ContactsComponent)
      },
      {
        path: 'contacts/em-andamento',
        loadComponent: () => import('./demo/pages/contacts/contacts.component').then((c) => c.ContactsComponent)
      },
      {
        path: 'whatsapp',
        loadComponent: () => import('./demo/pages/whatsapp/whatsapp.component').then((c) => c.WhatsappComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./demo/pages/users/users.component').then((c) => c.UsersComponent)
      }
    ]
  },
  {
    path: '',
    component: GuestComponent,
    children: [
      {
        path: 'login',
        loadComponent: () => import('./demo/pages/authentication/login/login.component').then((c) => c.LoginComponent)
      },
      {
        path: 'register',
        loadComponent: () => import('./demo/pages/authentication/register/register.component').then((c) => c.RegisterComponent)
      },
      {
        path: 'access-denied',
        loadComponent: () => import('./demo/pages/authentication/access-denied/access-denied.component').then((c) => c.AccessDeniedComponent)
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
