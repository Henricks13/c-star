import { Routes } from '@angular/router';

export const routes: Routes = [
	{
		path: '',
		pathMatch: 'full',
		redirectTo: 'public'
	},
	{
		path: 'public',
		loadComponent: () => import('./features/public/public-layout.component').then((m) => m.PublicLayoutComponent),
		children: [
			{
				path: '',
				loadComponent: () => import('./features/public/public-home.page').then((m) => m.PublicHomePage)
			}
		]
	},
	{
		path: 'app',
		loadComponent: () => import('./features/app/app-layout.component').then((m) => m.AppLayoutComponent),
		children: [
			{
				path: '',
				loadComponent: () => import('./features/app/app-home.page').then((m) => m.AppHomePage)
			}
		]
	},
	{
		path: 'admin',
		loadComponent: () => import('./features/admin/admin-layout.component').then((m) => m.AdminLayoutComponent),
		children: [
			{
				path: '',
				loadComponent: () => import('./features/admin/admin-home.page').then((m) => m.AdminHomePage)
			}
		]
	},
	{
		path: '**',
		redirectTo: 'public'
	}
];
