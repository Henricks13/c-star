export interface NavigationItem {
  id: string;
  title: string;
  type: 'item' | 'collapse' | 'group';
  translate?: string;
  icon?: string;
  hidden?: boolean;
  url?: string;
  classes?: string;
  external?: boolean;
  target?: boolean;
  breadcrumbs?: boolean;
  children?: NavigationItem[];
  role?: string[];
  isMainParent?: boolean;
}

export const NavigationItems: NavigationItem[] = [
  {
    id: 'menu',
    title: 'Menu',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'contacts',
        title: 'Contatos',
        type: 'item',
        classes: 'nav-item',
        url: '/contacts',
        icon: 'ti ti-users',
        breadcrumbs: false
      },
      {
        id: 'whatsapp',
        title: 'WhatsApp',
        type: 'item',
        url: '/whatsapp',
        classes: 'nav-item',
        icon: 'ti ti-brand-whatsapp'
      }
    ]
  }
];
