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
        redirectTo: '/default',
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
      },
      {
        path: 'clients/services',
        loadComponent: () => import('./demo/pages/client-services/client-services.component').then((c) => c.ClientServicesComponent)
      },
      {
        path: 'clients',
        loadComponent: () => import('./demo/pages/clients/clients.component').then((c) => c.ClientsComponent)
      },
      {
        path: 'products',
        loadComponent: () => import('./demo/pages/products/products.component').then((c) => c.ProductsComponent)
      },
      {
        path: 'products/types',
        loadComponent: () => import('./demo/pages/product-types/product-types.component').then((c) => c.ProductTypesComponent)
      },
      {
        path: 'services',
        loadComponent: () => import('./demo/pages/services/services.component').then((c) => c.ServicesComponent)
      },
      {
        path: 'agenda',
        loadComponent: () => import('./demo/pages/agenda/agenda.component').then((c) => c.AgendaComponent)
      },
      {
        path: 'finance',
        redirectTo: '/finance/incomes',
        pathMatch: 'full'
      },
      {
        path: 'finance/incomes',
        loadComponent: () => import('./demo/pages/finance-incomes/finance-incomes.component').then((c) => c.FinanceIncomesComponent)
      },
      {
        path: 'finance/expenses',
        loadComponent: () => import('./demo/pages/finance-expenses/finance-expenses.component').then((c) => c.FinanceExpensesComponent)
      },
      {
        path: 'finance/income-types',
        loadComponent: () => import('./demo/pages/finance-income-types/finance-income-types.component').then((c) => c.FinanceIncomeTypesComponent)
      },
      {
        path: 'finance/expense-types',
        loadComponent: () => import('./demo/pages/finance-expense-types/finance-expense-types.component').then((c) => c.FinanceExpenseTypesComponent)
      },
      {
        path: 'finance/product-sales',
        loadComponent: () => import('./demo/pages/finance-product-sales/finance-product-sales.component').then((c) => c.FinanceProductSalesComponent)
      },
      {
        path: 'finance/report',
        loadComponent: () => import('./demo/pages/finance-report/finance-report.component').then((c) => c.FinanceReportComponent)
      },
      {
        path: 'settings/anamnesis-questions',
        loadComponent: () =>
          import('./demo/pages/settings-anamnesis-questions/settings-anamnesis-questions.component').then(
            (c) => c.SettingsAnamnesisQuestionsComponent
          )
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
      },
      {
        path: 'anamnese',
        loadComponent: () => import('./demo/pages/public-anamnesis/public-anamnesis.component').then((c) => c.PublicAnamnesisComponent)
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
